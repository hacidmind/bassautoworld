import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import { Motion } from "@/components/motion";
import { settings } from "@/lib/data";
import { Analytics } from "@vercel/analytics/next";
import { Tracking } from "@/components/tracking";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "BassAutoWorld | Your vehicle partner. Worldwide.",
    template: "%s | BassAutoWorld",
  },
  description:
    "Buy, source, import, ship, clear and deliver your next vehicle with BassAutoWorld.",
  openGraph: { type: "website", siteName: "BassAutoWorld" },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await settings();
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Header logoUrl={s.logoUrl} />
        <main id="main">{children}</main>
        <Footer settings={s} />
        <Motion />
        {process.env.VERCEL && <Analytics />}
        <Tracking />
      </body>
    </html>
  );
}
