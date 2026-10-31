import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { z } from "zod";

/**
 * Merge Tailwind class names predictably: later classes WIN over earlier
 * conflicting ones (e.g. `bg-primary … bg-white` → blue classes dropped).
 * Our design-token colors are registered so token classes conflict-merge
 * exactly like built-in Tailwind colors.
 */
const brandColors = [
  "background",
  "background-subtle",
  "card",
  "foreground",
  "muted-foreground",
  "primary",
  "primary-strong",
  "primary-foreground",
  "accent",
  "accent-soft",
  "border",
  "navy",
  "navy-strong",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [...brandColors],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lowercase + trim an email address for consistent storage/matching. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Turn a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Escape a value for safe use inside a CSV cell (RFC 4180-ish + Excel-safe). */
export function csvEscape(value: string): string {
  const neutralized = /^[=+\-@\t]/.test(value) ? `'${value}` : value;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

/** Escape user text for safe interpolation into HTML emails. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Format a date or ISO string for compact admin display. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Split a textarea value into clean non-empty lines. */
export function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30);
}

/* ------------------------------------------------------------------ */
/* Validation schemas (shared between client form and API)             */
/* ------------------------------------------------------------------ */

export const CONTACT_LIMITS = {
  fullName: { min: 2, max: 120 },
  organization: { max: 160 },
  phone: { max: 40 },
  message: { min: 20, max: 4000 },
  email: { max: 254 },
} as const;

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.fullName.min, "Please enter your full name.")
    .max(CONTACT_LIMITS.fullName.max, "Name is too long."),
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.email.max, "Email address is too long.")
    .email("Please enter a valid work email address.")
    .transform(normalizeEmail),
  organization: z.string().trim().max(CONTACT_LIMITS.organization.max, "Organization name is too long.").optional().default(""),
  phone: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.phone.max, "Phone number is too long.")
    .refine((v) => v === "" || /^[+()\-.\s\d]{7,40}$/.test(v), "Please enter a valid phone number.")
    .optional()
    .default(""),
  practiceType: z.string().trim().min(2, "Please select your provider or practice type.").max(120),
  services: z.array(z.string().trim().max(80)).max(12, "Please select up to 12 services.").default([]),
  claimVolume: z.string().trim().max(60).optional().default(""),
  preferredContact: z.enum(["email", "phone"]).default("email"),
  message: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.message.min, "Please tell us a little more (at least 20 characters).")
    .max(CONTACT_LIMITS.message.max, "Message is too long (max 4,000 characters)."),
  privacyAck: z.boolean().refine((v) => v === true, "Please acknowledge the privacy notice."),
  /* Anti-spam: honeypot + time trap. Never shown to real users. */
  company: z.string().max(200).optional().default(""),
  startedAt: z.number().int().positive().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;
/** Form-side representation: privacyAck starts unchecked, transforms validate. */
export type ContactFormValues = z.input<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().trim().max(254).email("Enter a valid email address.").transform(normalizeEmail),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const passwordPolicy = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password is too long.")
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Password must include letters and numbers.");

export const setupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().max(254).email("Enter a valid email address.").transform(normalizeEmail),
  password: passwordPolicy,
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

export const resetRequestSchema = z.object({
  email: z.string().trim().max(254).email("Enter a valid email address.").transform(normalizeEmail),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordPolicy,
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

/** Avatars are stored inline as small data URLs — no external storage needed. */
export const avatarSchema = z
  .string()
  .trim()
  .max(250_000, "Image is too large. Please choose a smaller picture.")
  .refine(
    (v) => v === "" || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
    "Unsupported image format. Please upload a JPG, PNG, or WebP file.",
  );

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().max(254).email("Enter a valid email address.").transform(normalizeEmail),
  jobTitle: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(40).default(""),
  avatarUrl: avatarSchema.default(""),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    password: passwordPolicy,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((v) => v.password !== v.currentPassword, {
    message: "Choose a password different from your current one.",
    path: ["password"],
  });

export const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter the team member's name.").max(120),
  email: z.string().trim().max(254).email("Enter a valid email address.").transform(normalizeEmail),
  role: z.enum(["owner", "manager", "staff"], { errorMap: () => ({ message: "Choose a valid role." }) }),
  jobTitle: z.string().trim().max(120).default(""),
  password: passwordPolicy,
});

