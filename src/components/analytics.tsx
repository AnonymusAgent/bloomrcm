"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check, Cookie, Lock, Settings2, ShieldCheck, X } from "lucide-react";
import {
  ALLOW_ALL,
  AUTO_ACCEPT_SECONDS,
  CONSENT_CATEGORIES,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  DENY_ALL,
  parseConsent,
  resolveIgnoredConsent,
  serializeConsent,
  type ConsentState,
} from "@/lib/consent";
import { cn } from "@/lib/utils";

const CONSENT_EVENT = "bloom-consent-change";
const OPEN_EVENT = "bloom-consent-open";

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

function writeConsent(state: ConsentState) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(state)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
}

/** Browser-level opt-out signal (Do Not Track / Global Privacy Control). */
function hasOptOutSignal(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1" || nav.msDoNotTrack === "1" || win.doNotTrack === "1";
}

/** Reopen the cookie banner from anywhere (footer link). */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/* ------------------------------------------------------------------ */
/* Pageview tracker                                                    */
/* ------------------------------------------------------------------ */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const lastSent = useRef("");

  useEffect(() => {
    setAllowed(parseConsent(readConsentCookie())?.analytics === true);
    const onChange = (e: Event) => setAllowed((e as CustomEvent<ConsentState>).detail.analytics === true);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!allowed || !pathname) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;
    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, title: document.title.slice(0, 160), referrer: document.referrer || "" }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  }, [allowed, pathname]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Bottom consent banner (non-blocking)                                */
