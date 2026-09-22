"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Lock,
  Upload,
  Mail,
  Check,
  Send,
  Trash2,
} from "lucide-react";
import type { Lead, MagnetPage, Sequence, Account } from "@/lib/data";

interface LeadDetailsModalProps {
  selectedLead: Lead | null;
  magnetPages: MagnetPage[];
  sequences: Sequence[];
  account: Account | null;
  onClose: () => void;
  onDelete: (lead: Lead) => void;
  onResendEmail: (lead: Lead) => Promise<void>;
}

export const LeadDetailsModal = memo(function LeadDetailsModal({
  selectedLead,
  magnetPages,
  sequences,
  onClose,
  onDelete,
  onResendEmail,
}: LeadDetailsModalProps) {
  if (!selectedLead) return null;

  const page = magnetPages.find(
    (p) => p.id === selectedLead.pageId || p.name === selectedLead.page
  );
  const isLockedPdf =
    selectedLead.source === "locked-pdf-otp" ||
    selectedLead.tags?.includes("locked-pdf") ||
    page?.template === "locked-pdf" ||
    selectedLead.page?.toLowerCase().includes("locked");
  const isManual =
    selectedLead.source === "integration" ||
    (selectedLead.source as string) === "manual" ||
    selectedLead.page === "Direct Manual Add" ||
    selectedLead.sequence === "Imported Contact";

  // Sequence Funnel Information (using cached sequences in props instead of synchronous localStorage reads)
  const foundSeq = sequences.find(
    (s) =>
      s.id === page?.id ||
      s.pageId === page?.id ||
      (page && s.name.includes(page.name))
  );
  const isEnabled = page
    ? page.sequenceEnabled ||
      (page.sequenceEmails && page.sequenceEmails.length > 0)
    : false;
  const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
  const totalSteps =
    foundSeq?.emails?.length || page?.sequenceEmails?.length || 2;
  const stepsList = foundSeq?.emails || page?.sequenceEmails || [
    { id: "1", subject: "Initial Delivery Email", delayLabel: "Instantly" },
    {
      id: "2",
      subject: "Follow-up Check-in Email",
      delayLabel: "1 day later",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-sm font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
                {(selectedLead.name || selectedLead.email || "U").slice(0, 2)}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {selectedLead.name || "Subscriber Details"}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                    {selectedLead.email}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      !selectedLead.email.endsWith("@gmail.com") &&
                      !selectedLead.email.endsWith("@yahoo.com")
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {!selectedLead.email.endsWith("@gmail.com") &&
                    !selectedLead.email.endsWith("@yahoo.com")
                      ? "🔥 Hot Prospect (80 pts)"
                      : "⚡ Warm Lead (60 pts)"}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#25252A] dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 py-1 border-b border-zinc-100 dark:border-white/5">
              <div>
                <span className="block text-zinc-500 dark:text-[#9B9085]">
                  Signup Method / Gate
                </span>
                {isLockedPdf ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 mt-1">
                    <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>🔒 Locked PDF Gate (OTP)</span>
                  </span>
                ) : isManual ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20 mt-1">
                    <Upload className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span>📥 Manual Import</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20 mt-1">
                    <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    <span>⚡ Landing Page Form</span>
                  </span>
                )}
              </div>
              <div>
                <span className="block text-zinc-500 dark:text-[#9B9085]">
                  Subscribed On Magnet
                </span>
                <strong className="font-semibold text-zinc-900 dark:text-white block truncate mt-1">
                  {selectedLead.page}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1 border-b border-zinc-100 dark:border-white/5">
              <div>
                <span className="block text-zinc-500 dark:text-[#9B9085]">
                  Signup Date & Time
                </span>
                <strong className="font-semibold text-zinc-900 dark:text-white block mt-1">
                  {selectedLead.signedUpAt}
                </strong>
              </div>
              <div>
                <span className="block text-zinc-500 dark:text-[#9B9085]">
                  Traffic Source / Referrer
                </span>
                <strong className="font-semibold text-zinc-900 dark:text-white block capitalize mt-1">
                  {selectedLead.referrer || "Direct Link"}{" "}
                  <span className="text-zinc-400 font-normal text-[11px]">
                    ({selectedLead.deviceType || "Desktop"})
                  </span>
                </strong>
              </div>
            </div>

            {selectedLead.customFields &&
              Object.keys(selectedLead.customFields).length > 0 && (
                <div className="py-2 border-b border-zinc-100 dark:border-white/5 space-y-1.5">
                  <span className="font-bold text-zinc-900 dark:text-white block">
                    Form Submissions
                  </span>
                  {Object.entries(selectedLead.customFields).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center bg-zinc-50 dark:bg-[#121214] p-2 rounded-lg"
                    >
                      <span className="text-zinc-500 dark:text-[#9B9085] capitalize">
                        {key}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {/* Custom AI Prompt Answer */}
            {selectedLead.customAnswer && (
              <div className="py-2 border-b border-zinc-100 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 block">
                  ✨ Visitor Prompt Answer
                </span>
                <p className="text-xs italic text-zinc-700 dark:text-zinc-300 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  "{selectedLead.customAnswer}"
                </p>
              </div>
            )}

            {/* Sequence Delivery Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                  Follow-up Funnel Progress
                </span>
                {!isSeqLive ? (
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    Sequence Ended
                  </span>
                ) : selectedLead.status === "stopped" ? (
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    🛑 Stopped
                  </span>
                ) : selectedLead.status === "completed" ||
                  selectedLead.status === "delivered" ? (
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {totalSteps}/{totalSteps} Steps Completed
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    1/{totalSteps} Steps Delivered
                  </span>
                )}
              </div>

              {/* Step Items List */}
              <div className="space-y-1.5 pt-1">
                {stepsList.map((step: any, idx: number) => {
                  const isDone = !isSeqLive
                    ? false
                    : selectedLead.status === "completed" ||
                      selectedLead.status === "delivered" ||
                      idx === 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] bg-white dark:bg-[#18181B] p-2 rounded-lg border border-zinc-100 dark:border-white/5"
                    >
                      <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        {isDone ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                            {idx + 1}
                          </span>
                        )}
                        <span className="font-semibold">
                          {step.subject || `Step #${idx + 1}`}
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {step.delayLabel ||
                          (idx === 0 ? "Instantly" : `${idx} day later`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedLead.customAnswer && (
              <div className="py-2 space-y-1">
                <span className="block text-zinc-500 dark:text-[#9B9085]">
                  Custom Form Response
                </span>
                <p className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white leading-relaxed">
                  "{selectedLead.customAnswer}"
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onResendEmail(selectedLead)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#202026] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#282830] transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-emerald-500" /> Resend Email
              </button>
              <button
                type="button"
                onClick={() => onDelete(selectedLead)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0066B2] text-xs font-semibold text-white hover:bg-[#005799] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
