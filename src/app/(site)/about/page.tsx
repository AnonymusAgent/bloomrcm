import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Compass, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import { ButtonLink, Card, Container, CtaBand, SectionHeading } from "@/components/ui";
import { getAboutContent, getExperiences, getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "About the Company",
    description: `The mission, values, and approach behind ${settings.name} — an independent medical billing and RCM practice for US healthcare providers.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [about, experiences, settings] = await Promise.all([getAboutContent(), getExperiences(true), getSettings()]);

  return (
    <>
      <section aria-labelledby="about-heading" className="bg-background-subtle py-14 sm:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">About the company</p>
            <h1 id="about-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              An independent billing partner, built deliberately
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {settings.name} is a new independent medical billing and revenue cycle management practice founded by a
              medical billing professional — built from real, hands-on billing operations experience rather than a
              franchise playbook.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission + values */}
      <section aria-labelledby="mission-heading" className="py-14 sm:py-18">
        <Container className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Target className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <h2 id="mission-heading" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Our mission
              </h2>
            </div>
            <p className="mt-5 rounded-2xl border-l-4 border-primary bg-background-subtle/70 px-6 py-5 text-lg leading-[1.7] text-foreground">
              {about.mission}
            </p>

            <div className="mt-12">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Compass className="h-5.5 w-5.5" aria-hidden="true" />
                </span>
                <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Our approach</h2>
              </div>
              <p className="mt-5 text-base leading-[1.8] text-muted-foreground">{about.approach}</p>
            </div>
          </div>

          <div aria-labelledby="values-heading">
            <Card className="p-7">
              <h3 id="values-heading" className="font-display text-xl font-bold text-foreground">
                The values we operate by
              </h3>
              <ul className="mt-5 space-y-3.5" role="list">
                {about.values.map((value) => (
                  <li key={value} className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                    <span className="text-[15px] leading-relaxed text-foreground">{value}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="mt-5 p-7">
              <h3 className="flex items-center gap-2.5 font-display text-xl font-bold text-foreground">
                <ShieldCheck className="h-5.5 w-5.5 text-accent" aria-hidden="true" />
                Confidentiality &amp; accuracy
              </h3>
              <p className="mt-3 text-sm leading-[1.75] text-muted-foreground">
                Accuracy, communication, confidentiality, and workflow consistency are treated as operating
                requirements. Access to any practice or billing data happens only after written agreements define the
                boundaries; public inquiries through this website never request or accept patient information.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Founder */}
      <section aria-labelledby="founder-heading" className="bg-background-subtle/70 py-14 sm:py-18">
        <Container className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="mx-auto w-full max-w-sm">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-xl">
              <Image
                src="/images/founder.jpg"
                alt={`Portrait of ${about.founderName}`}
                fill
                sizes="(max-width: 1024px) 90vw, 24rem"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/25 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-display text-xl font-bold text-white">{about.founderName}</p>
                <p className="mt-1 text-sm font-medium text-blue-100/85">{about.founderHeadline}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">Founder</p>
            <h2 id="founder-heading" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Meet the founder
            </h2>
            <p className="mt-4 text-base leading-[1.8] text-muted-foreground">{about.founderBio}</p>
            {experiences.length > 0 ? (
              <p className="mt-4 text-base leading-[1.8] text-muted-foreground">
                Before starting this practice, the founder worked in medical billing and revenue cycle operations at{" "}
                {experiences.map((e) => e.organization).join(", ")} — experience that directly informs this company&apos;s
                documented, workflow-first approach.
              </p>
            ) : null}
            <p className="mt-6">
              <ButtonLink href="/experience" variant="outline">
                View professional experience
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </p>
          </div>
        </Container>
      </section>

      {/* Onboarding */}
      <section aria-labelledby="onboarding-heading" className="py-14 sm:py-18">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <SectionHeading
            align="left"
            id="onboarding-heading"
            eyebrow="Client onboarding"
            title="A structured start for every engagement"
            description="Onboarding is a sequence of explicit, approved steps — not a leap of faith."
          />
          <Card className="p-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <HeartHandshake className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <p className="text-base leading-[1.8] text-muted-foreground">{about.onboarding}</p>
            </div>
            <p className="mt-6">
              <ButtonLink href="/contact">
                Discuss your billing requirements
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </p>
          </Card>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
