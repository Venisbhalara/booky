"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

export function BlurImage(props: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError || !props.src) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand/10 to-navy/10 p-4 text-center">
        <span className="line-clamp-3 px-2 font-serif text-lg font-bold italic text-brand/60">
          {typeof props.alt === "string" ? props.alt : "Book"}
        </span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      className={`${props.className ?? ""} transition-[transform,filter,opacity] duration-700 ease-in-out ${
        isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"
      }`}
      onLoad={(e) => {
        // Detect 1x1 pixel placeholders from Open Library
        const img = e.currentTarget;
        if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
          setHasError(true);
          return;
        }
        setIsLoading(false);
        if (props.onLoad) props.onLoad(e);
      }}
      onError={() => {
        setHasError(true);
      }}
    />
  );
}
