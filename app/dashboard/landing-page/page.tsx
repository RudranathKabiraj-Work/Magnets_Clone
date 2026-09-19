"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";
import { FileText } from "lucide-react";

export default function LandingPagePlaceholder() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const acc = loadAccount();
    if (acc) setAccount(acc);
  }, []);

  return (
    <DashboardShell account={account} title="Landing Page">
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-[#0B0B0D]">
        <div className="px-6 pt-6 lg:px-8 border-b border-zinc-200/80 dark:border-zinc-800/60 bg-white/80 dark:bg-[#121215] backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Landing Page
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Custom landing page workspace.
            </p>
          </div>
        </div>

        <div className="flex-1 px-6 py-12 lg:px-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mb-4">
            <FileText className="h-8 w-8 stroke-[1.75px]" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Landing Page Workspace
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            This page is ready for implementation.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
