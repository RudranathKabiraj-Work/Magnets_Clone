"use client";

import React from "react";
import { Check, ExternalLink, FileText } from "lucide-react";
import { type Account } from "@/lib/data";

export interface AfterSignupTabProps {
  account: Account | null;
  afterSignupOption: "standard" | "elsewhere" | "custom";
  setAfterSignupOption: (option: "standard" | "elsewhere" | "custom") => void;
  destinationUrl: string;
  setDestinationUrl: (url: string) => void;
  customHeading: string;
  setCustomHeading: (heading: string) => void;
  customMessage: string;
  setCustomMessage: (message: string) => void;
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  buttonLabel: string;
  setButtonLabel: (label: string) => void;
  buttonUrl: string;
  setButtonUrl: (url: string) => void;
  quizFunnelEnabled: boolean;
  setQuizFunnelEnabled: (enabled: boolean) => void;
}

export default function AfterSignupTab({
  account,
  afterSignupOption,
  setAfterSignupOption,
  destinationUrl,
  setDestinationUrl,
  customHeading,
  setCustomHeading,
  customMessage,
  setCustomMessage,
  videoUrl,
  setVideoUrl,
  buttonLabel,
  setButtonLabel,
  buttonUrl,
  setButtonUrl,
  quizFunnelEnabled,
  setQuizFunnelEnabled,
}: AfterSignupTabProps) {
  return (
    <div className="space-y-4">
      {/* Canvas Outer Wrapper - Adapts dynamically to Brand Theme Mode */}
      <div className={`rounded-2xl border p-3 sm:p-5 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E10] text-white" : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"}`}>
        <div className="mx-auto max-w-4xl space-y-4">

          {/* Top Options Card - Left Panel Background (#18181B) in Dark Mode */}
          <div className={`rounded-2xl border p-4 sm:p-6 shadow-xs space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white" : "border-zinc-200 bg-white text-zinc-700"}`}>
                <Check className="h-4 w-4 stroke-[2.5px]" />
              </div>
              <div>
                <h3 className={`text-base font-extrabold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>What happens after someone opts in?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Keep it simple: show a confirmation, take them straight to another URL, or give them a useful next step on a short page.
                </p>
              </div>
            </div>

            {/* 3 Interactive Card Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
              {/* Option 1: Standard confirmation */}
              <button
                type="button"
                onClick={() => setAfterSignupOption("standard")}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "standard"
                  ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                  : ((account?.themeMode || "light") === "dark"
                    ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]")
                  }`}
              >
                <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "standard" ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                  Standard confirmation
                </h4>
                <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "standard" ? "text-white/90" : "text-zinc-400"}`}>
                  Show the email confirmation message.
                </p>
              </button>

              {/* Option 2: Send them elsewhere */}
              <button
                type="button"
                onClick={() => setAfterSignupOption("elsewhere")}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "elsewhere"
                  ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                  : ((account?.themeMode || "light") === "dark"
                    ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]")
                  }`}
              >
                <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "elsewhere" ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                  Send them elsewhere
                </h4>
                <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "elsewhere" ? "text-white/90" : "text-zinc-400"}`}>
                  Open a URL as soon as the form is submitted.
                </p>
              </button>

              {/* Option 3: Custom next step */}
              <button
                type="button"
                onClick={() => setAfterSignupOption("custom")}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "custom"
                  ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                  : ((account?.themeMode || "light") === "dark"
                    ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                    : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]")
                  }`}
              >
                <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "custom" ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                  Custom next step
                </h4>
                <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "custom" ? "text-white/90" : "text-zinc-400"}`}>
                  Show your own message, video, or offer.
                </p>
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-medium">
              A quiz funnel is available with Custom next step.
            </p>

            {/* DYNAMIC FORM FIELDS DEPENDING ON SELECTED OPTION */}

            {/* Dynamic Panel 2: Destination URL when "elsewhere" is selected */}
            {afterSignupOption === "elsewhere" && (
              <div className={`pt-3 space-y-1.5 border-t ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-100"}`}>
                <label className={`text-xs font-bold flex items-center gap-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-200" : "text-zinc-700"}`}>
                  <ExternalLink className="h-3.5 w-3.5 text-[#0066B2]" />
                  <span>Destination URL</span>
                </label>
                <input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://your-site.com/next-step"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                />
                <p className="text-xs text-zinc-400">
                  They will be taken here straight after a successful signup.
                </p>
              </div>
            )}

            {/* Dynamic Panel 3: Custom Next Step fields when "custom" is selected */}
            {afterSignupOption === "custom" && (
              <div className={`pt-3 space-y-3 border-t ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-100"}`}>
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Heading</label>
                  <input
                    type="text"
                    value={customHeading}
                    onChange={(e) => setCustomHeading(e.target.value)}
                    placeholder="You are in. Here is what to do next."
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Message</label>
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Set expectations, introduce an offer, or explain the next step."
                    className={`w-full rounded-xl border p-2.5 text-xs outline-none resize-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold flex items-center gap-1.5 mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                    <span>🎥 Loom or YouTube URL</span>
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.loom.com/share/..."
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Button label</label>
                    <input
                      type="text"
                      value={buttonLabel}
                      onChange={(e) => setButtonLabel(e.target.value)}
                      placeholder="Book a call"
                      className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Button URL</label>
                    <input
                      type="url"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://cal.com/..."
                      className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Card: Quiz Funnel Card - Left Panel Background (#18181B) in Dark Mode */}
          <div className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${(account?.themeMode || "light") === "dark" ? "bg-[#121216] text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className={`text-xs sm:text-sm font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>Add a quiz funnel</h4>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                  Ask a short series of questions after signup. Save every answer, then optionally route people based on their responses.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setQuizFunnelEnabled(!quizFunnelEnabled)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${quizFunnelEnabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60"
                : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#25252B] dark:text-zinc-300 dark:border-[#27272A]"
                }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${quizFunnelEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
              <span>{quizFunnelEnabled ? "On" : "Off"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
