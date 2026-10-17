"use client";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  // Lenis smooth scrolling is initialized and synchronized with GSAP ScrollTrigger inside /aardvark/slater.js
  return <>{children}</>;
}
