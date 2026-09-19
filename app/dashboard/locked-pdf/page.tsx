"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import dynamic from "next/dynamic";
import {
  FileLock,
  Plus,
  Eye,
  Check,
  Lock,
  Mail,
  Clock,
  Home,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  loadPages,
  savePages,
  deletePage,
  syncWithDatabase,
  loadAccount,
  loadResources,
} from "@/lib/store";
import type { Account, MagnetPage } from "@/lib/data";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table as TableExtension } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextAlign } from "@tiptap/extension-text-align";
import type { SequenceEmailItem } from "@/components/leadmagnets/edit/SequenceTab";

const LockedPdfSetup = dynamic(() => import("@/components/leadmagnets/locked-pdf-setup"));
const DeliveryEmailTab = dynamic(() => import("@/components/leadmagnets/edit/DeliveryEmailTab"));
const SequenceTab = dynamic(() => import("@/components/leadmagnets/edit/SequenceTab"));
const AfterSignupTab = dynamic(() => import("@/components/leadmagnets/edit/AfterSignupTab"));
const EmailPreviewModal = dynamic(() => import("@/components/leadmagnets/edit/EmailPreviewModal"));
const SequencePreviewModal = dynamic(() => import("@/components/leadmagnets/edit/SequencePreviewModal"));

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

  // Active Tab navigation state ("locked" | "email" | "sequence" | "after")
  const [activeTab, setActiveTab] = useState<"locked" | "email" | "sequence" | "after">("locked");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Toasts & Modal States
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delivery Email tab state
  const [emailSubject, setEmailSubject] = useState("Your PDF resource is inside!");
  const [emailPreviewText, setEmailPreviewText] = useState("Here is your link to view the document.");
  const [emailBody, setEmailBody] = useState("<p>Hi there,</p><p>Thanks for requesting access! Click below to view the document.</p>");
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [showInsertResourceMenu, setShowInsertResourceMenu] = useState(false);
  const [hostedResources, setHostedResources] = useState<any[]>([]);
  const [enableAiPersonalizedDeliverable, setEnableAiPersonalizedDeliverable] = useState(false);
  const [customPromptQuestion, setCustomPromptQuestion] = useState("");
  const [customPromptPlaceholder, setCustomPromptPlaceholder] = useState("");

  // Sequence tab state
  const [sequenceEnabled, setSequenceEnabled] = useState(false);
  const [stopOnCall, setStopOnCall] = useState(false);
  const [sequenceEmails, setSequenceEmails] = useState<SequenceEmailItem[]>([
    {
      id: "seq-1",
      subject: "Did you have a chance to read the document?",
      delayDays: 1,
      delayUnit: "hours",
      previewText: "Quick check-in regarding your access",
      body: "Hi there,\n\nJust wanted to follow up and see if you had any questions after reading through the PDF!\n\nBest,",
    },
  ]);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0);
  const [showSequencePreviewModal, setShowSequencePreviewModal] = useState(false);
  const [previewSequenceIndex, setPreviewSequenceIndex] = useState(0);

  // After Signup tab state
  const [afterSignupOption, setAfterSignupOption] = useState<"standard" | "elsewhere" | "custom">("standard");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customHeading, setCustomHeading] = useState("Access Granted!");
  const [customMessage, setCustomMessage] = useState("Thank you for verifying your email. You can now read the full PDF document.");
  const [videoUrl, setVideoUrl] = useState("");
  const [buttonLabel, setButtonLabel] = useState("View Full PDF");
  const [buttonUrl, setButtonUrl] = useState("");
  const [quizFunnelEnabled, setQuizFunnelEnabled] = useState(false);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Tiptap Editor for Delivery Email Tab
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: emailBody,
    onUpdate: ({ editor }) => {
      setEmailBody(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && emailBody && editor.getHTML() !== emailBody) {
      editor.commands.setContent(emailBody);
    }
  }, [emailBody, editor]);

  // Initial Load & Store Sync
  useEffect(() => {
    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    const localResources = loadResources();
    if (localResources) setHostedResources(localResources);

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

  // Populate activePage states when activePage changes
  useEffect(() => {
    if (!activePage) return;
    if (activePage.deliveryEmail) {
      setEmailSubject(activePage.deliveryEmail.subject || "Your PDF resource is inside!");
      setEmailPreviewText(activePage.deliveryEmail.previewText || "Here is your link to view the document.");
      if (activePage.deliveryEmail.body) setEmailBody(activePage.deliveryEmail.body);
    }
    if (activePage.sequenceEnabled !== undefined) {
      setSequenceEnabled(activePage.sequenceEnabled);
    }
    if (activePage.sequenceEmails && Array.isArray(activePage.sequenceEmails)) {
      setSequenceEmails(activePage.sequenceEmails);
    }
  }, [activePage?.id]);

  const handleToggleSequenceEnabled = (enabled: boolean) => {
    setSequenceEnabled(enabled);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, sequenceEnabled: enabled } : p
      );
      setPages(updated);
      savePages(updated);
    }
  };

  const handleUpdateSequenceEmails: React.Dispatch<React.SetStateAction<SequenceEmailItem[]>> = (value) => {
    setSequenceEmails((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (activePage) {
        const updated = pages.map((p) =>
          p.id === activePage.id ? { ...p, sequenceEmails: next } : p
        );
        setPages(updated);
        savePages(updated);
      }
      return next;
    });
  };

  const addSequenceEmail = () => {
    const nextNum = sequenceEmails.length + 1;
    const newId = Date.now().toString();
    const newItem: SequenceEmailItem = {
      id: newId,
      subject: `Follow-up ${nextNum}: Check out this document`,
      delayDays: 1,
      delayUnit: "hours",
      previewText: "Quick follow-up regarding your access",
      body: `Hi there,\n\nFollowing up to see if you had any questions regarding the document!\n\nBest,\n${account?.name || "The Team"}`,
    };
    const updated = [...sequenceEmails, newItem];
    setSequenceEmails(updated);
    setSelectedSequenceIndex(updated.length - 1);
    setSequenceEnabled(true);

    if (activePage) {
      const nextPages = pages.map((p) =>
        p.id === activePage.id ? { ...p, sequenceEnabled: true, sequenceEmails: updated } : p
      );
      setPages(nextPages);
      savePages(nextPages);
    }
  };

  const removeSequenceEmail = (id: string) => {
    const updated = sequenceEmails.filter((item) => item.id !== id);
    setSequenceEmails(updated);
    const nextEnabled = updated.length > 0 ? sequenceEnabled : false;
    if (updated.length === 0) {
      setSequenceEnabled(false);
      setSelectedSequenceIndex(0);
    } else if (selectedSequenceIndex >= updated.length) {
      setSelectedSequenceIndex(updated.length - 1);
    }

    if (activePage) {
      const nextPages = pages.map((p) =>
        p.id === activePage.id ? { ...p, sequenceEnabled: nextEnabled, sequenceEmails: updated } : p
      );
      setPages(nextPages);
      savePages(nextPages);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Locked PDF
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Upload your document, set free preview pages, configure delivery emails and lead nurture sequences.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Tabs Bar — Workflow Navigation */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 rounded-2xl border p-2.5 sm:p-3 gap-2.5 sm:gap-4 w-full transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E11]" : "border-zinc-200 bg-zinc-100/80"}`}
          onMouseLeave={() => setHoveredTab(null)}
        >
          {[
            { id: "locked", label: "Locked PDF", desc: "Design the PDF", icon: Lock },
            { id: "email", label: "Delivery email", desc: "Send the resource", icon: Mail },
            { id: "sequence", label: "Sequence", desc: "Nurture leads", icon: Clock },
            { id: "after", label: "After signup", desc: "Choose the next step", icon: Home },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;
            const isDark = (account?.themeMode || "light") === "dark";

            return (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-colors w-full cursor-pointer border ${
                  isActive
                    ? isDark
                      ? "border-[#27272A] text-white shadow-sm"
                      : "border-zinc-200 text-zinc-900 shadow-sm"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {/* Active Tab Solid Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeLockedPdfTabPill"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className={`absolute inset-0 rounded-xl ${isDark ? "bg-[#1E1E24]" : "bg-white"}`}
                  />
                )}
                {/* Hover Morphing Pill */}
                {!isActive && isHovered && (
                  <motion.div
                    layoutId="hoverLockedPdfTabPill"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className={`absolute inset-0 rounded-xl ${isDark ? "bg-[#18181C]" : "bg-zinc-200/80"}`}
                  />
                )}
                <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-lg ${isDark ? "bg-[#27272A] text-zinc-300" : "bg-zinc-200/60 text-zinc-700"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="relative z-10 text-left leading-tight">
                  <span className={`block text-xs font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{tab.label}</span>
                  <span className="block text-[10px] font-normal text-zinc-400">{tab.desc}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Loader2 className="h-6 w-6 animate-spin text-[#0066B2]" />
          </div>
        ) : activePage ? (
          <div className="space-y-4">
            {/* TAB 1: LOCKED PDF SETUP */}
            {activeTab === "locked" && (
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
            )}

            {/* TAB 2: DELIVERY EMAIL */}
            {activeTab === "email" && (
              <DeliveryEmailTab
                account={account}
                setShowEmailPreviewModal={setShowEmailPreviewModal}
                emailSubject={emailSubject}
                setEmailSubject={(val) => {
                  setEmailSubject(val);
                  if (activePage) {
                    const updated = pages.map((p) =>
                      p.id === activePage.id
                        ? {
                            ...p,
                            deliveryEmail: {
                              subject: val,
                              previewText: emailPreviewText,
                              body: emailBody,
                              linkText: "Access document",
                              linkUrl: "",
                            },
                          }
                        : p
                    );
                    setPages(updated);
                    savePages(updated);
                  }
                }}
                emailPreviewText={emailPreviewText}
                setEmailPreviewText={(val) => {
                  setEmailPreviewText(val);
                  if (activePage) {
                    const updated = pages.map((p) =>
                      p.id === activePage.id
                        ? {
                            ...p,
                            deliveryEmail: {
                              subject: emailSubject,
                              previewText: val,
                              body: emailBody,
                              linkText: "Access document",
                              linkUrl: "",
                            },
                          }
                        : p
                    );
                    setPages(updated);
                    savePages(updated);
                  }
                }}
                editor={editor}
                showInsertResourceMenu={showInsertResourceMenu}
                setShowInsertResourceMenu={setShowInsertResourceMenu}
                hostedResources={hostedResources}
                emailBody={emailBody}
                setEmailBody={setEmailBody}
                enableAiPersonalizedDeliverable={enableAiPersonalizedDeliverable}
                setEnableAiPersonalizedDeliverable={setEnableAiPersonalizedDeliverable}
                customPromptQuestion={customPromptQuestion}
                setCustomPromptQuestion={setCustomPromptQuestion}
                customPromptPlaceholder={customPromptPlaceholder}
                setCustomPromptPlaceholder={setCustomPromptPlaceholder}
              />
            )}

            {/* TAB 3: SEQUENCE */}
            {activeTab === "sequence" && (
              <SequenceTab
                account={account}
                sequenceEnabled={sequenceEnabled}
                setSequenceEnabled={handleToggleSequenceEnabled}
                stopOnCall={stopOnCall}
                setStopOnCall={setStopOnCall}
                sequenceEmails={sequenceEmails}
                setSequenceEmails={handleUpdateSequenceEmails}
                selectedSequenceIndex={selectedSequenceIndex}
                setSelectedSequenceIndex={setSelectedSequenceIndex}
                addSequenceEmail={addSequenceEmail}
                removeSequenceEmail={removeSequenceEmail}
                setShowSequencePreviewModal={setShowSequencePreviewModal}
                setPreviewSequenceIndex={setPreviewSequenceIndex}
              />
            )}

            {/* TAB 4: AFTER SIGNUP */}
            {activeTab === "after" && (
              <AfterSignupTab
                account={account}
                afterSignupOption={afterSignupOption}
                setAfterSignupOption={setAfterSignupOption}
                destinationUrl={destinationUrl}
                setDestinationUrl={setDestinationUrl}
                customHeading={customHeading}
                setCustomHeading={setCustomHeading}
                customMessage={customMessage}
                setCustomMessage={setCustomMessage}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                buttonLabel={buttonLabel}
                setButtonLabel={setButtonLabel}
                buttonUrl={buttonUrl}
                setButtonUrl={setButtonUrl}
                quizFunnelEnabled={quizFunnelEnabled}
                setQuizFunnelEnabled={setQuizFunnelEnabled}
              />
            )}
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

      {/* Email Preview Modal */}
      {showEmailPreviewModal && (
        <EmailPreviewModal
          account={account}
          emailSubject={emailSubject}
          emailBody={emailBody}
          setShowEmailPreviewModal={setShowEmailPreviewModal}
        />
      )}

      {/* Sequence Preview Modal */}
      {showSequencePreviewModal && (
        <SequencePreviewModal
          account={account}
          sequenceEmails={sequenceEmails}
          previewSequenceIndex={previewSequenceIndex}
          setShowSequencePreviewModal={setShowSequencePreviewModal}
        />
      )}

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
