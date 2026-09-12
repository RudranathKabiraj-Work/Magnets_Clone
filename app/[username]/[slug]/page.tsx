import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import MagnetSignupForm from "@/components/magnet-signup-form";
import AnalyticsAndExitIntent from "@/components/analytics-and-exit-intent";
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
  let accountDoc: any = null;
  let pageDoc: any = null;

  try {
    await dbConnect();
    const decodedUsername = decodeURIComponent(params.username || "");
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    accountDoc = await AccountModel.findOne(
      escapedUsername ? { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } } : {}
    );

    if (accountDoc && accountDoc.email) {
      pageDoc = await MagnetPageModel.findOne({
        userEmail: accountDoc.email.trim().toLowerCase(),
        $or: [{ id: params.slug }, { slug: params.slug }]
      });
    }

    if (!pageDoc) {
      pageDoc = await MagnetPageModel.findOne({
        $or: [{ id: params.slug }, { slug: params.slug }]
      });
    }
  } catch (err) {
    console.warn("MongoDB connection fallback in MagnetPageRoute:", err);
  }

  // Cookie session check to identify if the current viewer is the logged-in owner
  const cookieStore = cookies();
  const sessionToken =
    cookieStore.get("session_token")?.value ||
    cookieStore.get("next-auth.session-token")?.value ||
    cookieStore.get("__Secure-next-auth.session-token")?.value;

  const isOwner = Boolean(sessionToken);
  const isDraftMode = pageDoc?.status === "draft";

  // Draft Access Protection: If page is in Draft and viewer is NOT the logged-in owner, block public access
  if (isDraftMode && !isOwner) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0E0E10] px-4 text-center">
        <div className="max-w-md space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] p-8 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Page Not Published Yet</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            This lead magnet is currently in <span className="font-bold text-amber-600 dark:text-amber-400">Draft</span> mode and is not visible to the public. If you are the owner, please switch the status to Published inside your dashboard.
          </p>
          <a
            href="/dashboard/leadmagnets"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 text-xs font-bold text-white transition shadow-md"
          >
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  const cleanUserEmail = pageDoc?.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;

  if (!accountDoc && cleanUserEmail) {
    try {
      accountDoc = await AccountModel.findOne({ email: cleanUserEmail });
    } catch (_) { }
  }

  if (!accountDoc) {
    try {
      accountDoc = await AccountModel.findOne({});
    } catch (_) { }
  }

  if (!pageDoc) {
    notFound();
  }

  const page = JSON.parse(JSON.stringify(pageDoc)) as MagnetPage;

  // A/B Split Test Variant Selection
  let activeHeadline = page.headline;
  let activeImageUrl = page.imageUrl;
  let activeVariantLabel: "Control" | "Variant B" = "Control";
  let isVariantB = false;

  if (page.testStarted && page.hasVariantB) {
    const variantBText = page.variantBTitle && page.variantBTitle.trim() !== "" ? page.variantBTitle : page.headline;
    const variantBImg = page.variantBImage && page.variantBImage.trim() !== "" ? page.variantBImage : page.imageUrl;

    isVariantB = Math.random() < 0.5;
    if (isVariantB) {
      activeHeadline = variantBText;
      activeImageUrl = variantBImg;
      activeVariantLabel = "Variant B";
    }
  }

  const themeMode = (accountDoc?.themeMode as "light" | "dark") || "light";
  const brandColor = accountDoc?.brandColor || "#0066B2";
  const logo = accountDoc?.logo || null;
  const highlightIntensity = accountDoc?.highlightIntensity ?? 100;
  const businessName = accountDoc?.name || "BDA";

  return (
    <main
      className="flex min-h-screen flex-col font-sans transition-colors duration-300 relative"
      style={{
        colorScheme: themeMode === "dark" ? "dark" : "light",
        backgroundColor: themeMode === "dark" ? "#0E0E10" : "#FAFAFA",
        color: themeMode === "dark" ? "#ffffff" : "#18181b",
        backgroundImage: themeMode === "light"
          ? `radial-gradient(circle at 0% 0%, ${brandColor}10 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}08 0%, transparent 40%)`
          : `radial-gradient(circle at 0% 0%, ${brandColor}15 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}0c 0%, transparent 40%)`
      }}
    >
      <AnalyticsAndExitIntent
        ga4Id={accountDoc?.ga4MeasurementId}
        pixelId={accountDoc?.metaPixelId}
        faviconUrl={accountDoc?.faviconUrl}
        ogImageUrl={accountDoc?.ogImageUrl}
        pageTitle={page.name}
        ctaText={page.cta}
        brandColor={brandColor}
        pageId={page.id}
        isVariantB={isVariantB}
        isOwner={isOwner}
      />
      {/* Draft Preview Mode Top Banner for Logged-In Owner */}
      {isDraftMode && isOwner && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-black px-4 py-2 text-xs font-bold shadow-md border-b border-amber-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>⚠️ Draft Preview Mode — This magnet is not yet published. Only you can view this page.</span>
        </div>
      )}
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-center px-4 sm:px-6 relative">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-transparent overflow-hidden ${logo ? "border-none" : "border border-dashed border-[#a1a1aa]/45"}`}>
            {logo ? (
              <img src={logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-4 w-4 rounded-sm border border-dashed border-[#a1a1aa]" />
            )}
          </div>
          <span className={`text-sm font-bold tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
            {businessName}
          </span>
        </div>
      </header>

      {/* Main card container layout */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 pt-4 sm:px-6">
        {/* Dynamic Multi-Template View Renderer */}
        {((page.template as string) === "template2" || (!page.template && (accountDoc?.templateId as string) === "template2")) ? (
          /* TEMPLATE 2: Lead Capture Split Panel Layout */
          <div
            className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${themeMode === "dark" ? "bg-[#111827] text-white border-zinc-800" : "bg-white text-zinc-900 border-zinc-200"}`}
            style={{
              borderColor: `${brandColor}${Math.round((0.25 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`,
              boxShadow: `0 16px 40px -10px ${brandColor}${Math.round((highlightIntensity / 100) * 0.25 * 255).toString(16).padStart(2, '0')}`
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
              {/* Left Panel: Cover Image + Gradient Scrim + Bullets (~60%) */}
              <div className="md:col-span-7 relative flex flex-col justify-end p-6 md:p-8 overflow-hidden min-h-[260px] md:min-h-full bg-zinc-900 text-white">
                <img
                  src={activeImageUrl || "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"}
                  alt={page.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-[#0a0c16]/60 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    {activeHeadline}
                  </h1>
                  {page.subheadline && (
                    <p className="text-xs md:text-sm font-semibold text-white/90">
                      {page.subheadline}
                    </p>
                  )}
                  {page.pitch && (
                    <p className="text-xs text-white/70 leading-relaxed">
                      {page.pitch}
                    </p>
                  )}

                  {page.bullets && page.bullets.length > 0 && (
                    <ul className="space-y-2 pt-3 border-t border-white/10">
                      {page.bullets.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-white/90">
                          <span style={{ color: brandColor || "#a5b4fc" }}>
                            <CheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Panel: Form (~40%) */}
              <div className={`md:col-span-5 p-6 md:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l ${themeMode === "dark" ? "border-zinc-800 bg-[#18181B]" : "border-zinc-200 bg-white"}`}>
                <MagnetSignupForm
                  cta={page.cta}
                  formTitle={page.formTitle}
                  formSubtitle={page.formSubtitle}
                  formButtonText={page.formButtonText}
                  deliverable={page.deliverable}
                  accent={page.accent}
                  pageId={page.id}
                  pageName={page.name}
                  pageSlug={page.slug}
                  pageOwnerEmail={(page as any).userEmail}
                  brandColor={brandColor}
                  highlightIntensity={highlightIntensity}
                  themeMode={themeMode}
                  customPromptQuestion={page.customPromptQuestion}
                  customPromptPlaceholder={page.customPromptPlaceholder}
                  enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                  customFormFields={page.customFormFields}
                  username={params.username}
                />
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template3" || (!page.template && (accountDoc?.templateId as string) === "template3")) ? (
          /* TEMPLATE 3: Glassmorphic Editorial Luxury Hero */
          <div
            className={`rounded-3xl border overflow-hidden transition-all duration-300 relative ${themeMode === "dark" ? "bg-[#0B0F17] text-white border-zinc-800" : "bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white border-zinc-800"}`}
            style={{
              boxShadow: `0 24px 60px -12px ${brandColor}${Math.round((0.35 + (highlightIntensity / 100) * 0.4) * 255).toString(16).padStart(2, '0')}`
            }}
          >
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ backgroundColor: brandColor }} />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: brandColor }} />

            <div className="relative z-10 p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/90">
                    <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
                    <span>{page.bulletsTitle || "VIP Exclusive Access"}</span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    {activeHeadline}
                  </h1>

                  {page.subheadline && (
                    <p className="text-xs md:text-sm font-medium text-zinc-300 leading-relaxed max-w-xl">
                      {page.subheadline}
                    </p>
                  )}

                  {page.bullets && page.bullets.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {page.bullets.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-xs font-medium text-zinc-200">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-white font-bold text-[10px]" style={{ backgroundColor: brandColor }}>
                            ✓
                          </div>
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5">
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle={page.formTitle}
                    formSubtitle={page.formSubtitle}
                    formButtonText={page.formButtonText}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor}
                    highlightIntensity={highlightIntensity}
                    themeMode={themeMode}
                    customPromptQuestion={page.customPromptQuestion}
                    customPromptPlaceholder={page.customPromptPlaceholder}
                    enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                    customFormFields={page.customFormFields}
                    username={params.username}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template6" || (!page.template && (accountDoc?.templateId as string) === "template6")) ? (
          /* TEMPLATE 6: Floating Newsletter Card */
          <div
            className={`rounded-2xl border p-8 max-w-2xl mx-auto transition-all duration-300 ${themeMode === "dark" ? "bg-[#16161A] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"}`}
          >
            <div className="flex items-center gap-2 mb-4 justify-center">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brandColor }} />
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Weekly Insight</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-3 text-center">
              {activeHeadline}
            </h1>

            {page.subheadline && (
              <p className={`text-xs md:text-sm leading-relaxed mb-6 text-center max-w-md mx-auto ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                {page.subheadline}
              </p>
            )}

            <MagnetSignupForm
              cta={page.cta}
              formTitle={page.formTitle}
              formSubtitle={page.formSubtitle}
              formButtonText={page.formButtonText}
              deliverable={page.deliverable}
              accent={page.accent}
              pageId={page.id}
              pageName={page.name}
              pageSlug={page.slug}
              pageOwnerEmail={(page as any).userEmail}
              brandColor={brandColor}
              highlightIntensity={highlightIntensity}
              themeMode={themeMode}
              customPromptQuestion={page.customPromptQuestion}
              customPromptPlaceholder={page.customPromptPlaceholder}
              enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
              customFormFields={page.customFormFields}
              username={params.username}
            />
          </div>
        ) : ((page.template as string) === "template7" || (!page.template && (accountDoc?.templateId as string) === "template7")) ? (
          /* TEMPLATE 7: SaaS Cyber Spotlight */
          <div
            className="rounded-2xl border p-8 md:p-12 relative overflow-hidden transition-all duration-300 text-center bg-[#090A0F] text-white border-cyan-500/30 max-w-3xl mx-auto"
            style={{ boxShadow: `0 0 40px ${brandColor}20` }}
          >
            <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest border border-cyan-400/40 text-cyan-300 mb-5 bg-cyan-950/40">
              PRO EDITION
            </span>

            <h1 className="text-3xl md:text-5xl font-mono font-bold leading-tight text-white mb-4">
              {activeHeadline}
            </h1>

            {page.subheadline && (
              <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto mb-8">
                {page.subheadline}
              </p>
            )}

            <div className="max-w-md mx-auto">
              <MagnetSignupForm
                cta={page.cta}
                formTitle={page.formTitle}
                formSubtitle={page.formSubtitle}
                formButtonText={page.formButtonText}
                deliverable={page.deliverable}
                accent={page.accent}
                pageId={page.id}
                pageName={page.name}
                pageSlug={page.slug}
                pageOwnerEmail={(page as any).userEmail}
                brandColor={brandColor}
                highlightIntensity={highlightIntensity}
                themeMode={themeMode}
                customPromptQuestion={page.customPromptQuestion}
                customPromptPlaceholder={page.customPromptPlaceholder}
                enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                customFormFields={page.customFormFields}
                username={params.username}
              />
            </div>
          </div>
        ) : (
          /* TEMPLATE 1 / Default: Modern Split Layout */
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
                  {activeHeadline}
                </h1>
                <p className={`text-base leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"
                  }`}>
                  {page.subheadline}
                </p>

                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#9B9085]">
                      {page.bulletsTitle || page.pitch || "What they will learn"}
                    </p>
                    <ul className="space-y-4">
                      {page.bullets.map((line, idx) => (
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
                )}
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
                  {activeImageUrl ? (
                    <img src={activeImageUrl} alt="Resource" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#9B9085]/60">Media Placeholder</span>
                  )}
                </div>

                {/* Form Card */}
                <div className="w-full">
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle={page.formTitle}
                    formSubtitle={page.formSubtitle}
                    formButtonText={page.formButtonText}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor}
                    highlightIntensity={highlightIntensity}
                    themeMode={themeMode}
                    customPromptQuestion={page.customPromptQuestion}
                    customPromptPlaceholder={page.customPromptPlaceholder}
                    enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                    customFormFields={page.customFormFields}
                    username={params.username}
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
        )}
      </div>

      <p className="mx-auto pb-8 text-center text-[11px] text-[#5c5650]">
        <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-[#FE6F34]">
          Powered by LeadMagnets <MoveRightIcon className="h-3 w-3" />
        </a>
      </p>
    </main>
  );
}