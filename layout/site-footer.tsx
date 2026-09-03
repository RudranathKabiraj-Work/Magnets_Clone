import BrandLogo from "@/components/brand";

export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-[#080C14] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs sm:text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <BrandLogo height="h-7" />
        <div className="flex flex-wrap items-center gap-6 font-medium">
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