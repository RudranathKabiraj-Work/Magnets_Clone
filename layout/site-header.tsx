import { ArrowRightIcon } from "@/components/icons";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";

export default function SiteHeader() {
  return (
    <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
      <a aria-label="LeadMagnets home" href="/">
        <BrandLogo />
      </a>
      <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm text-ink-600 dark:text-ink-300 md:flex">
        <a className="transition hover:text-ink-950 dark:hover:text-white" href="#how-it-works">
          How it works
        </a>
        <a className="transition hover:text-ink-950 dark:hover:text-white" href="#features">
          Features
        </a>
        <a className="transition hover:text-ink-950 dark:hover:text-white" href="#integrations">
          Integrations
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <a
          className="hidden h-10 items-center px-3 text-sm font-medium text-ink-700 dark:text-ink-300 transition hover:text-ink-950 dark:hover:text-white sm:inline-flex"
          href="/login"
        >
          Sign in
        </a>
        <a
          className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950"
          href="/register"
        >
          Start free <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}