"use client";

/**
 * LockedPdfSetup — standalone component rendered inside the lead magnet editor
 * when template === "locked-pdf".
 *
 * SAFETY: This component is self-contained. It does NOT modify any existing
 * editor tabs or existing lead magnet functionality. It uses the same
 * Cloudinary upload endpoint (/api/upload) that the rest of the app uses.
 *
 * PDF → Images strategy:
 *   1. User selects a PDF file.
 *   2. We use pdfjs-dist (npm, no CDN) to convert each page to a JPEG blob.
 *   3. Each JPEG blob is uploaded to Cloudinary via the existing /api/upload route.
 *   4. The array of Cloudinary URLs is saved to the MagnetPage via onSave().
 *
 * This avoids any server-side binary dependencies (Ghostscript, sharp etc.)
 * and works on Vercel's free tier with zero additional configuration.
 */

import { useRef, useState, useEffect } from "react";
import { Upload, Lock, Eye, Loader2, CheckCircle2, Trash2, HardDrive, FileText, Copy, ExternalLink } from "lucide-react";

interface Props {
  magnetId: string;
  userEmail: string;
  pdfPages: string[];
  pdfFreePages: number;
  pdfTitle: string;
  pageName?: string;
  pageSlug?: string;
  onSave: (updates: {
    pdfPages: string[];
    pdfFreePages: number;
    pdfTitle: string;
    pdfPageCount: number;
    name?: string;
    slug?: string;
  }) => Promise<void>;
  appUrl: string;
  hostedResources?: any[];
  onOpenAssetPicker?: () => void;
  selectedHostedPdf?: { url: string; name: string; timestamp?: number } | null;
}

// ─── PDF.js helpers (npm, worker served from /public/pdf.worker.min.mjs) ────
async function loadPdfJs(): Promise<any> {
  // Dynamic import so Next.js code-splits this large module.
  const pdfjs = await import(/* webpackChunkName: "pdfjs-dist" */ "pdfjs-dist");
  if (typeof window !== "undefined") {
    // Use same-origin local worker file from public/ to avoid browser CORS/cross-origin worker blocking
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "/pdf.worker.min.mjs",
      window.location.origin
    ).toString();
  }
  return pdfjs;
}

async function pdfPageToJpegBlob(
  pdfjs: any,
  pdfDoc: any,
  pageNum: number,
  scale = 1.5
): Promise<Blob> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Immediate GPU bitmap buffer deallocation to prevent memory accumulation on multi-page PDFs
        canvas.width = 0;
        canvas.height = 0;
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed for page " + pageNum));
      },
      "image/jpeg",
      0.88
    );
  });
}

async function uploadBlob(
  blob: Blob,
  filename: string,
  userEmail: string
): Promise<string> {
  const form = new FormData();
  const file = new File([blob], filename, { type: "image/jpeg" });
  form.append("file", file);
  form.append("userEmail", userEmail);
  form.append("isPageAsset", "true");

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  if (!data?.data?.fileUrl) throw new Error("No fileUrl in upload response");
  return data.data.fileUrl as string;
}

// Cloudinary blur helper — no extra storage needed
function getBlurPreviewUrl(url: string): string {
  if (!url) return url;
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/e_blur:900,q_30/");
  }
  return url;
}

