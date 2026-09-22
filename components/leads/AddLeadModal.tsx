"use client";

import React, { memo } from "react";
import { UserPlus, X, Loader2 } from "lucide-react";
import type { MagnetPage } from "@/lib/data";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newLeadEmail: string;
  setNewLeadEmail: (val: string) => void;
  newLeadName: string;
  setNewLeadName: (val: string) => void;
  newLeadMagnet: string;
  setNewLeadMagnet: (val: string) => void;
  magnetPages: MagnetPage[];
  isAdding: boolean;
}

export const AddLeadModal = memo(function AddLeadModal({
  isOpen,
  onClose,
  onSubmit,
  newLeadEmail,
  setNewLeadEmail,
  newLeadName,
  setNewLeadName,
  newLeadMagnet,
  setNewLeadMagnet,
  magnetPages,
  isAdding,
}: AddLeadModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Add Subscriber Manually
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                Manually add a contact to your lead list.
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

        <form onSubmit={onSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="subscriber@example.com"
              value={newLeadEmail}
              onChange={(e) => setNewLeadEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white focus:border-[#0066B2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name (Optional)
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={newLeadName}
              onChange={(e) => setNewLeadName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white focus:border-[#0066B2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Associated Lead Magnet
            </label>
            <select
              value={newLeadMagnet}
              onChange={(e) => setNewLeadMagnet(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-medium text-zinc-700 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 focus:border-[#0066B2] focus:outline-none cursor-pointer"
            >
              {magnetPages.map((page) => (
                <option key={page.id} value={page.name}>
                  {page.name}
                </option>
              ))}
              <option value="Direct Manual Add">Direct Manual Add</option>
            </select>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-5 py-2 text-xs font-bold text-white hover:bg-[#005291] transition cursor-pointer shadow-sm disabled:opacity-60"
            >
              {isAdding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              <span>Save Subscriber</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
