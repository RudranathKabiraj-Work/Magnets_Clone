import BrandLogo from "@/components/brand";

export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-600 dark:text-zinc-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-xs sm:text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <BrandLogo height="h-8 sm:h-9" />
        <div className="flex flex-wrap items-center gap-6 font-medium">
          <a className="transition hover:text-zinc-900 dark:hover:text-white" href="/privacy">
            Privacy
          </a>
          <a className="transition hover:text-zinc-900 dark:hover:text-white" href="/terms">
            Terms
          </a>
          <a className="transition hover:text-zinc-900 dark:hover:text-white" href="/login">
            Sign in
          </a>
        </div>
      </div>
    </footer>
  );
}