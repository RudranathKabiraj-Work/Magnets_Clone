import { notFound } from "next/navigation";
import MagnetSignupForm from "@/components/magnet-signup-form";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
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

  const pageDoc = await MagnetPageModel.findOne({ slug: params.slug });
  if (!pageDoc) notFound();

  const accountDoc = await AccountModel.findOne({
    $or: [
      { username: { $regex: new RegExp(`^${params.username}$`, "i") } },
      { email: pageDoc.userEmail ? pageDoc.userEmail.toLowerCase() : "" }
    ]
  });

  // Increment views
  pageDoc.views = (pageDoc.views || 0) + 1;
  if (pageDoc.views > 0) {
    pageDoc.conversionRate = parseFloat(((pageDoc.signups / pageDoc.views) * 100).toFixed(1));
  }
  await pageDoc.save();

  const page = JSON.parse(JSON.stringify(pageDoc)) as MagnetPage;

  const themeMode = accountDoc?.themeMode || "light";
  const brandColor = accountDoc?.brandColor || "#0066B2";
  const logo = accountDoc?.logo || null;
  const highlightIntensity = accountDoc?.highlightIntensity ?? 100;
  const businessName = accountDoc?.name || "BDA";

  return (
    <main
      className="flex min-h-screen flex-col transition-colors duration-300"
      style={{
        backgroundColor: themeMode === "dark" ? "#0E0E10" : "#FAFAFA",
        color: themeMode === "dark" ? "#ffffff" : "#18181b",
        backgroundImage: themeMode === "light"
          ? `radial-gradient(circle at 0% 0%, ${brandColor}10 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}08 0%, transparent 40%)`
          : `radial-gradient(circle at 0% 0%, ${brandColor}15 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}0c 0%, transparent 40%)`
      }}
    >
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-center px-4 sm:px-6 relative">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg border border-dashed border-[#a1a1aa]/45 flex items-center justify-center bg-transparent overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-4 w-4 rounded-sm border border-dashed border-[#a1a1aa]" />
            )}
          </div>
          <span className="text-sm font-bold tracking-wider uppercase">
            {businessName}
          </span>
        </div>
        <a
          href="/login"
          className={`absolute right-4 sm:right-6 text-sm font-medium transition ${themeMode === "dark" ? "text-zinc-400 hover:text-white" : "text-ink-600 hover:text-ink-950"}`}
        >
          Sign in
        </a>
      </header>

      {/* Main card container layout */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-4 sm:px-6">
        <div
          className={`rounded-2xl border p-6 md:p-8 shadow-2xl transition-all duration-300 backdrop-blur-md ${themeMode === "dark"
            ? "text-white"
            : "text-zinc-900"
            }`}
          style={{
            borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.65) * 255).toString(16).padStart(2, '0')}`,
            boxShadow: (highlightIntensity > 10)
              ? `0 16px 40px -10px ${brandColor}${Math.round((highlightIntensity / 100) * 0.45 * 255).toString(16).padStart(2, '0')}`
              : "0 4px 12px rgba(0,0,0,0.05)",
            background: themeMode === "light"
              ? `linear-gradient(135deg, ${brandColor}${Math.round((0.02 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0.95) 50%)`
              : `linear-gradient(135deg, ${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')} 0%, rgba(18, 18, 20, 0.95) 50%)`
          }}
        >
          {/* Grid structure */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Content */}
            <div className="md:col-span-6 space-y-7">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm ${themeMode === "dark"
                ? "border-[#252529] bg-[#161619] text-zinc-300"
                : "border-ink-200 bg-zinc-50 text-ink-600"
                }`}>
                <SparklesIcon className="h-3 w-3 text-brand-orange" />
                Free resource
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-tight">
                {page.headline}
              </h1>
              <p className={`text-base leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"
                }`}>
                {page.subheadline}
              </p>

              <div className="space-y-4 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9B9085]">
                  This playbook breaks down:
                </p>
                <ul className="space-y-4">
                  {[
                    "101 fill-in-the-blank templates for every content scenario",
                    "Proven structures for storytelling, advice, and transformation posts",
                    "Ready-to-use formats that let you focus on your message"
                  ].map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 shadow-sm transition-all duration-300"
                        style={{
                          backgroundColor: brandColor,
                          opacity: 0.4 + (highlightIntensity / 100) * 0.6,
                          boxShadow: highlightIntensity > 30 ? `0 0 ${Math.round(12 * (highlightIntensity / 100))}px ${brandColor}${Math.round((highlightIntensity / 100) * 0.7 * 255).toString(16).padStart(2, '0')}` : 'none'
                        }}
                      >
                        <CheckIcon className="h-3 w-3 text-white" />
                      </span>
                      <span className={themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}>
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Media Placeholder & Form Column */}
            <div className="md:col-span-6 space-y-4">
              {/* Media Placeholder */}
              <div
                className="rounded-xl border aspect-[16/11] w-full flex items-center justify-center transition-all duration-300 relative overflow-hidden"
                style={{
                  borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`,
                  backgroundColor: `${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')}`
                }}
              >
                {page.imageUrl ? (
                  <img src={page.imageUrl} alt="Resource" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9B9085]/60">Media Placeholder</span>
                )}
              </div>

              {/* Form Card */}
              <div className="w-full">
                <MagnetSignupForm
                  cta={page.cta}
                  deliverable={page.deliverable}
                  accent={page.accent}
                  pageId={page.id}
                  pageName={page.name}
                  brandColor={brandColor}
                  highlightIntensity={highlightIntensity}
                  themeMode={themeMode}
                  customPromptQuestion={page.customPromptQuestion}
                  customPromptPlaceholder={page.customPromptPlaceholder}
                  enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                />
                <p className={`mt-3 flex items-center justify-center gap-1.5 text-xs ${themeMode === "dark" ? "text-zinc-500" : "text-ink-500"
                  }`}>
                  <GiftIcon className="h-3.5 w-3.5" />
                  {page.deliverable}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto pb-8 text-center text-[11px] text-[#5c5650]">
        <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-[#FE6F34]">
          Powered by LeadMagnets <MoveRightIcon className="h-3 w-3" />
        </a>
      </p>
    </main>
  );
}