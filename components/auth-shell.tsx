import { ArrowRightIcon } from "@/components/icons";
import { MagnetsMark } from "@/components/brand";

const cardClass =
  "space-y-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-form";

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
    <main className="brand-soft-bg relative flex min-h-screen items-center justify-center px-4 py-10 text-ink-900">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <MagnetsMark size="h-12 w-12" />
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-normal text-ink-950">{title}</h1>
            <p className="mt-1.5 text-sm font-normal text-ink-600">{subtitle}</p>
          </div>
        </div>
        <form className={cardClass} onSubmit={onSubmit}>{children}</form>
        {footer && <p className="mt-6 text-center text-sm text-ink-600">{footer}</p>}
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