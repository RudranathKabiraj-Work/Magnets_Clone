"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";

interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedCount: number;
  isBulkDeleting: boolean;
  onClose: () => void;
  onConfirmBulkDelete: () => void;
}

export const BulkDeleteModal = memo(function BulkDeleteModal({
  isOpen,
  selectedCount,
  isBulkDeleting,
  onClose,
  onConfirmBulkDelete,
}: BulkDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
              Delete {selectedCount} Selected Leads?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-[#9B9085]">
              Are you sure you want to delete{" "}
              <strong className="text-zinc-900 dark:text-white">
                {selectedCount} leads
              </strong>
              ? This action cannot be undone and will remove them from your active
              lead list.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={onClose}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={onConfirmBulkDelete}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete {selectedCount} Leads</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
