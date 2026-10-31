"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  businessSettings,
  experiences,
  faqs,
  followUpTasks,
  inquiries,
  inquiryNotes,
  services,
  siteContent,
  specialties,
  statusHistory,
} from "@/db/schema";
import { audit, clientIp, requireOwner, requirePermission } from "@/lib/auth";
import {
  aboutContentSchema,
  experienceSchema,
  faqSchema,
  homeContentSchema,
  lines,
  noteSchema,
  serviceSchema,
  settingsSchema,
  slugify,
  specialtySchema,
  taskSchema,
} from "@/lib/utils";
import { LEAD_STATUSES, type LeadStatus } from "@/config/site";

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}
function okTo(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}notice=${encodeURIComponent(message)}`);
}
const s = (fd: FormData, key: string) => String(fd.get(key) ?? "");
const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";

async function touchInquiry(id: string) {
  await db.update(inquiries).set({ updatedAt: new Date() }).where(eq(inquiries.id, id));
}

/* ============================== LEADS ================================ */

export async function setInquiryStatus(formData: FormData): Promise<void> {
  const admin = await requirePermission("inquiries.update");
  const id = s(formData, "id");
  const status = s(formData, "status") as LeadStatus;
  const back = `/admin/inquiries/${id}`;
  if (!LEAD_STATUSES.includes(status)) fail(back, "Invalid status.");
  const rows = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  const inquiry = rows[0];
  if (!inquiry) fail("/admin/inquiries", "Inquiry not found.");
  if (inquiry.status !== status) {
    await db.update(inquiries).set({ status, isRead: true, updatedAt: new Date() }).where(eq(inquiries.id, id));
    await db.insert(statusHistory).values({ inquiryId: id, fromStatus: inquiry.status, toStatus: status, changedBy: admin.id });
    await audit("inquiry.status_changed", { actorId: admin.id, entity: "inquiry", entityId: id, metadata: { from: inquiry.status, to: status } });
  }
  revalidatePath("/admin");
  okTo(back, `Status updated to "${status === "proposal_sent" ? "Proposal Sent" : status[0].toUpperCase() + status.slice(1)}".`);
}

export async function addInquiryNote(formData: FormData): Promise<void> {
  const admin = await requirePermission("inquiries.update");
  const id = s(formData, "id");
  const back = `/admin/inquiries/${id}`;
  const parsed = noteSchema.safeParse({ note: s(formData, "note") });
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Invalid note.");
  await db.insert(inquiryNotes).values({ inquiryId: id, authorId: admin.id, note: parsed.data.note });
  await db.update(inquiries).set({ isRead: true, updatedAt: new Date() }).where(eq(inquiries.id, id));
  await audit("inquiry.note_added", { actorId: admin.id, entity: "inquiry", entityId: id });
  okTo(back, "Note added.");
}

export async function markInquiryRead(formData: FormData): Promise<void> {
  await requirePermission("inquiries.view");
  const id = s(formData, "id");
  await db.update(inquiries).set({ isRead: true, updatedAt: new Date() }).where(eq(inquiries.id, id));
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function addFollowUpTask(formData: FormData): Promise<void> {
  const admin = await requirePermission("inquiries.update");
  const id = s(formData, "id");
  const back = `/admin/inquiries/${id}`;
  const parsed = taskSchema.safeParse({ title: s(formData, "title"), dueDate: s(formData, "dueDate") });
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Invalid task.");
  await db.insert(followUpTasks).values({ inquiryId: id, title: parsed.data.title, dueDate: parsed.data.dueDate, createdBy: admin.id });
  await touchInquiry(id);
  await audit("inquiry.task_added", { actorId: admin.id, entity: "inquiry", entityId: id });
  okTo(back, "Follow-up task added.");
}

export async function toggleTask(formData: FormData): Promise<void> {
  await requirePermission("inquiries.update");
  const id = s(formData, "id");
  const taskId = s(formData, "taskId");
  const complete = s(formData, "complete") === "1";
  await db
    .update(followUpTasks)
    .set({ isCompleted: complete, completedAt: complete ? new Date() : null })
    .where(eq(followUpTasks.id, taskId));
  await touchInquiry(id);
  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin");
}

export async function setAssignee(formData: FormData): Promise<void> {
  const admin = await requirePermission("inquiries.update");
  const id = s(formData, "id");
  const assignee = s(formData, "assignedTo");
  await db.update(inquiries).set({ assignedTo: assignee || null, updatedAt: new Date() }).where(eq(inquiries.id, id));
  await audit("inquiry.assigned", { actorId: admin.id, entity: "inquiry", entityId: id, metadata: { assignedTo: assignee || null } });
  okTo(`/admin/inquiries/${id}`, "Assignment updated.");
}

export async function archiveInquiry(formData: FormData): Promise<void> {
  const admin = await requirePermission("inquiries.archive");
  const id = s(formData, "id");
  const archive = s(formData, "archive") === "1";
  await db.update(inquiries).set({ isArchived: archive, updatedAt: new Date() }).where(eq(inquiries.id, id));
  await audit(archive ? "inquiry.archived" : "inquiry.restored", { actorId: admin.id, entity: "inquiry", entityId: id });
  revalidatePath("/admin/inquiries");
  okTo(archive ? "/admin/inquiries" : `/admin/inquiries/${id}`, archive ? "Inquiry archived." : "Inquiry restored.");
}

export async function deleteInquiry(formData: FormData): Promise<void> {
  const admin = await requireOwner();
  const id = s(formData, "id");
  await db.delete(inquiries).where(eq(inquiries.id, id));
  await audit("inquiry.deleted", { actorId: admin.id, entity: "inquiry", entityId: id, ip: await clientIp() });
  revalidatePath("/admin");
  okTo("/admin/inquiries", "Inquiry permanently deleted.");
}

/* ============================ SERVICES ============================== */

export async function upsertService(formData: FormData): Promise<void> {
  const admin = await requirePermission("content.manage");
  const id = s(formData, "id");
  const parsed = serviceSchema.safeParse({
    title: s(formData, "title"), slug: s(formData, "slug"), summary: s(formData, "summary"),
    description: s(formData, "description"), workflow: s(formData, "workflow"), value: s(formData, "value"),
    requirements: s(formData, "requirements"), icon: s(formData, "icon"),
    isVisible: bool(formData, "isVisible"), displayOrder: s(formData, "displayOrder") || "0",
  });
  const back = id ? `/admin/services?id=${id}` : "/admin/services?id=new";
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Invalid service.");
  const slug = slugify(parsed.data.slug || parsed.data.title);
  if (!slug) fail(back, "A valid slug is required.");
  const slugClash = await db.select({ id: services.id }).from(services).where(eq(services.slug, slug)).limit(1);
  if (slugClash[0] && slugClash[0].id !== id) fail(back, "Another service already uses this slug.");
  const values = { ...parsed.data, slug, updatedAt: new Date() };
  if (id) {
    await db.update(services).set(values).where(eq(services.id, id));
    await audit("service.updated", { actorId: admin.id, entity: "service", entityId: id });
  } else {
    const [created] = await db.insert(services).values(values).returning();
    await audit("service.created", { actorId: admin.id, entity: "service", entityId: created.id });
  }
  revalidatePath("/services");
  revalidatePath("/");
  okTo("/admin/services", "Service saved.");
}

export async function deleteService(formData: FormData): Promise<void> {
  const admin = await requireOwner();
  const id = s(formData, "id");
  await db.delete(services).where(eq(services.id, id));
  await audit("service.deleted", { actorId: admin.id, entity: "service", entityId: id });
  revalidatePath("/services");
  okTo("/admin/services", "Service deleted.");
}

export async function toggleServiceVisibility(formData: FormData): Promise<void> {
  await requirePermission("content.manage");
  const id = s(formData, "id");
  await db.execute(sql`UPDATE services SET is_visible = NOT is_visible, updated_at = now() WHERE id = ${id}`);
  revalidatePath("/admin/services");
  revalidatePath("/services");
}

async function moveRow(table: "services" | "experiences" | "faqs" | "specialties", id: string, dir: number) {
  const rows =
    table === "services"
      ? await db.select({ id: services.id, displayOrder: services.displayOrder }).from(services).orderBy(asc(services.displayOrder))
      : table === "experiences"
        ? await db.select({ id: experiences.id, displayOrder: experiences.displayOrder }).from(experiences).orderBy(asc(experiences.displayOrder))
        : table === "specialties"
          ? await db.select({ id: specialties.id, displayOrder: specialties.displayOrder }).from(specialties).orderBy(asc(specialties.displayOrder))
          : await db.select({ id: faqs.id, displayOrder: faqs.displayOrder }).from(faqs).orderBy(asc(faqs.displayOrder));
  const idx = rows.findIndex((r) => r.id === id);
  const swapWith = rows[idx + dir];
  if (idx === -1 || !swapWith) return;
  const me = rows[idx];
  const update = async (rowId: string, order: number) => {
    if (table === "services") await db.update(services).set({ displayOrder: order }).where(eq(services.id, rowId));
    else if (table === "experiences") await db.update(experiences).set({ displayOrder: order }).where(eq(experiences.id, rowId));
    else if (table === "specialties") await db.update(specialties).set({ displayOrder: order }).where(eq(specialties.id, rowId));
    else await db.update(faqs).set({ displayOrder: order }).where(eq(faqs.id, rowId));
  };
  const newMine = swapWith.displayOrder === me.displayOrder ? swapWith.displayOrder + dir : swapWith.displayOrder;
  await update(me.id, newMine);
  await update(swapWith.id, me.displayOrder);
}

export async function reorderItem(formData: FormData): Promise<void> {
  await requirePermission("content.manage");
  const table = s(formData, "table");
  if (!["services", "experiences", "faqs", "specialties"].includes(table)) fail("/admin", "Invalid table.");
  await moveRow(table as "services" | "experiences" | "faqs" | "specialties", s(formData, "id"), s(formData, "dir") === "up" ? -1 : 1);
  revalidatePath(`/admin/${table}`);
  revalidatePath("/");
}

/* =========================== EXPERIENCE ============================= */

export async function upsertExperience(formData: FormData): Promise<void> {
  const admin = await requirePermission("content.manage");
  const id = s(formData, "id");
  const parsed = experienceSchema.safeParse({
    organization: s(formData, "organization"), role: s(formData, "role"),
    startDate: s(formData, "startDate"), endDate: s(formData, "endDate"),
    isCurrent: bool(formData, "isCurrent"), description: s(formData, "description"),
    responsibilities: s(formData, "responsibilities"), specialties: s(formData, "specialties"),
    systems: s(formData, "systems"), clearinghouses: s(formData, "clearinghouses"),
    achievements: s(formData, "achievements"), logoUrl: s(formData, "logoUrl"),
    isPublished: bool(formData, "isPublished"), displayOrder: s(formData, "displayOrder") || "0",
  });
  const back = id ? `/admin/experience?id=${id}` : "/admin/experience?id=new";
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Invalid experience record.");
  const values = {
    ...parsed.data,
    responsibilities: lines(parsed.data.responsibilities),
    specialties: lines(parsed.data.specialties),
    systems: lines(parsed.data.systems),
    clearinghouses: lines(parsed.data.clearinghouses),
    logoUrl: parsed.data.logoUrl || null,
    updatedAt: new Date(),
  };
  if (id) {
    await db.update(experiences).set(values).where(eq(experiences.id, id));
    await audit("experience.updated", { actorId: admin.id, entity: "experience", entityId: id });
  } else {
    const [created] = await db.insert(experiences).values(values).returning();
    await audit("experience.created", { actorId: admin.id, entity: "experience", entityId: created.id });
  }
  revalidatePath("/experience");
  revalidatePath("/");
  okTo("/admin/experience", "Experience record saved.");
}

export async function deleteExperience(formData: FormData): Promise<void> {
  const admin = await requireOwner();
  const id = s(formData, "id");
  await db.delete(experiences).where(eq(experiences.id, id));
  await audit("experience.deleted", { actorId: admin.id, entity: "experience", entityId: id });
  revalidatePath("/experience");
  okTo("/admin/experience", "Experience record deleted.");
}

export async function toggleExperiencePublished(formData: FormData): Promise<void> {
  await requirePermission("content.manage");
  const id = s(formData, "id");
  await db.execute(sql`UPDATE experiences SET is_published = NOT is_published, updated_at = now() WHERE id = ${id}`);
  revalidatePath("/admin/experience");
  revalidatePath("/experience");
}

/* ============================== FAQS ================================ */

export async function upsertFaq(formData: FormData): Promise<void> {
  const admin = await requirePermission("content.manage");
  const id = s(formData, "id");
  const parsed = faqSchema.safeParse({
    question: s(formData, "question"), answer: s(formData, "answer"), category: s(formData, "category") || "General",
    isPublished: bool(formData, "isPublished"), displayOrder: s(formData, "displayOrder") || "0",
  });
  const back = id ? `/admin/faqs?id=${id}` : "/admin/faqs?id=new";
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Invalid FAQ.");
  const values = { ...parsed.data, updatedAt: new Date() };
  if (id) {
    await db.update(faqs).set(values).where(eq(faqs.id, id));
    await audit("faq.updated", { actorId: admin.id, entity: "faq", entityId: id });
  } else {
    const [created] = await db.insert(faqs).values(values).returning();
    await audit("faq.created", { actorId: admin.id, entity: "faq", entityId: created.id });
  }
  revalidatePath("/faq");
  okTo("/admin/faqs", "FAQ saved.");
}

export async function deleteFaq(formData: FormData): Promise<void> {
  const admin = await requireOwner();
  const id = s(formData, "id");
  await db.delete(faqs).where(eq(faqs.id, id));
  await audit("faq.deleted", { actorId: admin.id, entity: "faq", entityId: id });
  revalidatePath("/faq");
  okTo("/admin/faqs", "FAQ deleted.");
}

export async function toggleFaqPublished(formData: FormData): Promise<void> {
  await requirePermission("content.manage");
  const id = s(formData, "id");
  await db.execute(sql`UPDATE faqs SET is_published = NOT is_published, updated_at = now() WHERE id = ${id}`);
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}

/* =========================== SPECIALTIES ============================ */

export async function upsertSpecialty(formData: FormData): Promise<void> {
  const admin = await requirePermission("content.manage");
  const id = s(formData, "id");
  const parsed = specialtySchema.safeParse({
    name: s(formData, "name"),
    blurb: s(formData, "blurb"),
    icon: s(formData, "icon") || "Stethoscope",
    isVisible: bool(formData, "isVisible"),
    displayOrder: s(formData, "displayOrder") || "0",
  });
  const back = id ? `/admin/specialties?id=${id}` : "/admin/specialties?id=new";
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Invalid specialty.");
  const values = { name: parsed.data.name, blurb: parsed.data.blurb, icon: parsed.data.icon, isVisible: parsed.data.isVisible, displayOrder: parsed.data.displayOrder, updatedAt: new Date() };
  if (id) {
    await db.update(specialties).set(values).where(eq(specialties.id, id));
    await audit("specialty.updated", { actorId: admin.id, entity: "specialty", entityId: id });
  } else {
    const [created] = await db.insert(specialties).values(values).returning();
    await audit("specialty.created", { actorId: admin.id, entity: "specialty", entityId: created.id });
  }
  revalidatePath("/specialties");
  revalidatePath("/");
  okTo("/admin/specialties", "Specialty saved.");
}

export async function deleteSpecialty(formData: FormData): Promise<void> {
  const admin = await requireOwner();
  const id = s(formData, "id");
  await db.delete(specialties).where(eq(specialties.id, id));
  await audit("specialty.deleted", { actorId: admin.id, entity: "specialty", entityId: id });
  revalidatePath("/specialties");
  revalidatePath("/");
  okTo("/admin/specialties", "Specialty deleted.");
}

export async function toggleSpecialtyVisibility(formData: FormData): Promise<void> {
  await requirePermission("content.manage");
  const id = s(formData, "id");
  await db.execute(sql`UPDATE specialties SET is_visible = NOT is_visible, updated_at = now() WHERE id = ${id}`);
  revalidatePath("/admin/specialties");
  revalidatePath("/specialties");
  revalidatePath("/");
}

/* ============================= ANALYTICS ============================ */

/** Owner-only data-retention control: wipe all first-party analytics data. */
export async function purgeAnalytics(formData: FormData): Promise<void> {
  const admin = await requireOwner();
  const scope = s(formData, "scope"); // "all" | "90"
  try {
    if (scope === "90") {
      await db.execute(sql`DELETE FROM analytics_pageviews WHERE created_at < now() - interval '90 days'`);
      await db.execute(sql`DELETE FROM analytics_sessions WHERE started_at < now() - interval '90 days'`);
      await db.execute(sql`DELETE FROM analytics_visitors WHERE last_seen_at < now() - interval '90 days'`);
    } else {
      await db.execute(sql`DELETE FROM analytics_pageviews`);
      await db.execute(sql`DELETE FROM analytics_sessions`);
      await db.execute(sql`DELETE FROM analytics_visitors`);
    }
  } catch (error) {
    console.error("[analytics] purge failed:", error instanceof Error ? error.message : "unknown");
    fail("/admin/analytics", "Could not purge analytics data. Please try again.");
  }
  await audit("analytics.purged", { actorId: admin.id, entity: "analytics", metadata: { scope: scope || "all" }, ip: await clientIp() });
  revalidatePath("/admin/analytics");
  okTo("/admin/analytics", scope === "90" ? "Analytics older than 90 days deleted." : "All analytics data deleted.");
}

/* ============================= SETTINGS ============================= */

export async function saveSettings(formData: FormData): Promise<void> {
  const admin = await requireOwner();
  const parsed = settingsSchema.safeParse({
    businessName: s(formData, "businessName"), tagline: s(formData, "tagline"), email: s(formData, "email"),
    phone: s(formData, "phone"), address: s(formData, "address"), websiteUrl: s(formData, "websiteUrl"),
    notifyEmail: s(formData, "notifyEmail"), linkedin: s(formData, "linkedin"), x: s(formData, "x"),
    seoTitle: s(formData, "seoTitle"), seoDescription: s(formData, "seoDescription"),
    requireOrganization: bool(formData, "requireOrganization"),
    founderName: s(formData, "founderName"), founderHeadline: s(formData, "founderHeadline"), founderBio: s(formData, "founderBio"),
  });
  if (!parsed.success) fail("/admin/settings", parsed.error.issues[0]?.message ?? "Invalid settings.");
  await db
    .insert(businessSettings)
    .values({
      id: 1,
      businessName: parsed.data.businessName,
      tagline: parsed.data.tagline,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      websiteUrl: parsed.data.websiteUrl,
      notifyEmail: parsed.data.notifyEmail,
      socials: { linkedin: parsed.data.linkedin, x: parsed.data.x },
      seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
      contactForm: { requireOrganization: parsed.data.requireOrganization },
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: businessSettings.id,
      set: {
        businessName: parsed.data.businessName,
        tagline: parsed.data.tagline,
        email: parsed.data.email,
        phone: parsed.data.phone,
        address: parsed.data.address,
        websiteUrl: parsed.data.websiteUrl,
        notifyEmail: parsed.data.notifyEmail,
        socials: { linkedin: parsed.data.linkedin, x: parsed.data.x },
        seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
        contactForm: { requireOrganization: parsed.data.requireOrganization },
        updatedAt: new Date(),
      },
    });

  // Founder profile lives in the editable "about" content blob.
  const existing = await db.select().from(siteContent).where(eq(siteContent.key, "about")).limit(1);
  const merged = { ...(existing[0]?.content ?? {}), founderName: parsed.data.founderName, founderHeadline: parsed.data.founderHeadline, founderBio: parsed.data.founderBio };
  await db
    .insert(siteContent)
    .values({ key: "about", content: merged, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteContent.key, set: { content: merged, updatedAt: new Date() } });

  await audit("settings.updated", { actorId: admin.id, entity: "business_settings", ip: await clientIp() });
  revalidatePath("/", "layout");
  okTo("/admin/settings", "Settings saved. The public site now reflects your changes.");
}

export async function saveHomeContent(formData: FormData): Promise<void> {
  const admin = await requirePermission("content.manage");
  const parsed = homeContentSchema.safeParse({
    heroEyebrow: s(formData, "heroEyebrow"), heroHeading: s(formData, "heroHeading"), heroSubheading: s(formData, "heroSubheading"),
    introHeading: s(formData, "introHeading"), introBody: s(formData, "introBody"),
    specialties: s(formData, "specialties"), whyUs: s(formData, "whyUs"),
  });
  if (!parsed.success) fail("/admin/settings?section=home", parsed.error.issues[0]?.message ?? "Invalid homepage content.");
  const existing = await db.select().from(siteContent).where(eq(siteContent.key, "home")).limit(1);
  const content = {
    ...(existing[0]?.content ?? {}),
    heroEyebrow: parsed.data.heroEyebrow,
    heroHeading: parsed.data.heroHeading,
    heroSubheading: parsed.data.heroSubheading,
    introHeading: parsed.data.introHeading,
    introBody: parsed.data.introBody,
    specialties: lines(parsed.data.specialties.replaceAll(",", "\n")),
    whyUs: lines(parsed.data.whyUs),
  };
  await db
    .insert(siteContent)
    .values({ key: "home", content, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteContent.key, set: { content, updatedAt: new Date() } });
  await audit("content.home_updated", { actorId: admin.id, entity: "site_content", entityId: "home" });
  revalidatePath("/");
  okTo("/admin/settings?section=home", "Homepage content saved.");
}

export async function saveAboutContent(formData: FormData): Promise<void> {
  const admin = await requirePermission("content.manage");
  const parsed = aboutContentSchema.safeParse({
    mission: s(formData, "mission"), values: s(formData, "values"), approach: s(formData, "approach"), onboarding: s(formData, "onboarding"),
  });
  if (!parsed.success) fail("/admin/settings?section=about", parsed.error.issues[0]?.message ?? "Invalid about content.");
  const existing = await db.select().from(siteContent).where(eq(siteContent.key, "about")).limit(1);
  const content = {
    ...(existing[0]?.content ?? {}),
    mission: parsed.data.mission,
    values: lines(parsed.data.values),
    approach: parsed.data.approach,
    onboarding: parsed.data.onboarding,
  };
  await db
    .insert(siteContent)
    .values({ key: "about", content, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteContent.key, set: { content, updatedAt: new Date() } });
  await audit("content.about_updated", { actorId: admin.id, entity: "site_content", entityId: "about" });
  revalidatePath("/about");
  okTo("/admin/settings?section=about", "About page content saved.");
}
