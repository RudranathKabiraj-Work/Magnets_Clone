import BrandLogo from "@/components/brand";

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-950 bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <BrandLogo height="h-7" />
        <div className="flex flex-wrap items-center gap-5">
          <a className="transition hover:text-white" href="/privacy">
            Privacy
          </a>
          <a className="transition hover:text-white" href="/terms">
            Terms
          </a>
          <a className="transition hover:text-white" href="/login">
            Sign in
          </a>
        </div>
      </div>
    </footer>
  );
}