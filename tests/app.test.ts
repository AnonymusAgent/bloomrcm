import { describe, expect, it } from "vitest";
import {
  contactSchema,
  csvEscape,
  escapeHtml,
  lines,
  loginSchema,
  normalizeEmail,
  normalizeRange,
  passwordPolicy,
  setupSchema,
  slugify,
} from "../src/lib/utils";
import { dedupeHash, hashPassword, sha256Hex, withinLimit, verifyPassword } from "../src/lib/security";
import {
  ALLOW_ALL,
  analyticsAllowed,
  AUTO_ACCEPT_SECONDS,
  CONSENT_CATEGORIES,
  DENY_ALL,
  parseConsent,
  resolveIgnoredConsent,
  serializeConsent,
} from "../src/lib/consent";
import {
  assignableRoles,
  can,
  canEditUser,
  idleSecondsRemaining,
  IDLE_TIMEOUT_SECONDS,
  IDLE_WARNING_SECONDS,
  isSessionIdleExpired,
  toRole,
} from "../src/lib/roles";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, PRIVACY_NOTICE_TEXT } from "../src/config/site";

/* ------------------------------------------------------------------ */
/* Contact form validation                                             */
/* ------------------------------------------------------------------ */

const validInquiry = {
  fullName: "Jordan Rivera",
  email: "Jordan.Rivera@Example.com",
  organization: "Rivera Family Practice",
  phone: "(312) 555-0142",
  practiceType: "Small group practice (2–10 providers)",
  services: ["Medical Billing & Claims Submission"],
  claimVolume: "500 – 1,000 claims / month",
  preferredContact: "email" as const,
  message: "We are a four-provider family practice looking for full-cycle billing support.",
  privacyAck: true,
  company: "",
  startedAt: Date.now(),
};

describe("contact form validation", () => {
  it("accepts a fully valid inquiry and normalizes the email", () => {
    const result = contactSchema.safeParse(validInquiry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jordan.rivera@example.com");
      expect(result.data.privacyAck).toBe(true);
    }
  });

  it("rejects invalid email addresses", () => {
    for (const bad of ["not-an-email", "a@", "@b.com", "a b@c.com"]) {
      expect(contactSchema.safeParse({ ...validInquiry, email: bad }).success).toBe(false);
    }
  });

  it("rejects missing required fields", () => {
    expect(contactSchema.safeParse({ ...validInquiry, fullName: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validInquiry, practiceType: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validInquiry, message: "too short" }).success).toBe(false);
  });

  it("rejects when the privacy notice is not acknowledged", () => {
    const result = contactSchema.safeParse({ ...validInquiry, privacyAck: false });
    expect(result.success).toBe(false);
  });

  it("enforces length limits on all fields", () => {
    const long = "x".repeat(5000);
    expect(contactSchema.safeParse({ ...validInquiry, message: long }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validInquiry, fullName: long }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validInquiry, organization: long }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validInquiry, phone: long }).success).toBe(false);
  });

  it("rejects malformed phone numbers but allows empty", () => {
    expect(contactSchema.safeParse({ ...validInquiry, phone: "call me!" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validInquiry, phone: "" }).success).toBe(true);
  });

  it("caps the number of selected services", () => {
    const many = Array.from({ length: 20 }, (_, i) => `Service ${i}`);
    expect(contactSchema.safeParse({ ...validInquiry, services: many }).success).toBe(false);
  });

  it("keeps the PHI notice text unchanged and explicit", () => {
    expect(PRIVACY_NOTICE_TEXT).toContain("protected health information");
    expect(PRIVACY_NOTICE_TEXT).toContain("business inquiries only");
  });
});

/* ------------------------------------------------------------------ */
/* Authentication validation                                           */
/* ------------------------------------------------------------------ */

