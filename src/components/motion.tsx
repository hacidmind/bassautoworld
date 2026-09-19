"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;
    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("animejs"),
    ]).then(([{ gsap }, { ScrollTrigger }, { animate }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const animations: Animation[] = [];
      const revealTweens: ReturnType<typeof gsap.to>[] = [];
      // Drive native animation timelines with GSAP without changing DOM attributes
      // while React is still hydrating streamed server content.
      const reveal = (el: HTMLElement, delay = 0) => {
        const animation = el.animate(
          [
            { opacity: 0, transform: "translateY(36px) scale(.98)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 850, fill: "both", easing: "cubic-bezier(.16,1,.3,1)" },
        );
        animation.pause();
        animations.push(animation);
        const clock = { time: 0 };
        revealTweens.push(
          gsap.to(clock, {
            time: 850,
            duration: 0.85,
            delay,
            ease: "none",
            onUpdate: () => {
              animation.currentTime = clock.time;
            },
            onComplete: () => animation.cancel(),
          }),
        );
      };
      const ctx = gsap.context(() => {
        const main = document.querySelector<HTMLElement>("main");
        if (!document.querySelector(".hero") && main) reveal(main);
        document
          .querySelectorAll<HTMLElement>(".hero-copy > *")
          .forEach((el, i) => reveal(el, i * 0.1));
        gsap.utils
          .toArray<HTMLElement>(
            ".reveal, .car-card, .trust-items > span, .final-cta > *",
          )
          .forEach((el) =>
            ScrollTrigger.create({
              trigger: el,
              start: "top 92%",
              once: true,
              onEnter: () => {
                const siblings = Array.from(el.parentElement?.children || []);
                const stagger = el.matches(
                  ".car-card, .service-card, .process-step, .trust-items > span, .final-cta > *",
                );
                reveal(el, stagger ? (siblings.indexOf(el) % 3) * 0.12 : 0);
              },
            }),
          );
        const hero = document.querySelector<HTMLElement>(".hero-image");
        if (hero) {
          const parallax = hero.animate(
            [
              { transform: "scale(1.04) translateY(0)" },
              { transform: "scale(1.14) translateY(3%)" },
            ],
            { duration: 1000, fill: "both" },
          );
          parallax.pause();
          animations.push(parallax);
          const clock = { time: 0 };
          gsap.to(clock, {
            time: 1000,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
            onUpdate: () => {
              parallax.currentTime = clock.time;
            },
          });
        }
      });
      const hoverAnimations = new Map<Element, ReturnType<typeof animate>>();
      const interact = (event: Event) => {
        const target = (event.target as Element).closest?.(
          ".button, .text-link, .car-card, .service-card",
        );
        if (!target) return;
        const related = (event as PointerEvent | FocusEvent).relatedTarget;
        if (related instanceof Node && target.contains(related)) return;
        const active = event.type === "pointerover" || event.type === "focusin";
        const arrow = target.querySelector("svg");
        const element = arrow || target;
        hoverAnimations.get(element)?.revert();
        hoverAnimations.set(
          element,
          animate(element, {
            translateX: active && arrow ? [0, 4] : 0,
            translateY: active ? [0, -3] : 0,
            duration: 350,
            ease: "out(3)",
          }),
        );
      };
      const events = ["pointerover", "pointerout", "focusin", "focusout"];
      events.forEach((event) => document.addEventListener(event, interact));
      cleanup = () => {
        ctx.revert();
        revealTweens.forEach((tween) => tween.kill());
        animations.forEach((animation) => animation.cancel());
        hoverAnimations.forEach((animation) => animation.revert());
        events.forEach((event) =>
          document.removeEventListener(event, interact),
        );
      };
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [path]);
  return null;
}
