import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  FileSearch,
  MessagesSquare,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { ButtonLink, Card, Container, CtaBand, SectionHeading, ServiceIcon, SpecialtyIcon } from "@/components/ui";
import { Rcm3DScene } from "@/components/rcm-3d-scene";
import { getExperiences, getHomeContent, getServices, getSettings, getSpecialties } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seo.title,
    description: settings.seo.description,
    alternates: { canonical: "/" },
  };
}

const workflowSteps = [
  { n: "01", title: "Patient access", body: "Scheduling data quality, registration, eligibility & benefits verification." },
  { n: "02", title: "Charge & claim preparation", body: "Charge capture review, claim scrubbing, and clean electronic submission." },
  { n: "03", title: "Payer processing", body: "Acceptance tracking, status monitoring, and scheduled claim follow-up." },
  { n: "04", title: "Payment posting", body: "ERA/EOB posting, adjustments, and deposit-level reconciliation." },
  { n: "05", title: "Denial & A/R follow-up", body: "Denial categorization, appeals support, and prioritized A/R worklists." },
  { n: "06", title: "Reporting & review", body: "Scheduled performance reporting with plain-language commentary." },
];

const trustPoints = [
  { icon: ShieldCheck, title: "Confidential by design", body: "Data handling expectations and access boundaries are agreed in writing before any work begins." },
  { icon: ClipboardList, title: "Documentation-led", body: "Engagements run on written operating procedures — not tribal knowledge." },
  { icon: MessagesSquare, title: "Communication you can plan around", body: "Defined contact channels, scheduled reporting, and same-week escalation of exceptions." },
  { icon: TrendingUp, title: "Honest visibility", body: "Work activity is logged and reported clearly — including when the news is not good." },
];

