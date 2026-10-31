import Link from "next/link";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { KeyRound, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import {
  createTeamMember,
  deleteTeamMember,
  resetTeamPassword,
  toggleTeamMemberActive,
  updateTeamRole,
} from "@/lib/actions/account";
import { AvatarBadge } from "@/components/admin/avatar-upload";
import { AutoSubmitSelect, ConfirmButton } from "@/components/admin/widgets";
import { Field, inputClass, Notice } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { assignableRoles, canEditUser, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, toRole } from "@/lib/roles";

export const metadata: Metadata = { title: "Team & roles", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; reset?: string; notice?: string; error?: string }>;
}) {
  const actor = await requirePermission("team.manage");
  const sp = await searchParams;
  const members = await db.select().from(adminUsers).orderBy(asc(adminUsers.createdAt));
  const resettingId = sp.reset;
  const resetting = resettingId ? members.find((m) => m.id === resettingId) : undefined;
  const roleOptions = assignableRoles(actor.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Team &amp; roles</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Add managers and staff, control what each person can do, reset passwords, and revoke access. Every change
            here is written to the audit log.
          </p>
        </div>
        <Link
          href="/admin/team?new=1"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add team member
        </Link>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {/* Role reference */}
      <section aria-labelledby="roles-heading" className="rounded-2xl border border-border bg-background-subtle/50 p-5">
        <h2 id="roles-heading" className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
          What each role can do
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {ROLES.map((role) => (
            <div key={role} className="rounded-xl border border-border bg-card p-4">
              <dt className="font-display text-sm font-extrabold text-foreground">{ROLE_LABELS[role]}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Add member */}
      {sp.new ? (
        <section aria-labelledby="add-heading" className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="add-heading" className="font-display text-xl font-bold text-foreground">
              Add a team member
            </h2>
            <Link href="/admin/team" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Link>
          </div>
          <form action={createTeamMember} className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" required>
              <input id="name" name="name" type="text" required maxLength={120} className={inputClass} />
            </Field>
            <Field label="Email / username" htmlFor="email" required>
              <input id="email" name="email" type="email" required maxLength={254} className={inputClass} />
            </Field>
            <Field label="Role" htmlFor="role" required>
              <select id="role" name="role" defaultValue="staff" className={inputClass}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job title" htmlFor="jobTitle">
              <input id="jobTitle" name="jobTitle" type="text" maxLength={120} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Temporary password"
                htmlFor="password"
                required
                hint="At least 12 characters with letters and numbers. Share it securely — they must change it after signing in."
              >
                <input id="password" name="password" type="text" required minLength={12} maxLength={128} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
                Create account
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Reset password */}
      {resetting ? (
        <section aria-labelledby="reset-heading" className="rounded-2xl border border-amber-300 bg-card p-6 dark:border-amber-800">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="reset-heading" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              Reset password for {resetting.name}
            </h2>
            <Link href="/admin/team" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Link>
          </div>
          <form action={resetTeamPassword} className="flex flex-wrap items-end gap-4">
            <input type="hidden" name="id" value={resetting.id} />
            <div className="min-w-[18rem] flex-1">
              <Field label="New temporary password" htmlFor="reset-password" required hint="They will be signed out of all devices and must change this at next sign-in.">
                <input id="reset-password" name="password" type="text" required minLength={12} maxLength={128} className={inputClass} />
              </Field>
            </div>
            <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
              Set password
            </button>
          </form>
        </section>
      ) : null}

      {/* Member table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[920px] text-left text-sm">
          <caption className="sr-only">Administrator accounts and their roles</caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-5 py-3.5 font-bold">Member</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Role</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Last sign-in</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const isSelf = member.id === actor.id;
              const editable = canEditUser(actor.role, member.role) && !isSelf;
              return (
                <tr key={member.id}>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <AvatarBadge name={member.name} avatarUrl={member.avatarUrl} />
                      <span className="min-w-0">
                        <span className="block font-bold text-foreground">
                          {member.name}
                          {isSelf ? <span className="ml-2 text-xs font-semibold text-muted-foreground">(you)</span> : null}
                        </span>
                        <span className="block text-xs text-muted-foreground">{member.email}</span>
                        {member.jobTitle ? <span className="block text-xs text-muted-foreground">{member.jobTitle}</span> : null}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {editable ? (
                      <AutoSubmitSelect
                        action={updateTeamRole}
                        name="role"
                        hiddenInputs={{ id: member.id }}
                        defaultValue={toRole(member.role)}
                        ariaLabel={`Change role for ${member.name}`}
                        options={roleOptions.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
                      />
                    ) : (
                      <span className="inline-flex rounded-full border border-border bg-background-subtle px-3 py-1 text-xs font-bold text-foreground">
                        {ROLE_LABELS[toRole(member.role)]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                          member.isActive
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                            : "border-border bg-background-subtle text-muted-foreground"
                        }`}
                      >
                        {member.isActive ? "Active" : "Deactivated"}
                      </span>
                      {member.mustChangePassword ? (
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Temp password</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{formatDateTime(member.lastLoginAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {isSelf ? (
                        <Link href="/admin/profile" className="text-xs font-bold text-primary hover:underline">
                          Edit in my profile
                        </Link>
                      ) : null}
                      {editable ? (
                        <>
                          <Link href={`/admin/team?reset=${member.id}`} className="text-xs font-bold text-primary hover:underline">
                            Reset password
                          </Link>
                          <form action={toggleTeamMemberActive}>
                            <input type="hidden" name="id" value={member.id} />
                            <ConfirmButton
                              message={
                                member.isActive
                                  ? `Deactivate ${member.name}? They will be signed out immediately and cannot sign in again until reactivated.`
                                  : `Reactivate ${member.name}?`
                              }
                              className="text-xs font-bold text-amber-700 hover:underline dark:text-amber-400"
                            >
                              {member.isActive ? "Deactivate" : "Reactivate"}
                            </ConfirmButton>
                          </form>
                          <form action={deleteTeamMember}>
                            <input type="hidden" name="id" value={member.id} />
                            <ConfirmButton
                              message={`Permanently delete ${member.name}'s account? This cannot be undone.`}
                              className="text-xs font-bold text-red-600 hover:underline dark:text-red-400"
                            >
                              Delete
                            </ConfirmButton>
                          </form>
                        </>
                      ) : null}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-2.5 rounded-xl border border-border bg-background-subtle/60 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Safety rules enforced by the server: the last active Owner cannot be demoted, deactivated, or deleted; you
          cannot deactivate or delete your own account; and deactivating or resetting a password immediately destroys
          that person's active sessions.
        </span>
      </p>
    </div>
  );
}
