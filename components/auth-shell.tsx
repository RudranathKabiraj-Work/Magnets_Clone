import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import BrandLogo, { MagnetsMark } from "@/components/brand";

const cardClass =
  "space-y-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-form dark:border-white/10 dark:bg-[#18181B]";

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
    <main className="brand-soft-bg relative flex min-h-screen flex-col px-4 py-6 text-ink-900 dark:bg-[#0E0E10] dark:text-white">
      {/* Top Left Logo Link to Landing Page */}
      <div className="mx-auto w-full max-w-6xl px-2 sm:px-4 py-2">
        <Link href="/" aria-label="Magnets home" className="inline-flex items-center transition hover:opacity-80">
          <BrandLogo height="h-8" width="w-[8.5rem]" />
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-6">
        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4">
            <MagnetsMark size="h-12 w-12" />
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-normal text-ink-950 dark:text-white">{title}</h1>
              <p className="mt-1.5 text-sm font-normal text-ink-600 dark:text-zinc-400">{subtitle}</p>
            </div>
          </div>
          <form className={cardClass} onSubmit={onSubmit}>{children}</form>
          {footer && <p className="mt-6 text-center text-sm text-ink-600 dark:text-zinc-400">{footer}</p>}
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