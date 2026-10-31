import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { ButtonLink, Container, CtaBand } from "@/components/ui";
import { getFaqs, getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Frequently Asked Questions",
    description: `Answers about services, onboarding, workflows, confidentiality, and how to start working with ${settings.name}.`,
    alternates: { canonical: "/faq" },
  };
}

export default async function FaqPage() {
  const faqs = await getFaqs(true);
  const categories = [...new Set(faqs.map((f) => f.category))];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      {faqs.length > 0 ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <section aria-labelledby="faq-heading" className="bg-background-subtle py-12 sm:py-14">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">FAQ</p>
            <h1 id="faq-heading" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Straight answers about services, onboarding, and how we work. If your question isn't covered, ask it in a
              consultation request — you'll get a direct answer.
            </p>
          </div>
        </Container>
      </section>

      <section aria-label="Questions and answers" className="py-12 sm:py-14">
        <Container className="max-w-3xl">
          {faqs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-background-subtle/60 p-10 text-center text-muted-foreground">
              FAQs are being prepared. Please check back shortly.
            </p>
          ) : (
            categories.map((category) => (
              <div key={category} className="mb-10 last:mb-0">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{category}</h2>
                <div className="space-y-3">
                  {faqs
                    .filter((f) => f.category === category)
                    .map((faq) => (
                      <details key={faq.id} className="faq-item group rounded-2xl border border-border bg-card transition-colors open:border-primary/40">
                        <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4.5 text-left font-display text-[17px] font-bold text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                          {faq.question}
                          <ChevronDown className="faq-chevron h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" aria-hidden="true" />
                        </summary>
                        <div className="border-t border-border px-6 py-5">
                          <p className="text-[15px] leading-[1.8] text-muted-foreground">{faq.answer}</p>
                        </div>
                      </details>
                    ))}
                </div>
              </div>
            ))
          )}

          <div className="mt-12 rounded-2xl border border-border bg-background-subtle/70 p-7 text-center">
            <h2 className="font-display text-xl font-bold text-foreground">Still have questions?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              The fastest way to get a specific answer is a short consultation request.
            </p>
            <p className="mt-5">
              <ButtonLink href="/contact">Request a Consultation</ButtonLink>
            </p>
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
