"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Pencil,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, loadAccount, syncWithDatabase } from "@/lib/store";

export default function LeadMagnetAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(() => loadAccount());
  const [page, setPage] = useState<MagnetPage | null>(() => {
    const pages = loadPages();
    return pages.find((p) => p.id === params.id) || null;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) {
          const found = data.pages.find((p) => p.id === params.id);
          if (found) setPage(found);
        }
        if (data.account) setAccount(data.account);
      }
    });
  }, [params.id]);

  const visitsCount = page?.views || 0;
  const signupsCount = page?.signups || 0;
  const conversionRate = visitsCount > 0 ? ((signupsCount / visitsCount) * 100).toFixed(1) + "%" : "0.0%";

  return (
    <DashboardShell account={account} title="Analytics">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#F8FBFF] dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-950 dark:text-white">
                Analytics
                <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B]">?</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                {page?.name || "Magnet"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/leadmagnets"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-[#18181B] px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition shadow-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All pages</span>
              </Link>

              {params.id && (
                <Link
                  href={`/dashboard/leadmagnets/${params.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-[#18181B] px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition shadow-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit magnet</span>
                </Link>
              )}
            </div>
          </div>

          {/* Metric Cards Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Visits */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-zinc-800 dark:bg-[#18181B] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Visits</span>
                <Sparkles className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-900 dark:text-white">{visitsCount}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 font-medium">0 in the last 30 days</div>
              </div>
            </div>

            {/* Card 2: Total signups */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-zinc-800 dark:bg-[#18181B] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total signups</span>
                <Users className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-900 dark:text-white">{signupsCount}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 font-medium">
                  {signupsCount} unique people · 0 in the last 30 days
                </div>
              </div>
            </div>

            {/* Card 3: Conversion rate */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-zinc-800 dark:bg-[#18181B] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Conversion rate</span>
                <BarChart2 className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-900 dark:text-white">{conversionRate}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 font-medium">Tracked conversions ÷ visits</div>
              </div>
            </div>

            {/* Card 4: Tracked conversions */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-zinc-800 dark:bg-[#18181B] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tracked conversions</span>
                <CheckCircle2 className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-900 dark:text-white">{signupsCount}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 font-medium">0 in the last 30 days</div>
              </div>
            </div>

            {/* Card 5: Average engaged time */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-zinc-800 dark:bg-[#18181B] p-5 space-y-3 shadow-xs sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Average engaged time</span>
                <Clock className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-zinc-900 dark:text-white">0s</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 font-medium">Time the page was actively visible</div>
              </div>
            </div>
          </div>

          {/* Visits Chart Section */}
          <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-zinc-800 dark:bg-[#18181B] p-6 space-y-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white">Visits over the last 30 days</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Each bar is one day. Orange shows tracked conversions.</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  Visits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FE6F34]" />
                  Conversions
                </span>
              </div>
            </div>

            {/* Chart Container / Empty State */}
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-50/50 dark:bg-[#121214]">
              <BarChart2 className="h-8 w-8 text-zinc-400 dark:text-zinc-600 mb-3" />
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">No visits recorded yet</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-md mt-1 leading-relaxed">
                Publish and share this magnet. New visits and successful form submissions will appear here automatically.
              </p>
            </div>
          </div>

          {/* Footer Explanatory Note Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800/60 dark:bg-[#141417] p-5 text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed font-normal">
            Total signups count every successful submission, including repeat requests from the same person. The unique people figure deduplicates those records by email address. A tracked conversion is a successful signup matched to an anonymous browser-tab visit; tracked conversions are used for the conversion rate, chart, and A/B tests. Refreshing the same page does not inflate visits. Engaged time only counts while the page is visible. A video play is one successful signup explicitly pressing Play, counted once. A quiz completion requires every configured answer to be saved. No names, emails, cookies, or raw IP addresses are stored in visit analytics. Historical visit activity from before tracking began cannot be reconstructed.
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
