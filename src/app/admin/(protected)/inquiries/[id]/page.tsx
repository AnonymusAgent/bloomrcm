import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  Clock4,
  Mail,
  MailCheck,
  MailWarning,
  MailX,
  MessageSquarePlus,
  Phone,
  ShieldCheck,
  Square,
  StickyNote,
} from "lucide-react";
import { db } from "@/db";
import { adminUsers, followUpTasks, inquiries, inquiryNotes, statusHistory } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  addFollowUpTask,
  addInquiryNote,
  archiveInquiry,
  deleteInquiry,
  markInquiryRead,
  setAssignee,
  setInquiryStatus,
  toggleTask,
} from "@/lib/actions/admin";
import { AutoSubmitSelect, ConfirmButton } from "@/components/admin/widgets";
import { formatDate, formatDateTime } from "@/lib/utils";
import { inputClass, Notice, StatusBadge } from "@/components/ui";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from "@/config/site";

export const metadata: Metadata = { title: "Inquiry detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const EMAIL_STATUS_META: Record<string, { label: string; icon: typeof MailCheck; tone: string }> = {
  sent: { label: "Notification + confirmation delivered", icon: MailCheck, tone: "text-emerald-600 dark:text-emerald-400" },
  partial: { label: "Partial email delivery (one message failed)", icon: MailWarning, tone: "text-amber-600 dark:text-amber-400" },
  failed: { label: "Email delivery failed — inquiry is safely stored", icon: MailX, tone: "text-red-600 dark:text-red-400" },
  not_configured: { label: "Email not configured — inquiry is safely stored", icon: MailWarning, tone: "text-amber-600 dark:text-amber-400" },
  pending: { label: "Email delivery pending", icon: Mail, tone: "text-muted-foreground" },
};

