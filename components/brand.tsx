import React from "react";

export function MagnetIcon({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center">
      <img
        alt="LeadMagnets"
        src="/brand/custom-mark.png"
        className={`${className} object-contain`}
      />
    </span>
  );
}

export default function BrandLogo({
  height = "h-11 sm:h-12 lg:h-13",
  className = "",
}: {
  height?: string;
  width?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      {/* Light mode logo */}
      <img
        alt="LeadMagnets"
        src="/brand/custom-logo-light.png"
        className={`${height} w-auto object-contain dark:hidden`}
      />

      {/* Dark mode logo */}
      <img
        alt="LeadMagnets"
        src="/brand/custom-logo.png"
        className={`${height} w-auto object-contain hidden dark:block`}
      />
    </span>
  );
}

export function MagnetsMark({ size = "h-14 w-14", src = "/brand/custom-mark.png" }: { size?: string; src?: string }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
      <img
        alt="LeadMagnets"
        src={src}
        className={`${size} w-auto object-contain`}
      />
    </span>
  );
}

export function GeminiLogo({
  size = "h-20 w-auto",
  className = "",
  src = "/brand/gemini-logo.png",
  darkSrc = "/brand/gemini-logo-dark.png",
}: {
  size?: string;
  className?: string;
  src?: string;
  darkSrc?: string;
}) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      {/* Light mode logo */}
      <img
        alt="LeadMagnets Logo"
        src={src}
        className={`${size} object-contain filter drop-shadow-md dark:hidden`}
      />
      {/* Dark mode logo */}
      <img
        alt="LeadMagnets Logo"
        src={darkSrc}
        className={`${size} object-contain filter drop-shadow-md hidden dark:block`}
      />
    </span>
  );
}