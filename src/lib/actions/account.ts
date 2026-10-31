"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { audit, clientIp, requireAdmin, requirePermission } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/security";
import { changePasswordSchema, profileSchema, teamMemberSchema } from "@/lib/utils";
import { canEditUser, toRole } from "@/lib/roles";

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}
function done(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}notice=${encodeURIComponent(message)}`);
}
const s = (fd: FormData, key: string) => String(fd.get(key) ?? "");

/* ============================ MY PROFILE ============================ */

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const parsed = profileSchema.safeParse({
    name: s(formData, "name"),
    email: s(formData, "email"),
    jobTitle: s(formData, "jobTitle"),
    phone: s(formData, "phone"),
    avatarUrl: s(formData, "avatarUrl"),
  });
  if (!parsed.success) fail("/admin/profile", parsed.error.issues[0]?.message ?? "Please check your details.");

  // Email is the sign-in identifier, so it must stay unique.
  const clash = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(and(eq(adminUsers.email, parsed.data.email), ne(adminUsers.id, user.id)))
    .limit(1);
  if (clash[0]) fail("/admin/profile", "That email address is already used by another account.");

  await db
    .update(adminUsers)
    .set({
      name: parsed.data.name,
      email: parsed.data.email,
      jobTitle: parsed.data.jobTitle,
      phone: parsed.data.phone,
      avatarUrl: parsed.data.avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, user.id));

  await audit("account.profile_updated", { actorId: user.id, entity: "admin_user", entityId: user.id, ip: await clientIp() });
  revalidatePath("/admin", "layout");
  done("/admin/profile", "Your profile has been updated.");
}

export async function removeAvatar(): Promise<void> {
  const user = await requireAdmin();
  await db.update(adminUsers).set({ avatarUrl: null, updatedAt: new Date() }).where(eq(adminUsers.id, user.id));
  await audit("account.avatar_removed", { actorId: user.id, entity: "admin_user", entityId: user.id });
  revalidatePath("/admin", "layout");
  done("/admin/profile", "Profile picture removed.");
}

export async function changeOwnPassword(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: s(formData, "currentPassword"),
    password: s(formData, "password"),
    confirmPassword: s(formData, "confirmPassword"),
  });
  if (!parsed.success) fail("/admin/profile", parsed.error.issues[0]?.message ?? "Please check the password fields.");

  const rows = await db.select({ hash: adminUsers.passwordHash }).from(adminUsers).where(eq(adminUsers.id, user.id)).limit(1);
  const valid = rows[0] ? await verifyPassword(parsed.data.currentPassword, rows[0].hash) : false;
  if (!valid) {
    await audit("account.password_change_failed", { actorId: user.id, entity: "admin_user", entityId: user.id, ip: await clientIp() });
    fail("/admin/profile", "Your current password is incorrect.");
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(parsed.data.password), mustChangePassword: false, updatedAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  await audit("account.password_changed", { actorId: user.id, entity: "admin_user", entityId: user.id, ip: await clientIp() });
  done("/admin/profile", "Password updated. Other devices stay signed in — use “Sign out everywhere” to revoke them.");
}

/** Revoke every other session for this account (keeps the current browser). */
export async function signOutOtherSessions(): Promise<void> {
  const user = await requireAdmin();
  const { cookies } = await import("next/headers");
  const { sha256Hex } = await import("@/lib/security");
  const { SESSION_COOKIE } = await import("@/lib/auth");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const currentId = token ? sha256Hex(token) : "";

  await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.userId, user.id), ne(adminSessions.id, currentId)));
  await audit("account.sessions_revoked", { actorId: user.id, entity: "admin_user", entityId: user.id, ip: await clientIp() });
  done("/admin/profile", "All other sessions were signed out.");
}

/* ============================== TEAM =============================== */

export async function createTeamMember(formData: FormData): Promise<void> {
  const actor = await requirePermission("team.manage");
  const parsed = teamMemberSchema.safeParse({
    name: s(formData, "name"),
    email: s(formData, "email"),
    role: s(formData, "role"),
    jobTitle: s(formData, "jobTitle"),
    password: s(formData, "password"),
  });
  if (!parsed.success) fail("/admin/team?new=1", parsed.error.issues[0]?.message ?? "Please check the details.");
  if (!canEditUser(actor.role, parsed.data.role)) fail("/admin/team", "You cannot assign that role.");

  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  if (existing[0]) fail("/admin/team?new=1", "An account with that email already exists.");

  const [created] = await db
    .insert(adminUsers)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      jobTitle: parsed.data.jobTitle,
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: true,
      createdBy: actor.id,
    })
    .returning({ id: adminUsers.id });

  await audit("team.member_created", {
    actorId: actor.id, entity: "admin_user", entityId: created.id,
    metadata: { role: parsed.data.role }, ip: await clientIp(),
  });
  done("/admin/team", `${parsed.data.name} was added. Share the temporary password securely — they must change it after signing in.`);
}

export async function updateTeamRole(formData: FormData): Promise<void> {
  const actor = await requirePermission("team.manage");
  const id = s(formData, "id");
  const role = toRole(s(formData, "role"));
  const target = (await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1))[0];
  if (!target) fail("/admin/team", "That account no longer exists.");
  if (!canEditUser(actor.role, target.role)) fail("/admin/team", "You cannot modify that account.");

  // Never allow the last owner to be demoted — it would lock everyone out.
  if (target.role === "owner" && role !== "owner") {
    const owners = await db.select({ n: sql<number>`count(*)::int` }).from(adminUsers).where(and(eq(adminUsers.role, "owner"), eq(adminUsers.isActive, true)));
    if ((owners[0]?.n ?? 0) <= 1) fail("/admin/team", "This is the last active Owner. Promote another owner first.");
  }

  await db.update(adminUsers).set({ role, updatedAt: new Date() }).where(eq(adminUsers.id, id));
  await audit("team.role_changed", {
    actorId: actor.id, entity: "admin_user", entityId: id,
    metadata: { from: target.role, to: role }, ip: await clientIp(),
  });
  done("/admin/team", `${target.name}'s role was updated.`);
}

