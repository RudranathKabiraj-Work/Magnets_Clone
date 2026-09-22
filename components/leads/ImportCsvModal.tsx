"use client";

import React, { memo } from "react";
import { FileSpreadsheet, X, Check, Loader2 } from "lucide-react";
import type { Lead } from "@/lib/data";

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvFileName: string;
  importedLeadsPreview: Partial<Lead>[];
  isImporting: boolean;
  onConfirmImport: () => void;
}

export const ImportCsvModal = memo(function ImportCsvModal({
  isOpen,
  onClose,
  csvFileName,
  importedLeadsPreview,
  isImporting,
  onConfirmImport,
}: ImportCsvModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Import Contacts from CSV
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                {csvFileName || "CSV File Preview"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Ready to import{" "}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {importedLeadsPreview.length} contacts
            </strong>{" "}
            from your CSV file. Preview below:
          </p>

          <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] p-3 divide-y divide-zinc-200/60 dark:divide-white/5">
            {importedLeadsPreview.slice(0, 5).map((previewLead, idx) => (
              <div
                key={idx}
                className="py-1.5 flex justify-between items-center text-xs"
              >
                <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">
                  {previewLead.email}
                </span>
                <span className="text-zinc-500 dark:text-[#9B9085]">
                  {previewLead.name}
                </span>
              </div>
            ))}
            {importedLeadsPreview.length > 5 && (
              <p className="pt-2 text-[11px] text-zinc-400 text-center italic">
                + {importedLeadsPreview.length - 5} more contacts...
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isImporting}
            onClick={onConfirmImport}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm disabled:opacity-60"
          >
            {isImporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>Import {importedLeadsPreview.length} Contacts</span>
          </button>
        </div>
      </div>
    </div>
  );
});
