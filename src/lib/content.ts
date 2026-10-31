import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings, experiences, faqs, services, siteContent } from "@/db/schema";
import { siteDefaults, founderDefaults } from "@/config/site";

export interface Settings {
  name: string;
  shortName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  websiteUrl: string;
  logoUrl: string | null;
  notifyEmail: string;
  socials: { linkedin?: string; x?: string };
  seo: { title?: string; description?: string };
  contactForm: { requireOrganization?: boolean };
  founderName: string;
  founderHeadline: string;
  founderBio: string;
}

function defaults(): Settings {
  return {
    name: siteDefaults.name,
    shortName: siteDefaults.shortName,
    tagline: siteDefaults.tagline,
    email: siteDefaults.email,
    phone: siteDefaults.phone,
    address: siteDefaults.address,
    websiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? siteDefaults.websiteUrl,
    logoUrl: siteDefaults.logoUrl,
    notifyEmail: siteDefaults.notifyEmail,
    socials: siteDefaults.socials,
    seo: siteDefaults.seo,
    contactForm: siteDefaults.contactForm,
    founderName: founderDefaults.name,
    founderHeadline: founderDefaults.headline,
    founderBio: founderDefaults.bio,
  };
}

/** Runtime business settings: DB row merged over centralized defaults. */
export const getSettings = cache(async (): Promise<Settings> => {
  const fallback = defaults();
  try {
    const rows = await db.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1);
    const row = rows[0];
    if (!row) return fallback;
    return {
      ...fallback,
      name: row.businessName || fallback.name,
      tagline: row.tagline || fallback.tagline,
      email: row.email || fallback.email,
      notifyEmail: row.notifyEmail || row.email || fallback.email,
      phone: row.phone,
      address: row.address,
      websiteUrl: row.websiteUrl || fallback.websiteUrl,
      logoUrl: row.logoUrl,
      socials: row.socials ?? {},
      seo: row.seo ?? {},
      contactForm: row.contactForm ?? { requireOrganization: true },
    };
  } catch (error) {
    console.error("[settings] falling back to defaults:", error instanceof Error ? error.message : "unknown");
    return fallback;
  }
});

interface ContentMap {
  [key: string]: unknown;
}

/** Editable keyed content (home, about) merged with founder fields for about. */
export const getSiteContent = cache(async (key: string): Promise<ContentMap> => {
  try {
    const rows = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
    return rows[0]?.content ?? {};
  } catch {
    return {};
  }
});

export const getAboutContent = cache(async () => {
  const content = await getSiteContent("about");
  return {
    mission: (content.mission as string) ?? "",
    values: (content.values as string[]) ?? [],
    approach: (content.approach as string) ?? "",
    onboarding: (content.onboarding as string) ?? "",
    founderName: (content.founderName as string) ?? founderDefaults.name,
    founderHeadline: (content.founderHeadline as string) ?? founderDefaults.headline,
    founderBio: (content.founderBio as string) ?? founderDefaults.bio,
  };
});

export const getHomeContent = cache(async () => {
  const content = await getSiteContent("home");
  return {
    heroEyebrow: (content.heroEyebrow as string) ?? "Independent RCM Partner",
    heroHeading: (content.heroHeading as string) ?? siteDefaults.seo.title ?? "",
    heroSubheading: (content.heroSubheading as string) ?? siteDefaults.seo.description ?? "",
    introHeading: (content.introHeading as string) ?? "",
    introBody: (content.introBody as string) ?? "",
    specialties: (content.specialties as string[]) ?? [],
    whyUs: (content.whyUs as string[]) ?? [],
  };
});

export const getServices = cache(async (visibleOnly = true) => {
  try {
    const rows = await db.select().from(services).orderBy(asc(services.displayOrder), asc(services.title));
    return visibleOnly ? rows.filter((s) => s.isVisible) : rows;
  } catch {
    return [];
  }
});

export const getServiceBySlug = cache(async (slug: string) => {
  try {
    const rows = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
    const row = rows[0];
    return row && row.isVisible ? row : null;
  } catch {
    return null;
  }
});

export const getExperiences = cache(async (publishedOnly = true) => {
  try {
    const rows = await db.select().from(experiences).orderBy(asc(experiences.displayOrder), asc(experiences.organization));
    return publishedOnly ? rows.filter((r) => r.isPublished) : rows;
  } catch {
    return [];
  }
});

export const getSpecialties = cache(async (visibleOnly = true) => {
  try {
    const { specialties } = await import("@/db/schema");
    const rows = await db.select().from(specialties).orderBy(asc(specialties.displayOrder), asc(specialties.name));
    return visibleOnly ? rows.filter((s) => s.isVisible) : rows;
  } catch {
    return [];
  }
});

export const getFaqs = cache(async (publishedOnly = true) => {
  try {
    const rows = await db.select().from(faqs).orderBy(asc(faqs.displayOrder), asc(faqs.question));
    return publishedOnly ? rows.filter((f) => f.isPublished) : rows;
  } catch {
    return [];
  }
});
