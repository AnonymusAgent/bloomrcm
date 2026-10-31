import Link from "next/link";
import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { siteDefaults } from "@/config/site";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-background-subtle px-6 py-20">
      <div className="max-w-md text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-card text-primary shadow-sm">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          The page you were looking for doesn't exist or may have been moved. Let's get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Back to homepage</ButtonLink>
          <ButtonLink href="/contact" variant="outline">
            Contact {siteDefaults.shortName}
          </ButtonLink>
        </div>
        <nav aria-label="Helpful links" className="mt-10">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold">
            <li><Link href="/services" className="text-primary hover:underline">Services</Link></li>
            <li><Link href="/about" className="text-primary hover:underline">About</Link></li>
            <li><Link href="/experience" className="text-primary hover:underline">Experience</Link></li>
            <li><Link href="/faq" className="text-primary hover:underline">FAQ</Link></li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
