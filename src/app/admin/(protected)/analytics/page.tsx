import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  Eye,
  Globe2,
  Laptop,
  LineChart,
  MousePointerClick,
  Repeat2,
  Timer,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { purgeAnalytics } from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/admin/widgets";
import {
  getAnalyticsSummary,
  getBrowsers,
  getChannels,
  getDevices,
  getLandingPages,
  getReferrers,
  getTopPages,
  getTrend,
  normalizeRange,
  type Breakdown,
} from "@/lib/analytics";
import { EmptyState, Notice } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2.5 font-display text-3xl font-extrabold tabular-nums text-foreground">{value}</dd>
      {hint ? <dd className="mt-1 text-xs font-semibold text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}

/** Accessible horizontal bar list — no charting library required. */
function BreakdownList({
  title,
  icon: Icon,
  items,
  emptyText,
  formatLabel,
}: {
  title: string;
  icon: typeof Globe2;
  items: Breakdown[];
  emptyText: string;
  formatLabel?: (label: string) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((sum, i) => sum + i.count, 0);
  return (
    <section aria-labelledby={`bd-${title.replace(/\W+/g, "-").toLowerCase()}`} className="rounded-2xl border border-border bg-card p-6">
      <h2
        id={`bd-${title.replace(/\W+/g, "-").toLowerCase()}`}
        className="flex items-center gap-2 font-display text-base font-bold text-foreground"
      >
        <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3" role="list">
          {items.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <li key={item.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-foreground">
                    {formatLabel ? formatLabel(item.label) : item.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {item.count.toLocaleString()} <span className="text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background-subtle">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; notice?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const isOwner = user.role === "owner";
  const sp = await searchParams;
  const days = normalizeRange(sp.range);

  const [summary, trend, topPages, channels, referrers, devices, browsers, landing] = await Promise.all([
    getAnalyticsSummary(days),
    getTrend(days),
    getTopPages(days),
    getChannels(days),
    getReferrers(days),
    getDevices(days),
    getBrowsers(days),
    getLandingPages(days),
  ]);

  const hasData = summary.sessions > 0;
  const maxDaily = Math.max(1, ...trend.map((t) => t.newSessions + t.returningSessions));
  const newPct = summary.sessions > 0 ? Math.round((summary.newSessions / summary.sessions) * 100) : 0;
  const returningPct = summary.sessions > 0 ? 100 - newPct : 0;

  // Donut geometry for the new vs returning split.
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const newArc = (newPct / 100) * circumference;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Website analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            First-party measurement from our own cookies and database — no Google Analytics, no third-party trackers,
            no advertising pixels. Visitors who decline cookies or send Do&nbsp;Not&nbsp;Track are never counted.
          </p>
        </div>
        <nav aria-label="Date range" className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          {RANGE_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={`/admin/analytics?range=${option.value}`}
              aria-current={days === option.value ? "page" : undefined}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-bold transition-colors",
                days === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background-subtle hover:text-foreground",
              )}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {!hasData ? (
        <EmptyState
          title="No analytics data yet"
          description="Visit the public website in a browser and choose “Allow analytics” on the cookie bar. Pageviews appear here immediately — this dashboard never shows sample or simulated data."
          action={
            <Link href="/" className="text-sm font-bold text-primary hover:underline">
              Open the public website
            </Link>
          }
        />
      ) : null}

      {/* Headline metrics */}
      <section aria-label="Audience metrics">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric icon={Users} label="Visitors" value={summary.visitors.toLocaleString()} hint={`${days}-day unique devices`} />
          <Metric icon={UserPlus} label="New visitors" value={summary.newVisitors.toLocaleString()} hint="First-time devices" />
          <Metric icon={Repeat2} label="Returning visitors" value={summary.returningVisitors.toLocaleString()} hint="Came back for another session" />
          <Metric icon={Activity} label="Sessions" value={summary.sessions.toLocaleString()} hint="30-minute inactivity window" />
          <Metric icon={Eye} label="Pageviews" value={summary.pageviews.toLocaleString()} />
          <Metric icon={MousePointerClick} label="Pages / session" value={summary.pagesPerSession.toFixed(2)} />
          <Metric icon={LineChart} label="Single-page visits" value={`${summary.singlePageRate.toFixed(0)}%`} hint="Left after one page" />
          <Metric icon={Timer} label="Avg. session" value={`${summary.avgSessionMinutes.toFixed(1)} min`} />
        </dl>
      </section>

      {/* New vs returning — the headline comparison */}
      <section aria-labelledby="split-heading" className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 id="split-heading" className="font-display text-base font-bold text-foreground">
            New vs returning sessions
          </h2>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative">
              <svg width="150" height="150" viewBox="0 0 140 140" role="img" aria-label={`${newPct}% new sessions, ${returningPct}% returning sessions`}>
                <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="16" className="stroke-border" />
                {summary.sessions > 0 ? (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="stroke-primary"
                    strokeDasharray={`${newArc} ${circumference - newArc}`}
                    transform="rotate(-90 70 70)"
                  />
                ) : null}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-extrabold tabular-nums text-foreground">{newPct}%</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">New</span>
              </div>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-sm" role="list">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <span className="inline-block h-3 w-3 rounded-sm bg-primary" aria-hidden="true" />
                New
              </span>
              <span className="tabular-nums text-muted-foreground">{summary.newSessions.toLocaleString()} ({newPct}%)</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <span className="inline-block h-3 w-3 rounded-sm bg-border" aria-hidden="true" />
                Returning
              </span>
              <span className="tabular-nums text-muted-foreground">{summary.returningSessions.toLocaleString()} ({returningPct}%)</span>
            </li>
          </ul>
        </div>

        {/* Daily stacked trend */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-foreground">Daily sessions</h2>
            <ul className="flex items-center gap-4 text-xs font-semibold text-muted-foreground" role="list">
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden="true" /> New
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" /> Returning
              </li>
            </ul>
          </div>
          <div className="mt-6 flex h-52 items-end gap-[3px] overflow-x-auto" role="img" aria-label={`Daily session trend for the last ${days} days`}>
            {trend.map((point) => {
              const total = point.newSessions + point.returningSessions;
              const heightPct = (total / maxDaily) * 100;
              return (
                <div
                  key={point.day}
                  className="group relative flex min-w-[6px] flex-1 flex-col justify-end"
                  style={{ height: "100%" }}
                  title={`${point.day}: ${point.newSessions} new, ${point.returningSessions} returning`}
                >
                  <div className="flex w-full flex-col justify-end rounded-t" style={{ height: `${Math.max(total > 0 ? 4 : 1, heightPct)}%` }}>
                    {point.returningSessions > 0 ? (
                      <div
                        className="w-full rounded-t bg-accent"
                        style={{ height: `${(point.returningSessions / Math.max(1, total)) * 100}%` }}
                      />
                    ) : null}
                    <div
                      className={cn("w-full bg-primary", point.returningSessions === 0 && "rounded-t")}
                      style={{ height: `${(point.newSessions / Math.max(1, total)) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <table className="sr-only">
            <caption>Daily sessions, new versus returning</caption>
            <thead>
              <tr><th scope="col">Date</th><th scope="col">New</th><th scope="col">Returning</th><th scope="col">Pageviews</th></tr>
            </thead>
            <tbody>
              {trend.map((p) => (
                <tr key={p.day}>
                  <th scope="row">{p.day}</th><td>{p.newSessions}</td><td>{p.returningSessions}</td><td>{p.pageviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Hover a bar for exact counts. A screen-reader data table of this chart is available to assistive technology.
          </p>
        </div>
      </section>

      {/* Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownList title="Top pages" icon={Eye} items={topPages} emptyText="No pageviews recorded yet." />
        <BreakdownList title="Landing pages" icon={MousePointerClick} items={landing} emptyText="No sessions recorded yet." />
        <BreakdownList
          title="Traffic channels"
          icon={Globe2}
          items={channels}
          emptyText="No sessions recorded yet."
          formatLabel={(l) => l.charAt(0).toUpperCase() + l.slice(1)}
        />
        <BreakdownList title="Referring sites" icon={Globe2} items={referrers} emptyText="No external referrers yet — traffic has been direct." />
        <BreakdownList
          title="Devices"
          icon={Laptop}
          items={devices}
          emptyText="No sessions recorded yet."
          formatLabel={(l) => l.charAt(0).toUpperCase() + l.slice(1)}
        />
        <BreakdownList title="Browsers" icon={Laptop} items={browsers} emptyText="No sessions recorded yet." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <p className="rounded-xl border border-border bg-background-subtle/60 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
          <strong className="font-bold text-foreground">How this works:</strong> a first-party cookie distinguishes
          devices, and a 30-minute rolling session cookie groups pageviews. Cookie values are stored only as salted
          hashes, IP addresses are never recorded, admin pages are excluded, and known bots are filtered. Visitors can
          turn analytics off at any time from the website footer.
        </p>
        {isOwner ? (
          <section aria-labelledby="retention-heading" className="rounded-xl border border-border bg-card p-5">
            <h2 id="retention-heading" className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Data retention
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Owner-only controls for honoring deletion requests and retention limits.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={purgeAnalytics}>
                <input type="hidden" name="scope" value="90" />
                <ConfirmButton
                  message="Delete all analytics data older than 90 days? This cannot be undone."
                  className="rounded-xl border border-border bg-background-subtle px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary"
                >
                  Purge &gt; 90 days
                </ConfirmButton>
              </form>
              <form action={purgeAnalytics}>
                <input type="hidden" name="scope" value="all" />
                <ConfirmButton
                  message="Delete ALL analytics data permanently? This cannot be undone."
                  className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700"
                >
                  Delete all
                </ConfirmButton>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
