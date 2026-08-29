import Link from "next/link";
import { ArrowUpRight, Globe, Inbox, Link2, Search, UserPlus } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type Lead } from "@/lib/data";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, AccountModel } from "@/lib/models";
import { account as seedAccount } from "@/lib/data";

export const dynamic = "force-dynamic";

const statusStyles: Record<Lead["status"], { dot: string; text: string; label: string }> = {
  new: { dot: "bg-brand-orange", text: "text-ink-700 dark:text-ink-300", label: "Signed up" },
  delivered: { dot: "bg-ink-400", text: "text-ink-500 dark:text-ink-400", label: "Delivered" },
  opened: { dot: "bg-brand-aqua", text: "text-ink-700 dark:text-ink-300", label: "Opened" },
  replied: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-300", label: "Replied" },
  stopped: { dot: "bg-brand-yellow", text: "text-ink-500 dark:text-ink-400", label: "Stopped" },
};

function SourceIcon({ source }: { source: Lead["source"] }) {
  if (source === "magnets") return <Inbox className="h-3 w-3" aria-hidden="true" />;
  if (source === "custom-domain") return <Globe className="h-3 w-3" aria-hidden="true" />;
  return <Link2 className="h-3 w-3" aria-hidden="true" />;
}

export default async function LeadsPage() {
  await dbConnect();
  
  const [accountRaw, leadsRaw] = await Promise.all([
    AccountModel.findOne().lean(),
    LeadModel.find().lean()
  ]);
  const account = accountRaw ? JSON.parse(JSON.stringify(accountRaw)) : seedAccount;
  const leads = JSON.parse(JSON.stringify(leadsRaw)) as Lead[];

  return (
    <DashboardShell account={account} title="Leads">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-white">
              All leads <span className="text-ink-400">({leads.length})</span>
            </h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              Everyone who signed up, plus their delivery and follow-up status.
            </p>
          </div>
          <div className="flex h-9 items-center gap-2 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900/95 dark:text-ink-400">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input placeholder="Search leads" className="w-40 bg-transparent text-sm outline-none placeholder:text-ink-400" />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900/95">
          <div className="hidden grid-cols-[60px_minmax(0,1fr)_minmax(0,1.6fr)_180px] gap-4 border-b border-ink-200 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400 sm:grid dark:border-ink-700 dark:text-ink-500">
            <span />
            <span>Lead</span>
            <span>Status</span>
            <span className="text-right">Signed up</span>
          </div>
          <div className="divide-y divide-ink-200 dark:divide-ink-700">
            {leads.map((lead) => {
              const st = statusStyles[lead.status];
              return (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="grid items-center gap-4 px-5 py-3.5 transition hover:bg-ink-50/70 sm:grid-cols-[60px_minmax(0,1fr)_minmax(0,1.6fr)_180px] dark:hover:bg-white/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-ink-700 dark:bg-ink-950 dark:text-ink-300">
                    {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-950 dark:text-white">{lead.name}</p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{lead.email}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-ink-700 dark:text-ink-300">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
                      {st.label}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-ink-500 dark:text-ink-400">
                      <span className="flex shrink-0 items-center gap-1 text-ink-400 dark:text-ink-500">
                        <SourceIcon source={lead.source} />
                      </span>
                      {lead.page} · {lead.sequenceStep ?? "No sequence"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <p className="text-xs text-ink-500 dark:text-ink-400">{lead.signedUpAt}</p>
                    <ArrowUpRight className="h-4 w-4 text-ink-300 dark:text-ink-600" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
          {leads.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-orange dark:bg-ink-950">
                <UserPlus className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-ink-700 dark:text-ink-300">No leads yet</p>
              <p className="max-w-xs text-sm text-ink-500 dark:text-ink-400">Share your published page and leads will show up here instantly.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}