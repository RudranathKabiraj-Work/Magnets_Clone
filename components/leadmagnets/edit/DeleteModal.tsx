"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteModal({ onConfirm, onClose }: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl border border-zinc-800 bg-[#18181C] p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-950/50 border border-red-900/40 text-red-400">
              <AlertTriangle className="h-5 w-5 stroke-[2.2px]" />
            </div>
            <h3 className="text-base font-bold text-white">Delete this magnet?</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-3 pt-1">
          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
            This removes the page and stops it serving. Any signups already collected stay on your list.
          </p>
          <p className="text-xs text-zinc-400 font-medium">
            This action cannot be undone.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-[#222226] hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-red-900/60 bg-[#2C1818] hover:bg-red-950 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition cursor-pointer shadow-xs"
          >
            Delete magnet
          </button>
        </div>
      </div>
    </div>
  );
}
