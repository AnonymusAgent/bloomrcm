import type { Metadata } from "next";
import { Building2, FileSliders, Info, Save } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getAboutContent, getHomeContent, getSettings } from "@/lib/content";
import { saveAboutContent, saveHomeContent, saveSettings } from "@/lib/actions/admin";
import { Field, inputClass, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const user = await requirePermission("content.manage");
  const sp = await searchParams;
  const [settings, home, about] = await Promise.all([getSettings(), getHomeContent(), getAboutContent()]);
  const isOwner = user.role === "owner";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Business settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central place to rebrand the whole website — name, contact details, founder profile, SEO defaults, and
          homepage copy. Changes apply site-wide immediately.
        </p>
      </div>

      <Notice notice={sp.notice} error={sp.error} />

      {!isOwner ? (
        <div role="note" className="flex items-start gap-3 rounded-xl border border-border bg-accent-soft/40 px-5 py-4 dark:bg-accent-soft/15">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-foreground">
            Business identity settings are restricted to the account owner ({user.role} accounts can edit homepage and
            about page content below).
          </p>
        </div>
      ) : null}

      {/* ------------------------- Identity ------------------------- */}
      <section aria-labelledby="identity-heading" className="rounded-2xl border border-border bg-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="identity-heading" className="font-display text-xl font-bold text-foreground">
              Identity, contact &amp; SEO
            </h2>
            <p className="text-sm text-muted-foreground">Owner only. Used across every page, email, and metadata.</p>
          </div>
        </div>

        <form action={saveSettings} className="grid gap-5 sm:grid-cols-2" aria-disabled={!isOwner}>
          <fieldset disabled={!isOwner} className="contents disabled:opacity-60">
            <Field label="Business name" htmlFor="businessName" required>
              <input id="businessName" name="businessName" type="text" required maxLength={160} defaultValue={settings.name} className={inputClass} />
            </Field>
            <Field label="Tagline" htmlFor="tagline">
              <input id="tagline" name="tagline" type="text" maxLength={240} defaultValue={settings.tagline} className={inputClass} />
            </Field>
            <Field label="Business email" htmlFor="email" required hint="Shown publicly and used as the default notification inbox.">
              <input id="email" name="email" type="email" required maxLength={254} defaultValue={settings.email} className={inputClass} />
            </Field>
            <Field label="Notification email" htmlFor="notifyEmail" hint="Optional — new inquiry alerts go here instead.">
              <input id="notifyEmail" name="notifyEmail" type="email" maxLength={254} defaultValue={settings.notifyEmail} className={inputClass} />
            </Field>
            <Field label="Business phone" htmlFor="phone">
              <input id="phone" name="phone" type="tel" maxLength={40} defaultValue={settings.phone} className={inputClass} />
            </Field>
            <Field label="Public business address" htmlFor="address">
              <input id="address" name="address" type="text" maxLength={240} defaultValue={settings.address} className={inputClass} />
            </Field>
            <Field label="Website URL" htmlFor="websiteUrl">
              <input id="websiteUrl" name="websiteUrl" type="text" maxLength={300} defaultValue={settings.websiteUrl} className={inputClass} placeholder="https://…" />
            </Field>
            <Field label="LinkedIn URL" htmlFor="linkedin">
              <input id="linkedin" name="linkedin" type="text" maxLength={300} defaultValue={settings.socials.linkedin ?? ""} className={inputClass} placeholder="https://www.linkedin.com/in/…" />
            </Field>
            <Field label="SEO title (homepage)" htmlFor="seoTitle">
              <input id="seoTitle" name="seoTitle" type="text" maxLength={200} defaultValue={settings.seo.title ?? ""} className={inputClass} />
            </Field>
            <Field label="SEO description (homepage)" htmlFor="seoDescription">
              <input id="seoDescription" name="seoDescription" type="text" maxLength={300} defaultValue={settings.seo.description ?? ""} className={inputClass} />
            </Field>

            <div className="sm:col-span-2 -mb-1 mt-2 border-t border-border pt-5">
              <h3 className="font-display text-base font-bold text-foreground">Founder profile</h3>
              <p className="mt-1 text-sm text-muted-foreground">Shown on the About page. Update carefully — publish only accurate information.</p>
            </div>
            <Field label="Founder name" htmlFor="founderName">
              <input id="founderName" name="founderName" type="text" maxLength={120} defaultValue={about.founderName} className={inputClass} />
            </Field>
            <Field label="Founder headline" htmlFor="founderHeadline">
              <input id="founderHeadline" name="founderHeadline" type="text" maxLength={200} defaultValue={about.founderHeadline} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Founder biography" htmlFor="founderBio">
                <textarea id="founderBio" name="founderBio" rows={4} maxLength={6000} defaultValue={about.founderBio} className={inputClass} />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
              <input type="checkbox" name="requireOrganization" defaultChecked={settings.contactForm.requireOrganization ?? true} className="h-4.5 w-4.5 rounded border-border accent-[#1552c4]" />
              <span className="text-sm font-semibold text-foreground">Require organization name on the public inquiry form</span>
            </label>
          </fieldset>
          {isOwner ? (
            <div className="sm:col-span-2">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save business settings
              </button>
            </div>
          ) : null}
        </form>
      </section>

      {/* ------------------------ Homepage -------------------------- */}
      <section aria-labelledby="home-heading" className="rounded-2xl border border-border bg-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <FileSliders className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="home-heading" className="font-display text-xl font-bold text-foreground">
              Homepage content
            </h2>
            <p className="text-sm text-muted-foreground">Hero copy, intro, specialties, and "why choose us" points.</p>
          </div>
        </div>
        <form action={saveHomeContent} className="grid gap-5 sm:grid-cols-2">
          <Field label="Hero eyebrow" htmlFor="heroEyebrow">
            <input id="heroEyebrow" name="heroEyebrow" type="text" maxLength={80} defaultValue={home.heroEyebrow} className={inputClass} />
          </Field>
          <Field label="Hero heading" htmlFor="heroHeading" required>
            <input id="heroHeading" name="heroHeading" type="text" required maxLength={200} defaultValue={home.heroHeading} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Hero subheading" htmlFor="heroSubheading">
              <textarea id="heroSubheading" name="heroSubheading" rows={2} maxLength={400} defaultValue={home.heroSubheading} className={inputClass} />
            </Field>
          </div>
          <Field label="Intro heading" htmlFor="introHeading">
            <input id="introHeading" name="introHeading" type="text" maxLength={200} defaultValue={home.introHeading} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Intro paragraph" htmlFor="introBody">
              <textarea id="introBody" name="introBody" rows={4} maxLength={3000} defaultValue={home.introBody} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Practice types & specialties" htmlFor="specialties" hint="Separate with commas or new lines.">
              <textarea id="specialties" name="specialties" rows={3} maxLength={2000} defaultValue={home.specialties.join(", ")} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label='"Why choose us" points' htmlFor="whyUs" hint="One per line. Factual commitments, not outcome claims.">
              <textarea id="whyUs" name="whyUs" rows={5} maxLength={3000} defaultValue={home.whyUs.join("\n")} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save homepage content
            </button>
          </div>
        </form>
      </section>

      {/* ------------------------- About ---------------------------- */}
      <section aria-labelledby="about-heading" className="rounded-2xl border border-border bg-card p-7">
        <div className="mb-6">
          <h2 id="about-heading" className="font-display text-xl font-bold text-foreground">
            About page content
          </h2>
          <p className="text-sm text-muted-foreground">Mission, values, approach, and onboarding copy.</p>
        </div>
        <form action={saveAboutContent} className="grid gap-5">
          <Field label="Mission" htmlFor="mission">
            <textarea id="mission" name="mission" rows={3} maxLength={2000} defaultValue={about.mission} className={inputClass} />
          </Field>
          <Field label="Values" htmlFor="values" hint="One per line.">
            <textarea id="values" name="values" rows={5} maxLength={2000} defaultValue={about.values.join("\n")} className={inputClass} />
          </Field>
          <Field label="Our approach" htmlFor="approach">
            <textarea id="approach" name="approach" rows={5} maxLength={3000} defaultValue={about.approach} className={inputClass} />
          </Field>
          <Field label="Client onboarding" htmlFor="onboarding">
            <textarea id="onboarding" name="onboarding" rows={5} maxLength={3000} defaultValue={about.onboarding} className={inputClass} />
          </Field>
          <div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-strong">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save about content
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
