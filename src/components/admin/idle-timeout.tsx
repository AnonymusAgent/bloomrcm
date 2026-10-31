"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, TimerReset } from "lucide-react";
import { IDLE_TIMEOUT_SECONDS, IDLE_WARNING_SECONDS } from "@/lib/roles";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;
/** Don't call the server more than once per this many seconds. */
const HEARTBEAT_THROTTLE_MS = 45_000;

/**
 * Signs the administrator out after a period of inactivity.
 *
 * The server is the real enforcer (an idle session is destroyed in
 * getAdminUser). This component mirrors that policy in the browser so the
 * user sees a warning and is redirected promptly instead of discovering the
 * expiry on their next click.
 */
export function IdleTimeout() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(IDLE_TIMEOUT_SECONDS);
  const lastActivity = useRef(Date.now());
  const lastHeartbeat = useRef(0);
  const signingOut = useRef(false);

  const signOut = useCallback(
    async (reason: "timeout" | "revoked") => {
      if (signingOut.current) return;
      signingOut.current = true;
      try {
        await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" });
      } catch {
        /* sign out locally regardless */
      }
      const notice =
        reason === "timeout"
          ? "You were signed out after 5 minutes of inactivity."
          : "Your session is no longer valid. Please sign in again.";
      router.replace(`/admin/login?notice=${encodeURIComponent(notice)}`);
    },
    [router],
  );

  const heartbeat = useCallback(async () => {
    const now = Date.now();
    if (now - lastHeartbeat.current < HEARTBEAT_THROTTLE_MS) return;
    lastHeartbeat.current = now;
    try {
      const res = await fetch("/api/admin/session", { method: "POST", credentials: "same-origin" });
      const data = (await res.json()) as { authenticated?: boolean };
      if (!data.authenticated) void signOut("revoked");
    } catch {
      /* transient network issues shouldn't force a sign-out */
    }
  }, [signOut]);

  // Record local activity and keep the server session warm.
  useEffect(() => {
    function onActivity() {
      lastActivity.current = Date.now();
      void heartbeat();
    }
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true });
    }
    function onVisible() {
      if (document.visibilityState === "visible") onActivity();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      for (const evt of ACTIVITY_EVENTS) window.removeEventListener(evt, onActivity);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [heartbeat]);

  // Tick the countdown once per second.
  useEffect(() => {
    const id = window.setInterval(() => {
      const idleSeconds = (Date.now() - lastActivity.current) / 1000;
      const left = Math.max(0, Math.round(IDLE_TIMEOUT_SECONDS - idleSeconds));
      setRemaining(left);
      if (left <= 0) void signOut("timeout");
    }, 1000);
    return () => window.clearInterval(id);
  }, [signOut]);

  const warning = remaining <= IDLE_WARNING_SECONDS;
  if (!warning) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="idle-title"
      aria-describedby="idle-desc"
      className="fixed bottom-5 left-1/2 z-[60] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-amber-300 bg-card p-5 shadow-2xl dark:border-amber-700"
    >
      <div className="flex items-start gap-3.5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <TimerReset className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="idle-title" className="font-display text-sm font-extrabold text-foreground">
            Still there?
          </h2>
          <p id="idle-desc" className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            For security, you'll be signed out in{" "}
            <span aria-live="assertive" className="font-extrabold tabular-nums text-foreground">
              {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`}
            </span>{" "}
            due to inactivity.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                lastActivity.current = Date.now();
                lastHeartbeat.current = 0;
                setRemaining(IDLE_TIMEOUT_SECONDS);
                void heartbeat();
              }}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong"
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={() => void signOut("timeout")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-background-subtle"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
