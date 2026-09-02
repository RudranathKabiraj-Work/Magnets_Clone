"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Pencil,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, loadAccount, syncWithDatabase } from "@/lib/store";

export default function GeneralAnalyticsPage() {
  const [account, setAccount] = useState<Account | null>(() => loadAccount());
  const [pages, setPages] = useState<MagnetPage[]>(() => loadPages());

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) setPages(data.pages);
        if (data.account) setAccount(data.account);
      }
    });
  }, []);

  const totalVisits = pages.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalSignups = pages.reduce((acc, p) => acc + (p.signups || 0), 0);
  const conversionRate = totalVisits > 0 ? ((totalSignups / totalVisits) * 100).toFixed(1) + "%" : "0.0%";

  return (
    <DashboardShell account={account} title="Analytics">
      <div className="min-h-screen bg-[#0E0E10] text-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2 text-white">
                Analytics
                <span
                  className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 text-xs font-normal text-zinc-400 hover:bg-zinc-800 transition"
                  title="Track real-time visits, signups, and conversion metrics across all your lead magnets."
                >
                  ?
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {account?.name || "BDA"} · Overview
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/leadmagnets"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-[#18181B] px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All pages</span>
              </Link>
            </div>
          </div>

          {/* Metric Cards Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Visits */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Visits</span>
                <Sparkles className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">{totalVisits}</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium">0 in the last 30 days</div>
              </div>
            </div>

            {/* Card 2: Total signups */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Total signups</span>
                <Users className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">{totalSignups}</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium">
                  {totalSignups} unique people · 0 in the last 30 days
                </div>
              </div>
            </div>

            {/* Card 3: Conversion rate */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Conversion rate</span>
                <BarChart2 className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">{conversionRate}</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium">Tracked conversions ÷ visits</div>
              </div>
            </div>

            {/* Card 4: Tracked conversions */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Tracked conversions</span>
                <CheckCircle2 className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">{totalSignups}</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium">0 in the last 30 days</div>
              </div>
            </div>

            {/* Card 5: Average engaged time */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 space-y-3 shadow-sm sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Average engaged time</span>
                <Clock className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">0s</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-medium">Time the page was actively visible</div>
              </div>
            </div>
          </div>

          {/* Visits Chart Section */}
          <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-white">Visits over the last 30 days</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Each bar is one day. Orange shows tracked conversions.</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  Visits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FE6F34]" />
                  Conversions
                </span>
              </div>
            </div>

            {/* Chart Container / Empty State */}
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-zinc-800/80 rounded-xl bg-[#121214]">
              <BarChart2 className="h-8 w-8 text-zinc-600 mb-3" />
              <h4 className="text-sm font-extrabold text-white">No visits recorded yet</h4>
              <p className="text-xs text-zinc-500 text-center max-w-md mt-1 leading-relaxed">
                Publish and share your lead magnets. New visits and successful form submissions will appear here automatically.
              </p>
            </div>
          </div>

          {/* Footer Explanatory Note Card */}
          <div className="rounded-2xl border border-zinc-800/60 bg-[#141417] p-5 text-xs text-zinc-500 leading-relaxed font-normal">
            Total signups count every successful submission, including repeat requests from the same person. The unique people figure deduplicates those records by email address. A tracked conversion is a successful signup matched to an anonymous browser-tab visit; tracked conversions are used for the conversion rate, chart, and A/B tests. Refreshing the same page does not inflate visits. Engaged time only counts while the page is visible. A video play is one successful signup explicitly pressing Play, counted once. A quiz completion requires every configured answer to be saved. No names, emails, cookies, or raw IP addresses are stored in visit analytics. Historical visit activity from before tracking began cannot be reconstructed.
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
