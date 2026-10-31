import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ButtonLink, Container, CtaBand, SectionHeading, ServiceIcon } from "@/components/ui";
import { getServices, getSettings } from "@/lib/content";
import { siteDefaults } from "@/config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Medical Billing & RCM Services",
    description: `Billing and revenue cycle services from ${settings.name}: claims submission, eligibility verification, denial management, payment posting, A/R follow-up, reporting, and more.`,
    alternates: { canonical: "/services" },
  };
}

export default async function ServicesPage() {
  const services = await getServices(true);
  return (
    <>
      <section aria-labelledby="services-heading" className="bg-background-subtle py-14 sm:py-18">
        <Container>
          <div className="max-w-3xl py-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">Services</p>
            <h1 id="services-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Medical billing &amp; revenue cycle services
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every engagement is scoped in writing and run on documented workflows. We describe potential value
              honestly — we never guarantee reimbursement outcomes, denial elimination, or specific revenue increases.
            </p>
          </div>
        </Container>
      </section>

      <section aria-label="Service list" className="py-14 sm:py-18">
        <Container>
          {services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background-subtle/60 p-10 text-center text-muted-foreground">
              Services are being finalized. Please check back shortly or{" "}
              <Link href="/contact" className="font-semibold text-primary hover:underline">
                contact us directly
              </Link>
              .
            </div>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2" role="list">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="group flex h-full gap-5 rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                  >
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <ServiceIcon name={service.icon} className="h-6 w-6" />
                    </span>
                    <span className="flex-1">
                      <h2 className="font-display text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                        {service.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                        View service details
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-14 rounded-2xl border border-border bg-background-subtle/70 p-6 sm:p-8">
            <SectionHeading
              align="left"
              title="Not sure which services fit?"
              description={`Bring your billing pain points to a consultation. We'll map them to a concrete scope — or tell you honestly if ${siteDefaults.shortName} isn't the right partner.`}
            />
            <p className="mt-6">
              <ButtonLink href="/contact">
                Request a Consultation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </p>
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
