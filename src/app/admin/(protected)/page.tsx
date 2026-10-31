import Link from "next/link";
import type { Metadata } from "next";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  Clock4,
  FileText,
  Inbox,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { db } from "@/db";
import { adminUsers, auditEvents, followUpTasks, inquiries } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EmptyState, Notice, StatusBadge } from "@/components/ui";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from "@/config/site";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const metricIcons: Record<LeadStatus | "total", typeof Inbox> = {
  total: FileText,
  new: Sparkles,
  contacted: UserRoundCheck,
  qualified: BadgeCheck,
  proposal_sent: ClipboardCheck,
  converted: CircleDollarSign,
  closed: Clock4,
  spam: Inbox,
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;

  const [countRows, recentRows, taskRows, auditRows, statusRows] = await Promise.all([
    db.execute(sql`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE status = 'new')::int AS new,
      count(*) FILTER (WHERE status = 'contacted')::int AS contacted,
      count(*) FILTER (WHERE status = 'qualified')::int AS qualified,
      count(*) FILTER (WHERE status = 'proposal_sent')::int AS proposal_sent,
      count(*) FILTER (WHERE status = 'converted')::int AS converted,
      count(*) FILTER (WHERE status = 'closed')::int AS closed,
      count(*) FILTER (WHERE status = 'spam')::int AS spam,
      count(*) FILTER (WHERE NOT is_read)::int AS unread
      FROM inquiries WHERE NOT is_archived`),
    db.select().from(inquiries).where(eq(inquiries.isArchived, false)).orderBy(desc(inquiries.submittedAt)).limit(6),
    db
      .select({ task: followUpTasks, inquiryName: inquiries.fullName, inquiryId2: inquiries.id })
      .from(followUpTasks)
      .innerJoin(inquiries, eq(followUpTasks.inquiryId, inquiries.id))
      .where(eq(followUpTasks.isCompleted, false))
      .orderBy(asc(followUpTasks.dueDate))
      .limit(6),
    db
      .select({ event: auditEvents, actorName: adminUsers.name })
      .from(auditEvents)
      .leftJoin(adminUsers, eq(auditEvents.actorId, adminUsers.id))
      .orderBy(desc(auditEvents.createdAt))
      .limit(8),
    db.execute(sql`SELECT status, count(*)::int AS n FROM inquiries WHERE NOT is_archived GROUP BY status ORDER BY n DESC`),
  ]);

  const counts = countRows.rows[0] as Record<string, number>;
  const total = counts.total ?? 0;
  const dist = (statusRows.rows as { status: string; n: number }[]).filter((r) => r.n > 0);
  const today = new Date().toISOString().slice(0, 10);

  const metrics: { key: LeadStatus; label: string }[] = LEAD_STATUSES.map((status) => ({
    key: status,
    label: LEAD_STATUS_LABELS[status],
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live metrics from real inquiries — nothing here is sample data.
          </p>
        </div>
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          Review inquiries
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <Notice notice={params.notice} error={params.error} />

      {/* Metrics */}
      <section aria-label="Inquiry metrics">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
              Total inquiries
            </dt>
            <dd className="mt-2.5 font-display text-3xl font-extrabold tabular-nums text-foreground">{total}</dd>
            <dd className="mt-1 text-xs font-semibold text-muted-foreground">{counts.unread ?? 0} unread</dd>
          </div>
          {metrics.map(({ key, label }) => {
            const IconCmp = metricIcons[key];
            return (
              <div key={key} className="rounded-2xl border border-border bg-card p-5">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <IconCmp className="h-4 w-4 text-primary" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-2.5 font-display text-3xl font-extrabold tabular-nums text-foreground">{counts[key] ?? 0}</dd>
              </div>
            );
          })}
        </dl>

        {total > 0 && dist.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5" aria-label="Status distribution">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pipeline distribution</p>
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-background-subtle">
              {dist.map((row) => (
                <span
                  key={row.status}
                  title={`${LEAD_STATUS_LABELS[row.status as LeadStatus] ?? row.status}: ${row.n}`}
                  style={{ width: `${(row.n / total) * 100}%` }}
                  className={
                    {
                      new: "bg-blue-500",
                      contacted: "bg-amber-500",
                      qualified: "bg-violet-500",
                      proposal_sent: "bg-cyan-500",
                      converted: "bg-emerald-500",
                      closed: "bg-slate-400",
                      spam: "bg-red-500",
                    }[row.status] ?? "bg-slate-400"
                  }
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold text-muted-foreground">
              {dist.map((row) => (
                <li key={row.status} className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-sm ${
                      {
                        new: "bg-blue-500",
                        contacted: "bg-amber-500",
                        qualified: "bg-violet-500",
                        proposal_sent: "bg-cyan-500",
                        converted: "bg-emerald-500",
                        closed: "bg-slate-400",
                        spam: "bg-red-500",
                      }[row.status] ?? "bg-slate-400"
                    }`}
                    aria-hidden="true"
                  />
                  {LEAD_STATUS_LABELS[row.status as LeadStatus] ?? row.status} ({row.n})
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent inquiries */}
        <section aria-labelledby="recent-heading" className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-heading" className="font-display text-lg font-bold text-foreground">
              Recent inquiries
            </h2>
            <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              View all
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {recentRows.length === 0 ? (
            <EmptyState
              title="No inquiries yet"
              description="When a healthcare provider submits the public consultation form, it will appear here in real time."
            />
          ) : (
            <ul className="divide-y divide-border" role="list">
              {recentRows.map((inquiry) => (
                <li key={inquiry.id}>
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="group flex items-center gap-3 py-3">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${inquiry.isRead ? "bg-border" : "bg-primary"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground group-hover:text-primary">
                        {inquiry.fullName}
                        {inquiry.organization ? <span className="font-medium text-muted-foreground"> — {inquiry.organization}</span> : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">{formatDateTime(inquiry.submittedAt)}</span>
                    </span>
                    <StatusBadge status={inquiry.status as LeadStatus} label={LEAD_STATUS_LABELS[inquiry.status as LeadStatus] ?? inquiry.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming follow-ups */}
        <section aria-labelledby="followups-heading" className="rounded-2xl border border-border bg-card p-6">
          <h2 id="followups-heading" className="font-display text-lg font-bold text-foreground">
            Upcoming follow-ups
          </h2>
          {taskRows.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No open follow-ups"
                description="Follow-up tasks you create on individual inquiries will be listed here, sorted by due date."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3" role="list">
              {taskRows.map(({ task, inquiryName }) => {
                const overdue = task.dueDate && task.dueDate < today;
                return (
                  <li key={task.id} className="flex items-start gap-3 rounded-xl border border-border bg-background-subtle/50 px-4 py-3">
                    <Clock4 className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${overdue ? "text-red-500" : "text-primary"}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        For{" "}
                        <Link href={`/admin/inquiries/${task.inquiryId}`} className="font-semibold text-primary hover:underline">
                          {inquiryName}
                        </Link>{" "}
                        — due{" "}
                        <span className={overdue ? "font-bold text-red-600 dark:text-red-400" : "font-semibold"}>
                          {overdue ? "overdue (" : ""}
                          {task.dueDate ? formatDate(task.dueDate) : "anytime"}
                          {overdue ? ")" : ""}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Audit trail */}
      <section aria-labelledby="audit-heading" className="rounded-2xl border border-border bg-card p-6">
        <h2 id="audit-heading" className="font-display text-lg font-bold text-foreground">
          Recent activity
        </h2>
        {auditRows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Administrative actions will be recorded here.</p>
        ) : (
          <ul className="mt-4 space-y-2.5" role="list">
            {auditRows.map(({ event, actorName }) => (
              <li key={event.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <span className="tabular-nums text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                <span className="font-bold text-foreground">{event.action}</span>
                <span className="text-muted-foreground">
                  {actorName ?? "system"}
                  {event.entity ? ` · ${event.entity}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
