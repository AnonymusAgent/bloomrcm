import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { CookieSettingsLink } from "@/components/analytics";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45z" />
    </svg>
  );
}
import type { Settings } from "@/lib/content";
import type { Service } from "@/db/schema";
import { Container, LogoMark } from "@/components/ui";

export function SiteFooter({ settings, services }: { settings: Settings; services: Service[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background-subtle/70" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <p className="font-display text-[15px] font-bold leading-tight text-foreground">{settings.name}</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{settings.tagline}</p>
            {settings.socials.linkedin ? (
              <div className="mt-5">
                <a
                  href={settings.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <LinkedInIcon className="h-4 w-4" />
                  LinkedIn
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            ) : null}
          </div>

          <nav aria-label="Company">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              {[
                ["/services", "Services"],
                ["/specialties", "Specialties"],
                ["/pricing", "Pricing & engagement"],
                ["/about", "About the company"],
                ["/experience", "Professional experience"],
                ["/faq", "FAQs"],
                ["/contact", "Contact & consultation"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-muted-foreground transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Services</h3>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              {services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <Link href={`/services/${service.slug}`} className="text-muted-foreground transition-colors hover:text-primary">
                    {service.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="font-semibold text-primary hover:underline">
                  View all services
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Contact</h3>
            <address className="mt-4 space-y-3 text-sm not-italic text-muted-foreground">
              <p className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="font-medium text-foreground transition-colors hover:text-primary">
                  {settings.email}
                </a>
              </p>
              {settings.phone ? (
                <p className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="font-medium text-foreground transition-colors hover:text-primary">
                    {settings.phone}
                  </a>
                </p>
              ) : null}
              {settings.address ? (
                <p className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{settings.address}</span>
                </p>
              ) : null}
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {year} {settings.name}. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold">
              <li>
                <CookieSettingsLink />
              </li>
              <li>
                <Link href="/legal/privacy" className="text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/accessibility" className="text-muted-foreground hover:text-primary">
                  Accessibility
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
