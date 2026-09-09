"use client";

import { ArrowRightIcon } from "@/components/icons";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  // Positive offset (+35px) skips section py-28 padding so title and card grid frame perfectly in screen center
  const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY + 35);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenis = (window as any).__lenis;
  if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(el, { offset: 35, duration: 1.2 });
    return;
  }

  window.scrollTo({ top: targetY, behavior: "smooth" });
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const id = href.replace("#", "");
  return (
    <a
      href={href}
      className="transition hover:text-[#0066B2] dark:hover:text-white"
      onClick={(e) => {
        e.preventDefault();
        smoothScrollTo(id);
        // Update URL hash without triggering jump
        history.pushState(null, "", href);
      }}
    >
      {children}
    </a>
  );
}

export default function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex h-18 sm:h-22 max-w-7xl items-center justify-between px-5 pt-2 sm:pt-3 sm:px-8 lg:px-10">
      <a aria-label="LeadMagnets home" href="/">
        <BrandLogo />
      </a>
      <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
        <NavLink href="#how-it-works">How it works</NavLink>
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#integrations">Integrations</NavLink>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <a
          className="hidden h-10 items-center px-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:text-[#0066B2] dark:hover:text-white sm:inline-flex"
          href="/login"
        >
          Sign in
        </a>
        <a
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-4 text-sm font-bold text-white shadow-md transition-all active:scale-98"
          href="/register"
        >
          Start free <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}