export const serviceSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Title is required.").max(160),
  slug: z.string().trim().max(80).optional().default(""),
  summary: z.string().trim().max(240).default(""),
  description: z.string().trim().max(8000).default(""),
  workflow: z.string().trim().max(4000).default(""),
  value: z.string().trim().max(3000).default(""),
  requirements: z.string().trim().max(3000).default(""),
  icon: z.string().trim().max(40).default("FileCheck2"),
  isVisible: z.coerce.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const experienceSchema = z.object({
  id: z.string().optional(),
  organization: z.string().trim().min(2, "Organization is required.").max(160),
  role: z.string().trim().max(160).default(""),
  startDate: z.string().trim().max(30).default(""),
  endDate: z.string().trim().max(30).default(""),
  isCurrent: z.coerce.boolean().default(false),
  description: z.string().trim().max(8000).default(""),
  responsibilities: z.string().max(6000).default(""),
  specialties: z.string().max(2000).default(""),
  systems: z.string().max(2000).default(""),
  clearinghouses: z.string().max(2000).default(""),
  achievements: z.string().trim().max(4000).default(""),
  logoUrl: z.string().trim().max(300).default(""),
  isPublished: z.coerce.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

/** Clamp an analytics range query param to a supported window (pure helper). */
export function normalizeRange(value: string | undefined): 7 | 30 | 90 {
  const parsed = Number.parseInt(value ?? "30", 10);
  return parsed === 7 || parsed === 90 ? parsed : 30;
}

export const specialtySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Specialty name is required.").max(120),
  blurb: z.string().trim().max(500).default(""),
  icon: z.string().trim().max(40).default("Stethoscope"),
  isVisible: z.coerce.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(4, "Question is required.").max(300),
  answer: z.string().trim().min(10, "Answer is required.").max(4000),
  category: z.string().trim().max(60).default("General"),
  isPublished: z.coerce.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email or leave empty.");

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Enter a full URL (https://…) or leave empty.");

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required.").max(160),
  tagline: z.string().trim().max(240).default(""),
  email: z.string().trim().max(254).refine((v) => z.string().email().safeParse(v).success, "Enter a valid business email."),
  phone: z.string().trim().max(40).default(""),
  address: z.string().trim().max(240).default(""),
  websiteUrl: optionalUrl.default(""),
  notifyEmail: optionalEmail.default(""),
  linkedin: optionalUrl.default(""),
  x: optionalUrl.default(""),
  seoTitle: z.string().trim().max(200).default(""),
  seoDescription: z.string().trim().max(300).default(""),
  requireOrganization: z.coerce.boolean().default(false),
  founderName: z.string().trim().max(120).default(""),
  founderHeadline: z.string().trim().max(200).default(""),
  founderBio: z.string().trim().max(6000).default(""),
});

export const homeContentSchema = z.object({
  heroEyebrow: z.string().trim().max(80).default(""),
  heroHeading: z.string().trim().min(4, "Hero heading is required.").max(200),
  heroSubheading: z.string().trim().max(400).default(""),
  introHeading: z.string().trim().max(200).default(""),
  introBody: z.string().trim().max(3000).default(""),
  specialties: z.string().max(2000).default(""),
  whyUs: z.string().max(3000).default(""),
});

export const aboutContentSchema = z.object({
  mission: z.string().trim().max(2000).default(""),
  values: z.string().max(2000).default(""),
  approach: z.string().trim().max(3000).default(""),
  onboarding: z.string().trim().max(3000).default(""),
});

export const noteSchema = z.object({
  note: z.string().trim().min(1, "Note cannot be empty.").max(4000),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required.").max(200),
  dueDate: z.string().trim().max(30).default(""),
});
