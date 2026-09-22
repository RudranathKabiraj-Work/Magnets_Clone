import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import MagnetSignupForm from "@/components/magnet-signup-form";
import AnalyticsAndExitIntent from "@/components/analytics-and-exit-intent";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
import { type MagnetPage } from "@/lib/data";
import { verifySessionToken } from "@/lib/session-token";


export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string; slug: string };
}): Promise<Metadata> {
  let accountDoc: any = null;
  let pageDoc: any = null;

  try {
    await dbConnect();
    const decodedUsername = decodeURIComponent(params.username || "");
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    accountDoc = await AccountModel.findOne(
      escapedUsername ? { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } } : {}
    ).lean();

    if (accountDoc && accountDoc.email) {
      pageDoc = await MagnetPageModel.findOne({
        userEmail: accountDoc.email.trim().toLowerCase(),
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).lean();
    }

    if (!pageDoc) {
      pageDoc = await MagnetPageModel.findOne({
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).lean();
    }
  } catch (err) {
    console.warn("MongoDB metadata query fallback in generateMetadata:", err);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  const username = params.username || "user";
  const slug = params.slug || "resource";

  if (!pageDoc) {
    return {
      title: "Lead Magnet Not Found | LeadMagnets",
      description: "The requested lead magnet page could not be found.",
    };
  }

  const title = pageDoc.headline || pageDoc.name || "Free Resource";
  const rawDescription = pageDoc.subheadline || pageDoc.pitch || `Download ${title} instantly.`;
  const description = rawDescription.replace(/<[^>]*>/g, "").trim().slice(0, 200);
  const authorName = accountDoc?.name || username;
  const canonicalUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;
  const ogImageUrl = pageDoc.imageUrl || accountDoc?.ogImageUrl || "/landing-dashboard.png";

  return {
    title: `${title} | ${authorName}`,
    description: description,
    authors: [{ name: authorName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: title,
      description: description,
      siteName: `${authorName} · LeadMagnets`,
      images: [
        {
          url: ogImageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [ogImageUrl],
    },
  };
}

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
    ).lean();

    if (accountDoc && accountDoc.email) {
      pageDoc = await MagnetPageModel.findOne({
        userEmail: accountDoc.email.trim().toLowerCase(),
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).lean();
    }

    if (!pageDoc) {
      pageDoc = await MagnetPageModel.findOne({
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).lean();
    }
  } catch (err) {
    console.warn("MongoDB connection fallback in MagnetPageRoute:", err);
  }

  // Identify whether the current viewer is the actual owner of this page.
  // We decode the session token and compare the email against the page owner —
  // simply having any session is NOT enough (a logged-in visitor to someone
  // else's magnet is not the owner).
  const cookieStore = cookies();
  const rawToken =
    cookieStore.get("session_token")?.value ||
    cookieStore.get("next-auth.session-token")?.value ||
    cookieStore.get("__Secure-next-auth.session-token")?.value;

  let viewerEmail: string | null = null;
  if (rawToken) {
    try {
      const decoded = verifySessionToken(rawToken);
      if (decoded?.email) viewerEmail = decoded.email.trim().toLowerCase();
    } catch { /* invalid token — treat as unauthenticated */ }
  }

  const pageOwnerEmail = pageDoc?.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;
  const isOwner = Boolean(viewerEmail && pageOwnerEmail && viewerEmail === pageOwnerEmail);
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
      accountDoc = await AccountModel.findOne({ email: cleanUserEmail }).lean();
    } catch (_) { }
  }

  if (!accountDoc) {
    try {
      accountDoc = await AccountModel.findOne({}).lean();
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
        isOwner={isOwner && isDraftMode && !page.testStarted}
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
                {activeImageUrl && activeImageUrl.trim() !== "" ? (
                  <img
                    src={activeImageUrl}
                    alt={page.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#121215]" />
                )}
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
                  isVariantB={isVariantB}
                  afterSignupOption={page.afterSignupOption}
                  destinationUrl={page.destinationUrl}
                />
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template3" || (!page.template && (accountDoc?.templateId as string) === "template3")) ? (
          /* TEMPLATE 3: Aurora Reveal — Portrait image left with aurora glow, rich editorial form panel right */
          <div
            className="rounded-3xl overflow-hidden relative transition-all duration-300"
            style={{
              background: themeMode === "dark" ? "#0c0c12" : "#f7f8fc",
              border: `1px solid ${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.2) * 255).toString(16).padStart(2, '0')}`,
              boxShadow: `0 24px 70px -12px ${brandColor}${Math.round((0.22 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')}`,
            }}
          >
            <div className="grid grid-cols-12 min-h-[440px]">
              {/* LEFT: Aurora Image Tile (5 cols) */}
              <div className="col-span-12 md:col-span-5 relative overflow-hidden min-h-[260px] md:min-h-[440px]">
                {page.imageUrl && page.imageUrl.trim() !== "" ? (
                  <img
                    src={page.imageUrl}
                    alt={page.name || "Cover"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#121215]">
                    <div className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/80 text-white">
                      <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" strokeWidth="2" />
                      </svg>
                      <span className="text-xs font-bold text-white">Cover Image</span>
                    </div>
                  </div>
                )}

                {/* Right fade into card */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: themeMode === "dark" ? "linear-gradient(to right, transparent 55%, #0c0c12 100%)" : "linear-gradient(to right, transparent 55%, #f7f8fc 100%)" }}
                />
                {/* Bottom fade */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />

              </div>

              {/* RIGHT: Editorial Form Panel (7 cols) */}
              <div
                className="col-span-12 md:col-span-7 flex flex-col justify-center p-6 md:p-8 space-y-4"
                style={{
                  borderLeft: `1px solid ${themeMode === "dark" ? `${brandColor}22` : `${brandColor}15`}`,
                }}
              >
                {/* Eyebrow */}
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                    {page.bulletsTitle || "Free Resource · Instant Access"}
                  </span>
                </div>

                {/* Headline */}
                <div className="space-y-1.5">
                  <h1 className={`text-2xl md:text-3xl font-black leading-tight tracking-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                    {activeHeadline}
                  </h1>
                  {page.subheadline && (
                    <p className={`text-xs md:text-sm leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                      {page.subheadline}
                    </p>
                  )}
                </div>

                {/* Bullets */}
                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {page.bullets.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
                          style={{ background: `${brandColor}22`, border: `1px solid ${brandColor}44` }}
                        >
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                            <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className={`text-xs font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Accent divider */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}44, transparent)` }} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Sign Up Free</span>
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}44, transparent)` }} />
                </div>

                {/* Form */}
                <div className="pt-1">
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
                    isVariantB={isVariantB}
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template4" || (!page.template && (accountDoc?.templateId as string) === "template4")) ? (
          /* TEMPLATE 4: Neon Orbit — Circular glowing image portal right, editorial copy left */
          <div
            className="rounded-3xl overflow-hidden transition-all duration-300 relative"
            style={{
              background: themeMode === "dark"
                ? `radial-gradient(ellipse 80% 60% at 70% 30%, ${brandColor}14 0%, #08080f 55%, #0d0012 100%)`
                : `radial-gradient(ellipse 80% 60% at 70% 30%, ${brandColor}0d 0%, #f4f5fb 55%, #f8f4ff 100%)`,
              border: `1px solid ${themeMode === "dark" ? `${brandColor}22` : `${brandColor}18`}`,
              boxShadow: `0 0 0 1px ${brandColor}12, 0 32px 80px -16px ${brandColor}${Math.round((0.22 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')}`,
            }}
          >
            <div className="grid grid-cols-12 min-h-[500px] p-8 gap-6 items-center">
              {/* LEFT: Copy + Form */}
              <div className="col-span-6 flex flex-col justify-center space-y-5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}` }} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                    {page.bulletsTitle || "Free Resource · Limited Time"}
                  </span>
                </div>

                <h1 className={`text-3xl md:text-4xl font-black leading-tight tracking-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                  {activeHeadline}
                </h1>

                {page.subheadline && (
                  <p className={`text-sm leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {page.subheadline}
                  </p>
                )}

                {page.pitch && (
                  <p className={`text-xs md:text-sm leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {page.pitch}
                  </p>
                )}

                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-2.5">
                    {page.bullets.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                          <svg width="8" height="8" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span className={`text-sm font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}55, transparent)` }} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Secure Sign Up</span>
                  <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}55, transparent)` }} />
                </div>

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
                  isVariantB={isVariantB}
                  afterSignupOption={page.afterSignupOption}
                  destinationUrl={page.destinationUrl}
                />
              </div>

              {/* RIGHT: Orbital image portal */}
              <div className="col-span-6 flex items-center justify-center relative" style={{ minHeight: "400px" }}>
                {/* Ambient glow */}
                <div className="absolute rounded-full pointer-events-none" style={{ width: "420px", height: "420px", background: `radial-gradient(circle, ${brandColor}${Math.round((0.12 + (highlightIntensity / 100) * 0.2) * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`, filter: "blur(30px)" }} />
                {/* Outer dashed ring */}
                <div className="absolute rounded-full border border-dashed pointer-events-none" style={{ width: "380px", height: "380px", borderColor: `${brandColor}25` }} />
                {/* Mid ring */}
                <div className="absolute rounded-full pointer-events-none" style={{ width: "330px", height: "330px", border: `1px solid ${brandColor}${Math.round((0.18 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 20px ${brandColor}22` }} />
                {/* Inner neon halo */}
                <div className="absolute rounded-full pointer-events-none" style={{ width: "290px", height: "290px", border: `2px solid ${brandColor}${Math.round((0.35 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 36px ${brandColor}${Math.round((0.2 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')}` }} />
                {/* Circular image */}
                <div className="relative rounded-full overflow-hidden z-10" style={{ width: "260px", height: "260px", border: `3px solid ${brandColor}${Math.round((0.5 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 50px -8px ${brandColor}${Math.round((0.45 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}` }}>
                  {activeImageUrl && activeImageUrl.trim() !== "" ? (
                    <img
                      src={activeImageUrl}
                      alt={page.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brandColor}88 0%, #0d0012 100%)` }}>
                      <div className="h-8 w-8 rounded-full bg-white/20" />
                    </div>
                  )}
                  <div className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 100%)" }} />
                </div>
              </div>
            </div>

            {/* Bottom trust strip */}
            <div className={`px-8 pb-5 pt-2 flex items-center justify-between border-t ${themeMode === "dark" ? "border-white/[0.05]" : "border-zinc-100"}`}>
              <div className="flex items-center gap-2">
                {logo ? <img src={logo} alt="Logo" className="h-6 w-6 rounded object-contain" /> : <div className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: brandColor }}>{(businessName || "B").charAt(0).toUpperCase()}</div>}
                <span className={`text-xs font-bold ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{businessName}</span>
              </div>
              <div className="flex items-center gap-4">
                {["Verified Free", "Instant Access", "No Spam"].map((tag, i) => (
                  <span key={i} className={`flex items-center gap-1.5 text-[10px] font-semibold ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: brandColor }} />{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template5" || (!page.template && (accountDoc?.templateId as string) === "template5")) ? (
          /* TEMPLATE 5: Magazine Cover Overlay — full-bleed image hero, cinematic scrim, overlaid copy, floating glass sign-up tray */
          <div className="rounded-3xl overflow-hidden relative transition-all duration-300" style={{ border: `1px solid ${brandColor}${Math.round((0.14 + (highlightIntensity / 100) * 0.22) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 24px 70px -12px ${brandColor}${Math.round((0.18 + (highlightIntensity / 100) * 0.28) * 255).toString(16).padStart(2, '0')}`, background: themeMode === "dark" ? "#0d0d11" : "#f0f2f7" }}>
            {/* Full-bleed cover image */}
            <div className="relative w-full" style={{ paddingBottom: "50%" }}>
              {activeImageUrl && activeImageUrl.trim() !== "" ? (
                <img
                  src={activeImageUrl}
                  alt={page.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#121215]" />
              )}
              {/* Cinematic scrim */}
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 100%)` }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${brandColor}33 0%, transparent 60%)` }} />

              {/* Brand logo top-left */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                {logo ? <img src={logo} alt="Logo" className="h-7 w-7 rounded object-contain" /> : <div className="h-7 w-7 rounded flex items-center justify-center text-white font-black text-xs" style={{ backgroundColor: brandColor }}>{(businessName || "B").charAt(0).toUpperCase()}</div>}
                <span className="text-white/90 text-xs font-bold tracking-wide">{businessName}</span>
              </div>

              {/* Overlaid headline & subheadline */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10 space-y-1">
                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight max-w-2xl drop-shadow-xl">{activeHeadline}</h1>
                {page.subheadline && <p className="text-white/80 text-sm max-w-xl leading-relaxed drop-shadow">{page.subheadline}</p>}
              </div>
            </div>

            {/* Floating glass sign-up tray / content card */}
            <div className={`relative z-20 mx-4 md:mx-8 -mt-5 mb-6 rounded-2xl p-5 space-y-4`} style={{ background: themeMode === "dark" ? "rgba(12,12,18,0.92)" : "rgba(255,255,255,0.96)", border: `1px solid ${themeMode === "dark" ? `${brandColor}30` : `${brandColor}20`}`, backdropFilter: "blur(20px)", boxShadow: `0 8px 40px rgba(0,0,0,0.18)` }}>
              {/* Pitch text */}
              {page.pitch && (
                <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                  {page.pitch}
                </p>
              )}

              {/* Bullets Section Header */}
              <h4 className={`text-xs font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                {page.bulletsTitle || "What they will learn"}
              </h4>

              {/* Bullets List */}
              {page.bullets && page.bullets.length > 0 && (
                <div className="space-y-2">
                  {page.bullets.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <span className={`text-xs ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sign up form component */}
              <div className="pt-2 border-t border-zinc-200/20 dark:border-zinc-800/40">
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
                  isVariantB={isVariantB}
                  afterSignupOption={page.afterSignupOption}
                  destinationUrl={page.destinationUrl}
                />
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template6" || (!page.template && (accountDoc?.templateId as string) === "template6")) ? (
          /* TEMPLATE 6: Full Bleed Image Card */
          <div
            className="w-full mx-auto max-w-6xl rounded-3xl overflow-hidden relative min-h-[560px] flex flex-col justify-between transition-all duration-300 shadow-2xl"
            style={{
              border: `1px solid ${themeMode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              boxShadow: themeMode === "dark"
                ? `0 0 0 1px ${brandColor}22, 0 28px 70px -14px rgba(0,0,0,0.8)`
                : `0 0 0 1px ${brandColor}18, 0 20px 60px -12px ${brandColor}22`,
            }}
          >
            {/* FULL CARD BACKGROUND IMAGE / GRADIENT LAYER */}
            {activeImageUrl && activeImageUrl.trim() !== "" ? (
              <img src={activeImageUrl} alt={page.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${brandColor}cc 0%, #080912 100%)` }}>
                <div className="relative flex flex-col items-center gap-2 opacity-50 text-white">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="2" y="2" width="28" height="28" rx="5" stroke="white" strokeWidth="1.4" strokeDasharray="3 2.5" />
                    <path d="M2 22l7-6 5 4 4-3 10 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="11" r="2.5" stroke="white" strokeWidth="1.4" />
                  </svg>
                  <span className="text-white text-[8px] font-bold uppercase tracking-[0.2em]">Resource Cover</span>
                </div>
              </div>
            )}

            {/* DARK SCRIM OVERLAY */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/75 to-black/45" />

            {/* CARD CONTENT FLOATING OVER IMAGE */}
            <div className="relative z-10 p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-2xl md:text-4xl font-black leading-tight tracking-tight text-white drop-shadow-md">{activeHeadline}</h1>
                {page.subheadline && (
                  <p className="text-sm md:text-base font-medium text-zinc-200 drop-shadow-sm">{page.subheadline}</p>
                )}
                {page.pitch && (
                  <p className="text-xs md:text-sm leading-relaxed text-zinc-300">{page.pitch}</p>
                )}

                {/* Bullets Section */}
                {((page.bullets && page.bullets.length > 0) || page.bulletsTitle) && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor, boxShadow: `0 0 6px ${brandColor}` }} />
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-300">
                        {page.bulletsTitle || "What they will learn"}
                      </span>
                    </div>
                    {page.bullets && page.bullets.length > 0 && (
                      <div className="space-y-2">
                        {page.bullets.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2.5">
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-white/10 border border-white/20">
                              <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <span className="text-xs font-semibold text-zinc-100">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SIGNUP FORM */}
              <div className="pt-4">
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
                  isVariantB={isVariantB}
                  layout="horizontal-glass"
                  afterSignupOption={page.afterSignupOption}
                  destinationUrl={page.destinationUrl}
                />
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template7" || (!page.template && (accountDoc?.templateId as string) === "template7")) ? (
          /* TEMPLATE 7: Spotlight Hero — two-panel layout matching brand & editor */
          <div
            className="rounded-3xl overflow-hidden transition-all duration-300"
            style={{
              padding: "2px",
              background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}55 50%, ${brandColor} 100%)`,
              boxShadow: `0 30px 80px -16px ${brandColor}${Math.round((0.3 + (highlightIntensity / 100) * 0.4) * 255).toString(16).padStart(2, '0')}`,
            }}
          >
            <div
              className="rounded-[22px] overflow-hidden"
              style={{ background: themeMode === "dark" ? "#0b0b10" : "#ffffff", minHeight: "480px" }}
            >
              <div className="flex flex-col md:flex-row" style={{ minHeight: "480px" }}>

                {/* LEFT: Full-bleed image panel */}
                <div className="relative md:w-[55%] h-52 md:h-auto overflow-hidden flex-shrink-0">
                  {activeImageUrl && activeImageUrl.trim() !== "" ? (
                    <img src={activeImageUrl} alt={page.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(155deg, ${brandColor}99 0%, #060610 55%, #12001a 100%)` }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        {[160, 110, 66, 32].map((size, i) => (
                          <div key={i} className="absolute rounded-full border border-white" style={{ width: size, height: size, opacity: 1 - i * 0.2 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Right-edge scrim */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)" }} />
                  {/* Bottom scrim */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />
                  {/* Headline overlay at bottom-left */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
                    <div className="space-y-2 max-w-xs">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.0] tracking-tight drop-shadow-2xl">
                        {activeHeadline}
                      </h1>
                      {page.subheadline && (
                        <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed font-medium drop-shadow-sm">
                          {page.subheadline}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Glassmorphic form panel */}
                <div
                  className="relative md:w-[45%] flex flex-col justify-center p-5 md:p-6 space-y-4"
                  style={{
                    borderLeft: `1px solid ${themeMode === "dark" ? `${brandColor}30` : `${brandColor}20`}`,
                  }}
                >
                  {/* Header */}
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: brandColor }}>
                      {page.bulletsTitle || "Exclusive · Free Access"}
                    </p>
                    {page.formTitle && (
                      <p className={`text-sm font-black leading-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>{page.formTitle}</p>
                    )}
                    {page.formSubtitle && (
                      <p className={`text-[10px] leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{page.formSubtitle}</p>
                    )}
                  </div>

                  {/* Bullet list */}
                  {page.bullets && page.bullets.length > 0 && (
                    <div className="space-y-1.5">
                      {page.bullets.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div
                            className="flex h-3.5 w-3.5 shrink-0 mt-0.5 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${brandColor}22`, border: `1px solid ${brandColor}55` }}
                          >
                            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                              <path d="M1 3l1.5 1.5L5 1.5" stroke={brandColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <span className={`text-[10px] leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}44, transparent)` }} />
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Sign Up Free</span>
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}44, transparent)` }} />
                  </div>

                  {/* Form */}
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle=""
                    formSubtitle=""
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
                    isVariantB={isVariantB}
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
                  />

                  {/* Social proof */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex -space-x-2">
                      {["#e879f9", "#38bdf8", "#4ade80", "#fb923c"].map((color, i) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-[7px] font-black text-white"
                          style={{ backgroundColor: color, borderColor: themeMode === "dark" ? "#0b0b10" : "#ffffff" }}
                        >
                          {["A", "B", "C", "D"][i]}
                        </div>
                      ))}
                    </div>
                    <span className={`text-[9px] font-semibold ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Join 12,000+ creators already inside</span>
                  </div>
                </div>
              </div>
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
                    isVariantB={isVariantB}
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
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
