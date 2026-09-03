"use client";

import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function MagnetSignupForm({
  cta,
  deliverable,
  accent,
  pageId,
  pageName,
  brandColor,
  highlightIntensity,
  themeMode,
  customPromptQuestion,
  customPromptPlaceholder,
  enableAiPersonalizedDeliverable,
}: {
  cta: string;
  deliverable: string;
  accent: string;
  pageId: string;
  pageName: string;
  brandColor?: string;
  highlightIntensity?: number;
  themeMode?: "light" | "dark";
  customPromptQuestion?: string;
  customPromptPlaceholder?: string;
  enableAiPersonalizedDeliverable?: boolean;
}) {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [personalizedOutput, setPersonalizedOutput] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      let customDeliverable = deliverable;

      // Feature 2: If AI personalization is enabled and user provided an answer, generate custom deliverable
      if (enableAiPersonalizedDeliverable && customAnswer.trim()) {
        try {
          const aiRes = await fetch("/api/ai/personalize-deliverable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadName: name.trim() || email.split("@")[0],
              magnetName: pageName,
              question: customPromptQuestion,
              answer: customAnswer.trim(),
              baseDeliverable: deliverable,
            }),
          });
          const aiData = await aiRes.json();
          if (aiData.success && aiData.personalizedDeliverable) {
            customDeliverable = aiData.personalizedDeliverable;
            setPersonalizedOutput(aiData.personalizedDeliverable);
          }
        } catch (err) {
          console.error("AI personalization error:", err);
        }
      }

      const newLead = {
        id: `l_${Date.now()}`,
        name: name.trim() || email.split("@")[0],
        email: email.trim(),
        page: pageName,
        pageId: pageId,
        status: "new",
        source: "leadmagnets",
        signedUpAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        tags: enableAiPersonalizedDeliverable ? ["ai-personalized"] : [],
        customAnswer: customAnswer.trim(),
      };

      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addLead", data: newLead }),
      });

      if (res.ok) {
        setDone(true);

        // First check if an uploaded resource URL is already saved in page data or local storage
        try {
          const cachedResources = localStorage.getItem("currentUserResources");
          if (cachedResources) {
            const list = JSON.parse(cachedResources);
            if (Array.isArray(list) && list.length > 0 && list[0].url) {
              setDownloadUrl(list[0].url);
              return;
            }
          }
        } catch (_) {}

        // Fallback fetch from database
        fetch("/api/data")
          .then((r) => r.json())
          .then((data) => {
            if (data && data.resources && data.resources.length > 0) {
              setDownloadUrl(data.resources[0].url);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to submit lead", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {done ? (
        <div className={`rounded-2xl border p-5 text-left transition-colors duration-300 ${themeMode === "dark" ? "bg-[#161619] border-[#252529]" : "bg-brand-soft border-ink-200"
          }`}>
          <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
          <p className={`mt-2 text-sm font-semibold ${themeMode === "dark" ? "text-white" : "text-ink-950"}`}>On its way — check {email}</p>
          <p className={`mt-1 text-xs leading-5 ${themeMode === "dark" ? "text-zinc-400" : "text-ink-600"}`}>
            Your resource is being delivered right now.
          </p>

          <a
            href={downloadUrl || "/r/v5am4lu"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-4 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-98 cursor-pointer w-full text-center"
          >
            <ArrowRight className="h-4 w-4" />
            <span>📥 Click Here to Download Resource Immediately</span>
          </a>
        </div>
      ) : (
        <div className={`rounded-xl border p-5 sm:p-6 text-left transition-all duration-300 backdrop-blur-sm ${themeMode === "dark"
          ? "text-white"
          : "text-zinc-900"
          }`}
          style={{
            borderColor: `${brandColor}${Math.round((0.15 + ((highlightIntensity ?? 100) / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`,
            boxShadow: (highlightIntensity ?? 100) > 20 ? `0 8px 24px -4px ${brandColor}${Math.round(((highlightIntensity ?? 100) / 100) * 0.35 * 255).toString(16).padStart(2, '0')}` : "0 2px 8px rgba(0,0,0,0.05)",
            background: themeMode === "light" || !themeMode
              ? `linear-gradient(135deg, ${brandColor}${Math.round((0.05 + ((highlightIntensity ?? 100) / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0.95) 60%)`
              : `linear-gradient(135deg, ${brandColor}${Math.round((0.08 + ((highlightIntensity ?? 100) / 100) * 0.3) * 255).toString(16).padStart(2, '0')} 0%, rgba(22, 22, 25, 0.95) 60%)`
          }}
        >
          <p className="text-base font-extrabold text-center">{cta || "Download for free now"}</p>
          <p className="text-xs text-[#9B9085] text-center mt-1.5 leading-normal">
            By opting in you consent to receive this resource by email.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-3"
          >
            <input
              type="text"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              style={{
                backgroundColor: themeMode === "dark" ? "#18181C" : "#ffffff",
                color: themeMode === "dark" ? "#ffffff" : "#09090b",
                borderColor: themeMode === "dark" ? "#252529" : "#e4e4e7"
              }}
              className="min-h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
            />
            {enableAiPersonalizedDeliverable && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#0066B2] flex items-center gap-1">
                  ✨ {customPromptQuestion || "What is your main goal or bottleneck?"}
                </label>
                <input
                  type="text"
                  required
                  value={customAnswer}
                  disabled={loading}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder={customPromptPlaceholder || "e.g. Scaling outreach, Lead generation"}
                  style={{
                    backgroundColor: themeMode === "dark" ? "#18181C" : "#ffffff",
                    color: themeMode === "dark" ? "#ffffff" : "#09090b",
                    borderColor: themeMode === "dark" ? "#252529" : "#e4e4e7"
                  }}
                  className="min-h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                />
              </div>
            )}
            <input
              type="email"
              required
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{
                backgroundColor: themeMode === "dark" ? "#18181C" : "#ffffff",
                color: themeMode === "dark" ? "#ffffff" : "#09090b",
                borderColor: themeMode === "dark" ? "#252529" : "#e4e4e7"
              }}
              className="min-h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 inline-flex items-center justify-center rounded-xl bg-[#0066B2] hover:bg-[#005799] px-4 py-2.5 text-sm font-bold text-white transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : cta}
            </button>
          </form>
        </div>
      )}
    </>
  );
}