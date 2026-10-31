import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * First-party analytics aggregation.
 * All queries read only our own tables — no external services are contacted.
 */

export interface AnalyticsSummary {
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  sessions: number;
  newSessions: number;
  returningSessions: number;
  pageviews: number;
  pagesPerSession: number;
  singlePageRate: number;
  avgSessionMinutes: number;
}

export interface TrendPoint {
  day: string;
  newSessions: number;
  returningSessions: number;
  pageviews: number;
}

export interface Breakdown {
  label: string;
  count: number;
}

export type RangeDays = 7 | 30 | 90;
export { normalizeRange } from "@/lib/utils";

function rows<T>(result: { rows: unknown[] }): T[] {
  return result.rows as T[];
}

export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  try {
    const result = await db.execute(sql`
      WITH window_sessions AS (
        SELECT * FROM analytics_sessions
        WHERE started_at >= now() - (${days} * interval '1 day')
      )
      SELECT
        (SELECT count(DISTINCT visitor_id)::int FROM window_sessions) AS visitors,
        (SELECT count(DISTINCT visitor_id)::int FROM window_sessions WHERE NOT is_returning) AS new_visitors,
        (SELECT count(DISTINCT visitor_id)::int FROM window_sessions WHERE is_returning) AS returning_visitors,
        (SELECT count(*)::int FROM window_sessions) AS sessions,
        (SELECT count(*)::int FROM window_sessions WHERE NOT is_returning) AS new_sessions,
        (SELECT count(*)::int FROM window_sessions WHERE is_returning) AS returning_sessions,
        (SELECT coalesce(sum(pageview_count), 0)::int FROM window_sessions) AS pageviews,
        (SELECT count(*)::int FROM window_sessions WHERE pageview_count <= 1) AS single_page_sessions,
        (SELECT coalesce(avg(EXTRACT(EPOCH FROM (last_activity_at - started_at))), 0)::float FROM window_sessions) AS avg_seconds
    `);
    const row = rows<Record<string, number>>(result)[0] ?? ({} as Record<string, number>);
    const sessions = Number(row.sessions ?? 0);
    const pageviews = Number(row.pageviews ?? 0);
    const singlePage = Number(row.single_page_sessions ?? 0);
    return {
      visitors: Number(row.visitors ?? 0),
      newVisitors: Number(row.new_visitors ?? 0),
      returningVisitors: Number(row.returning_visitors ?? 0),
      sessions,
      newSessions: Number(row.new_sessions ?? 0),
      returningSessions: Number(row.returning_sessions ?? 0),
      pageviews,
      pagesPerSession: sessions > 0 ? pageviews / sessions : 0,
      singlePageRate: sessions > 0 ? (singlePage / sessions) * 100 : 0,
      avgSessionMinutes: Number(row.avg_seconds ?? 0) / 60,
    };
  } catch (error) {
    console.error("[analytics] summary failed:", error instanceof Error ? error.message : "unknown");
    return {
      visitors: 0, newVisitors: 0, returningVisitors: 0, sessions: 0, newSessions: 0,
      returningSessions: 0, pageviews: 0, pagesPerSession: 0, singlePageRate: 0, avgSessionMinutes: 0,
    };
  }
}

export async function getTrend(days: number): Promise<TrendPoint[]> {
  try {
    const result = await db.execute(sql`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', now()) - ((${days} - 1) * interval '1 day'),
          date_trunc('day', now()),
          interval '1 day'
        ) AS day
      ),
      s AS (
        SELECT date_trunc('day', started_at) AS day,
               count(*) FILTER (WHERE NOT is_returning)::int AS new_sessions,
               count(*) FILTER (WHERE is_returning)::int AS returning_sessions
        FROM analytics_sessions
        WHERE started_at >= date_trunc('day', now()) - ((${days} - 1) * interval '1 day')
        GROUP BY 1
      ),
      p AS (
        SELECT date_trunc('day', created_at) AS day, count(*)::int AS pageviews
        FROM analytics_pageviews
        WHERE created_at >= date_trunc('day', now()) - ((${days} - 1) * interval '1 day')
        GROUP BY 1
      )
      SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
             coalesce(s.new_sessions, 0) AS new_sessions,
             coalesce(s.returning_sessions, 0) AS returning_sessions,
             coalesce(p.pageviews, 0) AS pageviews
      FROM days
      LEFT JOIN s ON s.day = days.day
      LEFT JOIN p ON p.day = days.day
      ORDER BY days.day ASC
    `);
    return rows<{ day: string; new_sessions: number; returning_sessions: number; pageviews: number }>(result).map((r) => ({
      day: r.day,
      newSessions: Number(r.new_sessions ?? 0),
      returningSessions: Number(r.returning_sessions ?? 0),
      pageviews: Number(r.pageviews ?? 0),
    }));
  } catch (error) {
    console.error("[analytics] trend failed:", error instanceof Error ? error.message : "unknown");
    return [];
  }
}

async function breakdown(query: ReturnType<typeof sql>): Promise<Breakdown[]> {
  try {
    const result = await db.execute(query);
    return rows<{ label: string; count: number }>(result).map((r) => ({
      label: r.label || "Unknown",
      count: Number(r.count ?? 0),
    }));
  } catch (error) {
    console.error("[analytics] breakdown failed:", error instanceof Error ? error.message : "unknown");
    return [];
  }
}

export function getTopPages(days: number) {
  return breakdown(sql`
    SELECT path AS label, count(*)::int AS count
    FROM analytics_pageviews
    WHERE created_at >= now() - (${days} * interval '1 day')
    GROUP BY path ORDER BY count DESC, label ASC LIMIT 8
  `);
}

export function getChannels(days: number) {
  return breakdown(sql`
    SELECT channel AS label, count(*)::int AS count
    FROM analytics_sessions
    WHERE started_at >= now() - (${days} * interval '1 day')
    GROUP BY channel ORDER BY count DESC LIMIT 6
  `);
}

export function getReferrers(days: number) {
  return breakdown(sql`
    SELECT referrer_host AS label, count(*)::int AS count
    FROM analytics_sessions
    WHERE started_at >= now() - (${days} * interval '1 day') AND referrer_host <> ''
    GROUP BY referrer_host ORDER BY count DESC LIMIT 6
  `);
}

export function getDevices(days: number) {
  return breakdown(sql`
    SELECT device AS label, count(*)::int AS count
    FROM analytics_sessions
    WHERE started_at >= now() - (${days} * interval '1 day')
    GROUP BY device ORDER BY count DESC
  `);
}

export function getBrowsers(days: number) {
  return breakdown(sql`
    SELECT browser AS label, count(*)::int AS count
    FROM analytics_sessions
    WHERE started_at >= now() - (${days} * interval '1 day')
    GROUP BY browser ORDER BY count DESC LIMIT 6
  `);
}

export function getLandingPages(days: number) {
  return breakdown(sql`
    SELECT entry_path AS label, count(*)::int AS count
    FROM analytics_sessions
    WHERE started_at >= now() - (${days} * interval '1 day')
    GROUP BY entry_path ORDER BY count DESC, label ASC LIMIT 6
  `);
}
