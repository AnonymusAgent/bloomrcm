import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsPageviews, analyticsSessions, analyticsVisitors } from "@/db/schema";
import { randomToken, sha256Hex } from "@/lib/security";
import { analyticsAllowed, CONSENT_COOKIE } from "@/lib/consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const VISITOR_COOKIE = "bloom_vid";
export const SESSION_COOKIE_ANALYTICS = "bloom_sid";

const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SESSION_MAX_AGE = 60 * 30; // 30 minutes of inactivity

/** Hash cookie values so the database never stores the raw identifier. */
function idHash(value: string): string {
  return sha256Hex(`analytics|${value}`);
}

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|flipboard|tumblr|monitor|uptime|pingdom|lighthouse|headless|phantomjs|curl\/|wget\/|python-requests|axios\/|go-http/i;

function classifyDevice(ua: string): string {
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

function classifyBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
  if (/firefox\//i.test(ua)) return "Firefox";
  return "Other";
}

function classifyOs(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

const SEARCH_RE = /google|bing|duckduckgo|yahoo|ecosia|brave|baidu|yandex/i;
const SOCIAL_RE = /linkedin|facebook|instagram|twitter|t\.co|x\.com|reddit|youtube|tiktok|threads/i;

function classifyChannel(referrerHost: string, selfHost: string): string {
  if (!referrerHost || referrerHost === selfHost) return "direct";
  if (SEARCH_RE.test(referrerHost)) return "search";
  if (SOCIAL_RE.test(referrerHost)) return "social";
  return "referral";
}

/** Only track real, in-app public paths. Never admin or API routes. */
function sanitizePath(raw: string): string | null {
  if (!raw.startsWith("/")) return null;
  const path = raw.split("?")[0].split("#")[0].slice(0, 160);
  if (path.startsWith("/admin") || path.startsWith("/api")) return null;
  return path || "/";
}

export async function POST(request: NextRequest) {
  // 1. Consent gate. The visitor's explicit, stored choice is authoritative:
  //    a browser DNT/GPC header only pre-sets the modal to "off" — it must not
  //    override someone who then deliberately switched analytics on.
  const consentCookie = request.cookies.get(CONSENT_COOKIE)?.value;
  if (!analyticsAllowed(consentCookie)) {
    return NextResponse.json({ ok: true, tracked: false, reason: "no-consent" });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_RE.test(userAgent)) {
    return NextResponse.json({ ok: true, tracked: false, reason: "bot" });
  }

  let body: { path?: string; title?: string; referrer?: string };
  try {
    const text = await request.text();
    if (text.length > 4000) return NextResponse.json({ ok: false }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = sanitizePath(String(body.path ?? ""));
  if (!path) return NextResponse.json({ ok: true, tracked: false, reason: "excluded-path" });
  const title = String(body.title ?? "").slice(0, 160);

  let referrerHost = "";
  try {
    const ref = String(body.referrer ?? "");
    if (ref) referrerHost = new URL(ref).hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    referrerHost = "";
  }

  // 2. Resolve first-party identifiers (create them if missing).
  const rawVisitor = request.cookies.get(VISITOR_COOKIE)?.value ?? randomToken(16);
  const existingSessionRaw = request.cookies.get(SESSION_COOKIE_ANALYTICS)?.value;
  const rawSession = existingSessionRaw ?? randomToken(16);
  const visitorId = idHash(rawVisitor);
  const sessionId = idHash(rawSession);

  const response = NextResponse.json({ ok: true, tracked: true });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(VISITOR_COOKIE, rawVisitor, {
    httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: VISITOR_MAX_AGE,
  });
  response.cookies.set(SESSION_COOKIE_ANALYTICS, rawSession, {
    httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_MAX_AGE,
  });

  try {
    // 3. Upsert the visitor; detect whether this person existed before now.
    const priorVisitor = await db
      .select({ id: analyticsVisitors.id })
      .from(analyticsVisitors)
      .where(eq(analyticsVisitors.id, visitorId))
      .limit(1);
    const isKnownVisitor = priorVisitor.length > 0;

    if (isKnownVisitor) {
      await db
        .update(analyticsVisitors)
        .set({ lastSeenAt: new Date(), pageviewCount: sql`${analyticsVisitors.pageviewCount} + 1` })
        .where(eq(analyticsVisitors.id, visitorId));
    } else {
      await db
        .insert(analyticsVisitors)
        .values({ id: visitorId, sessionCount: 0, pageviewCount: 1 })
        .onConflictDoNothing();
    }

    // 4. Upsert the session. A brand-new session for a known visitor = returning.
    const existingSession = existingSessionRaw
      ? await db.select({ id: analyticsSessions.id }).from(analyticsSessions).where(eq(analyticsSessions.id, sessionId)).limit(1)
      : [];

    if (existingSession.length > 0) {
      await db
        .update(analyticsSessions)
        .set({ lastActivityAt: new Date(), pageviewCount: sql`${analyticsSessions.pageviewCount} + 1` })
        .where(eq(analyticsSessions.id, sessionId));
    } else {
      const selfHost = request.nextUrl.hostname.replace(/^www\./, "");
      await db
        .insert(analyticsSessions)
        .values({
          id: sessionId,
          visitorId,
          isReturning: isKnownVisitor,
          pageviewCount: 1,
          entryPath: path,
          referrerHost,
          channel: classifyChannel(referrerHost, selfHost),
          device: classifyDevice(userAgent),
          browser: classifyBrowser(userAgent),
          os: classifyOs(userAgent),
        })
        .onConflictDoNothing();
      await db
        .update(analyticsVisitors)
        .set({ sessionCount: sql`${analyticsVisitors.sessionCount} + 1` })
        .where(eq(analyticsVisitors.id, visitorId));
    }

    const sessionIsReturning = existingSession.length > 0 ? undefined : isKnownVisitor;
    await db.insert(analyticsPageviews).values({
      sessionId,
      visitorId,
      path,
      title,
      isReturning: sessionIsReturning ?? isKnownVisitor,
    });
  } catch (error) {
    // Analytics must never break the visitor's experience.
    console.error("[analytics] collect failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: true, tracked: false, reason: "error" });
  }

  return response;
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed." }, { status: 405 });
}
