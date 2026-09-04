import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import BrandLogo, { GeminiLogo } from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";

const cardClass =
  "space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#191919]";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  onSubmit,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
}) {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Top Header Bar matching Landing Page Navbar positioning */}
      <header className="relative z-20 mx-auto flex h-18 sm:h-22 w-full max-w-7xl items-center justify-between px-5 pt-2 sm:pt-3 sm:px-8 lg:px-10">
        <Link href="/" aria-label="LeadMagnets home" className="inline-flex items-center transition hover:opacity-80">
          <BrandLogo />
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center py-6">
        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4">
            <GeminiLogo size="h-14 sm:h-16 w-auto" />
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-normal text-zinc-900 dark:text-white">{title}</h1>
              <p className="mt-1.5 text-sm font-normal text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            </div>
          </div>
          <form className={cardClass} onSubmit={onSubmit}>{children}</form>
          {footer && <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">{footer}</p>}
        </div>
      </div>
    </main>
  );
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="inline-flex h-8 items-center gap-1.5 text-sm font-medium text-ink-700 transition hover:text-ink-950" href={href}>
      {children} <ArrowRightIcon className="h-3.5 w-3.5" />
    </a>
  );
}