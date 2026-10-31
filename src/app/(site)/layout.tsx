import type { ReactNode } from "react";
import { A11yToolbar } from "@/components/a11y-toolbar";
import { AnalyticsTracker, CookieConsent } from "@/components/analytics";
import { SiteHeader } from "@/components/chrome";
import { SiteFooter } from "@/components/site-footer";
import { getServices, getSettings } from "@/lib/content";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}

async function SiteShell({ children }: { children: ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices(true)]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader businessName={settings.name} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} services={services} />
      <A11yToolbar />
      <AnalyticsTracker />
      <CookieConsent />
    </div>
  );
}
