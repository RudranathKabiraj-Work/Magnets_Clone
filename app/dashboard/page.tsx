"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const acc = loadAccount();
    if (acc) setAccount(acc);
  }, []);

  return (
    <DashboardShell account={account} title="Dashboard">
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-[#0B0B0D]" />
    </DashboardShell>
  );
}