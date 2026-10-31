import Link from "next/link";
import type { Metadata } from "next";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { Archive, ChevronLeft, ChevronRight, Download, SearchX } from "lucide-react";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EmptyState, inputClass, Notice, StatusBadge } from "@/components/ui";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from "@/config/site";

export const metadata: Metadata = { title: "Inquiries", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

interface Filters {
  q: string;
  status: string;
  service: string;
  from: string;
  to: string;
  sort: string;
  page: number;
  archived: boolean;
}

function buildQuery(filters: Filters, includeArchived: boolean): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.service) params.set("service", filters.service);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sort) params.set("sort", filters.sort);
  if (includeArchived) params.set("archived", "1");
  return params.toString();
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const filters: Filters = {
    q: (sp.q ?? "").trim().slice(0, 120),
    status: sp.status ?? "",
    service: (sp.service ?? "").trim().slice(0, 100),
    from: sp.from ?? "",
    to: sp.to ?? "",
    sort: sp.sort ?? "newest",
    page: Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1),
    archived: sp.archived === "1",
  };

  const conditions: SQL[] = [eq(inquiries.isArchived, filters.archived)];
  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(ilike(inquiries.fullName, pattern), ilike(inquiries.email, pattern), ilike(inquiries.organization, pattern))!,
    );
  }
  if (filters.status && (LEAD_STATUSES as readonly string[]).includes(filters.status)) {
    conditions.push(eq(inquiries.status, filters.status));
  }
  if (filters.service) {
    conditions.push(sql`services_requested::text ILIKE ${"%" + filters.service + "%"}`);
  }
  if (filters.from) conditions.push(sql`submitted_at >= ${filters.from}::date`);
  if (filters.to) conditions.push(sql`submitted_at < (${filters.to}::date + interval '1 day')`);

  const where = and(...conditions);
  const orderBy =
    filters.sort === "oldest"
      ? asc(inquiries.submittedAt)
      : filters.sort === "name"
        ? asc(inquiries.fullName)
        : desc(inquiries.submittedAt);

  const [totalRows, rows] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(inquiries).where(where),
    db.select().from(inquiries).where(where).orderBy(orderBy).limit(PAGE_SIZE).offset((filters.page - 1) * PAGE_SIZE),
  ]);
  const total = totalRows[0]?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pages);

  const baseQuery = buildQuery(filters, filters.archived);
  const exportHref = `/admin/export${baseQuery ? `?${baseQuery}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            {filters.archived ? "Archived inquiries" : "Inquiries"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "record" : "records"}
            {baseQuery ? " matching your filters" : ""}. All data is private to authorized administrators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={filters.archived ? "/admin/inquiries" : "/admin/inquiries?archived=1"}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/50"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            {filters.archived ? "View active" : "View archived"}
          </Link>
          {user.role === "owner" ? (
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
              download
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </a>
          ) : null}
        </div>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {/* Filters */}
      <form method="GET" action="/admin/inquiries" className="rounded-2xl border border-border bg-card p-4" aria-label="Filter inquiries">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_1fr_auto]">
          <div>
            <label htmlFor="q" className="sr-only">
              Search by name, email, or organization
            </label>
            <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Search name, email, organization…" className={inputClass} maxLength={120} />
          </div>
          <div>
            <label htmlFor="status" className="sr-only">
              Status
            </label>
            <select id="status" name="status" defaultValue={filters.status} className={inputClass}>
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="service" className="sr-only">
              Service
            </label>
            <input id="service" name="service" type="text" defaultValue={filters.service} placeholder="Filter by service…" className={inputClass} maxLength={100} />
          </div>
          <div>
            <label htmlFor="from" className="sr-only">
              From date
            </label>
            <input id="from" name="from" type="date" defaultValue={filters.from} className={inputClass} />
          </div>
          <div>
            <label htmlFor="to" className="sr-only">
              To date
            </label>
            <input id="to" name="to" type="date" defaultValue={filters.to} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sort" className="sr-only">
              Sort
            </label>
            <select id="sort" name="sort" defaultValue={filters.sort} className={inputClass}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <button type="submit" className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-strong dark:bg-primary dark:text-primary-foreground">
            Apply
          </button>
        </div>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState
          title={baseQuery ? "No inquiries match these filters" : filters.archived ? "Nothing archived" : "No inquiries yet"}
          description={
            baseQuery
              ? "Try broadening your search or clearing some filters."
              : filters.archived
                ? "Archived inquiries will appear here when you archive records from the active list."
                : "When a provider submits the public consultation form, their inquiry will appear here immediately — with its status, history, and follow-up tools."
          }
          action={
            baseQuery ? (
              <Link href={filters.archived ? "/admin/inquiries?archived=1" : "/admin/inquiries"} className="text-sm font-bold text-primary hover:underline">
                Clear all filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">
              Provider inquiries, {total} total. Use the filter form above to narrow results.
            </caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-5 py-3.5 font-bold">Contact</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Organization</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Services</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Submitted</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((inquiry) => (
                <tr key={inquiry.id} className="transition-colors hover:bg-background-subtle/60">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/inquiries/${inquiry.id}`} className="group flex items-center gap-2.5">
                      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${inquiry.isRead ? "bg-border" : "bg-primary"}`} />
                      <span>
                        <span className="block font-bold text-foreground group-hover:text-primary group-hover:underline">
                          {inquiry.fullName}
                        </span>
                        <span className="block text-xs text-muted-foreground">{inquiry.email}</span>
                        {inquiry.phone ? <span className="block text-xs text-muted-foreground">{inquiry.phone}</span> : null}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{inquiry.organization || "—"}</td>
                  <td className="max-w-[220px] px-5 py-3.5">
                    {inquiry.servicesRequested.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        {inquiry.servicesRequested.slice(0, 2).map((s) => (
                          <span key={s} className="rounded-md bg-background-subtle px-2 py-0.5 text-xs font-semibold text-foreground">
                            {s.length > 26 ? `${s.slice(0, 26)}…` : s}
                          </span>
                        ))}
                        {inquiry.servicesRequested.length > 2 ? (
                          <span className="rounded-md bg-background-subtle px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            +{inquiry.servicesRequested.length - 2}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{formatDateTime(inquiry.submittedAt)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={inquiry.status as LeadStatus} label={LEAD_STATUS_LABELS[inquiry.status as LeadStatus] ?? inquiry.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{formatDate(inquiry.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 ? (
        <nav aria-label="Inquiry pages" className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <Link
              aria-disabled={page <= 1}
              href={`/admin/inquiries?${baseQuery}${baseQuery ? "&" : ""}page=${page - 1}`}
              className={`inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-primary/50"}`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Link>
            <Link
              aria-disabled={page >= pages}
              href={`/admin/inquiries?${baseQuery}${baseQuery ? "&" : ""}page=${page + 1}`}
              className={`inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold ${page >= pages ? "pointer-events-none opacity-40" : "hover:border-primary/50"}`}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
