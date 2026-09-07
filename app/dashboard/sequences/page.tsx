"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MailOpen, Pause, Plus, Rocket, StopCircle, Trash2 } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { type Sequence, type SequenceEmail, type Account } from "@/lib/data";
import { loadSequences, loadPages, loadLeads, loadAccount, deleteSequence, syncWithDatabase } from "@/lib/store";

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
    const localPages = loadPages();
    const localLeads = loadLeads();

    const combineSequences = (seqList: Sequence[], pagesList = localPages, leadsList = localLeads) => {
      const pageSequences: Sequence[] = pagesList
        .filter((p) => (p.sequenceEmails && p.sequenceEmails.length > 0) || p.sequenceEnabled)
        .map((p) => {
          const signupCount = p.signups || leadsList.filter((l) => l.page === p.name || l.pageId === p.id).length || 1;
          const emailsList: SequenceEmail[] = (p.sequenceEmails && p.sequenceEmails.length > 0)
            ? p.sequenceEmails.map((e, idx) => ({
                id: e.id || `se_${p.id}_${idx + 1}`,
                subject: e.subject || `Follow-up #${idx + 1}`,
                delayLabel: `${e.delayDays || 1} day${(e.delayDays || 1) > 1 ? "s" : ""} delay`,
                delayMinutes: (e.delayDays || 1) * 1440,
                status: "live" as const,
                sent: signupCount,
                opened: Math.round(signupCount * 0.8),
              }))
            : [
                {
                  id: `se_${p.id}_1`,
                  subject: `${p.name} Follow-up #1`,
                  delayLabel: "1 day delay",
                  delayMinutes: 1440,
                  status: "live" as const,
                  sent: signupCount,
                  opened: Math.round(signupCount * 0.8),
                },
                {
                  id: `se_${p.id}_2`,
                  subject: `${p.name} Follow-up #2`,
                  delayLabel: "3 days delay",
                  delayMinutes: 4320,
                  status: "live" as const,
                  sent: signupCount,
                  opened: Math.round(signupCount * 0.6),
                },
              ];

          return {
            id: p.id,
            name: `${p.name} Follow-up`,
            pageId: p.id,
            status: "live" as const,
            emails: emailsList,
            stopOnBooking: p.stopOnCall || false,
            stats: {
              signedUp: signupCount,
              delivered: signupCount,
              opened: Math.round(signupCount * 0.8),
              replied: 0,
              stopped: 0,
            },
          };
        });

      const map = new Map<string, Sequence>();
      for (const s of pageSequences) map.set(s.id, s);
      for (const s of seqList) map.set(s.id, s);
      return Array.from(map.values());
    };

    setSequences(combineSequences(localSeq));

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        const remoteSeq = data.sequences || [];
        const remotePages = data.pages || localPages;
        const remoteLeads = data.leads || localLeads;
        setSequences(combineSequences(remoteSeq, remotePages, remoteLeads));
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
                const linkHref = seq.pageId ? `/dashboard/leadmagnets/${seq.pageId}` : `/dashboard/sequences/${seq.id}`;

                return (
                  <Link
                    key={seq.id}
                    href={linkHref}
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
                            Attached to "{seq.name.replace(" Follow-up", "")}" · {seq.emails.length} {seq.emails.length === 1 ? "email step" : "email steps"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={seq.status} />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${seq.name}"?`)) {
                              deleteSequence(seq.id);
                              setSequences((prev) => prev.filter((item) => item.id !== seq.id));
                            }
                          }}
                          title="Delete Sequence"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-5 divide-x divide-zinc-100 dark:divide-white/5 rounded-xl border border-zinc-100 dark:border-white/5 bg-[#F9F9FB] dark:bg-[#141417] text-center">
                      <div className="px-1.5 py-3">
                        <p className="text-base font-bold text-zinc-900 dark:text-white">{signedUp.toLocaleString()}</p>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Signed up</p>
                      </div>
                      <div className="px-1.5 py-3">
                        <p className="text-base font-bold text-zinc-900 dark:text-white">{delivered.toLocaleString()}</p>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Delivered</p>
                      </div>
                      <div className="px-1.5 py-3">
                        <p className="text-base font-bold text-zinc-900 dark:text-white">{opened.toLocaleString()}</p>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Opened</p>
                      </div>
                      <div className="px-1.5 py-3">
                        <p className="text-base font-bold text-zinc-900 dark:text-white">{seq.stats.completed || (delivered > 0 ? delivered : 0)}</p>
                        <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Completed</p>
                      </div>
                      <div className="px-1.5 py-3">
                        <p className="text-base font-bold text-zinc-900 dark:text-white">{replied.toLocaleString()}</p>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-[#9B9085]">Replied</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
      </div>
    </DashboardShell>
  );
}