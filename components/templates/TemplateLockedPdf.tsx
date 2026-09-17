import React from "react";
import LockedPdfSetup from "@/components/leadmagnets/locked-pdf-setup";
import { type TemplateProps } from "./types";

export default function TemplateLockedPdf(props: TemplateProps) {
  const {
    page,
    account,
    lockedPdfPages = [],
    lockedPdfFreePages = 2,
    lockedPdfTitle = "",
    setLockedPdfPages,
    setLockedPdfFreePages,
    setLockedPdfTitle,
  } = props as any;

  const handleSavePdfSetup = async (updates: {
    pdfPages: string[];
    pdfFreePages: number;
    pdfTitle: string;
    pdfPageCount: number;
  }) => {
    if (setLockedPdfPages) setLockedPdfPages(updates.pdfPages);
    if (setLockedPdfFreePages) setLockedPdfFreePages(updates.pdfFreePages);
    if (setLockedPdfTitle) setLockedPdfTitle(updates.pdfTitle);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <LockedPdfSetup
        magnetId={page?.id || "pdf-magnet"}
        userEmail={account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") || "" : "")}
        pdfPages={lockedPdfPages}
        pdfFreePages={lockedPdfFreePages}
        pdfTitle={lockedPdfTitle}
        onSave={handleSavePdfSetup}
        appUrl={typeof window !== "undefined" ? window.location.origin : ""}
      />
    </div>
  );
}
