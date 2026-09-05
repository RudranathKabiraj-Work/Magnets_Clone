"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MailOpen, Pause, Plus, Rocket, StopCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { type Sequence, type Account } from "@/lib/data";
import { loadSequences, loadAccount, syncWithDatabase } from "@/lib/store";

export default function SequencesPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const live = useMemo(() => sequences.filter((s) => s.status === "live").length, [sequences]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);
    const localSeq = loadSequences();
    if (localSeq.length > 0) setSequences(localSeq);

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.sequences) setSequences(data.sequences);
        if (data.account) setAccount(data.account);
      }
    });
  }, []);

  return (
    <DashboardShell account={account} title="Sequences">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
      <div className="mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 lg:px-10 flex-1">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-white">
              Follow-up sequences <span className="text-ink-400">({sequences.length})</span>
            </h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              {live} live · Automate the resource email, then follow up while the problem is top of mind.
            </p>
          </div>
          {sequences.length > 0 && (
            <Link
              href="/dashboard/sequences/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0066B2] px-4 text-xs font-bold text-white shadow-md hover:bg-[#005799] transition dark:bg-[#0066B2] dark:hover:bg-[#005799]"
            >
              <Plus className="h-4 w-4 stroke-[2.5px]" aria-hidden="true" />
              New sequence
            </Link>
          )}
        </div>

        {/* Active Sequences Grid OR Professional Empty State */}
        {sequences.length > 0 ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {sequences.map((seq) => {
              const { signedUp, delivered, opened, replied } = seq.stats;
              return (
                <Link
                  key={seq.id}
                  href={`/dashboard/sequences/${seq.id}`}
                  className="group rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#18181B] p-6 transition-all duration-200 hover:border-[#0066B2] dark:hover:border-[#38BDF8] shadow-xs hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                        <Rocket className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition">
                          {seq.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                          {seq.emails.length} {seq.emails.length === 1 ? "email step" : "email steps"} · Updated recently
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={seq.status} />
                  </div>

                  <div className="mt-5 grid grid-cols-4 divide-x divide-zinc-100 dark:divide-white/5 rounded-xl border border-zinc-100 dark:border-white/5 bg-[#F9F9FB] dark:bg-[#141417] text-center">
                    <div className="px-2 py-3">
                      <p className="text-base font-bold text-zinc-900 dark:text-white">{signedUp.toLocaleString()}</p>
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Signed up</p>
                    </div>
                    <div className="px-2 py-3">
                      <p className="text-base font-bold text-zinc-900 dark:text-white">{delivered.toLocaleString()}</p>
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Delivered</p>
                    </div>
                    <div className="px-2 py-3">
                      <p className="text-base font-bold text-zinc-900 dark:text-white">{opened.toLocaleString()}</p>
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Opened</p>
                    </div>
                    <div className="px-2 py-3">
                      <p className="text-base font-bold text-zinc-900 dark:text-white">{replied.toLocaleString()}</p>
                      <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Replied</p>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Compact Add Card when items exist */}
            <Link
              href="/dashboard/sequences/new"
              className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-[#18181B]/50 p-6 text-center transition hover:border-[#0066B2] dark:hover:border-[#38BDF8] hover:bg-white dark:hover:bg-[#18181B]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Create another sequence</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-[#9B9085]">Add another automated email follow-up funnel</p>
              </div>
            </Link>
          </div>
        ) : (
          /* Sleek Vercel-Style Hero Empty State */
          <div className="mt-8 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-8 sm:p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0066B2]/10 dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] mb-5 border border-[#0066B2]/20">
              <MailOpen className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">No follow-up sequences yet</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-[#9B9085] max-w-md mx-auto leading-relaxed">
              Automate your email delivery, send scheduled follow-ups, and convert new subscribers into clients automatically.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/dashboard/sequences/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#005799] transition dark:bg-[#0066B2] dark:hover:bg-[#005799]"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
                Create your first sequence
              </Link>
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-5 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <MailOpen className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">Instant Trigger</h4>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                The first email sends the moment someone signs up. No manual work.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-5 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <Pause className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">Custom Delays</h4>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                Control the delay for each email. Pause or stop the sequence anytime.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-5 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <StopCircle className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">Smart Calendar Stop</h4>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                Stops automatically when a lead books a call via Calendly or Cal.com.
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-[#9B9085]">
          <span>LeadMagnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>
    </DashboardShell>
  );
}