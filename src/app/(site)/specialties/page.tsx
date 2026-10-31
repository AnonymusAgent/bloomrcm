import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, SearchCheck } from "lucide-react";
import { ButtonLink, Container, CtaBand, SectionHeading, SpecialtyIcon } from "@/components/ui";
import { getSettings, getSpecialties } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Specialties We Support",
    description: `Specialty-aware medical billing support from ${settings.name}: family medicine, behavioral health, therapy, cardiology, laboratory, dental and more — scoped per practice.`,
    alternates: { canonical: "/specialties" },
  };
}

export default async function SpecialtiesPage() {
  const [specialties, settings] = await Promise.all([getSpecialties(true), getSettings()]);

  return (
    <>
      <section aria-labelledby="specialties-heading" className="bg-background-subtle py-14 sm:py-16">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">Specialties</p>
            <h1 id="specialties-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Specialty-aware billing workflows
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Every specialty bills differently — visit caps in therapy, global periods in surgery, vaccine
              administration in pediatrics. {settings.name} structures workflows around the realities of your
              specialty rather than forcing one generic process onto every practice.
            </p>
          </div>
        </Container>
      </section>

      <section aria-label="Specialty list" className="py-14 sm:py-16">
        <Container>
          {specialties.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-background-subtle/60 p-10 text-center text-muted-foreground">
              Specialty coverage is being finalized. Please check back shortly or{" "}
              <Link href="/contact" className="font-semibold text-primary hover:underline">
                ask about your specialty directly
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
              {specialties.map((specialty) => (
                <li key={specialty.id} id={specialty.id} className="scroll-mt-24">
                  <Link
                    href={`/contact?practice=${encodeURIComponent(specialty.name)}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                  >
                    <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <SpecialtyIcon name={specialty.icon} className="h-6 w-6" />
                    </span>
                    <h2 className="font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {specialty.name}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{specialty.blurb}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                      Ask about this specialty
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Can't find your specialty — BellMedEx-style honest CTA */}
          <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-navy">
            <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  <SearchCheck className="h-7 w-7 shrink-0 text-teal-300" aria-hidden="true" />
                  Don't see your specialty listed?
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-blue-100/80">
                  This grid shows our most common fits, not a hard boundary. Supportability always depends on your
                  specialty, payer mix, and systems — ask directly and you'll get a straight answer, including an
                  honest "we're not the right fit" when that's the truth.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <ButtonLink href="/contact" size="lg" className="bg-white text-navy hover:bg-blue-50">
                  <Mail className="h-4.5 w-4.5" aria-hidden="true" />
                  Ask about your specialty
                </ButtonLink>
                <ButtonLink
                  href="/services"
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:border-white/60 hover:text-white"
                >
                  Browse all services
                </ButtonLink>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
            Specialty blurbs describe the billing characteristics of each field — they are educational context, not
            performance promises. Scope for your practice is defined per engagement.
          </p>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
