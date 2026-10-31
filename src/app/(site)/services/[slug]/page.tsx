import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList, ListChecks, TrendingUp } from "lucide-react";
import { ButtonLink, Container, CtaBand, ServiceIcon } from "@/components/ui";
import { getServiceBySlug, getServices } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.title,
    description: service.summary || service.description.slice(0, 160),
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, all] = await Promise.all([getServiceBySlug(slug), getServices(true)]);
  if (!service) notFound();

  const workflowSteps = service.workflow.split(/\r?\n/).map((step) => step.trim()).filter(Boolean);
  const others = all.filter((s) => s.id !== service.id).slice(0, 4);

  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b border-border bg-background-subtle/60">
        <Container className="flex items-center gap-2 py-3.5 text-sm text-muted-foreground">
          <Link href="/services" className="inline-flex items-center gap-1.5 font-semibold hover:text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All services
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-foreground">
            {service.title}
          </span>
        </Container>
      </nav>

      <section aria-labelledby="service-heading" className="py-14 sm:py-16">
        <Container className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <article>
            <span className="mb-5 inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-accent-soft text-accent" style={{ height: 52, width: 52 }}>
              <ServiceIcon name={service.icon} className="h-6 w-6" />
            </span>
            <h1 id="service-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
              {service.title}
            </h1>
            {service.summary ? <p className="mt-4 text-lg font-medium leading-relaxed text-primary">{service.summary}</p> : null}
            {service.description ? (
              <div className="mt-6 space-y-4 text-base leading-[1.75] text-muted-foreground">
                {service.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ) : null}

            {workflowSteps.length > 0 ? (
              <section aria-labelledby="workflow-title" className="mt-10">
                <h2 id="workflow-title" className="flex items-center gap-2.5 font-display text-xl font-bold text-foreground">
                  <ListChecks className="h-5.5 w-5.5 text-accent" aria-hidden="true" />
                  Typical workflow
                </h2>
                <ol className="mt-5 space-y-3">
                  {workflowSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3.5 rounded-xl border border-border bg-card px-5 py-3.5">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary" style={{ backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}>
                        {i + 1}
                      </span>
                      <span className="text-[15px] leading-relaxed text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {service.value ? (
              <section aria-labelledby="value-title" className="mt-10">
                <h2 id="value-title" className="flex items-center gap-2.5 font-display text-xl font-bold text-foreground">
                  <TrendingUp className="h-5.5 w-5.5 text-accent" aria-hidden="true" />
                  Potential value for your practice
                </h2>
                <p className="mt-4 rounded-xl border-l-4 border-accent bg-accent-soft/60 px-5 py-4 text-[15px] leading-relaxed text-foreground dark:bg-accent-soft/25">
                  {service.value}
                </p>
              </section>
            ) : null}

            {service.requirements ? (
              <section aria-labelledby="req-title" className="mt-10">
                <h2 id="req-title" className="flex items-center gap-2.5 font-display text-xl font-bold text-foreground">
                  <ClipboardList className="h-5.5 w-5.5 text-accent" aria-hidden="true" />
                  What an engagement typically requires
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{service.requirements}</p>
              </section>
            ) : null}
          </article>

          <aside aria-label="Next steps" className="lg:pt-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="rounded-2xl border border-border bg-background-subtle/70 p-6">
                <h2 className="font-display text-lg font-bold text-foreground">Discuss this service</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Tell us about your practice and where this workflow currently sits. We'll respond within one to two
                  business days.
                </p>
                <ButtonLink href={`/contact?service=${encodeURIComponent(service.title)}`} className="mt-5 w-full">
                  Request a Consultation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
              {others.length > 0 ? (
                <nav aria-label="Other services" className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Other services</h2>
                  <ul className="mt-4 space-y-3">
                    {others.map((other) => (
                      <li key={other.id}>
                        <Link
                          href={`/services/${other.slug}`}
                          className="group flex items-center justify-between gap-3 text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {other.title}
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          </aside>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
