/**
 * Role-based access control for the admin console.
 * Pure functions only (no DB, no React) so permissions are unit-testable
 * and can be enforced identically on the server and reflected in the UI.
 */

export const ROLES = ["owner", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner:
    "Full control: business settings, team management, data exports, and permanent deletion. There is always at least one owner.",
  manager:
    "Manages day-to-day work: inquiries, services, specialties, experience, FAQs, and analytics. Cannot manage the team, change business settings, export, or delete records.",
  staff:
    "Works the inquiry pipeline: view inquiries, add notes, change lead status, and view analytics. Cannot edit website content or manage the team.",
};

/** Every capability the console gates on. */
export type Permission =
  | "inquiries.view"
  | "inquiries.update"
  | "inquiries.archive"
  | "inquiries.delete"
  | "inquiries.export"
  | "content.manage"
  | "content.delete"
  | "analytics.view"
  | "analytics.purge"
  | "settings.manage"
  | "team.manage";

const MATRIX: Record<Role, Permission[]> = {
  owner: [
    "inquiries.view", "inquiries.update", "inquiries.archive", "inquiries.delete", "inquiries.export",
    "content.manage", "content.delete",
    "analytics.view", "analytics.purge",
    "settings.manage", "team.manage",
  ],
  manager: [
    "inquiries.view", "inquiries.update", "inquiries.archive",
    "content.manage",
    "analytics.view",
  ],
  staff: ["inquiries.view", "inquiries.update", "analytics.view"],
};

/** Narrow an untrusted string to a known role (defaults to the safest). */
export function toRole(value: string | null | undefined): Role {
  return (ROLES as readonly string[]).includes(value ?? "") ? (value as Role) : "staff";
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return MATRIX[toRole(role)].includes(permission);
}

/** Roles a given actor is allowed to assign to someone else. */
export function assignableRoles(actorRole: string | null | undefined): Role[] {
  return can(actorRole, "team.manage") ? [...ROLES] : [];
}

/** Owners are the only role that may act on another owner's account. */
export function canEditUser(actorRole: string | null | undefined, targetRole: string | null | undefined): boolean {
  if (!can(actorRole, "team.manage")) return false;
  if (toRole(targetRole) === "owner") return toRole(actorRole) === "owner";
  return true;
}

/* ------------------------------------------------------------------ */
/* Idle session policy                                                 */
/* ------------------------------------------------------------------ */

/** Hard idle limit for an authenticated admin session. */
export const IDLE_TIMEOUT_SECONDS = 5 * 60;
/** How long before expiry the "still there?" warning appears. */
export const IDLE_WARNING_SECONDS = 60;
/** Don't write to the session row more often than this. */
export const ACTIVITY_WRITE_THROTTLE_SECONDS = 30;

/** Has a session been idle past the allowed limit? */
export function isSessionIdleExpired(lastActivityAt: Date, now: Date = new Date()): boolean {
  return (now.getTime() - lastActivityAt.getTime()) / 1000 >= IDLE_TIMEOUT_SECONDS;
}

/** Seconds of inactivity remaining before forced sign-out (never negative). */
export function idleSecondsRemaining(lastActivityAt: Date, now: Date = new Date()): number {
  const elapsed = (now.getTime() - lastActivityAt.getTime()) / 1000;
  return Math.max(0, Math.round(IDLE_TIMEOUT_SECONDS - elapsed));
}
