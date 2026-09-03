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
            href={downloadUrl || "/dashboard/hostresources"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-4 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-98 cursor-pointer w-full text-center"
          >
            <ArrowRight className="h-4 w-4" />
            <span>📥 Click Here to Download Resource Immediately</span>
          </a>

          {personalizedOutput && (
            <div className="mt-4 rounded-xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange/10 to-amber-500/10 p-4 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-brand-orange mb-2">
                ✨ Your AI-Personalized Action Plan:
              </div>
              <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto rounded-lg bg-black/5 dark:bg-white/5 p-3 text-ink-800 dark:text-zinc-200">
                {personalizedOutput}
              </div>
            </div>
          )}
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
              className={`min-h-11 w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition ${themeMode === "dark"
                ? "bg-[#0E0E10] border-[#252529] text-white placeholder:text-zinc-500 focus:border-zinc-700"
                : "bg-white border-zinc-200 text-ink-900 placeholder:text-ink-400 focus:border-[#0066B2]/50"
                }`}
            />
            {enableAiPersonalizedDeliverable && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-brand-orange flex items-center gap-1">
                  ✨ {customPromptQuestion || "What is your main goal or bottleneck?"}
                </label>
                <input
                  type="text"
                  required
                  value={customAnswer}
                  disabled={loading}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder={customPromptPlaceholder || "e.g. Scaling outreach, Lead generation"}
                  className={`min-h-11 w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition ${themeMode === "dark"
                    ? "bg-[#0E0E10] border-[#252529] text-white placeholder:text-zinc-500 focus:border-zinc-700"
                    : "bg-white border-zinc-200 text-ink-900 placeholder:text-ink-400 focus:border-[#0066B2]/50"
                    }`}
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
              className={`min-h-11 w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition ${themeMode === "dark"
                ? "bg-[#0E0E10] border-[#252529] text-white placeholder:text-zinc-500 focus:border-zinc-700"
                : "bg-white border-zinc-200 text-ink-900 placeholder:text-ink-400 focus:border-[#0066B2]/50"
                }`}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 inline-flex items-center justify-center rounded-md bg-[#0E0E10] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#161619] disabled:opacity-50"
            >
              {loading ? "Sending..." : cta}
            </button>
          </form>
        </div>
      )}
    </>
  );
}