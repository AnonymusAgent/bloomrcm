import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { audit, clientIp, requireOwner } from "@/lib/auth";
import { csvEscape } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owner-only CSV export of inquiries, honoring the same filters as the list UI. */
export async function GET(request: NextRequest) {
  const user = await requireOwner();
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 120);
  const status = sp.get("status") ?? "";
  const service = (sp.get("service") ?? "").trim().slice(0, 100);
  const archived = sp.get("archived") === "1";

  const conditions: SQL[] = [eq(inquiries.isArchived, archived)];
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(or(ilike(inquiries.fullName, pattern), ilike(inquiries.email, pattern), ilike(inquiries.organization, pattern))!);
  }
  if (status && (LEAD_STATUSES as readonly string[]).includes(status)) conditions.push(eq(inquiries.status, status));
  if (service) conditions.push(sql`services_requested::text ILIKE ${"%" + service + "%"}`);
  if (sp.get("from")) conditions.push(sql`submitted_at >= ${sp.get("from")!}::date`);
  if (sp.get("to")) conditions.push(sql`submitted_at < (${sp.get("to")!}::date + interval '1 day')`);

  const rows = await db
    .select()
    .from(inquiries)
    .where(and(...conditions))
    .orderBy(desc(inquiries.submittedAt))
    .limit(5000);

  const header = [
    "ID", "Full name", "Email", "Phone", "Organization", "Practice type", "Services requested",
    "Claim volume", "Preferred contact", "Status", "Message", "Submitted at", "Last updated", "Archived",
  ];
  const lines = rows.map((r) =>
    [
      r.id, r.fullName, r.email, r.phone, r.organization, r.practiceType,
      r.servicesRequested.join("; "), r.claimVolume, r.preferredContact,
      LEAD_STATUS_LABELS[r.status as LeadStatus] ?? r.status,
      r.message, r.submittedAt.toISOString(), r.updatedAt.toISOString(), String(r.isArchived),
    ]
      .map(csvEscape)
      .join(","),
  );
  const csv = `﻿${header.map(csvEscape).join(",")}\n${lines.join("\n")}\n`;

  await audit("inquiry.export", {
    actorId: user.id,
    entity: "inquiry",
    metadata: { count: rows.length, filters: { q, status, service, archived } },
    ip: await clientIp(),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inquiries-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
