"use client";

import React, { memo } from "react";
import { Copy, Eye, Trash2, Lock, Upload, Sparkles, Linkedin } from "lucide-react";
import type { Lead } from "@/lib/data";

interface LeadTableRowProps {
  lead: Lead;
  isSelected: boolean;
  isLockedPdf: boolean;
  isManual: boolean;
  isLinkedIn?: boolean;
  sequenceStatusNode: React.ReactNode;
  formattedDate: string;
  onToggleSelect: (id: string) => void;
  onViewDetails: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onCopyEmail: (email: string) => void;
}

export const LeadTableRow = memo(function LeadTableRow({
  lead,
  isSelected,
  isLockedPdf,
  isManual,
  isLinkedIn,
  sequenceStatusNode,
  formattedDate,
  onToggleSelect,
  onViewDetails,
  onDelete,
  onCopyEmail,
}: LeadTableRowProps) {
  return (
    <tr
      className={`transition-colors ${
        isSelected
          ? "bg-[#EFF6FF] dark:bg-[#0066B2]/15"
          : "hover:bg-[#EFF6FF]/40 dark:hover:bg-[#1C1C22]/60"
      }`}
    >
      {/* Checkbox Column */}
      <td className="px-3 py-3.5 text-center whitespace-nowrap w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(lead.id)}
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
        />
      </td>

      {/* Subscriber Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-xs font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
            {(lead.name || lead.email || "U").slice(0, 2)}
          </div>
          <div className="min-w-0 max-w-[190px] xl:max-w-[240px]">
            <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
              <span className="truncate" title={lead.email}>{lead.email}</span>
              <button
                type="button"
                onClick={() => onCopyEmail(lead.email)}
                title="Copy Email"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer shrink-0"
              >
                <Copy className="h-3 w-3" />
              </button>
            </p>
            {lead.name && lead.name !== lead.email.split("@")[0] && (
              <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] truncate mt-0.5" title={lead.name}>
                {lead.name}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Source / Gate Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">
        {isLinkedIn ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2]/10 px-2 py-0.5 text-xs font-bold text-[#0A66C2] dark:text-[#38BDF8] border border-[#0A66C2]/20 shadow-2xs">
            <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] dark:text-[#38BDF8] shrink-0" />
            <span>LinkedIn</span>
          </span>
        ) : isLockedPdf ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
            <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Locked PDF</span>
          </span>
        ) : isManual ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
            <Upload className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Import</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>Form</span>
          </span>
        )}
      </td>

      {/* Lead Magnet Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">
        <span
          className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-[#222228] px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]"
          title={lead.page}
        >
          <span className="truncate">{lead.page}</span>
        </span>
      </td>

      {/* Signup Date Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {formattedDate}
      </td>

      {/* Sequence Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">{sequenceStatusNode}</td>

      {/* Actions Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onViewDetails(lead)}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-200 dark:hover:bg-[#282830] transition cursor-pointer shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />{" "}
            View Details
          </button>
          <button
            type="button"
            onClick={() => onDelete(lead)}
            title="Delete lead"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});
