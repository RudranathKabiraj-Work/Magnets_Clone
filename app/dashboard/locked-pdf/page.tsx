"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import LockedPdfSetup from "@/components/leadmagnets/locked-pdf-setup";
import {
  FileLock,
  Plus,
  Eye,
  Settings,
  Link2,
  Check,
  BarChart3,
  Lock,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  ChevronDown,
  Trash2
} from "lucide-react";
import {
  loadPages,
  savePages,
  deletePage,
  syncWithDatabase,
  loadAccount,
} from "@/lib/store";
import type { Account, MagnetPage } from "@/lib/data";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function LockedPdfPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    if (localPages.length > 0) {
      setPages(localPages);
      const lockedPages = localPages.filter(
        (p) => p.template === "locked-pdf" || p.pdfFreePages !== undefined || (p.pdfPages && p.pdfPages.length > 0)
      );
      if (lockedPages.length > 0) {
        setSelectedPageId(lockedPages[0].id);
      } else if (localPages[0]) {
        setSelectedPageId(localPages[0].id);
      }
    }
    setLoading(false);

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        if (data.pages && data.pages.length > 0) {
          setPages(data.pages);
          const lockedPages = data.pages.filter(
            (p) => p.template === "locked-pdf" || p.pdfFreePages !== undefined || (p.pdfPages && p.pdfPages.length > 0)
          );
          if (lockedPages.length > 0) {
            setSelectedPageId((prev) => prev || lockedPages[0].id);
          } else if (data.pages[0]) {
            setSelectedPageId((prev) => prev || data.pages[0].id);
          }
        }
      }
    });
  }, []);

  // Filter for pages that are Locked PDFs
  const lockedPdfPages = useMemo(() => {
    return pages.filter((p) => {
      const isLockedTemplate = p.template === "locked-pdf";
      const hasPdfGate = p.pdfFreePages !== undefined || (p.pdfPages && p.pdfPages.length > 0);
      return isLockedTemplate || hasPdfGate;
    });
  }, [pages]);

  // Active selected locked PDF page object
  const activePage = useMemo(() => {
    if (selectedPageId) {
      const found = pages.find((p) => p.id === selectedPageId);
      if (found) return found;
    }
    return lockedPdfPages[0] || pages[0] || null;
  }, [selectedPageId, pages, lockedPdfPages]);

  // Create a new Locked PDF document
  const createNewLockedPdfDocument = () => {
    const newId = Date.now().toString();
    const docCount = lockedPdfPages.length + 1;
    const name = `Locked PDF Document ${String(docCount).padStart(2, "0")}`;
    const slug = `locked-pdf-${docCount}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newMagnet: MagnetPage = {
      id: newId,
      name,
      slug,
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: name,
      subheadline: "Enter your email to verify and unlock full PDF access instantly.",
      cta: "Verify & Unlock PDF",
      deliverable: "Locked PDF Document",
      updatedAt: new Date().toISOString().split("T")[0],
      publishedAt: null,
      template: "locked-pdf",
      accent: "#0066B2",
      pdfPages: [],
      pdfFreePages: 2,
      pdfTitle: name,
      pdfPageCount: 0,
    };

    const updated = [newMagnet, ...pages];
    setPages(updated);
    savePages(updated);
    setSelectedPageId(newId);
    setShowDocumentDropdown(false);
    addToast(`Created "${name}". Ready for PDF upload!`);
  };

  const handleCopyLink = () => {
    if (!activePage) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const pdfUrl = `${origin}/pdf-viewer/${activePage.id}`;
    navigator.clipboard.writeText(pdfUrl);
    setCopiedLink(true);
    addToast("Viewer URL copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDeleteActiveDocument = () => {
    if (!activePage) return;
    setIsDeleting(true);
    try {
      deletePage(activePage.id);
      const remaining = pages.filter((p) => p.id !== activePage.id);
      setPages(remaining);
      savePages(remaining);

      const remainingLocked = remaining.filter(
        (p) => p.template === "locked-pdf" || p.pdfFreePages !== undefined
      );
      if (remainingLocked.length > 0) {
        setSelectedPageId(remainingLocked[0].id);
      } else if (remaining[0]) {
        setSelectedPageId(remaining[0].id);
      } else {
        setSelectedPageId(null);
      }

      addToast(`Deleted "${activePage.name}".`);
      setShowDeleteModal(false);
    } catch (e) {
      addToast("Failed to delete document.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in");

  return (
    <DashboardShell account={account} title="Locked PDF">
      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
                toast.type === "error"
                  ? "bg-rose-900/90 text-rose-100 border-rose-700/50"
                  : "bg-zinc-900/95 text-white border-zinc-700/60 dark:bg-zinc-800/95"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <FileLock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Locked PDF
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Upload your document, set free preview pages, and collect email signups with OTP verification.
              </p>
            </div>
          </div>

          {/* Top Document Actions & Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selector Dropdown if documents exist */}
            {lockedPdfPages.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDocumentDropdown(!showDocumentDropdown)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                >
                  <FileLock className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                  <span className="max-w-[160px] truncate">{activePage?.name || "Select Document"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </button>

                <AnimatePresence>
                  {showDocumentDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl z-30 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Locked PDF Documents ({lockedPdfPages.length})
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {lockedPdfPages.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              setSelectedPageId(doc.id);
                              setShowDocumentDropdown(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer ${
                              activePage?.id === doc.id
                                ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#0066B2]/20 dark:text-[#38BDF8]"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span className="truncate">{doc.name}</span>
                            {activePage?.id === doc.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                          </button>
                        ))}
                      </div>

                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                      <button
                        onClick={createNewLockedPdfDocument}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-[#0066B2] hover:bg-[#0066B2]/10 transition dark:text-[#38BDF8] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create New Locked PDF</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Create New Document Button */}
            <button
              onClick={createNewLockedPdfDocument}
              className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#005291] transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Document</span>
            </button>

            {/* Quick Action Links if active document exists */}
            {activePage && (
              <>
                <a
                  href={`/pdf-viewer/${activePage.id}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Preview PDF Viewer"
                  className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:border-[#0066B2] hover:text-[#0066B2] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  title="Copy Viewer URL"
                  className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:border-[#0066B2] hover:text-[#0066B2] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy Link"}</span>
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete document"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area: Interactive Locked PDF Setup Component */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Loader2 className="h-6 w-6 animate-spin text-[#0066B2]" />
          </div>
        ) : activePage ? (
          <div className="space-y-4">
            <LockedPdfSetup
              key={activePage.id}
              magnetId={activePage.id}
              userEmail={account?.email || ""}
              pdfPages={activePage.pdfPages || []}
              pdfFreePages={activePage.pdfFreePages !== undefined ? activePage.pdfFreePages : 2}
              pdfTitle={activePage.pdfTitle || activePage.name}
              appUrl={appUrl}
              onSave={async (updates) => {
                const updatedPages = pages.map((p) => {
                  if (p.id === activePage.id) {
                    return {
                      ...p,
                      name: updates.pdfTitle.trim() || p.name,
                      pdfPages: updates.pdfPages,
                      pdfFreePages: updates.pdfFreePages,
                      pdfTitle: updates.pdfTitle.trim() || p.name,
                      pdfPageCount: updates.pdfPageCount,
                      template: "locked-pdf" as const,
                      updatedAt: new Date().toISOString().split("T")[0],
                    };
                  }
                  return p;
                });
                setPages(updatedPages);
                savePages(updatedPages);
                addToast("Locked PDF settings saved successfully!");
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <FileLock className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
              No Locked PDF Setup yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Create a Locked PDF document to upload your PDF file, set free preview pages, and collect email verification signups.
            </p>
            <button
              onClick={createNewLockedPdfDocument}
              className="mt-5 flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#005291] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Locked PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && activePage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Document?</h3>
              </div>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-white">&quot;{activePage.name}&quot;</span>? This will permanently remove its PDF pages and viewer link.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteActiveDocument}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
