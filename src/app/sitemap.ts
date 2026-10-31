import type { MetadataRoute } from "next";
import { getServices } from "@/lib/content";
import { siteDefaults } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? siteDefaults.websiteUrl).replace(/\/$/, "");
  const staticRoutes = ["", "/services", "/specialties", "/pricing", "/about", "/experience", "/contact", "/faq", "/legal/privacy", "/legal/terms", "/legal/accessibility"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path.startsWith("/legal") ? 0.3 : 0.8,
    }),
  );
  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const services = await getServices(true);
    serviceRoutes = services.map((s) => ({
      url: `${base}/services/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    /* DB unavailable — return static routes only */
  }
  return [...staticRoutes, ...serviceRoutes];
}
