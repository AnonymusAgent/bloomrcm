import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Eye, EyeOff, PencilLine, PlusCircle, X } from "lucide-react";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { deleteFaq, reorderItem, toggleFaqPublished, upsertFaq } from "@/lib/actions/admin";
import { ConfirmButton } from "@/components/admin/widgets";
import { EmptyState, Field, inputClass, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Manage FAQs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminFaqsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; notice?: string; error?: string }>;
}) {
  const user = await requirePermission("content.manage");
  const sp = await searchParams;
  const rows = await db.select().from(faqs).orderBy(faqs.displayOrder);
  const editingId = sp.id;
  const editing = editingId && editingId !== "new" ? rows.find((r) => r.id === editingId) : undefined;
  const isNew = editingId === "new";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">FAQs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep answers factual, current, and free of outcome promises.</p>
        </div>
        <Link
          href="/admin/faqs?id=new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New FAQ
        </Link>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {isNew || editing ? (
        <section aria-labelledby="editor-heading" className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="editor-heading" className="font-display text-xl font-bold text-foreground">
              {isNew ? "Create an FAQ" : "Edit FAQ"}
            </h2>
            <Link href="/admin/faqs" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              Close editor
            </Link>
          </div>
          <form action={upsertFaq} className="grid gap-5 sm:grid-cols-2">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="sm:col-span-2">
              <Field label="Question" htmlFor="question" required>
                <input id="question" name="question" type="text" required maxLength={300} defaultValue={editing?.question ?? ""} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Answer" htmlFor="answer" required>
                <textarea id="answer" name="answer" rows={5} required maxLength={4000} defaultValue={editing?.answer ?? ""} className={inputClass} />
              </Field>
            </div>
            <Field label="Category" htmlFor="category" hint="Groups questions on the public page.">
              <input id="category" name="category" type="text" maxLength={60} defaultValue={editing?.category ?? "General"} className={inputClass} />
            </Field>
            <Field label="Display order" htmlFor="displayOrder">
              <input id="displayOrder" name="displayOrder" type="number" min={0} max={9999} defaultValue={editing?.displayOrder ?? rows.length + 1} className={inputClass} />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
              <input type="checkbox" name="isPublished" defaultChecked={editing ? editing.isPublished : true} className="h-4.5 w-4.5 rounded border-border accent-[#1552c4]" />
              <span className="text-sm font-semibold text-foreground">Published on the public website</span>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
                Save FAQ
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="No FAQs yet" description="FAQs answer the questions providers ask most before requesting a consultation." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Frequently asked questions</caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-5 py-3.5 font-bold">Order</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Question</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Category</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((faq, index) => (
                <tr key={faq.id}>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1">
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="faqs" />
                        <input type="hidden" name="id" value={faq.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" disabled={index === 0} aria-label="Move FAQ up" className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                      <form action={reorderItem} className="inline">
                        <input type="hidden" name="table" value="faqs" />
                        <input type="hidden" name="id" value={faq.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button type="submit" disabled={index === rows.length - 1} aria-label="Move FAQ down" className="rounded-lg p-1.5 text-muted-foreground hover:bg-background-subtle hover:text-foreground disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                    </span>
                  </td>
                  <td className="max-w-[380px] px-5 py-3.5 font-bold text-foreground">{faq.question}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{faq.category}</td>
                  <td className="px-5 py-3.5">
                    <form action={toggleFaqPublished}>
                      <input type="hidden" name="id" value={faq.id} />
                      <button
                        type="submit"
                        aria-pressed={faq.isPublished}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${faq.isPublished ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-border bg-background-subtle text-muted-foreground"}`}
                      >
                        {faq.isPublished ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                        {faq.isPublished ? "Published" : "Draft"}
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`/admin/faqs?id=${faq.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:underline">
                        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Link>
                      {user.role === "owner" ? (
                        <form action={deleteFaq}>
                          <input type="hidden" name="id" value={faq.id} />
                          <ConfirmButton message="Delete this FAQ permanently?" className="text-xs font-bold text-red-600 hover:underline dark:text-red-400">
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
