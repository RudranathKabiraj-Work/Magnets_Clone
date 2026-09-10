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
  await dbConnect();

  const decodedUsername = decodeURIComponent(params.username || "");
  const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

  let accountDoc = await AccountModel.findOne(
    escapedUsername ? { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } } : {}
  );

  let pageDoc = null;
  if (accountDoc && accountDoc.email) {
    pageDoc = await MagnetPageModel.findOne({
      userEmail: accountDoc.email.trim().toLowerCase(),
      $or: [{ id: params.slug }, { slug: params.slug }],
    });
  }

  if (!pageDoc) {
    pageDoc = await MagnetPageModel.findOne({
      $or: [{ id: params.slug }, { slug: params.slug }],
    });
  }

  if (!pageDoc) {
    notFound();
  }

  const cleanUserEmail = pageDoc.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;
  if (!accountDoc && cleanUserEmail) {
    accountDoc = await AccountModel.findOne({ email: cleanUserEmail });
  }

  if (!accountDoc) {
    accountDoc = await AccountModel.findOne({});
  }

  // Find uploaded deliverable resource
  let downloadUrl: string | null = null;
  if (cleanUserEmail) {
    const resourceDoc = await ResourceModel.findOne({ userEmail: cleanUserEmail }).sort({ uploadedAt: -1 });
    if (resourceDoc && resourceDoc.url) {
      downloadUrl = resourceDoc.url;
    }
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
      className="min-h-screen lg:h-screen lg:max-h-screen font-sans transition-colors duration-300 relative flex flex-col justify-between overflow-y-auto lg:overflow-hidden"
      style={{
        colorScheme: themeMode === "dark" ? "dark" : "light",
        backgroundColor: themeMode === "dark" ? "#0E0E10" : "#FAFAFA",
        color: themeMode === "dark" ? "#ffffff" : "#18181b",
        backgroundImage:
          themeMode === "light"
            ? `radial-gradient(circle at 50% 0%, ${brandColor}12 0%, transparent 55%)`
            : `radial-gradient(circle at 50% 0%, ${brandColor}18 0%, transparent 55%)`,
      }}
    >
      {/* Interactive 3D Three.js Floating Magnet Canvas */}
      <ThreeMagnet3DCanvas brandColor={brandColor} />
      {/* Header */}
      <header className="mx-auto flex h-12 w-full max-w-6xl items-center justify-center px-4 shrink-0 relative pt-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg border border-dashed border-[#a1a1aa]/45 flex items-center justify-center bg-transparent overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-sm border border-dashed border-[#a1a1aa]" />
            )}
          </div>
          <span className="text-xs font-bold tracking-wider uppercase">{businessName}</span>
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
