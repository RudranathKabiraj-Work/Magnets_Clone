import { ArrowLeftIcon } from "@/components/icons";
import BrandLogo from "@/components/brand";

export function LegalHeader() {
  return (
    <header className="border-b border-ink-200 bg-brand-soft">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a aria-label="LeadMagnets home" href="/">
          <BrandLogo height="h-8" />
        </a>
        <a
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-ink-600 transition hover:bg-white hover:text-ink-900"
          href="/"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Home
        </a>
      </div>
    </header>
  );
}

export function LegalFooter() {
  return (
    <footer className="border-t border-ink-200 bg-brand-soft px-4 py-6 text-xs text-ink-500 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 LeadMagnets</span>
        <div className="flex gap-3">
          <a className="hover:text-ink-900" href="/">
            Home
          </a>
          <a href="/privacy" className="hover:text-ink-900" target="_blank" rel="noreferrer">
            Privacy
          </a>
          <a href="/terms" className="hover:text-ink-900" target="_blank" rel="noreferrer">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}