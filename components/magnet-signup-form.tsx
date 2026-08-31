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
}: {
  cta: string;
  deliverable: string;
  accent: string;
  pageId: string;
  pageName: string;
  brandColor?: string;
  highlightIntensity?: number;
  themeMode?: "light" | "dark";
}) {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const newLead = {
        id: `l_${Date.now()}`,
        name: name.trim() || email.split("@")[0],
        email: email.trim(),
        page: pageName,
        pageId: pageId,
        status: "new",
        source: "magnets",
        signedUpAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        tags: [],
      };

      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addLead", data: newLead }),
      });

      if (res.ok) {
        setDone(true);
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
        <div className={`rounded-md border p-5 text-left transition-colors duration-300 ${themeMode === "dark" ? "bg-[#161619] border-[#252529]" : "bg-brand-soft border-ink-200"
          }`}>
          <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
          <p className={`mt-2 text-sm font-semibold ${themeMode === "dark" ? "text-white" : "text-ink-950"}`}>On its way — check {email}</p>
          <p className={`mt-1 text-xs leading-5 ${themeMode === "dark" ? "text-zinc-400" : "text-ink-600"}`}>
            The resource is being delivered to your inbox right now. If it doesn&apos;t appear within a few minutes, check your
            spam or promotions folders.
          </p>
        </div>
      ) : (
        <div className={`rounded-xl border p-6 text-left shadow-lg transition-colors duration-300 ${themeMode === "dark"
          ? "bg-[#161619] border-[#252529] text-white"
          : "bg-white border-ink-200 text-ink-900"
          }`}
          style={{ borderColor: themeMode === "light" ? `${brandColor}30` : undefined }}
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
                : "bg-white border-zinc-200 text-ink-900 placeholder:text-ink-400 focus:border-[#FE6F34]/50"
                }`}
            />
            <input
              type="email"
              required
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={`min-h-11 w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition ${themeMode === "dark"
                ? "bg-[#0E0E10] border-[#252529] text-white placeholder:text-zinc-500 focus:border-zinc-700"
                : "bg-white border-zinc-200 text-ink-900 placeholder:text-ink-400 focus:border-[#FE6F34]/50"
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