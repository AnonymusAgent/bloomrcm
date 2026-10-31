import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { requestPasswordReset, resetPassword } from "@/lib/actions/auth";
import { Field, inputClass, LogoMark, Notice, ThemeToggleWrap } from "@/components/admin/auth-ui";

export const metadata: Metadata = { title: "Reset admin password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; notice?: string }>;
}) {
  const { token, error, notice } = await searchParams;

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
            {token ? "Choose a new password" : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {token
              ? "Reset links expire after one hour and are single-use."
              : "Enter the email address on your administrator account. If it exists, we'll send a single-use reset link."}
          </p>
        </div>

        <div className="mb-4">
          <Notice notice={notice} error={error} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          {token ? (
            <form action={resetPassword} className="space-y-5">
              <input type="hidden" name="token" value={token} />
              <Field label="New password" htmlFor="password" required hint="At least 12 characters, with letters and numbers.">
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
              </Field>
              <Field label="Confirm new password" htmlFor="confirmPassword" required>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
              </Field>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
              >
                <KeyRound className="h-4.5 w-4.5" aria-hidden="true" />
                Update password
              </button>
            </form>
          ) : (
            <form action={requestPasswordReset} className="space-y-5">
              <Field label="Email address" htmlFor="email" required>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
              </Field>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
              >
                <MailCheck className="h-4.5 w-4.5" aria-hidden="true" />
                Send reset instructions
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/admin/login" className="font-semibold text-primary hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
