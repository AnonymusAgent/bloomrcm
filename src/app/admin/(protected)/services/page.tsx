import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ArrowDown, ArrowUp, Eye, EyeOff, PencilLine, PlusCircle, X } from "lucide-react";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { deleteService, reorderItem, toggleServiceVisibility, upsertService } from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/admin/widgets";
import { EmptyState, Field, inputClass, Notice, ServiceIcon } from "@/components/ui";

export const metadata: Metadata = { title: "Manage services", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ICON_OPTIONS = ["FileCheck2", "BadgeCheck", "RefreshCcw", "ShieldAlert", "Receipt", "HandCoins", "Workflow", "BarChart3", "SquareCode", "IdCard", "Compass"];

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; notice?: string; error?: string }>;
}) {
  const user = await requirePermission("content.manage");
  const sp = await searchParams;
  const rows = await db.select().from(services).orderBy(services.displayOrder);
  const editingId = sp.id;
  const editing = editingId && editingId !== "new" ? rows.find((r) => r.id === editingId) : undefined;
  const isNew = editingId === "new";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, reorder, and enable/disable the services shown on the public website.
          </p>
        </div>
        <Link
          href="/admin/services?id=new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New service
        </Link>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {isNew || editing ? (
        <section aria-labelledby="editor-heading" className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="editor-heading" className="font-display text-xl font-bold text-foreground">
              {isNew ? "Create a service" : `Edit: ${editing!.title}`}
            </h2>
            <Link href="/admin/services" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              Close editor
            </Link>
          </div>
          <form action={upsertService} className="grid gap-5 sm:grid-cols-2">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <Field label="Title" htmlFor="title" required>
              <input id="title" name="title" type="text" required maxLength={160} defaultValue={editing?.title ?? ""} className={inputClass} />
            </Field>
            <Field label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the title.">
              <input id="slug" name="slug" type="text" maxLength={80} defaultValue={editing?.slug ?? ""} className={inputClass} placeholder="medical-billing-claims" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Summary" htmlFor="summary" hint="One sentence shown on cards and used for SEO descriptions.">
                <input id="summary" name="summary" type="text" maxLength={240} defaultValue={editing?.summary ?? ""} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description" htmlFor="description">
                <textarea id="description" name="description" rows={5} maxLength={8000} defaultValue={editing?.description ?? ""} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Typical workflow" htmlFor="workflow" hint="One step per line." >
                <textarea id="workflow" name="workflow" rows={5} maxLength={4000} defaultValue={editing?.workflow ?? ""} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Potential value to the provider" htmlFor="value" hint="Describe value honestly — never promise specific financial outcomes.">
                <textarea id="value" name="value" rows={3} maxLength={3000} defaultValue={editing?.value ?? ""} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Engagement requirements" htmlFor="requirements">
                <textarea id="requirements" name="requirements" rows={3} maxLength={3000} defaultValue={editing?.requirements ?? ""} className={inputClass} />
              </Field>
            </div>
            <Field label="Icon" htmlFor="icon">
              <select id="icon" name="icon" defaultValue={editing?.icon ?? "FileCheck2"} className={inputClass}>
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Display order" htmlFor="displayOrder" hint="Lower numbers appear first.">
              <input id="displayOrder" name="displayOrder" type="number" min={0} max={9999} defaultValue={editing?.displayOrder ?? rows.length + 1} className={inputClass} />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
              <input type="checkbox" name="isVisible" defaultChecked={editing ? editing.isVisible : true} className="h-4.5 w-4.5 rounded border-border accent-[#1552c4]" />
              <span className="text-sm font-semibold text-foreground">Visible on the public website</span>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
                Save service
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No services defined"
          description="Services power the public Services page, the homepage cards, and the consultation form options."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Services shown on the public website</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-5 py-3.5 font-bold">Order</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Service</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Slug</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((service, index) => (
                <tr key={service.id} className="align-top">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1">
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="services" />
                        <input type="hidden" name="id" value={service.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" disabled={index === 0} aria-label={`Move ${service.title} up`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="services" />
                        <input type="hidden" name="id" value={service.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button type="submit" disabled={index === rows.length - 1} aria-label={`Move ${service.title} down`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <ServiceIcon name={service.icon} className="h-4.5 w-4.5" />
                      </span>
                      <span className="font-bold text-foreground">{service.title}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{service.slug}</td>
                  <td className="px-5 py-3.5">
                    <form action={toggleServiceVisibility}>
                      <input type="hidden" name="id" value={service.id} />
                      <button
                        type="submit"
                        aria-pressed={service.isVisible}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${service.isVisible ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-border bg-background-subtle text-muted-foreground"}`}
                      >
                        {service.isVisible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                        {service.isVisible ? "Visible" : "Hidden"}
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`/admin/services?id=${service.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:underline">
                        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Link>
                      {user.role === "owner" ? (
                        <form action={deleteService}>
                          <input type="hidden" name="id" value={service.id} />
                          <ConfirmButton
                            message={`Delete "${service.title}"? It will disappear from the public site immediately.`}
                            className="text-xs font-bold text-red-600 hover:underline dark:text-red-400"
                          >
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
