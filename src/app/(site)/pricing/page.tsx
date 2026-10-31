import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Calculator, FileSignature, Handshake, Percent, ReceiptText } from "lucide-react";
import { ButtonLink, Card, Container, CtaBand, SectionHeading } from "@/components/ui";
import { getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Pricing & Engagement Models",
    description: `How ${settings.name} structures billing engagements: percentage-of-collections, flat monthly, and per-project models — quoted in writing after a workflow assessment.`,
    alternates: { canonical: "/pricing" },
  };
}

const models = [
  {
    icon: Percent,
    title: "Percentage of collections",
    intro: "A success-aligned model for ongoing billing engagements.",
    points: [
      "Fee scales with what's actually collected, not just what's submitted",
      "Rate is quoted per practice after workflow assessment",
      "Best for full or partial revenue cycle engagements",
    ],
  },
  {
    icon: ReceiptText,
    title: "Flat monthly fee",
    intro: "A predictable fixed cost for a defined monthly scope.",
    points: [
      "Scope and cadence documented in the service agreement",
      "Easy to budget — no volume surprises either direction",
      "Best for defined functions like payment posting or A/R follow-up",
    ],
  },
  {
    icon: FileSignature,
    title: "Per project",
    intro: "Fixed-price structures for bounded consulting work.",
    points: [
      "Workflow assessments, A/R clean-up projects, one-time reviews",
      "Written deliverables and agreed completion criteria",
      "Best when you want a specific problem fixed, not a retainer",
    ],
  },
];

const included = [
  "Workflow assessment and written scope before any commitment",
  "Documented operating procedures for everything we touch",
  "Scheduled reporting with plain-language commentary",
  "A named contact and defined escalation path",
  "Secure data handling agreed in writing before access",
  "No hidden onboarding fees introduced after the proposal",
];

const factors = [
  { title: "Claim volume", body: "Monthly claim and encounter counts shape workload more than any other factor." },
  { title: "Scope breadth", body: "One function (e.g., denial management) prices differently than full-cycle support." },
  { title: "Specialty complexity", body: "Authorization-heavy or procedure-heavy specialties carry heavier documentation work." },
  { title: "Systems & access", body: "Your PM/EHR setup, clearinghouse, and reporting needs affect onboarding effort." },
];

export default async function PricingPage() {
  const settings = await getSettings();
  return (
    <>
      <section aria-labelledby="pricing-heading" className="bg-background-subtle py-14 sm:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">Pricing</p>
            <h1 id="pricing-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Transparent engagement models — quoted for your practice, in writing
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {settings.name} doesn't publish one-size-fits-all rates because practices genuinely differ. What we
              publish is how engagements are structured, what's always included, and exactly how your quote is built —
              then your written, itemized, no-obligation proposal does the talking.
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="models-heading" className="py-14 sm:py-16">
        <Container>
          <SectionHeading
            id="models-heading"
            eyebrow="Engagement models"
            title="Three ways to work with us"
            description="Every engagement starts with a free consultation and workflow assessment. You choose the model that fits your practice economics — the work quality doesn't change."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {models.map(({ icon: IconCmp, title, intro, points }) => (
              <Card key={title} className="flex flex-col p-7">
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <IconCmp className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm font-medium text-primary">{intro}</p>
                <ul className="mt-4 flex-1 space-y-2.5" role="list">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="included-heading" className="bg-background-subtle/70 py-14 sm:py-16">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Handshake className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <h2 id="included-heading" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Included in every engagement
              </h2>
            </div>
            <ul className="mt-6 space-y-3.5" role="list">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-[15px] leading-relaxed text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Calculator className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">How your quote is built</h2>
            </div>
            <ul className="mt-6 grid gap-4" role="list">
              {factors.map(({ title, body }) => (
                <li key={title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section aria-labelledby="quote-heading" className="py-14 sm:py-16">
        <Container className="max-w-3xl text-center">
          <h2 id="quote-heading" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Get your written quote
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            A short consultation plus a workflow assessment is all it takes. The proposal you receive is complete —
            scope, cadence, model, and price — with zero obligation attached.
          </p>
          <p className="mt-7">
            <ButtonLink href="/contact" size="lg">
              Request a Consultation
              <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
            </ButtonLink>
          </p>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Pricing on this page describes engagement structures only. Rates are never quoted publicly because they are
            set per practice, per proposal.
          </p>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
