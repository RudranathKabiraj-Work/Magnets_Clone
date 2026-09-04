"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Mail, MessageSquare, Newspaper, Plug, Workflow, Users } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import { loadIntegrations, saveIntegrations, loadAccount, syncWithDatabase } from "@/lib/store";
import type { Account, Integration } from "@/lib/data";

const categoryIcons = {
  newsletter: Newspaper,
  crm: Users,
  messaging: MessageSquare,
  automation: Workflow,
  calendar: CalendarClock,
  email: Mail,
} as const;

export default function IntegrationsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<Integration[]>([]);
  const connected = items.filter((i) => i.connected).length;

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);
    const localItems = loadIntegrations();
    if (localItems.length > 0) setItems(localItems);

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.integrations) setItems(data.integrations);
        if (data.account) setAccount(data.account);
      }
    });
  }, []);

  function toggle(id: string) {
    const nextItems = items.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i));
    setItems(nextItems);
    saveIntegrations(nextItems);
  }

  return (
    <DashboardShell account={account} title="Integrations">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
      <div className="mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 lg:px-10 flex-1">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-white">
              Integrations <span className="text-ink-400">({connected} connected)</span>
            </h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              Send new signups where work happens, and stop sequences after a booking.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || Plug;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-ink-200 bg-white p-5 sm:flex-row sm:items-center dark:border-ink-700 dark:bg-ink-900/95"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${item.connected
                        ? "bg-brand-soft text-brand-orange dark:bg-ink-950"
                        : "bg-ink-100 text-ink-400 dark:bg-ink-950 dark:text-ink-500"
                      }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-950 dark:text-white">{item.name}</p>
                    <p className="mt-0.5 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">{item.description}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-ink-400 dark:text-ink-500">
                      <Plug className="h-3 w-3" aria-hidden="true" />
                      Trigger: {item.trigger}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {item.connected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/90 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-400">
                      Not connected
                    </span>
                  )}
                  <Button onClick={() => toggle(item.id)} className="w-auto">
                    {item.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-ink-200 bg-brand-soft p-5 text-sm leading-6 text-ink-700 dark:border-ink-700 dark:bg-ink-900/95 dark:text-ink-300">
          <p className="font-semibold text-ink-950 dark:text-white">A note on connections</p>
          <p className="mt-1.5">
            Each integration only receives the information needed to perform its action. Signup data stays owned by you, and
            credentials are encrypted at rest.
          </p>
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