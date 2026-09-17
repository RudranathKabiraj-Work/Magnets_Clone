"use client";

import React from "react";
import {
  Plus,
  Mail,
  Eye,
  Trash2,
  Clock,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { type Account } from "@/lib/data";

export interface SequenceEmailItem {
  id: string;
  subject: string;
  delayDays: number;
  delayUnit?: "hours" | "minutes";
  previewText?: string;
  body: string;
}

export interface SequenceTabProps {
  account: Account | null;
  sequenceEnabled: boolean;
  setSequenceEnabled: (enabled: boolean) => void;
  stopOnCall: boolean;
  setStopOnCall: (stop: boolean) => void;
  sequenceEmails: SequenceEmailItem[];
  setSequenceEmails: React.Dispatch<React.SetStateAction<SequenceEmailItem[]>>;
  selectedSequenceIndex: number;
  setSelectedSequenceIndex: (idx: number) => void;
  addSequenceEmail: () => void;
  removeSequenceEmail: (id: string) => void;
  setShowSequencePreviewModal: (show: boolean) => void;
  setPreviewSequenceIndex: (idx: number) => void;
}

export default function SequenceTab({
  account,
  sequenceEnabled,
  setSequenceEnabled,
  stopOnCall,
  setStopOnCall,
  sequenceEmails,
  setSequenceEmails,
  selectedSequenceIndex,
  setSelectedSequenceIndex,
  addSequenceEmail,
  removeSequenceEmail,
  setShowSequencePreviewModal,
  setPreviewSequenceIndex,
}: SequenceTabProps) {
  const renderEmailBlockEditor = (
    val: string,
    onValChange: (next: string) => void,
    isDisabled = false
  ) => {
    return (
      <textarea
        disabled={isDisabled}
        value={val}
        onChange={(e) => onValChange(e.target.value)}
        placeholder="Write your email body content here... Use {name} for subscriber name."
        rows={10}
        className={`w-full p-2 bg-transparent outline-none resize-y min-h-[220px] font-sans text-sm leading-relaxed transition ${isDisabled ? "opacity-50 cursor-not-allowed" : ""
          } ${(account?.themeMode || "light") === "dark" ? "text-zinc-100 placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Canvas Outer Wrapper - Adapts dynamically to Brand Theme Mode */}
      <div className={`rounded-2xl border p-4 sm:p-6 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E10] text-white" : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"}`}>
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Top Control Card - Left Panel Background (#18181B) in Dark Mode */}
          <div className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className={`text-base font-extrabold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>Follow-up sequence</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Send extra emails after the lead magnet email. Delays are counted from the previous email or from signup for the first one.
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  LeadMagnets creates the events, templates, and automation for this sequence after your sender domain is ready.
                </p>
              </div>

              {/* Toggle Status Pill */}
              <button
                type="button"
                onClick={() => setSequenceEnabled(!sequenceEnabled)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${sequenceEnabled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#25252B] dark:text-zinc-300 dark:border-[#27272A]"
                  }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${sequenceEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                <span>{sequenceEnabled ? "Enabled" : "Disabled"}</span>
              </button>
            </div>

            {/* 2 Sub-cards in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Sub-card 1: Stop when a call is booked */}
              <div
                onClick={() => { if (sequenceEnabled) setStopOnCall(!stopOnCall); }}
                className={`rounded-xl border p-3.5 transition shadow-2xs ${sequenceEnabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"} ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] hover:border-zinc-500 text-white" : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stopOnCall}
                    disabled={!sequenceEnabled}
                    onChange={() => { }}
                    className="rounded border-zinc-300 text-[#FE6F34] focus:ring-[#FE6F34] cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className={`text-xs font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-800"}`}>Stop when a call is booked</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 pl-6 leading-relaxed">
                  Calendly and Cal.com booking-created webhooks stop this magnet&apos;s sequence for that email.
                </p>
              </div>

              {/* Sub-card 2: Calendar connection */}
              <div className={`rounded-xl border p-3.5 transition ${sequenceEnabled ? "" : "opacity-50"} ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white" : "border-zinc-200 bg-[#F9F9FB] text-zinc-900"}`}>
                <span className={`text-xs font-bold block ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-700"}`}>Calendar connection</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Connect Calendly or Cal.com in Configure to let booked calls stop this sequence.
                </p>
              </div>
            </div>
          </div>

          {/* Main Editor Body: Empty State OR 2-Column Sidebar + Detail View */}
          {sequenceEmails.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-dashed border-[#27272A] bg-[#18181B] text-white" : "border-dashed border-zinc-300 bg-white text-zinc-900"}`}>
              <h4 className={`text-base font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>No follow-up emails yet</h4>
              <p className="text-xs text-zinc-400 mt-1 mb-5">
                Add up to 10 emails to build this magnet&apos;s sequence.
              </p>
              <button
                type="button"
                disabled={!sequenceEnabled}
                onClick={addSequenceEmail}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-xs ${!sequenceEnabled
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : "cursor-pointer"
                  } ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#202025] text-white hover:bg-[#27272E]" : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"}`}
              >
                <Plus className="h-4 w-4" />
                <span>Add first email</span>
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-hidden shadow-xs transition-colors duration-200 flex flex-col md:flex-row min-h-[580px] ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>

              {/* LEFT COLUMN / SIDEBAR ITEM LIST */}
              <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r flex flex-col p-4 shrink-0 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#141418]" : "border-zinc-200 bg-zinc-50/70"}`}>
                {/* Header: "SEQUENCE" + "+" Button */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-[#27272A]">
                  <span className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Sequence</span>
                  <button
                    type="button"
                    disabled={!sequenceEnabled || sequenceEmails.length >= 10}
                    onClick={addSequenceEmail}
                    className={`p-1 rounded-lg border transition shadow-xs ${!sequenceEnabled || sequenceEmails.length >= 10
                      ? "opacity-40 cursor-not-allowed pointer-events-none"
                      : "cursor-pointer"
                      } ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-zinc-200 hover:bg-[#272730] hover:text-white" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"}`}
                    title={sequenceEmails.length >= 10 ? "Maximum 10 emails" : "Add sequence email (+)"}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Email Items List */}
                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                  {sequenceEmails.map((item, idx) => {
                    const isSelected = idx === selectedSequenceIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSequenceIndex(idx)}
                        className={`rounded-xl p-3 flex items-center justify-between transition cursor-pointer ${isSelected
                          ? "bg-[#0066B2] text-white shadow-md font-bold"
                          : ((account?.themeMode || "light") === "dark"
                            ? "bg-[#1B1B20] text-zinc-300 hover:bg-[#24242A] border border-[#27272A]"
                            : "bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-200")
                          }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className={`block text-xs font-extrabold truncate ${isSelected ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                            Email {idx + 2}
                          </span>
                          <span className={`block text-[11px] truncate mt-0.5 ${isSelected ? "text-white/80" : "text-zinc-400"}`}>
                            {item.subject || "Untitled email"}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : ((account?.themeMode || "light") === "dark" ? "bg-zinc-800/40 text-zinc-400" : "bg-zinc-100 text-zinc-500")}`}>
                          {item.delayDays}{item.delayUnit === "minutes" ? "m" : "h"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN / MAIN EMAIL EDITOR PANEL */}
              <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 min-w-0">
                {(() => {
                  const activeEmail = sequenceEmails[selectedSequenceIndex] || sequenceEmails[0];
                  if (!activeEmail) return null;

                  return (
                    <div className="space-y-5">
                      {/* Editor Top Bar */}
                      <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-[#27272A]">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#0066B2]" />
                          <h4 className={`text-sm sm:text-base font-extrabold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                            Email {selectedSequenceIndex + 2}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Preview Button */}
                          <button
                            type="button"
                            disabled={!sequenceEnabled}
                            onClick={() => {
                              setPreviewSequenceIndex(selectedSequenceIndex + 1);
                              setShowSequencePreviewModal(true);
                            }}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-2xs ${!sequenceEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              } ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-zinc-200 hover:bg-[#272730]" : "border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            disabled={!sequenceEnabled}
                            onClick={() => removeSequenceEmail(activeEmail.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/40 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Field 1: Delay from previous email */}
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Delay from previous email</span>
                        </label>
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            disabled={!sequenceEnabled}
                            value={activeEmail.delayDays || 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, delayDays: val } : item));
                            }}
                            className={`w-24 rounded-xl border px-3 py-2 text-xs font-bold outline-none disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 focus:border-[#FE6F34]"}`}
                          />
                          <select
                            disabled={!sequenceEnabled}
                            value={activeEmail.delayUnit || "hours"}
                            onChange={(e) => {
                              const unit = e.target.value as "hours" | "minutes";
                              setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, delayUnit: unit } : item));
                            }}
                            className={`rounded-xl border px-3 py-2 text-xs font-bold outline-none cursor-pointer disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 focus:border-[#FE6F34]"}`}
                          >
                            <option value="minutes">minutes</option>
                            <option value="hours">hours</option>
                          </select>
                        </div>
                      </div>

                      {/* Field 2: Subject */}
                      <div>
                        <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Subject</label>
                        <input
                          type="text"
                          disabled={!sequenceEnabled}
                          value={activeEmail.subject || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, subject: val } : item));
                          }}
                          placeholder="Quick follow-up"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-600 focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#FE6F34]"}`}
                        />
                      </div>

                      {/* Field 3: Preview Text */}
                      <div>
                        <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Preview text</label>
                        <input
                          type="text"
                          disabled={!sequenceEnabled}
                          value={activeEmail.previewText || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, previewText: val } : item));
                          }}
                          placeholder="Short inbox teaser"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white placeholder:text-zinc-600 focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#FE6F34]"}`}
                        />
                      </div>

                      {/* Field 4: Body + Rich Editor Toolbar */}
                      <div>
                        <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Body</label>
                        <div className={`rounded-xl border overflow-hidden transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B]" : "border-zinc-200 bg-white"}`}>
                          {/* Toolbar */}
                          <div className={`flex flex-wrap items-center gap-1 px-3 py-2 border-b text-xs text-zinc-400 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B]" : "border-zinc-100 bg-zinc-50"}`}>
                            <button title="Undo" type="button" onClick={() => { }} className="p-1 hover:text-white transition cursor-pointer"><Undo2 className="h-3.5 w-3.5" /></button>
                            <button title="Redo" type="button" onClick={() => { }} className="p-1 hover:text-white transition cursor-pointer"><Redo2 className="h-3.5 w-3.5" /></button>
                            <div className="h-3 w-px bg-zinc-700 mx-1" />
                            <span className="px-1 font-extrabold text-[11px] cursor-pointer">Aa</span>
                            <span className="px-1 font-bold italic cursor-pointer">B</span>
                            <span className="px-1 italic cursor-pointer">I</span>
                            <span className="px-1 font-serif cursor-pointer">&rdquo;</span>
                            <span className="px-1 cursor-pointer">≡</span>
                            <span className="px-1 cursor-pointer">-</span>
                            <div className="h-3 w-px bg-zinc-700 mx-1" />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedBody = (activeEmail.body || "") + " {name}";
                                setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, body: updatedBody } : item));
                              }}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 transition cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Insert &#123;name&#125;</span>
                            </button>
                          </div>

                          {/* Block Email Body Editor */}
                          <div className="p-3">
                            {renderEmailBlockEditor(
                              activeEmail.body || "",
                              (nextVal) => {
                                setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, body: nextVal } : item));
                              },
                              !sequenceEnabled
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Banner Card */}
                      <div className="mt-4 rounded-xl bg-[#080B12] p-5 flex items-center justify-center shadow-lg">
                        <button type="button" className="flex items-center gap-2 rounded-xl bg-[#181C26] text-white border border-[#272D3C] px-4 py-2 text-xs font-bold shadow-md hover:bg-[#202534] transition cursor-pointer">
                          {account?.logo || account?.avatar_url || account?.avatar ? (
                            <img src={account?.logo || account?.avatar_url || account?.avatar || ""} alt="Logo" className="h-5 w-5 rounded object-cover" />
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FE6F34] text-black font-extrabold text-[10px]">🧲</span>
                          )}
                          <span>Build yours free with Magnets</span>
                        </button>
                      </div>

                      {/* Footer Navigation Bar */}
                      <div className="flex items-center justify-between border-t pt-4 border-zinc-200 dark:border-[#27272A] text-xs text-zinc-400">
                        <button
                          type="button"
                          disabled={selectedSequenceIndex === 0}
                          onClick={() => setSelectedSequenceIndex(selectedSequenceIndex - 1)}
                          className="flex items-center gap-1 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Previous</span>
                        </button>

                        <span className="text-[11px] text-zinc-500 font-medium">
                          Swipe on mobile - Email {selectedSequenceIndex + 2} of {sequenceEmails.length + 1}
                        </span>

                        <button
                          type="button"
                          disabled={selectedSequenceIndex === sequenceEmails.length - 1}
                          onClick={() => setSelectedSequenceIndex(selectedSequenceIndex + 1)}
                          className="flex items-center gap-1 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })()}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
