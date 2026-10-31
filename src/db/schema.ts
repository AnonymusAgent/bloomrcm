import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Business settings (single row, id = 1)                              */
/* ------------------------------------------------------------------ */
export const businessSettings = pgTable("business_settings", {
  id: integer("id").primaryKey(),
  businessName: text("business_name").notNull(),
  tagline: text("tagline").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),
  logoUrl: text("logo_url"),
  notifyEmail: text("notify_email").notNull().default(""),
  socials: jsonb("socials").$type<{ linkedin?: string; x?: string }>().notNull().default({}),
  seo: jsonb("seo").$type<{ title?: string; description?: string }>().notNull().default({}),
  contactForm: jsonb("contact_form")
    .$type<{ requireOrganization?: boolean }>()
    .notNull()
    .default({ requireOrganization: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Editable site content (keyed JSON blobs: homepage, about, etc.)     */
/* ------------------------------------------------------------------ */
export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */
export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    workflow: text("workflow").notNull().default(""), // newline-separated steps
    value: text("value").notNull().default(""),
    requirements: text("requirements").notNull().default(""),
    icon: text("icon").notNull().default("FileCheck2"),
    isVisible: boolean("is_visible").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("services_slug_idx").on(t.slug), index("services_order_idx").on(t.displayOrder)],
);

/* ------------------------------------------------------------------ */
/* Professional experience                                             */
/* ------------------------------------------------------------------ */
export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organization: text("organization").notNull(),
    role: text("role").notNull().default(""),
    startDate: text("start_date").notNull().default(""), // stored as free text e.g. "2022-04"; empty = hidden on public page
    endDate: text("end_date").notNull().default(""),
    isCurrent: boolean("is_current").notNull().default(false),
    description: text("description").notNull().default(""),
    responsibilities: jsonb("responsibilities").$type<string[]>().notNull().default([]),
    specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
    systems: jsonb("systems").$type<string[]>().notNull().default([]),
    clearinghouses: jsonb("clearinghouses").$type<string[]>().notNull().default([]),
    achievements: text("achievements").notNull().default(""),
    logoUrl: text("logo_url"),
    isPublished: boolean("is_published").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("experiences_order_idx").on(t.displayOrder)],
);

/* ------------------------------------------------------------------ */
/* Admin users, sessions, password reset                               */
/* ------------------------------------------------------------------ */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("staff"), // owner | manager | staff
    jobTitle: text("job_title").notNull().default(""),
    phone: text("phone").notNull().default(""),
    /** Small square image stored as a data URL (no external storage needed). */
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: text("id").primaryKey(), // sha256 hash of the session token
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Drives the 5-minute inactivity auto-logout. */
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ipHash: text("ip_hash").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(), // sha256 hash of the reset token
  userId: uuid("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Contact inquiries + lead management                                 */
/* ------------------------------------------------------------------ */
export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    organization: text("organization").notNull().default(""),
    phone: text("phone").notNull().default(""),
    practiceType: text("practice_type").notNull().default(""),
    servicesRequested: jsonb("services_requested").$type<string[]>().notNull().default([]),
    claimVolume: text("claim_volume").notNull().default(""),
    preferredContact: text("preferred_contact").notNull().default("email"),
    message: text("message").notNull(),
    privacyAck: boolean("privacy_ack").notNull().default(false),
    privacyVersion: text("privacy_version").notNull().default(""),
    status: text("status").notNull().default("new"),
    isRead: boolean("is_read").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    assignedTo: uuid("assigned_to").references(() => adminUsers.id, { onDelete: "set null" }),
    emailStatus: text("email_status").notNull().default("pending"),
    dedupeHash: text("dedupe_hash").notNull().default(""),
    ipHash: text("ip_hash").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("inquiries_status_idx").on(t.status),
    index("inquiries_submitted_idx").on(t.submittedAt),
    index("inquiries_email_idx").on(t.email),
  ],
);

export const inquiryNotes = pgTable(
  "inquiry_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inquiryId: uuid("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => adminUsers.id, { onDelete: "set null" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("inquiry_notes_inquiry_idx").on(t.inquiryId)],
);

export const statusHistory = pgTable(
  "inquiry_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inquiryId: uuid("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").notNull().default(""),
    toStatus: text("to_status").notNull(),
    changedBy: uuid("changed_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("status_history_inquiry_idx").on(t.inquiryId)],
);

export const followUpTasks = pgTable(
  "follow_up_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inquiryId: uuid("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueDate: text("due_date").notNull().default(""), // ISO date string
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_inquiry_idx").on(t.inquiryId), index("tasks_due_idx").on(t.dueDate)],
);

/* ------------------------------------------------------------------ */
/* Specialties (editable practice-type coverage)                       */
/* ------------------------------------------------------------------ */
export const specialties = pgTable(
  "specialties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    blurb: text("blurb").notNull().default(""),
    icon: text("icon").notNull().default("Stethoscope"),
    isVisible: boolean("is_visible").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("specialties_order_idx").on(t.displayOrder)],
);

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */
export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: text("category").notNull().default("General"),
    isPublished: boolean("is_published").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("faqs_order_idx").on(t.displayOrder)],
);

/* ------------------------------------------------------------------ */
/* First-party analytics (no third-party trackers, no raw IPs)         */
/* ------------------------------------------------------------------ */
export const analyticsVisitors = pgTable(
  "analytics_visitors",
  {
    // sha256(salt + visitor cookie) — the raw cookie value is never stored.
    id: text("id").primaryKey(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    sessionCount: integer("session_count").notNull().default(0),
    pageviewCount: integer("pageview_count").notNull().default(0),
  },
  (t) => [index("analytics_visitors_last_seen_idx").on(t.lastSeenAt)],
);

export const analyticsSessions = pgTable(
  "analytics_sessions",
  {
    id: text("id").primaryKey(), // sha256(salt + session cookie)
    visitorId: text("visitor_id")
      .notNull()
      .references(() => analyticsVisitors.id, { onDelete: "cascade" }),
    isReturning: boolean("is_returning").notNull().default(false),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    pageviewCount: integer("pageview_count").notNull().default(0),
    entryPath: text("entry_path").notNull().default("/"),
    referrerHost: text("referrer_host").notNull().default(""),
    channel: text("channel").notNull().default("direct"), // direct | search | social | referral
    device: text("device").notNull().default("desktop"), // desktop | mobile | tablet
    browser: text("browser").notNull().default(""),
    os: text("os").notNull().default(""),
  },
  (t) => [
    index("analytics_sessions_visitor_idx").on(t.visitorId),
    index("analytics_sessions_started_idx").on(t.startedAt),
  ],
);

export const analyticsPageviews = pgTable(
  "analytics_pageviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id")
      .notNull()
      .references(() => analyticsSessions.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    path: text("path").notNull(),
    title: text("title").notNull().default(""),
    isReturning: boolean("is_returning").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("analytics_pageviews_created_idx").on(t.createdAt),
    index("analytics_pageviews_path_idx").on(t.path),
  ],
);

/* ------------------------------------------------------------------ */
/* Rate limiting + audit                                               */
/* ------------------------------------------------------------------ */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull().default(""),
    entityId: text("entity_id").notNull().default(""),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ipHash: text("ip_hash").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Specialty = typeof specialties.$inferSelect;
export type FollowUpTask = typeof followUpTasks.$inferSelect;
export type InquiryNote = typeof inquiryNotes.$inferSelect;
