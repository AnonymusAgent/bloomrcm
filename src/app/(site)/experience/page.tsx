import type { Metadata } from "next";
import { ArrowRight, BriefcaseBusiness, Building2, Info, Layers, MonitorSmartphone, Server, Tag, Trophy } from "lucide-react";
import { ButtonLink, Card, Container, CtaBand } from "@/components/ui";
import { getExperiences, getSettings } from "@/lib/content";
import type { Experience } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Professional Experience",
    description: `The founder's professional background in medical billing and revenue cycle operations — the experience behind ${settings.name}.`,
    alternates: { canonical: "/experience" },
  };
}

function DetailBlock({
  icon: IconCmp,
  title,
  items,
}: {
  icon: typeof Tag;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <IconCmp className="h-4 w-4 text-accent" aria-hidden="true" />
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-2" role="list">
          {items.map((item) => (
            <li key={item} className="rounded-full border border-border bg-background-subtle px-3 py-1 text-xs font-semibold text-foreground">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm italic text-muted-foreground">Details to be added</p>
      )}
    </div>
  );
}

function ExperienceCard({ exp, index }: { exp: Experience; index: number }) {
  const dateRange = exp.startDate
    ? `${exp.startDate} — ${exp.isCurrent ? "Present" : exp.endDate || "—"}`
    : "Dates to be added";
  return (
    <li className="relative pl-10 sm:pl-14">
      {/* timeline spine */}
      <span aria-hidden="true" className="absolute left-[13px] top-3 h-full w-px bg-border last:hidden sm:left-[19px]" style={{ display: index === undefined ? "none" : undefined }} />
      <span
        aria-hidden="true"
        className="absolute left-0 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-card sm:h-10 sm:w-10"
      >
        <Building2 className="h-3.5 w-3.5 text-primary sm:h-5 sm:w-5" aria-hidden="true" />
      </span>
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">{exp.organization}</h3>
            <p className="mt-1 text-[15px] font-bold text-primary">{exp.role || "Role details to be added"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-muted-foreground">{dateRange}</p>
            <p className="mt-1 inline-flex rounded-full bg-accent-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              {exp.isCurrent ? "Current role" : "Former employment"}
            </p>
          </div>
        </div>

        {exp.description ? (
          <p className="mt-4 text-[15px] leading-[1.75] text-muted-foreground">{exp.description}</p>
        ) : (
          <p className="mt-4 text-sm italic text-muted-foreground">Details to be added</p>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <DetailBlock icon={Layers} title="Billing workflows handled" items={exp.responsibilities} />
          <DetailBlock icon={Tag} title="Relevant specialties" items={exp.specialties} />
          <DetailBlock icon={MonitorSmartphone} title="Software & practice management systems" items={exp.systems} />
          <DetailBlock icon={Server} title="Clearinghouse experience" items={exp.clearinghouses} />
        </div>

        <div className="mt-6">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
            Verified achievements &amp; measurable outcomes
          </h4>
          {exp.achievements ? (
            <p className="mt-2.5 text-[15px] leading-relaxed text-foreground">{exp.achievements}</p>
          ) : (
            <p className="mt-2 text-sm italic text-muted-foreground">
              Details to be added. Achievements are published here only when they can be described accurately and
              verified — never inflated.
            </p>
          )}
        </div>
      </Card>
    </li>
  );
}

export default async function ExperiencePage() {
  const [experiences, settings] = await Promise.all([getExperiences(true), getSettings()]);

  return (
    <>
      <section aria-labelledby="exp-heading" className="bg-background-subtle py-14 sm:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              Professional experience
            </p>
            <h1 id="exp-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              The background behind the business
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {settings.name} is a new independent practice — but it is not built from theory. The founder's
              professional work inside established medical billing and RCM organizations is what shapes the documented,
              workflow-first approach this company runs on.
            </p>
          </div>
        </Container>
      </section>

      {/* Honest framing notice */}
      <section aria-label="Important clarification" className="pt-10">
        <Container>
          <div
            role="note"
            className="flex items-start gap-3.5 rounded-2xl border border-border bg-accent-soft/40 p-5 dark:bg-accent-soft/15"
          >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              <strong className="font-bold">A note on independence:</strong> the organizations listed below are the
              founder's <em>previous employers</em>. They are shown to describe professional background only — they do
              not endorse, sponsor, partner with, or hold any affiliation with {settings.name}. Dates, roles, and
              achievements marked "to be added" will be published once finalized, and are never fabricated.
            </p>
          </div>
        </Container>
      </section>

      <section aria-label="Experience timeline" className="py-12 sm:py-14">
        <Container>
          {experiences.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-background-subtle/60 p-10 text-center text-muted-foreground">
              Experience records are being prepared. Please check back shortly.
            </p>
          ) : (
            <ol className="space-y-10 sm:space-y-12">
              {experiences.map((exp, i) => (
                <ExperienceCard key={exp.id} exp={exp} index={i} />
              ))}
            </ol>
          )}
        </Container>
      </section>

      <CtaBand
        title="Let's discuss your practice's billing needs"
        description="Bring your current workflow, your systems, and your toughest billing questions — we'll talk through them concretely and honestly."
      />
    </>
  );
}
