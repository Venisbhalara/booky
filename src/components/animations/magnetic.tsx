"use client";

import React, { useRef, useState, useEffect } from "react";

export function Magnetic({
  children,
  strength = 0.2, // how much it follows the cursor (0.2 = 20%)
}: {
  children: React.ReactElement;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Only enable on desktop
  useEffect(() => {
    setIsMobile(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current!.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;
    setPosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isHovered
          ? "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)" // very fast when moving
          : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)", // spring back on leave
      }}
      className="inline-flex"
    >
      {children}
    </div>
  );
}
