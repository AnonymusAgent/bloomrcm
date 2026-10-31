import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { KeyRound, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { changeOwnPassword, removeAvatar, signOutOtherSessions, updateProfile } from "@/lib/actions/account";
import { AvatarUpload } from "@/components/admin/avatar-upload";
import { ConfirmButton } from "@/components/admin/widgets";
import { Field, inputClass, Notice } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { IDLE_TIMEOUT_SECONDS, ROLE_DESCRIPTIONS, ROLE_LABELS, toRole } from "@/lib/roles";

export const metadata: Metadata = { title: "My profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const role = toRole(user.role);

  const sessions = await db.select().from(adminSessions).where(eq(adminSessions.userId, user.id));
  const fresh = (await db.select().from(adminUsers).where(eq(adminUsers.id, user.id)).limit(1))[0] ?? user;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">My profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details, profile picture, sign-in password, and active sessions.
        </p>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {fresh.mustChangePassword ? (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          You're signed in with a temporary password. Please set your own password below.
        </div>
      ) : null}

      {/* Account details */}
      <section aria-labelledby="details-heading" className="rounded-2xl border border-border bg-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="details-heading" className="font-display text-xl font-bold text-foreground">
              Account details
            </h2>
            <p className="text-sm text-muted-foreground">Your email address is also your sign-in username.</p>
          </div>
        </div>

        <form action={updateProfile} className="space-y-6">
          <AvatarUpload initial={fresh.avatarUrl} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" required>
              <input id="name" name="name" type="text" required maxLength={120} defaultValue={fresh.name} className={inputClass} />
            </Field>
            <Field label="Email / username" htmlFor="email" required>
              <input id="email" name="email" type="email" required maxLength={254} defaultValue={fresh.email} className={inputClass} />
            </Field>
            <Field label="Job title" htmlFor="jobTitle" hint="Shown to your team, e.g. “Billing Manager”.">
              <input id="jobTitle" name="jobTitle" type="text" maxLength={120} defaultValue={fresh.jobTitle} className={inputClass} />
            </Field>
            <Field label="Contact phone" htmlFor="phone" hint="Internal only — never shown on the public website.">
              <input id="phone" name="phone" type="tel" maxLength={40} defaultValue={fresh.phone} className={inputClass} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save profile
            </button>
          </div>
        </form>

        {fresh.avatarUrl ? (
          <form action={removeAvatar} className="mt-3">
            <ConfirmButton
              message="Remove your profile picture?"
              className="text-xs font-bold text-muted-foreground hover:text-red-600 hover:underline"
            >
              Remove saved profile picture
            </ConfirmButton>
          </form>
        ) : null}
      </section>

      {/* Password */}
      <section aria-labelledby="password-heading" className="rounded-2xl border border-border bg-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="password-heading" className="font-display text-xl font-bold text-foreground">
              Change password
            </h2>
            <p className="text-sm text-muted-foreground">At least 12 characters, including letters and numbers.</p>
          </div>
        </div>
        <form action={changeOwnPassword} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Current password" htmlFor="currentPassword" required>
              <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} className={inputClass} />
            </Field>
          </div>
          <Field label="New password" htmlFor="password" required>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" required>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
              Update password
            </button>
          </div>
        </form>
      </section>

      {/* Access & sessions */}
      <section aria-labelledby="access-heading" className="rounded-2xl border border-border bg-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="access-heading" className="font-display text-xl font-bold text-foreground">
              Access &amp; security
            </h2>
            <p className="text-sm text-muted-foreground">Your permissions and where you're currently signed in.</p>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background-subtle/50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your role</dt>
            <dd className="mt-1.5 font-display text-lg font-extrabold text-foreground">{ROLE_LABELS[role]}</dd>
            <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background-subtle/50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last sign-in</dt>
            <dd className="mt-1.5 text-sm font-bold text-foreground">{formatDateTime(fresh.lastLoginAt)}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">Member since {formatDateTime(fresh.createdAt)}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background-subtle/50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto sign-out</dt>
            <dd className="mt-1.5 text-sm font-bold text-foreground">After {IDLE_TIMEOUT_SECONDS / 60} minutes idle</dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              {sessions.length} active {sessions.length === 1 ? "session" : "sessions"} on this account
            </dd>
          </div>
        </dl>

        {sessions.length > 1 ? (
          <form action={signOutOtherSessions} className="mt-5">
            <ConfirmButton
              message="Sign out all other devices? You'll stay signed in here."
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-background-subtle"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out everywhere else
            </ConfirmButton>
          </form>
        ) : null}
      </section>
    </div>
  );
}
