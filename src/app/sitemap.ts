import type { MetadataRoute } from "next";
import { cars, services } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  return [
    "",
    "/cars",
    "/preorder",
    "/inspection",
    "/services",
    "/reviews",
    "/about",
    "/contact",
    ...services.map((s) => "/services/" + s.slug),
    ...(await cars()).map((c) => "/cars/" + c.slug),
  ].map((path) => ({
    url: base + path,
    changeFrequency: path === "/cars" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