export async function toggleTeamMemberActive(formData: FormData): Promise<void> {
  const actor = await requirePermission("team.manage");
  const id = s(formData, "id");
  const target = (await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1))[0];
  if (!target) fail("/admin/team", "That account no longer exists.");
  if (target.id === actor.id) fail("/admin/team", "You cannot deactivate your own account.");
  if (!canEditUser(actor.role, target.role)) fail("/admin/team", "You cannot modify that account.");

  if (target.isActive && target.role === "owner") {
    const owners = await db.select({ n: sql<number>`count(*)::int` }).from(adminUsers).where(and(eq(adminUsers.role, "owner"), eq(adminUsers.isActive, true)));
    if ((owners[0]?.n ?? 0) <= 1) fail("/admin/team", "This is the last active Owner and cannot be deactivated.");
  }

  const nextActive = !target.isActive;
  await db.update(adminUsers).set({ isActive: nextActive, updatedAt: new Date() }).where(eq(adminUsers.id, id));
  // Deactivating must immediately cut off any live sessions.
  if (!nextActive) await db.delete(adminSessions).where(eq(adminSessions.userId, id));

  await audit(nextActive ? "team.member_activated" : "team.member_deactivated", {
    actorId: actor.id, entity: "admin_user", entityId: id, ip: await clientIp(),
  });
  done("/admin/team", `${target.name} was ${nextActive ? "reactivated" : "deactivated and signed out"}.`);
}

export async function resetTeamPassword(formData: FormData): Promise<void> {
  const actor = await requirePermission("team.manage");
  const id = s(formData, "id");
  const password = s(formData, "password");
  const target = (await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1))[0];
  if (!target) fail("/admin/team", "That account no longer exists.");
  if (!canEditUser(actor.role, target.role)) fail("/admin/team", "You cannot modify that account.");

  const { passwordPolicy } = await import("@/lib/utils");
  const checked = passwordPolicy.safeParse(password);
  if (!checked.success) fail(`/admin/team?reset=${id}`, checked.error.issues[0]?.message ?? "Invalid password.");

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: true, updatedAt: new Date() })
    .where(eq(adminUsers.id, id));
  await db.delete(adminSessions).where(eq(adminSessions.userId, id)); // force re-login

  await audit("team.password_reset", { actorId: actor.id, entity: "admin_user", entityId: id, ip: await clientIp() });
  done("/admin/team", `Temporary password set for ${target.name}. They were signed out and must change it at next sign-in.`);
}

export async function deleteTeamMember(formData: FormData): Promise<void> {
  const actor = await requirePermission("team.manage");
  const id = s(formData, "id");
  const target = (await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1))[0];
  if (!target) fail("/admin/team", "That account no longer exists.");
  if (target.id === actor.id) fail("/admin/team", "You cannot delete your own account.");
  if (!canEditUser(actor.role, target.role)) fail("/admin/team", "You cannot delete that account.");

  if (target.role === "owner") {
    const owners = await db.select({ n: sql<number>`count(*)::int` }).from(adminUsers).where(eq(adminUsers.role, "owner"));
    if ((owners[0]?.n ?? 0) <= 1) fail("/admin/team", "You cannot delete the last Owner account.");
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  await audit("team.member_deleted", {
    actorId: actor.id, entity: "admin_user", entityId: id,
    metadata: { email: target.email, role: target.role }, ip: await clientIp(),
  });
  done("/admin/team", `${target.name}'s account was permanently deleted.`);
}