export default function LockedPdfSetup({
  magnetId,
  userEmail,
  pdfPages: initialPages,
  pdfFreePages: initialFreePages,
  pdfTitle: initialTitle,
  pageName = "",
  pageSlug = "",
  onSave,
  appUrl,
  hostedResources = [],
  onOpenAssetPicker,
  selectedHostedPdf,
}: Props) {
  const [pages, setPages] = useState<string[]>(initialPages || []);
  const [freePages, setFreePages] = useState<number>(
    Math.min(initialFreePages ?? 2, Math.max(0, (initialPages || []).length - 1))
  );
  const [pdfTitle, setPdfTitle] = useState(initialTitle || pageName || "");
  const [name, setName] = useState(pageName || initialTitle || "");
  const [slug, setSlug] = useState(pageSlug || "");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const viewerUrl = `${appUrl}/pdf-viewer/${magnetId}`;

  useEffect(() => {
    if (pageName) setName(pageName);
  }, [pageName]);

  useEffect(() => {
    if (pageSlug) setSlug(pageSlug);
  }, [pageSlug]);

  useEffect(() => {
    if (initialTitle) setPdfTitle(initialTitle);
  }, [initialTitle]);

  // Automatically process selected hosted PDF asset from modal
  useEffect(() => {
    if (selectedHostedPdf?.url) {
      processPdfFromUrl(selectedHostedPdf.url, selectedHostedPdf.name);
    }
  }, [selectedHostedPdf?.url, selectedHostedPdf?.timestamp]);

  async function processPdfFromUrl(url: string, title?: string) {
    setError(null);
    setProcessing(true);
    setProgress({ done: 0, total: 0 });
    const finalTitle = title || pdfTitle || "Locked PDF Document";
    setPdfTitle(finalTitle);

    try {
      const pdfjs = await loadPdfJs();

      // Resolve the best direct fileUrl first.
      // Prefer fileUrl (Cloudinary direct) over tracking redirect url (/r/[id]).
      let targetUrl = url;
      const matchedResource = hostedResources?.find(
        (r: any) =>
          r.url === url ||
          r.fileUrl === url ||
          r.id === url ||
          (url.includes("/r/") && r.url?.includes(url.split("/r/")[1]))
      );
      if (matchedResource?.fileUrl) {
        targetUrl = matchedResource.fileUrl;
      }

      // Always fetch through the server-side proxy so that:
      //  • Auth cookies are attached by the server (fixes 401 on /r/ tracking routes)
      //  • CORS restrictions on Cloudinary raw/ resources are bypassed
      //  • The browser never needs direct network access to the storage origin
      const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);

      if (!res.ok) {
        let detail = "";
        try { detail = (await res.json()).error || ""; } catch {}
        throw new Error(`Failed to fetch PDF asset (${res.status})${detail ? ": " + detail : ""}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("Target resource returned an HTML page instead of a valid PDF document.");
      }

      const arrayBuffer = await res.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;
      setProgress({ done: 0, total: totalPages });

      const uploadedUrls: string[] = [];
      const BATCH = 4;

      for (let start = 1; start <= totalPages; start += BATCH) {
        const end = Math.min(start + BATCH - 1, totalPages);
        const batch = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        const batchResults = await Promise.all(
          batch.map(async (pageNum) => {
            const blob = await pdfPageToJpegBlob(pdfjs, pdfDoc, pageNum);
            const filename = `pdf-${magnetId}-page${String(pageNum).padStart(3, "0")}.jpg`;
            const pageUrl = await uploadBlob(blob, filename, userEmail);
            setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
            return pageUrl;
          })
        );
        uploadedUrls.push(...batchResults);
      }

      const computedFree = Math.min(initialFreePages ?? 2, Math.max(0, uploadedUrls.length - 1));
      setPages(uploadedUrls);
      setFreePages(computedFree);

      // Auto-save immediately to populate parent page state & card controls
      await onSave({
        pdfPages: uploadedUrls,
        pdfFreePages: computedFree,
        pdfTitle: finalTitle,
        pdfPageCount: uploadedUrls.length,
      });
      setSaved(true);
    } catch (err: any) {
      console.error("[LockedPdfSetup] Processing hosted PDF error:", err);
      setError(err.message || "Failed to process hosted PDF asset. Please try again.");
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  }

  // ── Handle PDF file selection ───────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Always reset input so same file can be re-selected
    if (e.target) (e.target as HTMLInputElement).value = "";

    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }
    const MAX = 30 * 1024 * 1024; // 30 MB
    if (file.size > MAX) {
      setError("PDF must be under 30 MB.");
      return;
    }

    setError(null);
    setProcessing(true);
    setProgress({ done: 0, total: 0 });

    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;
      setProgress({ done: 0, total: totalPages });

      const uploadedUrls: string[] = [];
      const BATCH = 4; // Process 4 pages in parallel to not block the main thread

      for (let start = 1; start <= totalPages; start += BATCH) {
        const end = Math.min(start + BATCH - 1, totalPages);
        const batch = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        const batchResults = await Promise.all(
          batch.map(async (pageNum) => {
            const blob = await pdfPageToJpegBlob(pdfjs, pdfDoc, pageNum);
            const filename = `pdf-${magnetId}-page${String(pageNum).padStart(3, "0")}.jpg`;
            const url = await uploadBlob(blob, filename, userEmail);
            setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
            return url;
          })
        );
        uploadedUrls.push(...batchResults);
      }

      const computedFree = Math.min(freePages, Math.max(0, uploadedUrls.length - 1));
      setPages(uploadedUrls);
      setFreePages(computedFree);

      // Auto-save immediately to populate parent page state & card controls
      await onSave({
        pdfPages: uploadedUrls,
        pdfFreePages: computedFree,
        pdfTitle: pdfTitle || "Locked PDF Document",
        pdfPageCount: uploadedUrls.length,
      });
      setSaved(true);
    } catch (err: any) {
      console.error("[LockedPdfSetup] Processing error:", err);
      setError(err.message || "Failed to process PDF. Please try again.");
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  }

  // ── Save settings ───────────────────────────────────────────────────────
  async function handleSave() {
    if (pages.length === 0) {
      setError("Please upload a PDF first.");
      return;
    }
    // Clamp freePages to safe range before saving
    const safeFreePages = Math.min(freePages, Math.max(0, pages.length - 1));
    setSaving(true);
    setSaved(false);
    try {
      // Clear any leftover server httpOnly & localStorage unlock tokens
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(`pdf_unlock_token_${magnetId}`);
          await fetch("/api/pdf-gate/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ magnetId }),
          }).catch(() => {});
        } catch (e) {}
      }
      await onSave({
        pdfPages: pages,
        pdfFreePages: safeFreePages,
        pdfTitle: pdfTitle.trim() || name.trim(),
        name: name.trim() || pdfTitle.trim(),
        slug: slug.trim(),
        pdfPageCount: pages.length,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Remove PDF & persist to DB ──────────────────────────────────────────
  async function handleRemove() {
    if (!confirm("Remove this PDF and all uploaded pages?")) return;
    setSaving(true);
    setSaved(false);
    try {
      setPages([]);
      setFreePages(0);
      setPdfTitle("");
      await onSave({
        pdfPages: [],
        pdfFreePages: 0,
        pdfTitle: "",
        name: name.trim(),
        slug: slug.trim(),
        pdfPageCount: 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to remove PDF. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isDark = typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141417] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20">
          <Lock className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
              Locked PDF Setup
            </h3>
            {slug && (
              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                /{slug}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            First {freePages} page{freePages !== 1 ? "s" : ""} are free, rest unlock after email verification.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFile}
          disabled={processing}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className={[
            "w-full rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
            "hover:border-zinc-400 dark:hover:border-zinc-600",
            pages.length > 0
              ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50",
            processing ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        >
          {processing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {progress
                  ? `Processing page ${progress.done} of ${progress.total}…`
                  : "Loading PDF renderer…"}
              </p>
              {progress && progress.total > 0 && (
                <div className="w-full max-w-xs bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#0066B2] transition-all duration-300"
                    style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ) : pages.length > 0 ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {pages.length} page{pages.length !== 1 ? "s" : ""} uploaded
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click to replace with a new PDF
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Click to upload PDF from device
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Max 30 MB · Each page is converted to an image automatically
              </p>
              {onOpenAssetPicker && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAssetPicker();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#0066B2]/40 bg-[#EFF6FF] dark:bg-[#0066B2]/20 px-3 py-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:bg-[#0066B2]/10 transition"
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>Or choose from Assets Page</span>
                </button>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium">
          ⚠️ {error}
        </p>
      )}

      {/* Settings — only shown once PDF is uploaded */}
      {pages.length > 0 && (
        <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          {/* Document Name and URL Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Document name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setPdfTitle(e.target.value);
                }}
                placeholder="e.g. 2026 Growth Playbook"
                maxLength={100}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#0066B2] dark:focus:border-[#38BDF8] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                URL slug
              </label>
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus-within:border-[#0066B2] dark:focus-within:border-[#38BDF8] transition">
                <span className="text-zinc-400 dark:text-zinc-500 mr-1 font-mono text-xs">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  placeholder="growth-playbook"
                  className="w-full bg-transparent font-mono text-xs text-zinc-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Free pages slider */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Free preview pages:{" "}
              <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold">{freePages}</span>
              {" "}of {pages.length}
            </label>
            <input
              type="range"
              min={0}
              max={Math.max(0, pages.length - 1)}
              value={Math.min(freePages, Math.max(0, pages.length - 1))}
              onChange={(e) => setFreePages(Number(e.target.value))}
              className="w-full accent-[#0066B2]"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
              <span>0 (fully gated)</span>
              <span>{pages.length - 1} (last page locked)</span>
            </div>
          </div>

          {/* Page grid preview */}
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Preview
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {pages.slice(0, 12).map((url, i) => {
                const isLocked = i >= freePages;
                return (
                  <div
                    key={i}
                    className="relative aspect-[612/792] rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 animate-pulse"
                    title={`Page ${i + 1} — ${isLocked ? "locked" : "free preview"}`}
                  >
                    <img
                      src={isLocked ? getBlurPreviewUrl(url) : url}
                      alt={`Page ${i + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                      onLoad={(e) => {
                        e.currentTarget.classList.remove("opacity-0");
                        e.currentTarget.parentElement?.classList.remove("animate-pulse");
                      }}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute bottom-0.5 inset-x-0 flex items-center justify-center">
                      {isLocked ? (
                        <Lock className="h-2.5 w-2.5 text-white drop-shadow" />
                      ) : (
                        <Eye className="h-2.5 w-2.5 text-white drop-shadow" />
                      )}
                    </div>
                  </div>
                );
              })}
              {pages.length > 12 && (
                <div className="aspect-[612/792] rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[11px] text-zinc-500">
                  +{pages.length - 12}
                </div>
              )}
            </div>
          </div>

          {/* Viewer URL */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Public Viewer URL
                </span>
              </div>
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                OTP Protected
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-amber-600 dark:text-amber-400 overflow-hidden shadow-xs">
                <span className="truncate select-all flex-1">{viewerUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewerUrl);
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-amber-500 transition-colors shrink-0 cursor-pointer"
                  title="Copy Viewer URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <a
                href={`${viewerUrl}?reset=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <span>Open Viewer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Save + Remove */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || pages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] text-white text-xs font-bold px-5 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
          ) : (
            "Save PDF settings"
          )}
        </button>
        {pages.length > 0 && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 transition disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {saving ? "Removing…" : "Remove PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
