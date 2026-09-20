export function siteUrl(env: Record<string, string | undefined> = process.env) {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (env.VERCEL ? url.protocol === "https:" && !local : ["http:", "https:"].includes(url.protocol)) {
        return url.origin;
      }
    } catch {
      // Fall back to the hosting URL when configuration is absent or invalid.
    }
  }
  if (env.VERCEL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL || "bassautoworld.vercel.app"}`;
  }
  return "http://localhost:3000";
}
