import type { Metadata } from "next";
import { Clock3, Mail, Phone, ShieldAlert } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { Container } from "@/components/ui";
import { getServices, getSettings } from "@/lib/content";
import { PRIVACY_NOTICE_TEXT } from "@/config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Contact & Consultation",
    description: `Request a consultation with ${settings.name} to discuss medical billing and revenue cycle support for your practice.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; practice?: string }>;
}) {
  const [{ service, practice }, settings, services] = await Promise.all([searchParams, getSettings(), getServices(true)]);
  const serviceTitles = services.map((s) => s.title);
  const preselected = service && serviceTitles.includes(service) ? service : undefined;
  const prefillMessage =
    practice && practice.length <= 120
      ? `Our practice focuses on ${practice}. We would like to discuss billing support for our specialty.`
      : undefined;

  return (
    <>
      <section aria-labelledby="contact-heading" className="bg-background-subtle py-12 sm:py-14">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">Contact</p>
            <h1 id="contact-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Request a consultation
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Tell us about your practice and what you'd like from a billing partner. We'll review your inquiry and
              respond within one to two business days.
            </p>
          </div>
        </Container>
      </section>

      <section aria-label="Consultation form and contact details" className="py-12 sm:py-14">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          {/* Info panel */}
          <aside aria-label="Direct contact information" className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Prefer to reach out directly?</h2>
              <address className="mt-4 space-y-4 text-sm not-italic">
                <p className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block font-bold text-foreground">Email</span>
                    <a href={`mailto:${settings.email}`} className="font-medium text-primary hover:underline">
                      {settings.email}
                    </a>
                  </span>
                </p>
                {settings.phone ? (
                  <p className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>
                      <span className="block font-bold text-foreground">Phone</span>
                      <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="font-medium text-foreground hover:text-primary">
                        {settings.phone}
                      </a>
                    </span>
                  </p>
                ) : null}
                <p className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block font-bold text-foreground">Response time</span>
                    <span className="text-muted-foreground">Typically one to two business days</span>
                  </span>
                </p>
              </address>
            </div>

            <div className="rounded-2xl border border-border bg-background-subtle/70 p-6">
              <h2 className="font-display text-lg font-bold text-foreground">What happens next?</h2>
              <ol className="mt-4 space-y-3.5 text-sm leading-relaxed text-muted-foreground">
                {[
                  "We review your inquiry and confirm fit for your specialty and systems.",
                  "You receive a reply to schedule an introductory call at a convenient time.",
                  "On the call we discuss your workflow, systems, and what support would look like.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-primary"
                      style={{ backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Form */}
          <div>
            <div className="mb-6 flex items-start gap-3.5 rounded-2xl border border-amber-300/70 bg-amber-50 p-5 dark:border-amber-800/60 dark:bg-amber-950/30" role="note">
              <ShieldAlert className="mt-0.5 h-5.5 w-5.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                  No patient information, please
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-950 dark:text-amber-100">{PRIVACY_NOTICE_TEXT}</p>
              </div>
            </div>
            <ContactForm
              services={serviceTitles}
              preselectedService={preselected}
              prefillMessage={prefillMessage}
              requireOrganization={settings.contactForm.requireOrganization ?? true}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
