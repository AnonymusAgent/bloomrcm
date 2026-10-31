import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { audit, clientIp } from "@/lib/auth";
import { getServices, getSettings } from "@/lib/content";
import { hitRateLimit } from "@/lib/limiter";
import { sendInquiryEmails, type EmailStatus } from "@/lib/email";
import { dedupeHash, hashIp } from "@/lib/security";
import { contactSchema } from "@/lib/utils";
import { PRIVACY_NOTICE_VERSION } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > 32_000) return json({ ok: false, error: "Your submission is too large." }, 413);
    raw = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "Invalid request format." }, 400);
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json({ ok: false, error: "Please review the highlighted fields.", fieldErrors }, 422);
  }

  const data = parsed.data;

  // Spam controls: honeypot + time-trap. Silently accept so bots learn nothing.
  const elapsed = data.startedAt ? Date.now() - data.startedAt : Number.POSITIVE_INFINITY;
  if ((data.company ?? "") !== "" || elapsed < 2500) {
    return json({ ok: true, filtered: true, message: "Thank you — your inquiry has been received." });
  }

  // Rate limiting: 6 submissions / hour / IP.
  const ip = await clientIp();
  const limit = await hitRateLimit(`contact:${hashIp(ip)}`, 6, 60);
  if (!limit.allowed) {
    return json(
      { ok: false, error: `Too many submissions from this network. Please try again in about ${Math.ceil(limit.retryAfterSec / 60)} minute(s) or email us directly.` },
      429,
    );
  }

  // Business rule: organization can be required by configuration.
  const settings = await getSettings();
  if (settings.contactForm.requireOrganization && !data.organization) {
    return json({ ok: false, error: "Please review the highlighted fields.", fieldErrors: { organization: "Please enter your practice or organization name." } }, 422);
  }

  // Restrict service labels to published services (plus a generic option).
  const published = new Set((await getServices(true)).map((s) => s.title));
  const services = data.services.filter((s) => published.has(s)).slice(0, 12);

  // Duplicate protection: same sender + same message within 10 minutes.
  const hash = dedupeHash(data.email, data.message);
  try {
    const dupe = await db
      .select({ id: inquiries.id })
      .from(inquiries)
      .where(and(eq(inquiries.dedupeHash, hash), gte(inquiries.submittedAt, new Date(Date.now() - 10 * 60 * 1000))))
      .limit(1);
    if (dupe[0]) {
      return json({
        ok: true,
        duplicate: true,
        reference: dupe[0].id,
        message: "We've already received this exact inquiry — no need to send it again. We'll respond as soon as possible.",
      });
    }
  } catch (error) {
    console.error("[contact] duplicate check failed:", error instanceof Error ? error.message : "unknown");
  }

  // Persist the inquiry. This is the source of truth and must never be
  // rolled back because an email or downstream service failed.
  const userAgent = request.headers.get("user-agent") ?? "";
  let stored: { id: string } | undefined;
  try {
    const [row] = await db
      .insert(inquiries)
      .values({
        fullName: data.fullName,
        email: data.email,
        organization: data.organization,
        phone: data.phone,
        practiceType: data.practiceType,
        servicesRequested: services,
        claimVolume: data.claimVolume,
        preferredContact: data.preferredContact,
        message: data.message,
        privacyAck: true,
        privacyVersion: PRIVACY_NOTICE_VERSION,
        dedupeHash: hash,
        ipHash: hashIp(ip),
        userAgent: userAgent.slice(0, 300),
      })
      .returning({ id: inquiries.id });
    stored = row;
  } catch (error) {
    console.error("[contact] persistence failed:", error instanceof Error ? error.message : "unknown");
    return json({ ok: false, error: "We could not save your inquiry right now. Please try again in a moment." }, 500);
  }

  await audit("inquiry.created", { entity: "inquiry", entityId: stored.id, ip });

  // Email delivery: notify the business + confirm to the submitter.
  // Status is recorded, never faked.
  let emailStatus: EmailStatus = "not_configured";
  try {
    emailStatus = await sendInquiryEmails({
      id: stored.id,
      fullName: data.fullName,
      email: data.email,
      organization: data.organization,
      phone: data.phone,
      practiceType: data.practiceType,
      services,
      claimVolume: data.claimVolume,
      preferredContact: data.preferredContact,
      message: data.message,
      businessName: settings.name,
      notifyEmail: settings.notifyEmail || settings.email,
    });
    await db.update(inquiries).set({ emailStatus }).where(eq(inquiries.id, stored.id));
  } catch (error) {
    console.error("[contact] email handling error:", error instanceof Error ? error.message : "unknown");
    await db.update(inquiries).set({ emailStatus: "failed" }).where(eq(inquiries.id, stored.id)).catch(() => undefined);
  }

  return json({
    ok: true,
    reference: stored.id,
    emailDelivered: emailStatus === "sent",
    message:
      "Thank you — your inquiry has been received. We'll respond within one to two business days" +
      (data.preferredContact === "phone" && data.phone ? " at the phone number you provided." : " at your email address."),
  });
}

export function GET() {
  return json({ ok: false, error: "Method not allowed." }, 405);
}
