"use client";

import { useEffect, useState } from "react";
import { TypographyVortexCanvas } from "@/src/shaders/typography-vortex/TypographyVortexCanvas";

function getActiveTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";

  try {
    // 1. Check saved user preference in localStorage
    const saved = localStorage.getItem("leadmagnets-theme");
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch (_) {}

  // 2. Check document element class or dataset set by inline layout script
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  if (document.documentElement.dataset.theme === "dark") return "dark";
  if (document.documentElement.dataset.theme === "light") return "light";

  // 3. Fallback to OS / System preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export default function NotFound() {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(getActiveTheme());

    const updateTheme = () => {
      setMode(getActiveTheme());
    };

    // Listen for DOM theme class changes (from ThemeToggle)
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => updateTheme();
    mediaQuery.addEventListener("change", handleMediaChange);

    // Listen for localStorage changes across tabs/windows
    window.addEventListener("storage", updateTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("storage", updateTheme);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#F7F5F1] dark:bg-[#0f0f11] overflow-hidden">
      {mounted && (
        <TypographyVortexCanvas
          key={mode}
          mode={mode}
          phrase="404 / PAGE NOT FOUND / "
          speed={1.0}
          ringGrowth={1.21}
          opacity={1.0}
          dissolveRadius={1.0}
          particleAmount={1.0}
          suctionDuration={920}
          className="w-full h-full"
        />
      )}
    </div>
  );
}


