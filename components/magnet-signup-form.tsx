"use client";

import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function MagnetSignupForm({
  cta,
  deliverable,
  accent,
  pageId,
  pageName,
}: {
  cta: string;
  deliverable: string;
  accent: string;
  pageId: string;
  pageName: string;
}) {
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const newLead = {
        id: `l_${Date.now()}`,
        name: email.split("@")[0],
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
        <div className="rounded-md border border-ink-200 bg-brand-soft p-5 text-left">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-ink-950">On its way — check {email}</p>
          <p className="mt-1 text-xs leading-5 text-ink-600">
            The resource is being delivered to your inbox right now. If it doesn&apos;t appear within a few minutes, check your
            spam or promotions folders.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-ink-200 bg-white p-2.5 text-left shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your best email"
              className="min-h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:ring-1 sm:min-h-10 focus:border-brand-orange focus:ring-brand-orange"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition hover:opacity-90 sm:min-h-10 disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {loading ? "Sending..." : cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-ink-400">
            <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
            No spam. Unsubscribe any time.
          </p>
        </div>
      )}
    </>
  );
}