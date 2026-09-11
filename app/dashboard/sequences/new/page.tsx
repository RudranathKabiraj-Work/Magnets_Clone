"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  Sparkles, 
  Rocket, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Layers,
  Check
} from "lucide-react";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type Sequence, type SequenceEmail, type MagnetPage, type Account } from "@/lib/data";
import { loadPages, loadSequences, saveSequences, loadAccount, syncWithDatabase } from "@/lib/store";

export default function NewSequence() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {

    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);
    const localPages = loadPages();
    if (localPages.length > 0) {
      setPages(localPages);
      if (localPages[0]) setSelectedPageId(localPages[0].id);
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) {
          setPages(data.pages);
          if (data.pages.length > 0 && !selectedPageId) {
            setSelectedPageId(data.pages[0].id);
          }
        }
        if (data.account) setAccount(data.account);
      }
    });
  }, []);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const initialEmail: SequenceEmail = {
      id: `e_${Date.now()}`,
      subject: subject.trim() || "Your requested resource is inside!",
      delayLabel: "Instantly",
      delayMinutes: 0,
      status: "live",
      sent: 0,
      opened: 0,
    };

    const followUpEmail: SequenceEmail = {
      id: `e_${Date.now() + 1}`,
      subject: "Quick follow-up: Did you get a chance to check out the resource?",
      delayLabel: "1 day later",
      delayMinutes: 1440,
      status: "live",
      sent: 0,
      opened: 0,
    };

    const seq: Sequence = {
      id: `s_${Date.now()}`,
      name: name.trim(),
      pageId: selectedPageId || undefined,
      status: "live",
      stopOnBooking: false,
      stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0 },
      emails: [initialEmail, followUpEmail],
    };

    const next = [seq, ...loadSequences()];
    saveSequences(next);

    // If attached to a magnet page, also update magnet page's sequence info
    if (selectedPageId) {
      const updatedPages = pages.map((p) => {
        if (p.id === selectedPageId) {
          return {
            ...p,
            sequenceEnabled: true,
            sequenceEmails: [
              { id: initialEmail.id, subject: initialEmail.subject, delayDays: 0, body: "Here is your download link." },
              { id: followUpEmail.id, subject: followUpEmail.subject, delayDays: 1, body: "Checking in to see if you have any questions!" },
            ],
          };
        }
        return p;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUserPages", JSON.stringify(updatedPages));
      }
    }

    setTimeout(() => {
      router.push(`/dashboard/sequences/${seq.id}`);
    }, 400);
  }

  return (
    <DashboardShell account={account} title="Create Sequence">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          
          {/* Back button */}
          <Link
            href="/dashboard/sequences"
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-[#2e2e38] px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#25252A] transition shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sequences</span>
          </Link>

          {/* Heading */}
          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Create Follow-up Sequence
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                Automate your initial resource delivery email and scheduled follow-up drip campaign.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <form 
            onSubmit={create}
            className="mt-8 rounded-2xl border border-zinc-200/90 dark:border-[#2e2e38] bg-white/90 dark:bg-[#18181B]/90 p-6 sm:p-8 shadow-sm backdrop-blur-sm space-y-6"
          >
            {/* Sequence Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
                Sequence Name *
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VIP eBook Welcome Sequence"
                maxLength={80}
                required
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500 shadow-xs font-medium"
              />
            </div>

            {/* Attach to Lead Magnet */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Attach to Lead Magnet</span>
                <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold lowercase">automates signups</span>
              </label>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs font-semibold text-zinc-800 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-200 cursor-pointer shadow-xs"
              >
                {pages.length > 0 ? (
                  pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      🎯 {p.name}
                    </option>
                  ))
                ) : (
                  <option value="">Standalone Sequence (No page attached)</option>
                )}
              </select>
            </div>

            {/* Resource Email Subject */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
                Initial Delivery Email Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Here is your free guide download →"
                maxLength={120}
                required
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500 shadow-xs font-medium"
              />
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-[#9B9085]">
                Sent instantly to subscribers the moment they sign up on your lead magnet form.
              </p>
            </div>

            {/* Sequence Steps Preview Card */}
            <div className="rounded-xl border border-[#0066B2]/20 bg-[#EFF6FF]/60 dark:border-[#0066B2]/30 dark:bg-[#0066B2]/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                <Sparkles className="h-4 w-4" />
                <span>Automated Email Steps Preview</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 bg-white dark:bg-[#18181B] p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0066B2] text-[10px] font-bold text-white shrink-0">1</span>
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-zinc-900 dark:text-white">Resource Delivery Email</span>
                    <span className="block text-[11px] text-zinc-500 dark:text-[#9B9085] truncate">{subject || "Here is your resource download"}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">Instantly</span>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-[#18181B] p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-white shrink-0">2</span>
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-zinc-900 dark:text-white">Follow-up Email #1</span>
                    <span className="block text-[11px] text-zinc-500 dark:text-[#9B9085]">Checking in to see if you have any questions</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">1 Day Later</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-zinc-100 dark:border-[#2e2e38] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-zinc-500 dark:text-[#9B9085] flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Automated & Verified Email Sender
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#0066B2] px-6 py-3 text-xs font-bold text-white hover:bg-[#005291] active:scale-[0.98] transition shadow-md cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? "Creating Sequence..." : "Create Sequence & Edit Steps"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}