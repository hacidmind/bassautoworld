"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { track } from "@vercel/analytics";
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
export function Tracking() {
  const path = usePathname();
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  useEffect(() => {
    const fire = (name: string) => {
      if (path.startsWith("/admin") || path === "/login") return;
      window.gtag?.("event", name);
      window.fbq?.("trackCustom", name);
      if (process.env.NODE_ENV === "production") track(name);
    };
    const event = (e: Event) => {
      const name = (e as CustomEvent).detail?.name;
      if (typeof name === "string" && /^[a-z_]+$/.test(name)) fire(name);
    };
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      if (a?.href.startsWith("tel:")) fire("phone_clicked");
    };
    window.addEventListener("baw-track", event);
    document.addEventListener("click", click);
    if (/^\/cars\/[^/]+$/.test(path)) fire("vehicle_view");
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");
    if (source) {
      try {
        sessionStorage.setItem("baw-source", source.toUpperCase());
      } catch {}
    }
    return () => {
      window.removeEventListener("baw-track", event);
      document.removeEventListener("click", click);
    };
  }, [path]);
  if (path.startsWith("/admin") || path === "/login") return null;
  return (
    <>
      {ga && /^G-[A-Z0-9]+$/.test(ga) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
          >{`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      )}
      {pixel && /^\d+$/.test(pixel) && (
        <Script
          id="meta-init"
          strategy="afterInteractive"
        >{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}
