"use client";

import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function MagnetSignupForm({
  cta,
  formTitle,
  formSubtitle,
  formButtonText,
  deliverable,
  accent,
  pageId,
  pageName,
  pageSlug,
  pageOwnerEmail,
  brandColor = "#0066B2",
  highlightIntensity = 100,
  themeMode = "light",
  customPromptQuestion,
  customPromptPlaceholder,
  enableAiPersonalizedDeliverable,
  username,
}: {
  cta: string;
  formTitle?: string;
  formSubtitle?: string;
  formButtonText?: string;
  deliverable: string;
  accent: string;
  pageId: string;
  pageName: string;
  pageSlug?: string;
  pageOwnerEmail?: string;
  brandColor?: string;
  highlightIntensity?: number;
  themeMode?: "light" | "dark";
  customPromptQuestion?: string;
  customPromptPlaceholder?: string;
  enableAiPersonalizedDeliverable?: boolean;
  username?: string;
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

      // Feature 2: If AI personalization is enabled and user provided an answer, generate custom deliverable with 1.5s max timeout
      if (enableAiPersonalizedDeliverable && customAnswer.trim()) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);

          const aiRes = await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              action: "generateAiPersonalizedDeliverable",
              data: { prompt: customAnswer.trim(), deliverableName: deliverable },
            }),
          });
          clearTimeout(timeoutId);
          const aiData = await aiRes.json();
          if (aiData.success && aiData.personalizedDeliverable) {
            customDeliverable = aiData.personalizedDeliverable;
            setPersonalizedOutput(aiData.personalizedDeliverable);
          }
        } catch (err) {
          console.error("AI personalization skipped/timed out:", err);
        }
      }

      const newLead = {
        id: `l_${Date.now()}`,
        name: name.trim() || email.split("@")[0],
        email: email.trim(),
        page: pageName,
        pageId: pageId,
        pageSlug: pageSlug || "",
        userEmail: pageOwnerEmail || "",
        status: "new",
        source: "leadmagnets",
        signedUpAt: `${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`,
        tags: enableAiPersonalizedDeliverable ? ["ai-personalized"] : [],
        customAnswer: customAnswer.trim(),
      };

      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addLead", data: newLead }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.downloadUrl) {
          setDownloadUrl(json.downloadUrl);
        }
        setDone(true);
        const finalLead = {
          ...newLead,
          deliverable: customDeliverable,
          downloadUrl: json.downloadUrl || null,
        };

        // Update local storage pages signups counter & leads cache instantly
        try {
          const cachedPages = localStorage.getItem("currentUserPages");
          if (cachedPages) {
            const pagesList = JSON.parse(cachedPages);
            const targetPage = pagesList.find((p: any) => p.id === pageId || p.name === pageName);
            if (targetPage) {
              targetPage.signups = (targetPage.signups || 0) + 1;
              localStorage.setItem("currentUserPages", JSON.stringify(pagesList));
            }
          }
          const cachedLeads = localStorage.getItem("currentUserLeads");
          if (cachedLeads) {
            const leadsList = JSON.parse(cachedLeads);
            leadsList.unshift(finalLead);
            localStorage.setItem("currentUserLeads", JSON.stringify(leadsList));
          } else {
            localStorage.setItem("currentUserLeads", JSON.stringify([finalLead]));
          }
        } catch (_) { }

        // Notify any open dashboard / editor tabs instantly
        try {
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const bc = new BroadcastChannel("leadmagnets_live_sync");
            bc.postMessage({ type: "STATS_UPDATED", pageId });
            bc.close();
          }
        } catch (_) {}

        // Construct redirect URL to thank-you page
        const targetUser = username || "u";
        const targetSlug = pageSlug || pageId;
        const queryParams = new URLSearchParams();
        if (email) queryParams.set("email", email.trim());
        if (name) queryParams.set("name", name.trim());
        if (customAnswer) queryParams.set("answer", customAnswer.trim());
        if (customDeliverable && customDeliverable !== deliverable) {
          queryParams.set("aiOutput", customDeliverable);
        }

        const thankYouRoute = `/${encodeURIComponent(targetUser)}/${encodeURIComponent(targetSlug)}/thank-you?${queryParams.toString()}`;
        
        // Instant smooth redirect to Thank You page
        window.location.href = thankYouRoute;
        return;
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
        <div className={`rounded-2xl border p-5 text-left transition-colors duration-300 ${themeMode === "dark"
            ? "bg-[#161619] border-[#252529] text-white"
            : "bg-white border-zinc-200 text-zinc-900 shadow-sm"
          }`}>
          <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden="true" />
          <p className={`mt-2 text-sm font-bold ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
            On its way — check <span className={`underline decoration-[#0066B2] font-extrabold ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>{email}</span>
          </p>
          <p className={`mt-1 text-xs leading-5 font-medium ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
            Your resource is being delivered right now.
          </p>

          <a
            href={downloadUrl || "#"}
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
          <p className="text-xl font-extrabold text-center">{formTitle || cta || "Download for free"}</p>
          <p className="text-xs text-[#9B9085] text-center mt-1.5 leading-normal">
            {formSubtitle || "By opting in you consent to receive this resource by email."}
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
              style={{ backgroundColor: brandColor }}
              className="w-full min-h-11 inline-flex items-center justify-center rounded-xl hover:opacity-90 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : (formButtonText || cta || "Send it to me")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}