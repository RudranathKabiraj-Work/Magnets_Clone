"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Mail, ArrowRight, Loader2, BellOff } from "lucide-react";
import { loadSequences, loadLeads, saveLeads, loadPages } from "@/lib/store";

export default function StopSequencePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [emailInput, setEmailInput] = useState(emailParam || "");
  const [sequenceName, setSequenceName] = useState<string>("Follow-up Sequence");
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sequences = loadSequences();
    const pages = loadPages();
    const foundSeq = sequences.find((s) => s.id === params.id || s.pageId === params.id);
    const foundPage = pages.find((p) => p.id === params.id);

    if (foundSeq) {
      setSequenceName(foundSeq.name);
    } else if (foundPage) {
      setSequenceName(`${foundPage.name} Follow-up`);
    }

    // Auto-unsubscribe if email param is provided
    if (emailParam) {
      handleConfirmUnsubscribe(emailParam);
    }
  }, [params.id, emailParam]);

  function handleConfirmUnsubscribe(targetEmail?: string) {
    const emailToStop = (targetEmail || emailInput).trim().toLowerCase();
    setLoading(true);

    setTimeout(() => {
      if (emailToStop) {
        const leads = loadLeads();
        let changed = false;
        const updated = leads.map((l) => {
          if (l.email.toLowerCase() === emailToStop) {
            changed = true;
            return {
              ...l,
              status: "stopped" as const,
              sequenceStep: "Stopped · unsubscribed via stop link",
            };
          }
          return l;
        });

        if (changed) {
          saveLeads(updated);
        }

        // Notify API to stop this email from future crons
        fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "saveLeads",
            data: updated.filter((l) => l.email.toLowerCase() === emailToStop),
          }),
        }).catch(console.error);
      }

      setUnsubscribed(true);
      setLoading(false);
    }, 400);
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center p-6 selection:bg-[#0066B2]">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#18181B] border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
        {unsubscribed ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <BellOff className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                You Have Been Unsubscribed
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You will no longer receive automated follow-up emails for{" "}
                <span className="font-semibold text-zinc-200">"{sequenceName}"</span>.
              </p>
            </div>

            {emailInput && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300 font-mono">
                {emailInput}
              </div>
            )}

            <div className="pt-2 text-xs text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Your email preferences have been recorded securely.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0066B2]/10 border border-[#0066B2]/20 text-[#38BDF8]">
              <Mail className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Unsubscribe From Sequence
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Confirm your email below to permanently stop receiving follow-up drip emails for{" "}
                <span className="font-semibold text-zinc-200">"{sequenceName}"</span>.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmUnsubscribe();
              }}
              className="space-y-3"
            >
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-[#0066B2] focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading || !emailInput.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] py-3 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
                <span>{loading ? "Unsubscribing..." : "Stop Follow-Up Emails"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
