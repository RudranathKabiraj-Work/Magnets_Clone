import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
import { type MagnetPage } from "@/lib/data";
import PdfViewerClient from "./pdf-viewer-client";

export const dynamic = "force-dynamic";

interface Props {
  params: { magnetId: string };
}

export default async function PdfViewerPage({ params }: Props) {
  const magnetId = params.magnetId;

  let pageDoc: any = null;
  let accountDoc: any = null;

  try {
    await dbConnect();

    // Try lookup by custom `id` field first, then by MongoDB _id
    pageDoc = await MagnetPageModel.findOne({ id: magnetId }).lean();

    if (!pageDoc) {
      // Fallback: try by MongoDB _id in case the id field differs
      pageDoc = await MagnetPageModel.findOne({ _id: magnetId }).lean();
    }

    if (pageDoc?.userEmail) {
      accountDoc = await AccountModel.findOne({
        email: pageDoc.userEmail.trim().toLowerCase(),
      }).lean();
    }
  } catch (err) {
    console.warn("[pdf-viewer] DB error:", err);
  }

  // If the magnet doesn't exist at all → 404
  if (!pageDoc) {
    return notFound();
  }

  // If template is not "locked-pdf" → this route shouldn't serve it.
  // Instead of notFound(), show a helpful message so we can debug.
  if ((pageDoc.template as string) !== "locked-pdf") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
          This page is not configured as a Locked PDF
        </h1>
        <p style={{ color: "#71717a", fontSize: "0.85rem", maxWidth: 420, margin: 0 }}>
          Magnet ID: <code style={{ color: "#38bdf8" }}>{magnetId}</code>
          <br />
          Stored template: <code style={{ color: "#f97316" }}>{pageDoc.template || "(none)"}</code>
          <br /><br />
          Go to your dashboard, open this magnet&apos;s editor, and make sure you
          uploaded the PDF and clicked <strong>&quot;Save PDF settings&quot;</strong>.
        </p>
      </div>
    );
  }

  const page = pageDoc as MagnetPage;
  const businessName = accountDoc?.name || "LeadMagnets";
  const brandColor = accountDoc?.brandColor || "#0066B2";

  const pdfPages: string[] = Array.isArray(page.pdfPages) ? page.pdfPages : [];
  const pdfFreePages: number =
    typeof page.pdfFreePages === "number"
      ? page.pdfFreePages
      : typeof page.pdfFreePages === "string" && !isNaN(parseInt(page.pdfFreePages, 10))
      ? parseInt(page.pdfFreePages, 10)
      : 2;
  const pdfTitle = page.pdfTitle || page.name || "Document";
  const customFormFields = Array.isArray(page.customFormFields) ? page.customFormFields : [];

  // PDF pages not uploaded yet — show a setup pending screen
  if (pdfPages.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>📄</div>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
          PDF not uploaded yet
        </h1>
        <p style={{ color: "#71717a", fontSize: "0.85rem", maxWidth: 420, margin: 0 }}>
          Go to your dashboard → edit this lead magnet → Landing page tab →
          upload your PDF and click <strong>&quot;Save PDF settings&quot;</strong>.
        </p>
      </div>
    );
  }

  return (
    <PdfViewerClient
      magnetId={magnetId}
      pdfTitle={pdfTitle}
      pdfPages={pdfPages}
      pdfFreePages={pdfFreePages}
      businessName={businessName}
      brandColor={brandColor}
      customFormFields={customFormFields}
    />
  );
}
