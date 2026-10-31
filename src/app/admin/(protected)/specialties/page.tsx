import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Eye, EyeOff, PencilLine, PlusCircle, X } from "lucide-react";
import { db } from "@/db";
import { specialties } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { deleteSpecialty, reorderItem, toggleSpecialtyVisibility, upsertSpecialty } from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/admin/widgets";
import { EmptyState, Field, inputClass, Notice, SpecialtyIcon } from "@/components/ui";

export const metadata: Metadata = { title: "Manage specialties", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ICON_OPTIONS = ["Stethoscope", "ClipboardPlus", "Brain", "Baby", "Dumbbell", "Hand", "Speech", "HeartPulse", "Bone", "Sparkles", "Zap", "FlaskConical", "Scan", "Move", "Smile", "Truck"];

export default async function AdminSpecialtiesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; notice?: string; error?: string }>;
}) {
  const user = await requirePermission("content.manage");
  const sp = await searchParams;
  const rows = await db.select().from(specialties).orderBy(specialties.displayOrder);
  const editingId = sp.id;
  const editing = editingId && editingId !== "new" ? rows.find((r) => r.id === editingId) : undefined;
  const isNew = editingId === "new";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Specialties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The specialty grid on the public /specialties page and homepage preview. Keep blurbs factual — describing
            billing characteristics, never promising outcomes.
          </p>
        </div>
        <Link
          href="/admin/specialties?id=new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New specialty
        </Link>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {isNew || editing ? (
        <section aria-labelledby="editor-heading" className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="editor-heading" className="font-display text-xl font-bold text-foreground">
              {isNew ? "Create a specialty" : `Edit: ${editing!.name}`}
            </h2>
            <Link href="/admin/specialties" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              Close editor
            </Link>
          </div>
          <form action={upsertSpecialty} className="grid gap-5 sm:grid-cols-2">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Field label="Specialty name" htmlFor="name" required>
              <input id="name" name="name" type="text" required maxLength={120} defaultValue={editing?.name ?? ""} className={inputClass} />
            </Field>
            <Field label="Icon" htmlFor="icon">
              <select id="icon" name="icon" defaultValue={editing?.icon ?? "Stethoscope"} className={inputClass}>
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Blurb" htmlFor="blurb" hint="One or two factual sentences about this specialty's billing characteristics. No outcome promises.">
                <textarea id="blurb" name="blurb" rows={3} maxLength={500} defaultValue={editing?.blurb ?? ""} className={inputClass} />
              </Field>
            </div>
            <Field label="Display order" htmlFor="displayOrder">
              <input id="displayOrder" name="displayOrder" type="number" min={0} max={9999} defaultValue={editing?.displayOrder ?? rows.length + 1} className={inputClass} />
            </Field>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="isVisible" defaultChecked={editing ? editing.isVisible : true} className="h-4.5 w-4.5 rounded border-border accent-[#1552c4]" />
              <span className="text-sm font-semibold text-foreground">Visible on the public website</span>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
                Save specialty
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="No specialties defined" description="Specialties power the public /specialties page grid and the homepage preview." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Specialties shown on the public website</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-5 py-3.5 font-bold">Order</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Specialty</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Blurb</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((specialty, index) => (
                <tr key={specialty.id}>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1">
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="specialties" />
                        <input type="hidden" name="id" value={specialty.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" disabled={index === 0} aria-label={`Move ${specialty.name} up`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="specialties" />
                        <input type="hidden" name="id" value={specialty.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button type="submit" disabled={index === rows.length - 1} aria-label={`Move ${specialty.name} down`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <SpecialtyIcon name={specialty.icon} className="h-4.5 w-4.5" />
                      </span>
                      <span className="font-bold text-foreground">{specialty.name}</span>
                    </span>
                  </td>
                  <td className="max-w-[300px] px-5 py-3.5 text-xs text-muted-foreground">
                    {specialty.blurb ? (specialty.blurb.length > 90 ? `${specialty.blurb.slice(0, 90)}…` : specialty.blurb) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <form action={toggleSpecialtyVisibility}>
                      <input type="hidden" name="id" value={specialty.id} />
                      <button
                        type="submit"
                        aria-pressed={specialty.isVisible}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${specialty.isVisible ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-border bg-background-subtle text-muted-foreground"}`}
                      >
                        {specialty.isVisible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                        {specialty.isVisible ? "Visible" : "Hidden"}
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`/admin/specialties?id=${specialty.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:underline">
                        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Link>
                      {user.role === "owner" ? (
                        <form action={deleteSpecialty}>
                          <input type="hidden" name="id" value={specialty.id} />
                          <ConfirmButton message={`Delete "${specialty.name}"?`} className="text-xs font-bold text-red-600 hover:underline dark:text-red-400">
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
