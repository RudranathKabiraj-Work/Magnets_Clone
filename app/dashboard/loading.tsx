"use client";

import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <DashboardShell title="Loading">
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#E0EDFB] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#18181B] animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-zinc-600 dark:text-[#9B9085]">
            Loading content...
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
