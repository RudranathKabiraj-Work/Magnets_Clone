import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel, ResourceModel } from "@/lib/models";
import ThankYouAnimatedContent from "@/components/thank-you-animated-content";
import ThreeMagnet3DCanvas from "@/components/three-magnet-3d-canvas";

export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: { username: string; slug: string };
  searchParams: { email?: string; name?: string; answer?: string; aiOutput?: string };
}) {
  const decodedUsername = decodeURIComponent(params.username || "");
  let accountDoc: any = null;
  let pageDoc: any = null;
  let downloadUrl: string | null = null;

  try {
    await dbConnect();
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    // Execute Account and MagnetPage lookup in parallel to eliminate sequential database roundtrips
    const [foundAccount, foundPage] = await Promise.all([
      escapedUsername
        ? AccountModel.findOne({ username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } }).lean()
        : null,
      MagnetPageModel.findOne({
        $or: [{ id: params.slug }, { slug: params.slug }],
      }).lean(),
    ]);

    accountDoc = foundAccount;
    pageDoc = foundPage;

    const cleanUserEmail = pageDoc?.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;

    // Parallel fetch fallback account and resource doc if cleanUserEmail exists
    const [fallbackAccount, resourceDoc] = await Promise.all([
      !accountDoc && cleanUserEmail ? AccountModel.findOne({ email: cleanUserEmail }).lean() : null,
      cleanUserEmail ? ResourceModel.findOne({ userEmail: cleanUserEmail }).sort({ uploadedAt: -1 }).lean() : null,
    ]);

    if (!accountDoc) {
      accountDoc = fallbackAccount || (await AccountModel.findOne({}).lean());
    }

    if (resourceDoc && resourceDoc.url) {
      downloadUrl = resourceDoc.url;
    }
  } catch (err) {
    console.warn("MongoDB connection fallback in ThankYouPage:", err);
  }

  if (!pageDoc) {
    pageDoc = {
      id: params.slug,
      name: "Resource Guide",
      slug: params.slug,
      deliverable: "Instant Access File",
    };
  }

  const themeMode = (accountDoc?.themeMode as "light" | "dark") || "light";
  const brandColor = accountDoc?.brandColor || "#0066B2";
  const logo = accountDoc?.logo || null;
  const businessName = accountDoc?.name || "LeadMagnets";

  const subscriberEmail = searchParams.email ? decodeURIComponent(searchParams.email) : "";
  const subscriberName = searchParams.name ? decodeURIComponent(searchParams.name) : "";
  const customAnswer = searchParams.answer ? decodeURIComponent(searchParams.answer) : "";
  const aiPersonalizedOutput = searchParams.aiOutput ? decodeURIComponent(searchParams.aiOutput) : "";

  return (
    <main
      className={`min-h-screen lg:h-screen lg:max-h-screen font-sans transition-colors duration-300 relative flex flex-col justify-between overflow-y-auto lg:overflow-hidden ${themeMode === "dark" ? "bg-[#0E0E10] text-white" : "bg-[#FAFAFA] text-[#18181b]"
        }`}
      style={{
        colorScheme: themeMode === "dark" ? "dark" : "light",
        backgroundImage:
          themeMode === "light"
            ? `radial-gradient(circle at 50% 0%, ${brandColor}12 0%, transparent 55%)`
            : `radial-gradient(circle at 50% 0%, ${brandColor}18 0%, transparent 55%)`,
      }}
    >
      {/* Header */}
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-center px-4 shrink-0 relative z-20 pt-2">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center bg-transparent overflow-hidden ${logo ? "border-none" : "border border-dashed border-[#a1a1aa]/45"}`}>
            {logo ? (
              <img src={logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-sm border border-dashed border-[#a1a1aa]" />
            )}
          </div>
          <span className={`text-xs sm:text-sm font-extrabold tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>{businessName}</span>
        </div>
      </header>

      {/* Main Animated Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-2">
        <ThankYouAnimatedContent
          subscriberName={subscriberName}
          subscriberEmail={subscriberEmail}
          deliverableName={pageDoc.deliverable || pageDoc.name || "Resource Access"}
          downloadUrl={downloadUrl}
          customAnswer={customAnswer}
          aiPersonalizedOutput={aiPersonalizedOutput}
          brandColor={brandColor}
          themeMode={themeMode}
          logoUrl={logo}
          businessName={businessName}
          pageName={pageDoc.name}
          magnetSlug={pageDoc.slug || pageDoc.id}
          username={decodedUsername || "u"}
          calendarUrl={accountDoc?.calendarToken || null}
        />
      </div>

      {/* Footer */}
      <footer className="mx-auto pb-3 text-center text-[10px] text-[#5c5650] shrink-0">
        <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-[#FE6F34]">
          Powered by LeadMagnets
        </a>
      </footer>
    </main>
  );
}
