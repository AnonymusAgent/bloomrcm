import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Accessibility as AccessibilityIcon, FileText, Scale, TriangleAlert } from "lucide-react";
import { Container } from "@/components/ui";
import { getSettings } from "@/lib/content";
import { legalPages } from "@/config/site";

export const dynamic = "force-dynamic";

const icons = { privacy: FileText, terms: Scale, accessibility: AccessibilityIcon } as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages.find((p) => p.slug === slug);
  if (!page) return { title: "Not found" };
  return { title: page.title, description: page.description, alternates: { canonical: `/legal/${page.slug}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = legalPages.find((p) => p.slug === slug);
  if (!page) notFound();
  const settings = await getSettings();
  const IconCmp = icons[page.slug];

  return (
    <>
      <section aria-labelledby="legal-heading" className="bg-background-subtle py-12 sm:py-14">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
              <IconCmp className="h-4 w-4" aria-hidden="true" />
              Legal &amp; trust
            </p>
            <h1 id="legal-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{page.description}</p>
          </div>
        </Container>
      </section>

      <section aria-label={`${page.title} content`} className="py-12 sm:py-14">
        <Container className="max-w-3xl">
          <div
            role="note"
            className="mb-10 flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 px-5 py-4 dark:border-amber-800/60 dark:bg-amber-950/30"
          >
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-100">
              <strong className="font-bold">{page.updated}.</strong> This document is draft template language. It must
              be reviewed by qualified counsel (and, for accessibility, a formal conformance review) before this website
              launches publicly.
            </p>
          </div>

          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.heading} aria-labelledby={section.heading.replace(/\W+/g, "-").toLowerCase()}>
                <h2
                  id={section.heading.replace(/\W+/g, "-").toLowerCase()}
                  className="font-display text-xl font-bold text-foreground"
                >
                  {section.heading}
                </h2>
                {section.paragraphs.map((para, i) => (
                  <p key={i} className="mt-3 text-[15px] leading-[1.85] text-muted-foreground">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <p className="mt-12 rounded-xl bg-background-subtle/70 px-5 py-4 text-sm text-muted-foreground">
            Questions about this policy? Contact {settings.name} at{" "}
            <a href={`mailto:${settings.email}`} className="font-semibold text-primary hover:underline">
              {settings.email}
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
