"use client";

import { useEffect, useRef, useState } from "react";

/** Returns a ref + a boolean that becomes true once the element enters the viewport. Fires only once. */
export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<Element>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference — reveal immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // fire only once
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px", ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

/** Wraps children in a div that fades + slides up on scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;           // ms stagger delay
  className?: string;
}) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Wraps an icon span and scales it in on view — used in the "How it works" cards. */
export function RevealIcon({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView();

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      style={{
        display: "inline-grid",
        placeItems: "center",
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1)" : "scale(0.55)",
        transition: `opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      {children}
    </span>
  );
}