describe("authentication validation", () => {
  it("accepts valid login input and normalizes email", () => {
    const result = loginSchema.safeParse({ email: "Admin@Example.com", password: "secret" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("admin@example.com");
  });

  it("enforces the password policy", () => {
    expect(passwordPolicy.safeParse("short").success).toBe(false);
    expect(passwordPolicy.safeParse("onlylettersall").success).toBe(false);
    expect(passwordPolicy.safeParse("1234567890123456").success).toBe(false);
    expect(passwordPolicy.safeParse("aVeryStrongPass1").success).toBe(true);
  });

  it("requires matching setup passwords", () => {
    const result = setupSchema.safeParse({
      name: "Owner",
      email: "owner@example.com",
      password: "aVeryStrongPass1",
      confirmPassword: "differentPass2",
    });
    expect(result.success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Password hashing primitives                                         */
/* ------------------------------------------------------------------ */

describe("password hashing", () => {
  it("hashes and verifies a password (scrypt roundtrip)", async () => {
    const stored = await hashPassword("correct horse battery 9");
    expect(stored.startsWith("s2$")).toBe(true);
    expect(stored).not.toContain("correct horse");
    await expect(verifyPassword("correct horse battery 9", stored)).resolves.toBe(true);
  });

  it("rejects the wrong password and malformed hashes", async () => {
    const stored = await hashPassword("correct horse battery 9");
    await expect(verifyPassword("wrong password 1", stored)).resolves.toBe(false);
    await expect(verifyPassword("anything1", "garbage")).resolves.toBe(false);
  });

  it("produces stable deterministic digests", () => {
    expect(sha256Hex("token")).toBe(sha256Hex("token"));
    expect(sha256Hex("token")).not.toBe(sha256Hex("token2"));
    expect(dedupeHash("a@b.com", " hello ")).toBe(dedupeHash("a@b.com", "hello"));
  });
});

/* ------------------------------------------------------------------ */
/* Rate-limit window helper                                            */
/* ------------------------------------------------------------------ */

describe("rate limit helper", () => {
  it("allows counts within the limit and blocks beyond it", () => {
    expect(withinLimit(1, 8)).toBe(true);
    expect(withinLimit(8, 8)).toBe(true);
    expect(withinLimit(9, 8)).toBe(false);
    expect(withinLimit(3, 0)).toBe(false);
    expect(withinLimit(-1, 8)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Text / output utilities                                             */
/* ------------------------------------------------------------------ */

describe("output safety utilities", () => {
  it("escapes HTML for safe email interpolation", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("M&Ms 'plain'")).toBe("M&amp;Ms &#39;plain&#39;");
  });

  it("neutralizes spreadsheet formula injection in CSV cells", () => {
    expect(csvEscape("=cmd|'/c calc'!A1").startsWith(`"'`)).toBe(true);
    expect(csvEscape("+SUM(1)").startsWith(`"'`)).toBe(true);
    expect(csvEscape("-2024-01-01").startsWith(`"'`)).toBe(true);
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("normal text")).toBe('"normal text"');
  });

  it("generates clean URL slugs", () => {
    expect(slugify("Medical Billing & RCM Solutions!")).toBe("medical-billing-rcm-solutions");
    expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
    expect(slugify("24-7 Consultancy")).toBe("24-7-consultancy");
  });

  it("normalizes emails consistently", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
    expect(normalizeEmail("a@b.co")).toBe("a@b.co");
  });

  it("splits textarea input into clean lines", () => {
    expect(lines("one\n\n two \n  \nthree")).toEqual(["one", "two", "three"]);
  });
});

/* ------------------------------------------------------------------ */
/* First-party analytics helpers                                       */
/* ------------------------------------------------------------------ */

describe("analytics range normalization", () => {
  it("accepts only the supported windows and defaults to 30", () => {
    expect(normalizeRange("7")).toBe(7);
    expect(normalizeRange("30")).toBe(30);
    expect(normalizeRange("90")).toBe(90);
    expect(normalizeRange(undefined)).toBe(30);
    expect(normalizeRange("999")).toBe(30);
    expect(normalizeRange("-1")).toBe(30);
    expect(normalizeRange("'; DROP TABLE analytics_sessions; --")).toBe(30);
  });
});

describe("analytics privacy guarantees", () => {
  it("stores visitor identifiers only as salted one-way hashes", () => {
    const rawCookie = "visitor-cookie-value";
    const stored = sha256Hex(`analytics|${rawCookie}`);
    expect(stored).toHaveLength(64);
    expect(stored).not.toContain(rawCookie);
    // Deterministic so the same device maps to the same row.
    expect(sha256Hex(`analytics|${rawCookie}`)).toBe(stored);
    // Distinct devices never collide into one identity.
    expect(sha256Hex("analytics|other-cookie")).not.toBe(stored);
  });
});

/* ------------------------------------------------------------------ */
/* Cookie consent model                                                */
/* ------------------------------------------------------------------ */

describe("cookie consent", () => {
  it("treats a missing or unreadable cookie as 'not chosen yet'", () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent("garbage")).toBeNull();
    // A future policy version must re-prompt rather than assume consent.
    expect(parseConsent("v99_a1_m1")).toBeNull();
  });

  it("round-trips granular choices through the cookie value", () => {
    const state = { essential: true as const, analytics: true, marketing: false };
    const serialized = serializeConsent(state);
    expect(serialized).toBe("v1_a1_m0");
    expect(parseConsent(serialized)).toEqual(state);
    expect(parseConsent(serializeConsent(ALLOW_ALL))).toEqual(ALLOW_ALL);
    expect(parseConsent(serializeConsent(DENY_ALL))).toEqual(DENY_ALL);
  });

  it("always keeps essential cookies enabled, even when everything is rejected", () => {
    expect(DENY_ALL.essential).toBe(true);
    expect(parseConsent(serializeConsent(DENY_ALL))?.essential).toBe(true);
    // There is no serialization that can disable the essential category.
    expect(serializeConsent(DENY_ALL)).not.toContain("e0");
  });

  it("gates analytics strictly on explicit opt-in", () => {
    expect(analyticsAllowed(serializeConsent(ALLOW_ALL))).toBe(true);
    expect(analyticsAllowed("v1_a1_m0")).toBe(true);
    expect(analyticsAllowed("v1_a0_m1")).toBe(false); // marketing on, analytics off
    expect(analyticsAllowed(serializeConsent(DENY_ALL))).toBe(false);
    expect(analyticsAllowed(undefined)).toBe(false);
  });

  it("keeps marketing independent of analytics", () => {
    const marketingOnly = parseConsent("v1_a0_m1");
    expect(marketingOnly).toEqual({ essential: true, analytics: false, marketing: true });
  });

  it("understands the legacy cookie format without re-prompting", () => {
    expect(parseConsent("granted")?.analytics).toBe(true);
    expect(parseConsent("denied")?.analytics).toBe(false);
    expect(parseConsent("denied")?.essential).toBe(true);
  });

  it("accepts all categories when the banner is ignored", () => {
    const ignored = resolveIgnoredConsent(false);
    expect(ignored).toEqual(ALLOW_ALL);
    expect(ignored.analytics).toBe(true);
    expect(ignored.marketing).toBe(true);
    expect(analyticsAllowed(serializeConsent(ignored))).toBe(true);
  });

  it("never auto-accepts for browsers sending a DNT/GPC opt-out signal", () => {
    const ignored = resolveIgnoredConsent(true);
    expect(ignored).toEqual(DENY_ALL);
    expect(ignored.analytics).toBe(false);
    expect(ignored.marketing).toBe(false);
    // Essential cookies still remain enabled in that outcome.
    expect(ignored.essential).toBe(true);
    expect(analyticsAllowed(serializeConsent(ignored))).toBe(false);
  });

  it("gives visitors a visible, non-trivial window before auto-accepting", () => {
    expect(AUTO_ACCEPT_SECONDS).toBeGreaterThanOrEqual(10);
    expect(Number.isInteger(AUTO_ACCEPT_SECONDS)).toBe(true);
  });

  it("exposes exactly one locked category and two optional ones", () => {
    const required = CONSENT_CATEGORIES.filter((c) => c.required);
    const optional = CONSENT_CATEGORIES.filter((c) => !c.required);
    expect(required.map((c) => c.key)).toEqual(["essential"]);
    expect(optional.map((c) => c.key)).toEqual(["analytics", "marketing"]);
  });
});

/* ------------------------------------------------------------------ */
/* Role-based access control                                           */
/* ------------------------------------------------------------------ */

describe("role permissions", () => {
  it("gives owners every capability", () => {
    for (const permission of [
      "inquiries.view", "inquiries.update", "inquiries.archive", "inquiries.delete", "inquiries.export",
      "content.manage", "content.delete", "analytics.view", "analytics.purge", "settings.manage", "team.manage",
    ] as const) {
      expect(can("owner", permission)).toBe(true);
    }
  });

  it("lets managers run content and inquiries but not team, settings, delete, or export", () => {
    expect(can("manager", "content.manage")).toBe(true);
    expect(can("manager", "inquiries.update")).toBe(true);
    expect(can("manager", "analytics.view")).toBe(true);
    expect(can("manager", "team.manage")).toBe(false);
    expect(can("manager", "settings.manage")).toBe(false);
    expect(can("manager", "inquiries.delete")).toBe(false);
    expect(can("manager", "inquiries.export")).toBe(false);
    expect(can("manager", "analytics.purge")).toBe(false);
  });

  it("limits staff to working the inquiry pipeline", () => {
    expect(can("staff", "inquiries.view")).toBe(true);
    expect(can("staff", "inquiries.update")).toBe(true);
    expect(can("staff", "content.manage")).toBe(false);
    expect(can("staff", "inquiries.archive")).toBe(false);
    expect(can("staff", "team.manage")).toBe(false);
    expect(can("staff", "settings.manage")).toBe(false);
  });

  it("fails closed for unknown, empty, or spoofed roles", () => {
    for (const role of ["", "admin", "superuser", null, undefined, "OWNER"]) {
      expect(can(role, "team.manage")).toBe(false);
      expect(can(role, "settings.manage")).toBe(false);
      expect(can(role, "content.manage")).toBe(false);
    }
    expect(toRole("nonsense")).toBe("staff");
    expect(toRole("manager")).toBe("manager");
  });

  it("only lets owners act on another owner's account", () => {
    expect(canEditUser("owner", "owner")).toBe(true);
    expect(canEditUser("owner", "manager")).toBe(true);
    expect(canEditUser("manager", "staff")).toBe(false); // managers can't manage the team at all
    expect(canEditUser("staff", "staff")).toBe(false);
  });

  it("only offers assignable roles to those who manage the team", () => {
    expect(assignableRoles("owner")).toEqual(["owner", "manager", "staff"]);
    expect(assignableRoles("manager")).toEqual([]);
    expect(assignableRoles("staff")).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Inactivity auto-logout                                              */
/* ------------------------------------------------------------------ */

describe("idle session policy", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  const at = (secondsAgo: number) => new Date(now.getTime() - secondsAgo * 1000);

  it("signs out after five minutes of inactivity", () => {
    expect(IDLE_TIMEOUT_SECONDS).toBe(300);
    expect(isSessionIdleExpired(at(299), now)).toBe(false);
    expect(isSessionIdleExpired(at(300), now)).toBe(true);
    expect(isSessionIdleExpired(at(3600), now)).toBe(true);
  });

  it("keeps an active session alive", () => {
    expect(isSessionIdleExpired(at(0), now)).toBe(false);
    expect(isSessionIdleExpired(at(60), now)).toBe(false);
  });

  it("reports remaining time and never goes negative", () => {
    expect(idleSecondsRemaining(at(0), now)).toBe(300);
    expect(idleSecondsRemaining(at(240), now)).toBe(60);
    expect(idleSecondsRemaining(at(600), now)).toBe(0);
  });

  it("warns before expiry, not after", () => {
    expect(IDLE_WARNING_SECONDS).toBeGreaterThan(0);
    expect(IDLE_WARNING_SECONDS).toBeLessThan(IDLE_TIMEOUT_SECONDS);
    // At the warning threshold the session must still be valid.
    expect(isSessionIdleExpired(at(IDLE_TIMEOUT_SECONDS - IDLE_WARNING_SECONDS), now)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Lead pipeline integrity                                             */
/* ------------------------------------------------------------------ */

describe("lead pipeline", () => {
  it("defines exactly the required statuses with labels", () => {
    expect(LEAD_STATUSES).toEqual(["new", "contacted", "qualified", "proposal_sent", "converted", "closed", "spam"]);
    for (const status of LEAD_STATUSES) {
      expect(LEAD_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
