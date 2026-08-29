import { notFound } from "next/navigation";
import BrandLogo from "@/components/brand";
import MagnetSignupForm from "@/components/magnet-signup-form";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel } from "@/lib/models";
import { type MagnetPage } from "@/lib/data";

export const dynamic = "force-dynamic";

function Icon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </Icon>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </Icon>
  );
}

function MoveRightIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M18 8 22 12 18 16" />
      <path d="M2 12h20" />
    </Icon>
  );
}

export default async function MagnetPageRoute({
  params,
}: {
  params: { username: string; slug: string };
}) {
  await dbConnect();
  const pageDoc = await MagnetPageModel.findOne({ slug: params.slug, status: "live" });

  if (!pageDoc) notFound();

  // Increment views
  pageDoc.views = (pageDoc.views || 0) + 1;
  if (pageDoc.views > 0) {
    pageDoc.conversionRate = parseFloat(((pageDoc.signups / pageDoc.views) * 100).toFixed(1));
  }
  await pageDoc.save();

  const page = JSON.parse(JSON.stringify(pageDoc)) as MagnetPage;

  return (
    <main className="flex min-h-screen flex-col bg-brand-soft text-ink-900">
      <header className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
        <a href="/" aria-label="Magnets home">
          <BrandLogo height="h-7" />
        </a>
        <a
          href="/login"
          className="text-sm font-medium text-ink-600 transition hover:text-ink-950"
        >
          Sign in
        </a>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 pb-16 pt-8 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] font-medium text-ink-600 shadow-sm">
            <SparklesIcon className="h-3 w-3" />
            Free resource
          </span>
          <h1
            className="mx-auto mt-6 max-w-lg text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl"
            style={{
              color: page.accent === "#111111" || page.accent === "#5C554E" ? "#111111" : page.accent,
            }}
          >
            {page.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-ink-600 sm:text-lg sm:leading-8">
            {page.subheadline}
          </p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-sm">
          <MagnetSignupForm cta={page.cta} deliverable={page.deliverable} accent={page.accent} pageId={page.id} pageName={page.name} />
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <GiftIcon className="h-3.5 w-3.5" />
            {page.deliverable}
          </p>
        </div>

        <div className="mx-auto mt-12 w-full max-w-md space-y-2.5">
          {[
            "No email chains, no follow-up spam — the resource arrives instantly",
            "Backed by a practical system people actually finish",
          ].map((line) => (
            <div key={line} className="flex items-center gap-2.5 text-sm text-ink-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                <CheckIcon className="h-3 w-3" />
              </span>
              {line}
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto pb-8 text-center text-[11px] text-ink-400">
        <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-ink-700">
          Powered by Magnets <MoveRightIcon className="h-3 w-3" />
        </a>
      </p>
    </main>
  );
}