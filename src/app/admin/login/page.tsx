import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck, UserRoundPlus } from "lucide-react";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getAdminUser } from "@/lib/auth";
import { login, setupFirstAdmin } from "@/lib/actions/auth";
import { Field, inputClass, LogoMark, Notice, ThemeToggleWrap } from "@/components/admin/auth-ui";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const user = await getAdminUser();
  if (user) redirect("/admin");

  const params = await searchParams;
  const adminCount = (await db.select({ id: adminUsers.id }).from(adminUsers).limit(1)).length;
  const isSetup = adminCount === 0;

  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-background-subtle px-5 py-12">
      <div className="absolute right-5 top-5">
        <ThemeToggleWrap />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-card shadow-sm">
            <LogoMark className="h-10 w-10" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-foreground">
            {isSetup ? "Create the first administrator" : "Admin console sign in"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isSetup
              ? "No administrator exists yet. This one-time setup creates the owner account and then closes permanently."
              : "Access is restricted to authorized administrators."}
          </p>
        </div>

        <div className="mb-4">
          <Notice notice={params.notice} error={params.error} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          {isSetup ? (
            <form action={setupFirstAdmin} className="space-y-5">
              <Field label="Your name" htmlFor="name" required>
                <input id="name" name="name" type="text" autoComplete="name" required maxLength={120} className={inputClass} />
              </Field>
              <Field label="Email address" htmlFor="email" required>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
              </Field>
              <Field label="Password" htmlFor="password" required hint="At least 12 characters, with letters and numbers.">
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
              </Field>
              <Field label="Confirm password" htmlFor="confirmPassword" required>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
              </Field>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
              >
                <UserRoundPlus className="h-4.5 w-4.5" aria-hidden="true" />
                Create administrator &amp; sign in
              </button>
            </form>
          ) : (
            <form action={login} className="space-y-5">
              <Field label="Email address" htmlFor="email" required>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
              </Field>
              <Field label="Password" htmlFor="password" required>
                <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} className={inputClass} />
              </Field>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
              >
                <LockKeyhole className="h-4.5 w-4.5" aria-hidden="true" />
                Sign in
              </button>
              <p className="text-center text-sm">
                <Link href="/admin/recover" className="font-semibold text-primary hover:underline">
                  Forgot your password?
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Sign-in attempts are rate-limited and recorded in the audit log.
        </p>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="font-semibold text-primary hover:underline">
            ← Back to the public website
          </Link>
        </p>
      </div>
    </main>
  );
}
