import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, adminUsers, auditEvents, type AdminUser } from "@/db/schema";
import { hashIp, randomToken, sha256Hex } from "@/lib/security";
import {
  ACTIVITY_WRITE_THROTTLE_SECONDS,
  can,
  idleSecondsRemaining,
  isSessionIdleExpired,
  type Permission,
} from "@/lib/roles";

export const SESSION_COOKIE = "ymbc_admin";
const SESSION_DAYS = 7;

/** Extract the best-effort client IP from proxy headers. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return h.get("x-real-ip") ?? "unknown";
}

export async function createSession(userId: string, ip: string, userAgent: string): Promise<void> {
  const token = randomToken(32);
  const id = sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({ id, userId, expiresAt, ipHash: hashIp(ip), userAgent: userAgent.slice(0, 300) });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.id, sha256Hex(token))).catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Look up the currently authenticated administrator, if any.
 * Also enforces the inactivity policy server-side: an idle session is
 * destroyed here, so a stale browser tab can never keep access alive.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const sessionId = sha256Hex(token);
    const rows = await db
      .select({ user: adminUsers, session: adminSessions })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
      .where(eq(adminSessions.id, sessionId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const now = new Date();
    // Absolute expiry, inactivity expiry, and deactivated accounts all revoke.
    if (row.session.expiresAt < now || isSessionIdleExpired(row.session.lastActivityAt, now) || !row.user.isActive) {
      await db.delete(adminSessions).where(eq(adminSessions.id, sessionId)).catch(() => undefined);
      return null;
    }

    // Refresh activity, throttled so we don't write on every single request.
    const staleSeconds = (now.getTime() - row.session.lastActivityAt.getTime()) / 1000;
    if (staleSeconds >= ACTIVITY_WRITE_THROTTLE_SECONDS) {
      await db
        .update(adminSessions)
        .set({ lastActivityAt: now })
        .where(eq(adminSessions.id, sessionId))
        .catch(() => undefined);
    }
    return row.user;
  } catch {
    return null;
  }
});

/** Seconds of inactivity left on the current session (0 when signed out). */
export async function getIdleRemaining(): Promise<number> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return 0;
    const rows = await db
      .select({ lastActivityAt: adminSessions.lastActivityAt })
      .from(adminSessions)
      .where(eq(adminSessions.id, sha256Hex(token)))
      .limit(1);
    return rows[0] ? idleSecondsRemaining(rows[0].lastActivityAt) : 0;
  } catch {
    return 0;
  }
}

/** Server-side authorization guard for every admin route/action. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Guard for owner-only operations (deletion, exports, settings). */
export async function requireOwner(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (user.role !== "owner") {
    redirect("/admin?error=" + encodeURIComponent("That action requires an Owner account."));
  }
  return user;
}

/** Capability guard — the single place permissions are enforced. */
export async function requirePermission(permission: Permission): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!can(user.role, permission)) {
    redirect("/admin?error=" + encodeURIComponent("You do not have permission to perform that action."));
  }
  return user;
}

/** Record an audit event. Never throws — logging must not break the operation. */
export async function audit(
  action: string,
  opts: { actorId?: string | null; entity?: string; entityId?: string; metadata?: Record<string, unknown>; ip?: string } = {},
): Promise<void> {
  try {
    await db.insert(auditEvents).values({
      actorId: opts.actorId ?? null,
      action: action.slice(0, 80),
      entity: (opts.entity ?? "").slice(0, 60),
      entityId: (opts.entityId ?? "").slice(0, 120),
      metadata: opts.metadata ?? {},
      ipHash: opts.ip ? hashIp(opts.ip) : "",
    });
  } catch (error) {
    console.error("[audit] failed:", error instanceof Error ? error.message : "unknown");
  }
}