/* ------------------------------------------------------------------ */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [choices, setChoices] = useState({ analytics: false, marketing: false });
  const [signal, setSignal] = useState(false);
  const [remaining, setRemaining] = useState(AUTO_ACCEPT_SECONDS);
  const [paused, setPaused] = useState(false);

  const bannerRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);

  // Decide whether to prompt on first paint.
  useEffect(() => {
    const existing = parseConsent(readConsentCookie());
    if (existing) {
      setChoices({ analytics: existing.analytics, marketing: existing.marketing });
      return;
    }
    const optOut = hasOptOutSignal();
    setSignal(optOut);
    if (optOut) setChoices({ analytics: false, marketing: false });
    const timer = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  // Reopen from the footer (keyboard users get focus moved in).
  useEffect(() => {
    const onOpen = () => {
      const existing = parseConsent(readConsentCookie());
      if (existing) setChoices({ analytics: existing.analytics, marketing: existing.marketing });
      setSignal(hasOptOutSignal());
      shouldFocus.current = true;
      setExpanded(true);
      setPaused(true); // never auto-dismiss a deliberately opened panel
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open && shouldFocus.current) {
      shouldFocus.current = false;
      bannerRef.current?.querySelector<HTMLElement>("button")?.focus();
    }
  }, [open]);

  const save = useCallback((state: ConsentState) => {
    writeConsent(state);
    setChoices({ analytics: state.analytics, marketing: state.marketing });
    setOpen(false);
    setExpanded(false);
  }, []);

  // Auto-apply the "ignored" outcome. Pauses while the visitor is reading,
  // hovering, keyboard-focused inside, or customizing their choices.
  const frozen = paused || expanded;
  useEffect(() => {
    if (!open || frozen) return;
    if (remaining <= 0) {
      save(resolveIgnoredConsent(signal));
      return;
    }
    const tick = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(tick);
  }, [open, frozen, remaining, signal, save]);

  if (!open) return null;

  const autoLabel = signal ? "Keeping only necessary cookies" : "Accepting all cookies";

  return (
    // Non-blocking: no backdrop, no scroll lock, page stays fully usable.
    // Bottom padding on small screens clears the floating accessibility button.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[5rem] sm:p-5 sm:pb-5 lg:pr-24">
      <div
        ref={bannerRef}
        role="region"
        aria-label="Cookie consent"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => !expanded && setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        className="pointer-events-auto relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-extrabold text-foreground">We use cookies</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Strictly necessary cookies keep this site working and are always on. We also use our own
                first-party analytics — never third-party advertising trackers, and never patient information.{" "}
                <Link href="/legal/privacy" className="font-semibold text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => {
                setExpanded((v) => !v);
                setPaused(true);
              }}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-background-subtle"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Customize
            </button>
            <button
              type="button"
              onClick={() => save(DENY_ALL)}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-background-subtle"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => save(ALLOW_ALL)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong"
            >
              Accept all
            </button>
          </div>

          <button
            type="button"
            onClick={() => save(resolveIgnoredConsent(signal))}
            aria-label={
              signal
                ? "Dismiss and keep only strictly necessary cookies"
                : "Dismiss and accept all cookies"
            }
            className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background-subtle hover:text-foreground lg:static lg:h-8 lg:w-8"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Expanded category controls */}
        {expanded ? (
          <div className="border-t border-border bg-background-subtle/40 p-5">
            {signal ? (
              <p className="mb-3.5 flex items-start gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  Your browser sends a “Do Not Track” / Global Privacy Control signal, so optional cookies stay{" "}
                  <strong className="font-bold text-foreground">off</strong> unless you switch them on here.
                </span>
              </p>
            ) : null}

            <ul className="grid gap-2.5 sm:grid-cols-3" role="list">
              {CONSENT_CATEGORIES.map((category) => {
                const isRequired = category.required;
                const checked = isRequired ? true : choices[category.key as "analytics" | "marketing"];
                return (
                  <li
                    key={category.key}
                    className={cn(
                      "rounded-xl border p-4 transition-colors",
                      checked && !isRequired
                        ? "border-primary/45 bg-accent-soft/40 dark:bg-accent-soft/15"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-foreground">
                        {category.title}
                        {isRequired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-border/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-foreground">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Always on
                          </span>
                        ) : null}
                      </h3>

                      {isRequired ? (
                        <span
                          className="mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-primary/50 px-0.5 opacity-70"
                          role="img"
                          aria-label="Strictly necessary cookies are always enabled and cannot be turned off"
                        >
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary shadow">
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={checked}
                          onClick={() =>
                            setChoices((prev) => ({
                              ...prev,
                              [category.key]: !prev[category.key as "analytics" | "marketing"],
                            }))
                          }
                          className={cn(
                            "mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                            checked ? "bg-primary" : "bg-border",
                          )}
                        >
                          <span className="sr-only">{category.title} cookies</span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-5 w-5 rounded-full bg-white shadow transition-transform",
                              checked ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{category.detail}</p>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => save({ essential: true, analytics: choices.analytics, marketing: choices.marketing })}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong"
            >
              Save my choices
            </button>
          </div>
        ) : (
          /* Countdown — transparent about what inaction will do. */
          <div className="flex items-center gap-3 border-t border-border bg-background-subtle/40 px-5 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground" aria-live="off">
              {frozen ? (
                <>Auto-selection paused while you choose.</>
              ) : (
                <>
                  {autoLabel} in <span className="font-extrabold tabular-nums text-foreground">{remaining}s</span> if
                  you continue without choosing.
                </>
              )}
            </p>
            {!frozen ? (
              <span className="ml-auto h-1 w-24 overflow-hidden rounded-full bg-border" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                  style={{ width: `${(remaining / AUTO_ACCEPT_SECONDS) * 100}%` }}
                />
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footer entry point                                                  */
/* ------------------------------------------------------------------ */
export function CookieSettingsLink() {
  const [state, setState] = useState<ConsentState | null>(null);

  useEffect(() => {
    setState(parseConsent(readConsentCookie()));
    const onChange = (e: Event) => setState((e as CustomEvent<ConsentState>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  const label = !state ? "not set" : state.analytics ? "analytics on" : "essential only";

  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
    >
      <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
      Cookie settings
      <span className="text-muted-foreground/80">({label})</span>
    </button>
  );
}
