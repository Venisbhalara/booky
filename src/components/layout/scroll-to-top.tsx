"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Magnetic } from "@/components/animations/magnetic";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    // Note: Since we have Lenis running via requestAnimationFrame globally,
    // window.scrollTo triggers Lenis to intercept and smooth scroll automatically.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 transition-all duration-500 ease-out md:bottom-8 md:right-8 ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-12 opacity-0"
      }`}
    >
      <Magnetic strength={0.2}>
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="group relative flex size-12 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-white/70 shadow-[0_8px_32px_rgba(10,22,40,0.12)] backdrop-blur-xl transition-all duration-300 hover:border-coral/50 hover:shadow-[0_8px_32px_rgba(255,107,53,0.25)] active:scale-95"
        >
          {/* Subtle coral hover fill */}
          <div className="absolute inset-0 bg-coral/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <ArrowUp className="relative z-10 size-5 text-navy transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-coral" strokeWidth={2.5} />
        </button>
      </Magnetic>
    </div>
  );
}
