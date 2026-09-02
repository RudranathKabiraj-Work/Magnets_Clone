"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MailOpen, Pause, Plus, Rocket, StopCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { type Sequence } from "@/lib/data";
import { loadSequences, loadAccount, syncWithDatabase } from "@/lib/store";

export default function SequencesPage() {
  const [account, setAccount] = useState(() => loadAccount());
  const [sequences, setSequences] = useState<Sequence[]>(() => loadSequences());
  const live = useMemo(() => sequences.filter((s) => s.status === "live").length, [sequences]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.sequences) setSequences(data.sequences);
        if (data.account) setAccount(data.account);
      }
    });
  }, []);

  return (
    <DashboardShell account={account} title="Sequences">
      <div className="flex flex-col min-h-[calc(100vh-3rem)]">
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
          <Link
            href="/dashboard/sequences/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950 dark:bg-brand-orange dark:text-ink-950"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New sequence
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {sequences.map((seq) => {
            const { signedUp, delivered, opened, replied } = seq.stats;
            return (
              <Link
                key={seq.id}
                href={`/dashboard/sequences/${seq.id}`}
                className="group rounded-2xl border border-ink-200 bg-white p-5 transition hover:border-ink-300 hover:shadow-card dark:border-ink-700 dark:bg-ink-900/95 dark:hover:border-ink-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-soft text-brand-orange dark:bg-ink-950">
                      <Rocket className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-950 group-hover:text-brand-orange dark:text-white dark:group-hover:text-brand-orange">
                        {seq.name}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        {seq.emails.length} {seq.emails.length === 1 ? "email" : "emails"} · updated recently
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={seq.status} />
                </div>
                <div className="mt-5 grid grid-cols-4 divide-x divide-ink-200 rounded-md border border-ink-200 text-center dark:divide-ink-700 dark:border-ink-700">
                  <div className="px-2 py-3">
                    <p className="text-base font-semibold text-ink-950 dark:text-white">{signedUp.toLocaleString()}</p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">Signed up</p>
                  </div>
                  <div className="px-2 py-3">
                    <p className="text-base font-semibold text-ink-950 dark:text-white">{delivered.toLocaleString()}</p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">Delivered</p>
                  </div>
                  <div className="px-2 py-3">
                    <p className="text-base font-semibold text-ink-950 dark:text-white">{opened.toLocaleString()}</p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">Opened</p>
                  </div>
                  <div className="px-2 py-3">
                    <p className="text-base font-semibold text-ink-950 dark:text-white">{replied.toLocaleString()}</p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">Replied</p>
                  </div>
                </div>
              </Link>
            );
          })}

          <Link
            href="/dashboard/sequences/new"
            className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-300 text-center transition hover:border-ink-400 hover:bg-white dark:border-ink-700 dark:hover:border-ink-500 dark:hover:bg-ink-900/95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-orange dark:bg-ink-950">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-white">Create a new sequence</p>
              <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">Deliver the resource, then follow up on your schedule.</p>
            </div>
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="flex gap-3 rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900/95">
            <MailOpen className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" aria-hidden="true" />
            <p className="text-sm leading-6 text-ink-600 dark:text-ink-300">
              The first email goes out the moment someone signs up. No manual sending.
            </p>
          </div>
          <div className="flex gap-3 rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900/95">
            <Pause className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" aria-hidden="true" />
            <p className="text-sm leading-6 text-ink-600 dark:text-ink-300">
              Control the delay for each email. Pause or stop the whole sequence anytime.
            </p>
          </div>
          <div className="flex gap-3 rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900/95">
            <StopCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" aria-hidden="true" />
            <p className="text-sm leading-6 text-ink-600 dark:text-ink-300">
              Stop automatically when someone books a call via Calendly or Cal.com.
            </p>
          </div>
        </div>
      </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-[#9B9085]">
          <span>Magnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>
    </DashboardShell>
  );
}