export default async function HomePage() {
  const [home, services, experiences, specialties, settings] = await Promise.all([
    getHomeContent(),
    getServices(true),
    getExperiences(true),
    getSpecialties(true),
    getSettings(),
  ]);
  const featured = services.slice(0, 6);
  const featuredSpecialties = specialties.slice(0, 6);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.name,
    url: settings.websiteUrl,
    email: settings.email,
    description: settings.tagline,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      {/* ============================ HERO ============================ */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-background-subtle">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(720px 340px at 8% -10%, rgba(21,82,196,.10), transparent 65%), radial-gradient(560px 300px at 96% 0%, rgba(11,143,133,.10), transparent 60%)",
          }}
        />
        <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              {home.heroEyebrow}
            </p>
            <h1 id="hero-heading" className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem]">
              Reliable Medical Billing &amp; <span className="text-primary">RCM Solutions</span> for Healthcare Providers
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{home.heroSubheading}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" size="lg">
                Request a Consultation
                <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/services" size="lg" variant="outline">
                Explore Our Services
              </ButtonLink>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground" aria-label="Working principles">
              {["Accuracy-first workflows", "Clear communication", "Confidential handling"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <BadgeCheck className="h-4.5 w-4.5 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <Rcm3DScene />
          </div>
        </Container>
      </section>

      {/* ============================ INTRO ============================ */}
      <section aria-labelledby="intro-heading" className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="intro-heading" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {home.introHeading}
            </h2>
            <p className="mt-5 text-base leading-[1.8] text-muted-foreground sm:text-lg">{home.introBody}</p>
            <p className="mt-6">
              <Link href="/about" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                Learn about the company
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </Container>
      </section>

      {/* ========================== SERVICES =========================== */}
      <section aria-labelledby="services-heading" className="bg-background-subtle/70 py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="services-heading"
            eyebrow="What we do"
            title="Billing services built around your practice"
            description="Engage a single billing function or broader revenue cycle support. Every service runs on a documented workflow agreed with your practice."
          />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {featured.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ServiceIcon name={service.icon} className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                    {service.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center">
            <ButtonLink href="/services" variant="outline">
              View all services
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </p>
        </Container>
      </section>

      {/* ========================== WHY CHOOSE ========================= */}
      <section aria-labelledby="why-heading" className="py-16 sm:py-20">
        <Container className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              id="why-heading"
              eyebrow="Why choose us"
              title="A billing partner that runs on process, not promises"
              description="We don't guarantee reimbursement outcomes — no honest billing company can. What we commit to is a disciplined, transparent way of working."
            />
            <ul className="mt-8 space-y-4" role="list">
              {home.whyUs.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-[15px] leading-relaxed text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustPoints.map(({ icon: IconCmp, title, body }) => (
              <Card key={title} className="p-5">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <IconCmp className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ========================== WORKFLOW =========================== */}
      <section aria-labelledby="workflow-heading" className="relative overflow-hidden bg-navy py-16 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(700px 300px at 100% 0%, rgba(21,82,196,.4), transparent 60%), radial-gradient(600px 260px at 0% 100%, rgba(11,143,133,.35), transparent 60%)",
          }}
        />
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-300 dark:text-teal-300/90">How the revenue cycle flows</p>
            <h2 id="workflow-heading" className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              One documented workflow, end to end
            </h2>
            <p className="mt-4 text-base leading-relaxed text-blue-100/80">
              Revenue leaks in the gaps between steps. Our engagements connect them into a single visible process.
            </p>
          </div>
          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <li key={step.n} className="workflow-depth-card relative rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm hover:border-teal-300/30 hover:bg-white/[0.09]">
                <p className="font-display text-sm font-extrabold tracking-widest text-teal-300">{step.n}</p>
                <h3 className="mt-2 font-display text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/75">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ============ SYSTEMS — "your software, not ours" ============== */}
      <section aria-labelledby="systems-heading" className="py-16 sm:py-20">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.3fr]">
            <SectionHeading
              align="left"
              id="systems-heading"
              eyebrow="Zero forced migrations"
              title="We work inside your existing systems"
              description="Your practice management system and clearinghouse stay exactly where they are. Billing support adapts to your tools — never the other way around."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { t: "Your PM / EHR stays", b: "Work happens inside the system your practice already runs on. Familiarity with your stack is confirmed during assessment — honestly." },
                { t: "Clearinghouse-connected", b: "Electronic claims continue through your existing clearinghouse relationships and payer setup." },
                { t: "No rip-and-replace", b: "No software purchase, no forced migration, no downtime project hiding inside a billing engagement." },
              ].map(({ t, b }) => (
                <Card key={t} className="p-5">
                  <h3 className="font-display text-[15px] font-bold text-foreground">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ======================== PRICING TEASER ======================== */}
      <section aria-labelledby="pricing-heading" className="bg-background-subtle/70 py-16 sm:py-20">
        <Container>
          <div className="grid items-center gap-10 rounded-3xl border border-border bg-card p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">Pricing</p>
              <h2 id="pricing-heading" className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Three engagement models. One written quote. Zero surprises.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Percentage of collections, flat monthly, or per project — the model is chosen around your practice
                economics, and every quote is itemized in writing before any commitment.
              </p>
            </div>
            <div className="flex lg:justify-end">
              <ButtonLink href="/pricing" size="lg" variant="outline">
                See how pricing works
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* ====================== EXPERIENCE PREVIEW ===================== */}
      <section aria-labelledby="exp-heading" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="exp-heading"
            eyebrow="Professional background"
            title="Built on real medical billing experience"
            description="The founder's background in established medical billing organizations shapes how this practice works: structured, documented, and accountable."
          />
          <ul className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3" role="list">
            {experiences.slice(0, 3).map((exp) => (
              <li key={exp.id}>
                <Card className="flex h-full flex-col p-6">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 font-display text-base font-extrabold text-primary" style={{ backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}>
                    {exp.organization.slice(0, 2).toUpperCase()}
                  </span>
                  <h3 className="font-display text-base font-bold leading-snug text-foreground">{exp.organization}</h3>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">{exp.role || "Medical billing & revenue cycle"}</p>
                  <p className="mt-auto pt-4 text-xs font-bold uppercase tracking-wider text-accent">
                    {exp.isCurrent ? "Current" : "Former employment"}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <Link href="/experience" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
              View the full professional experience
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </Container>
      </section>

      {/* ======================== SPECIALTIES ========================== */}
      <section aria-labelledby="specialties-heading" className="bg-background-subtle/70 py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="specialties-heading"
            eyebrow="Who we support"
            title="Specialty-aware billing workflows"
            description="Visit caps in therapy, global periods in surgery, vaccine administration in pediatrics — workflows are structured around the realities of your specialty."
          />
          {featuredSpecialties.length > 0 ? (
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {featuredSpecialties.map((specialty) => (
                <li key={specialty.id}>
                  <Link
                    href={`/specialties#${specialty.id}`}
                    className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                  >
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <SpecialtyIcon name={specialty.icon} className="h-5.5 w-5.5" />
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {specialty.name}
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                        {specialty.blurb}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-10 text-center">
            <ButtonLink href="/specialties" variant="outline">
              View all specialties
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </p>
        </Container>
      </section>

      {/* ====================== GETTING STARTED ======================== */}
      <section aria-labelledby="start-heading" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="start-heading"
            eyebrow="Getting started"
            title="How new clients begin working with us"
            description="A defined sequence with no surprises — you approve each step before the next one starts."
          />
          <ol className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-3">
            {[
              { icon: CalendarCheck, t: "1. Consultation", b: "A short introductory call about your practice, systems, and billing pain points. No patient data needed." },
              { icon: FileSearch, t: "2. Workflow assessment", b: "We review current billing workflows and reports to identify where support creates the most value." },
              { icon: ClipboardList, t: "3. Written scope proposal", b: "A clear engagement proposal: services, cadence, communication, and responsibilities — in writing." },
            ].map(({ icon: IconCmp, t, b }) => (
              <li key={t}>
                <Card className="h-full p-6">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <IconCmp className="h-5.5 w-5.5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-foreground">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
