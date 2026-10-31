"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, adminUsers, passwordResetTokens } from "@/db/schema";
import { audit, clientIp, createSession, destroySession } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { hitRateLimit } from "@/lib/limiter";
import { hashIp, hashPassword, randomToken, sha256Hex, verifyPassword } from "@/lib/security";
import { loginSchema, resetPasswordSchema, resetRequestSchema, setupSchema } from "@/lib/utils";

function err(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login?notice=signed-out");
}

export async function login(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) err("/admin/login", parsed.error.issues[0]?.message ?? "Invalid credentials.");

  const ip = await clientIp();
  const ipKey = hashIp(ip);
  const perAccount = await hitRateLimit(`login:${parsed.data.email}`, 8, 15);
  const perIp = await hitRateLimit(`loginip:${ipKey}`, 30, 15);
  if (!perAccount.allowed || !perIp.allowed) {
    err("/admin/login", `Too many attempts. Please try again in ${perAccount.retryAfterSec || 900} seconds.`);
  }

  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  const user = rows[0];
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    await audit("admin.login_failed", { entity: "admin_user", metadata: { email: parsed.data.email }, ip });
    err("/admin/login", "Invalid email or password.");
  }

  // Deactivated accounts keep their record but lose all access.
  if (!user.isActive) {
    await audit("admin.login_blocked_inactive", { actorId: user.id, entity: "admin_user", entityId: user.id, ip });
    err("/admin/login", "This account has been deactivated. Please contact an owner.");
  }

  const h = await headers();
  await createSession(user.id, ip, h.get("user-agent") ?? "");
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await audit("admin.login_success", { actorId: user.id, entity: "admin_user", entityId: user.id, ip });
  // Anyone on a temporary password is sent straight to set their own.
  if (user.mustChangePassword) {
    redirect("/admin/profile?notice=" + encodeURIComponent("Please set your own password to finish setting up your account."));
  }
  redirect("/admin");
}

/** First-run administrator setup — only available while zero admin users exist. */
export async function setupFirstAdmin(formData: FormData): Promise<void> {
  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  if (existing.length > 0) err("/admin/login", "Setup is closed — an administrator already exists. Sign in instead.");

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) err("/admin/login", parsed.error.issues[0]?.message ?? "Invalid setup details.");

  const ip = await clientIp();
  const [created] = await db
    .insert(adminUsers)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), role: "owner" })
    .returning();
  const h = await headers();
  await createSession(created.id, ip, h.get("user-agent") ?? "");
  await audit("admin.setup_completed", { actorId: created.id, entity: "admin_user", entityId: created.id, ip });
  redirect("/admin?notice=welcome");
}

/** Request a password reset link. Response is enumeration-safe. */
export async function requestPasswordReset(formData: FormData): Promise<void> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) err("/admin/recover", "Enter a valid email address.");

  const ip = await clientIp();
  const limit = await hitRateLimit(`reset:${hashIp(ip)}`, 5, 30);
  if (!limit.allowed) err("/admin/recover", "Too many requests. Please try again later.");

  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  const user = rows[0];
  if (user) {
    const token = randomToken(32);
    await db.insert(passwordResetTokens).values({
      id: sha256Hex(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${base}/admin/recover?token=${token}`;
    const delivered = await sendPasswordResetEmail(user.email, resetUrl, "Admin Console");
    if (!delivered) {
      // Email not configured: surface the link in server logs only (dev recovery path).
      console.warn(`[auth] password reset link for ${user.email}: ${resetUrl}`);
    }
    await audit("admin.password_reset_requested", { actorId: user.id, entity: "admin_user", entityId: user.id, ip });
  }
  redirect(
    "/admin/recover?notice=" +
      encodeURIComponent(
        "If an administrator account exists for that email, reset instructions have been sent. If email is not configured, ask the site owner to use the CLI recovery script documented in the README.",
      ),
  );
}

export async function resetPassword(formData: FormData): Promise<void> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) err(`/admin/recover?token=${String(formData.get("token") ?? "")}`, parsed.error.issues[0]?.message ?? "Invalid input.");

  const ip = await clientIp();
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.id, sha256Hex(parsed.data.token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  const tokenRow = rows[0];
  if (!tokenRow) err("/admin/recover", "This reset link is invalid or has expired. Please request a new one.");

  await db.update(adminUsers).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(adminUsers.id, tokenRow.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, tokenRow.id));
  await db.delete(adminSessions).where(eq(adminSessions.userId, tokenRow.userId));
  await audit("admin.password_reset_completed", { actorId: tokenRow.userId, entity: "admin_user", entityId: tokenRow.userId, ip });
  redirect("/admin/login?notice=" + encodeURIComponent("Password updated. Please sign in with your new password."));
}