export default async function InquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const rows = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  const inquiry = rows[0];
  if (!inquiry) notFound();

  if (!inquiry.isRead) {
    await markInquiryRead((() => { const fd = new FormData(); fd.set("id", id); return fd; })());
    inquiry.isRead = true;
  }

  const [notes, tasks, history, staff] = await Promise.all([
    db
      .select({ note: inquiryNotes, authorName: adminUsers.name })
      .from(inquiryNotes)
      .leftJoin(adminUsers, eq(inquiryNotes.authorId, adminUsers.id))
      .where(eq(inquiryNotes.inquiryId, id))
      .orderBy(desc(inquiryNotes.createdAt)),
    db.select().from(followUpTasks).where(eq(followUpTasks.inquiryId, id)).orderBy(asc(followUpTasks.isCompleted), asc(followUpTasks.dueDate)),
    db
      .select({ h: statusHistory, actorName: adminUsers.name })
      .from(statusHistory)
      .leftJoin(adminUsers, eq(statusHistory.changedBy, adminUsers.id))
      .where(eq(statusHistory.inquiryId, id))
      .orderBy(desc(statusHistory.createdAt)),
    db.select({ id: adminUsers.id, name: adminUsers.name }).from(adminUsers).orderBy(asc(adminUsers.name)),
  ]);

  const emailMeta = EMAIL_STATUS_META[inquiry.emailStatus] ?? EMAIL_STATUS_META.pending;
  const EmailIcon = emailMeta.icon;
  const statusLabel = LEAD_STATUS_LABELS[inquiry.status as LeadStatus] ?? inquiry.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/inquiries" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All inquiries
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <form action={archiveInquiry}>
            <input type="hidden" name="id" value={inquiry.id} />
            <input type="hidden" name="archive" value={inquiry.isArchived ? "0" : "1"} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/50"
            >
              {inquiry.isArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  Archive
                </>
              )}
            </button>
          </form>
          {user.role === "owner" ? (
            <form action={deleteInquiry}>
              <input type="hidden" name="id" value={inquiry.id} />
              <ConfirmButton message={`Permanently delete the inquiry from "${inquiry.fullName}"? This cannot be undone and is recorded in the audit log.`} />
            </form>
          ) : null}
        </div>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {inquiry.isArchived ? (
        <div role="note" className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100">
          This inquiry is archived. Restore it to return it to the active pipeline.
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* ---------------------------- Left ---------------------------- */}
        <div className="space-y-6">
          <section aria-labelledby="contact-heading" className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 id="contact-heading" className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                  {inquiry.fullName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {inquiry.practiceType} · submitted {formatDateTime(inquiry.submittedAt)}
                </p>
              </div>
              <StatusBadge status={inquiry.status as LeadStatus} label={statusLabel} />
            </div>
            <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-semibold">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline">
                    {inquiry.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  {inquiry.phone ? (
                    <a href={`tel:${inquiry.phone.replace(/[^+\d]/g, "")}`} className="text-primary hover:underline">
                      {inquiry.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization</dt>
                <dd className="mt-1 text-sm font-semibold">{inquiry.organization || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly claim volume</dt>
                <dd className="mt-1 text-sm font-semibold">{inquiry.claimVolume || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred contact</dt>
                <dd className="mt-1 text-sm font-semibold capitalize">{inquiry.preferredContact}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Privacy notice</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                  Acknowledged · v{inquiry.privacyVersion}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="services-heading" className="rounded-2xl border border-border bg-card p-6">
            <h2 id="services-heading" className="font-display text-lg font-bold text-foreground">
              Services requested
            </h2>
            {inquiry.servicesRequested.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No specific services selected.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2" role="list">
                {inquiry.servicesRequested.map((s) => (
                  <li key={s} className="rounded-full border border-border bg-background-subtle px-3.5 py-1.5 text-xs font-bold text-foreground">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <h2 className="mt-6 font-display text-lg font-bold text-foreground">Message</h2>
            <p className="mt-2 whitespace-pre-wrap rounded-xl bg-background-subtle/70 p-4 text-sm leading-relaxed text-foreground">
              {inquiry.message}
            </p>
          </section>

          {/* Notes */}
          <section aria-labelledby="notes-heading" className="rounded-2xl border border-border bg-card p-6">
            <h2 id="notes-heading" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <StickyNote className="h-5 w-5 text-primary" aria-hidden="true" />
              Internal notes
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">(private)</span>
            </h2>
            <form action={addInquiryNote} className="mt-4">
              <input type="hidden" name="id" value={inquiry.id} />
              <label htmlFor="note" className="sr-only">
                Add an internal note
              </label>
              <textarea id="note" name="note" rows={3} maxLength={4000} required placeholder="Add context from a call, next steps, or internal observations…" className={inputClass} />
              <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-strong dark:bg-primary dark:text-primary-foreground">
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                Add note
              </button>
            </form>
            {notes.length > 0 ? (
              <ul className="mt-5 space-y-3" role="list">
                {notes.map(({ note, authorName }) => (
                  <li key={note.id} className="rounded-xl border border-border bg-background-subtle/50 px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{note.note}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      {authorName ?? "Former administrator"} · {formatDateTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No notes yet. Notes stay private to staff and are never exposed publicly.</p>
            )}
          </section>
        </div>

        {/* ---------------------------- Right --------------------------- */}
        <div className="space-y-6">
          <section aria-labelledby="pipeline-heading" className="rounded-2xl border border-border bg-card p-6">
            <h2 id="pipeline-heading" className="font-display text-lg font-bold text-foreground">
              Pipeline status
            </h2>
            <div className="mt-3">
              <AutoSubmitSelect
                action={setInquiryStatus}
                name="status"
                hiddenInputs={{ id: inquiry.id }}
                defaultValue={inquiry.status}
                ariaLabel="Change lead status"
                options={LEAD_STATUSES.map((status) => ({ value: status, label: LEAD_STATUS_LABELS[status] }))}
              />
            </div>
            <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned to</h3>
            <div className="mt-2">
              <AutoSubmitSelect
                action={setAssignee}
                name="assignedTo"
                hiddenInputs={{ id: inquiry.id }}
                defaultValue={inquiry.assignedTo ?? ""}
                ariaLabel="Assign to staff member"
                options={[{ value: "", label: "Unassigned" }, ...staff.map((s) => ({ value: s.id, label: s.name }))]}
              />
            </div>
            <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Email delivery</h3>
            <p className={`mt-2 flex items-start gap-2 text-sm font-semibold ${emailMeta.tone}`}>
              <EmailIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {emailMeta.label}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Reference: {inquiry.id}</p>
          </section>

          {/* Follow-up tasks */}
          <section aria-labelledby="tasks-heading" className="rounded-2xl border border-border bg-card p-6">
            <h2 id="tasks-heading" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
              Follow-up tasks
            </h2>
            <form action={addFollowUpTask} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={inquiry.id} />
              <div>
                <label htmlFor="task-title" className="sr-only">
                  Task title
                </label>
                <input id="task-title" name="title" type="text" required maxLength={200} placeholder="e.g. Call to schedule intro meeting" className={inputClass} />
              </div>
              <div>
                <label htmlFor="task-due" className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Due date (optional)
                </label>
                <input id="task-due" name="dueDate" type="date" className={inputClass} />
              </div>
              <button type="submit" className="w-full rounded-xl border border-border bg-background-subtle px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/50">
                Add follow-up
              </button>
            </form>
            {tasks.length > 0 ? (
              <ul className="mt-5 space-y-2.5" role="list">
                {tasks.map((task) => (
                  <li key={task.id} className="rounded-xl border border-border px-3.5 py-3">
                    <form action={toggleTask} className="flex items-start gap-2.5">
                      <input type="hidden" name="id" value={inquiry.id} />
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="complete" value={task.isCompleted ? "0" : "1"} />
                      <button
                        type="submit"
                        aria-pressed={task.isCompleted}
                        aria-label={task.isCompleted ? `Mark "${task.title}" as not complete` : `Mark "${task.title}" as complete`}
                        className="mt-0.5 text-primary"
                      >
                        {task.isCompleted ? <CheckSquare className="h-5 w-5" aria-hidden="true" /> : <Square className="h-5 w-5" aria-hidden="true" />}
                      </button>
                      <span className="flex-1">
                        <span className={`block text-sm font-semibold ${task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {task.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock4 className="h-3.5 w-3.5" aria-hidden="true" />
                          {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                        </span>
                      </span>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No tasks yet — add the next follow-up so nothing slips.</p>
            )}
          </section>

          {/* Status history */}
          <section aria-labelledby="history-heading" className="rounded-2xl border border-border bg-card p-6">
            <h2 id="history-heading" className="font-display text-lg font-bold text-foreground">
              Status history
            </h2>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No status changes recorded yet.</p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {history.map(({ h, actorName }) => (
                  <li key={h.id} className="text-sm">
                    <span className="font-semibold text-foreground">{actorName ?? "Former administrator"}</span>
                    <span className="text-muted-foreground">
                      {" "}changed {h.fromStatus ? `${LEAD_STATUS_LABELS[h.fromStatus as LeadStatus] ?? h.fromStatus} → ` : ""}
                      {LEAD_STATUS_LABELS[h.toStatus as LeadStatus] ?? h.toStatus} ·{" "}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
