/**
 * Cookie consent model — shared by the browser modal and the server API.
 * Pure functions only (no DB / no React) so this is unit-testable.
 *
 * Categories:
 *  - essential : always on, cannot be disabled (session, security, theme,
 *                accessibility, consent record itself). Never used for tracking.
 *  - analytics : our own first-party measurement cookies. Optional.
 *  - marketing : advertising / remarketing cookies. Optional.
 *
 * Stored as a compact, URL-safe cookie value: `v1_a<0|1>_m<0|1>`
 */

export const CONSENT_COOKIE = "bloom_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export interface ConsentState {
  /** Always true — present for completeness; essential cookies cannot be refused. */
  essential: true;
  analytics: boolean;
  marketing: boolean;
}

export const DENY_ALL: ConsentState = { essential: true, analytics: false, marketing: false };
export const ALLOW_ALL: ConsentState = { essential: true, analytics: true, marketing: true };

/** Seconds the banner waits before applying the "ignored" outcome. */
export const AUTO_ACCEPT_SECONDS = 20;

/**
 * What to store when the visitor ignores the banner.
 *
 * Business choice: inaction accepts all cookies. The one exception is a
 * browser-level opt-out signal (Do Not Track / Global Privacy Control) —
 * that is an explicit machine-readable refusal (legally binding under
 * CCPA/CPRA), so silence from those browsers must stay essential-only.
 */
export function resolveIgnoredConsent(hasOptOutSignal: boolean): ConsentState {
  return hasOptOutSignal ? DENY_ALL : ALLOW_ALL;
}

/** Serialize consent into the cookie value. */
export function serializeConsent(state: ConsentState): string {
  return `v${CONSENT_VERSION}_a${state.analytics ? 1 : 0}_m${state.marketing ? 1 : 0}`;
}

/**
 * Parse a stored cookie value. Returns null when absent or unrecognized,
 * which means "the visitor has not chosen yet" → show the modal.
 * Accepts the legacy granted/denied values written by the previous version.
 */
export function parseConsent(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null;
  const modern = /^v(\d+)_a([01])_m([01])$/.exec(raw);
  if (modern) {
    if (Number(modern[1]) !== CONSENT_VERSION) return null; // re-ask on policy change
    return { essential: true, analytics: modern[2] === "1", marketing: modern[3] === "1" };
  }
  if (raw === "granted") return { essential: true, analytics: true, marketing: false };
  if (raw === "denied") return DENY_ALL;
  return null;
}

/** Has the visitor explicitly allowed first-party analytics? */
export function analyticsAllowed(raw: string | undefined | null): boolean {
  return parseConsent(raw)?.analytics === true;
}

export const CONSENT_CATEGORIES = [
  {
    key: "essential" as const,
    title: "Strictly necessary",
    required: true,
    summary: "Always active — the website cannot function without these.",
    detail:
      "Used to keep your session secure, remember your light/dark theme and accessibility settings, protect forms from abuse, and store this cookie choice. These never track you across websites and are never used for advertising.",
  },
  {
    key: "analytics" as const,
    title: "Analytics",
    required: false,
    summary: "Helps us see which pages are useful.",
    detail:
      "Our own first-party cookies count visits, distinguish new from returning devices, and show which pages people read. Data stays in our database — no Google Analytics and no third-party trackers. Identifiers are stored only as one-way hashes and IP addresses are never recorded.",
  },
  {
    key: "marketing" as const,
    title: "Marketing & targeting",
    required: false,
    summary: "Not currently used on this website.",
    detail:
      "Reserved for advertising or remarketing cookies. We do not set any marketing or advertising cookies today, and no ad networks are integrated. Your preference is saved and will be honored if this ever changes.",
  },
];
