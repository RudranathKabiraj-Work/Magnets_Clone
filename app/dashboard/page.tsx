"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHome from "@/components/dashboard/dashboard-home";
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
      <DashboardHome account={account} />
    </DashboardShell>
  );
}