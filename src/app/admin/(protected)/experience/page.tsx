import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Eye, EyeOff, PencilLine, PlusCircle, X } from "lucide-react";
import { db } from "@/db";
import { experiences } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { deleteExperience, reorderItem, toggleExperiencePublished, upsertExperience } from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/admin/widgets";
import { EmptyState, Field, inputClass, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Manage experience", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const lines = (items: string[]) => items.join("\n");

export default async function AdminExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; notice?: string; error?: string }>;
}) {
  const user = await requirePermission("content.manage");
  const sp = await searchParams;
  const rows = await db.select().from(experiences).orderBy(experiences.displayOrder);
  const editingId = sp.id;
  const editing = editingId && editingId !== "new" ? rows.find((r) => r.id === editingId) : undefined;
  const isNew = editingId === "new";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Professional experience</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish only what is accurate. Empty fields display as "Details to be added" — never fabricate specifics.
          </p>
        </div>
        <Link
          href="/admin/experience?id=new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New record
        </Link>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {isNew || editing ? (
        <section aria-labelledby="editor-heading" className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="editor-heading" className="font-display text-xl font-bold text-foreground">
              {isNew ? "Create an experience record" : `Edit: ${editing!.organization}`}
            </h2>
            <Link href="/admin/experience" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              Close editor
            </Link>
          </div>
          <form action={upsertExperience} className="grid gap-5 sm:grid-cols-2">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Field label="Organization" htmlFor="organization" required>
              <input id="organization" name="organization" type="text" required maxLength={160} defaultValue={editing?.organization ?? ""} className={inputClass} />
            </Field>
            <Field label="Role / job title" htmlFor="role" hint="Leave empty to show 'Role details to be added'.">
              <input id="role" name="role" type="text" maxLength={160} defaultValue={editing?.role ?? ""} className={inputClass} />
            </Field>
            <Field label="Start date" htmlFor="startDate" hint="e.g. Apr 2021 — leave empty if not finalized.">
              <input id="startDate" name="startDate" type="text" maxLength={30} defaultValue={editing?.startDate ?? ""} className={inputClass} />
            </Field>
            <Field label="End date" htmlFor="endDate" hint="e.g. Mar 2023 — ignored when 'current' is checked.">
              <input id="endDate" name="endDate" type="text" maxLength={30} defaultValue={editing?.endDate ?? ""} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" htmlFor="description" hint="Honest overview of the work. Placeholder copy is fine until finalized.">
                <textarea id="description" name="description" rows={4} maxLength={8000} defaultValue={editing?.description ?? ""} className={inputClass} />
              </Field>
            </div>
            <div>
              <Field label="Billing workflows handled" htmlFor="responsibilities" hint="One per line.">
                <textarea id="responsibilities" name="responsibilities" rows={4} maxLength={6000} defaultValue={editing ? lines(editing.responsibilities) : ""} className={inputClass} />
              </Field>
            </div>
            <div>
              <Field label="Relevant specialties" htmlFor="specialties" hint="One per line.">
                <textarea id="specialties" name="specialties" rows={4} maxLength={2000} defaultValue={editing ? lines(editing.specialties) : ""} className={inputClass} />
              </Field>
            </div>
            <div>
              <Field label="Software & PM systems" htmlFor="systems" hint="One per line.">
                <textarea id="systems" name="systems" rows={4} maxLength={2000} defaultValue={editing ? lines(editing.systems) : ""} className={inputClass} />
              </Field>
            </div>
            <div>
              <Field label="Clearinghouse experience" htmlFor="clearinghouses" hint="One per line.">
                <textarea id="clearinghouses" name="clearinghouses" rows={4} maxLength={2000} defaultValue={editing ? lines(editing.clearinghouses) : ""} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Verified achievements" htmlFor="achievements" hint="Only outcomes you can describe accurately and verify.">
                <textarea id="achievements" name="achievements" rows={3} maxLength={4000} defaultValue={editing?.achievements ?? ""} className={inputClass} />
              </Field>
            </div>
            <Field label="Logo URL" htmlFor="logoUrl" hint="Optional — only with permission to display it.">
              <input id="logoUrl" name="logoUrl" type="text" maxLength={300} defaultValue={editing?.logoUrl ?? ""} className={inputClass} placeholder="/images/logos/example.svg" />
            </Field>
            <Field label="Display order" htmlFor="displayOrder">
              <input id="displayOrder" name="displayOrder" type="number" min={0} max={9999} defaultValue={editing?.displayOrder ?? rows.length + 1} className={inputClass} />
            </Field>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="isCurrent" defaultChecked={editing?.isCurrent ?? false} className="h-4.5 w-4.5 rounded border-border accent-[#1552c4]" />
              <span className="text-sm font-semibold text-foreground">This is my current role</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="isPublished" defaultChecked={editing ? editing.isPublished : true} className="h-4.5 w-4.5 rounded border-border accent-[#1552c4]" />
              <span className="text-sm font-semibold text-foreground">Published on the public website</span>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
                Save experience record
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No experience records"
          description="Add the founder's professional experience records — they power the public Professional Experience page and homepage preview."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Professional experience records</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-5 py-3.5 font-bold">Order</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Organization</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Role</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((exp, index) => (
                <tr key={exp.id}>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1">
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="experiences" />
                        <input type="hidden" name="id" value={exp.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" disabled={index === 0} aria-label={`Move ${exp.organization} up`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="experiences" />
                        <input type="hidden" name="id" value={exp.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button type="submit" disabled={index === rows.length - 1} aria-label={`Move ${exp.organization} down`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-foreground">{exp.organization}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{exp.role || <em>To be added</em>}</td>
                  <td className="px-5 py-3.5">
                    <form action={toggleExperiencePublished}>
                      <input type="hidden" name="id" value={exp.id} />
                      <button
                        type="submit"
                        aria-pressed={exp.isPublished}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${exp.isPublished ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-border bg-background-subtle text-muted-foreground"}`}
                      >
                        {exp.isPublished ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                        {exp.isPublished ? "Published" : "Draft"}
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`/admin/experience?id=${exp.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:underline">
                        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Link>
                      {user.role === "owner" ? (
                        <form action={deleteExperience}>
                          <input type="hidden" name="id" value={exp.id} />
                          <ConfirmButton message={`Delete the record for "${exp.organization}"?`} className="text-xs font-bold text-red-600 hover:underline dark:text-red-400">
                            Delete
                          </ConfirmButton>
                        </form>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
