"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  MessageCircle,
  ArrowRight,
  Moon,
  Sun,
} from "lucide-react";
import { usePathname } from "next/navigation";
function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("baw-theme", next);
    } catch {}
  };
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Change color theme"
      title="Change color theme"
      onClick={toggleTheme}
    >
      <Moon className="theme-moon" size={18} aria-hidden="true" />
      <Sun className="theme-sun" size={18} aria-hidden="true" />
    </button>
  );
}
export function Brand({ logoUrl }: { logoUrl?: string } = {}) {
  if (logoUrl)
    return (
      <Link href="/" aria-label="BassAutoWorld home">
        <Image
          src={logoUrl}
          alt="BassAutoWorld"
          width={170}
          height={70}
          style={{ objectFit: "contain" }}
          priority
        />
      </Link>
    );
  return (
    <Link href="/" aria-label="BassAutoWorld home" className="brand">
      <span>
        BASS<span className="brand-dot">.</span>
      </span>
      <small>A U T O W O R L D</small>
    </Link>
  );
}
export function Header({ logoUrl }: { logoUrl?: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="header">
      <div className="container nav">
        <Brand logoUrl={logoUrl} />
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          {[
            ["/cars", "Browse cars"],
            ["/preorder", "Preorder"],
            ["/services", "Our services"],
            ["/about", "About us"],
            ["/reviews", "Reviews"],
          ].map(([href, label]) => (
            <Link
              onClick={() => setOpen(false)}
              className={path === href ? "active" : ""}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="button nav-cta" href="/contact">
          Let’s talk <ArrowUpRight size={16} />
        </Link>
        <ThemeToggle />
        <button
          className="menu"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function Footer({ settings }: { settings: Record<string, string> }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Brand logoUrl={settings.logoUrl} />
          <p>Your vehicle partner. Worldwide.</p>
          <p className="muted">Cars. Imports. Shipping. Clearing. Logistics.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link href="/cars">Browse cars</Link>
          <Link href="/preorder">Preorder a vehicle</Link>
          <Link href="/inspection">Book an inspection</Link>
          <Link href="/reviews">Customer stories</Link>
        </div>
        <div>
          <h4>Go further</h4>
          <Link href="/services">Our services</Link>
          <Link href="/about">About BassAutoWorld</Link>
          <Link href="/contact">Get in touch</Link>
          {settings.instagram && (
            <a href={settings.instagram} target="_blank" rel="noreferrer">
              Instagram <ArrowUpRight size={13} />
            </a>
          )}
        </div>
        <div>
          <h4>Start a conversation</h4>
          <p>
            Have a vehicle in mind?
            <br />
            Let’s make the next move.
          </p>
          <Link className="text-link" href="/contact">
            Talk to our team <ArrowRight size={16} />
          </Link>
          {settings.email && (
            <a href={"mailto:" + settings.email}>{settings.email}</a>
          )}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} BassAutoWorld. All rights reserved.
        </span>
        <span>YOUR NEXT CHAPTER STARTS HERE.</span>
        <Link href="/admin">Admin</Link>
      </div>
    </footer>
  );
}
export function WhatsApp({
  number,
  message,
  label = "Chat on WhatsApp",
}: {
  number?: string;
  message: string;
  label?: string;
}) {
  if (!number)
    return (
      <Link className="button outline" href="/contact">
        Contact our team <ArrowUpRight size={16} />
      </Link>
    );
  return (
    <a
      className="button outline"
      href={`https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("baw-track", {
            detail: { name: "whatsapp_clicked" },
          }),
        )
      }
    >
      <MessageCircle size={17} />
      {label}
    </a>
  );
}
