"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Users, Mail, Download, Search, Plus, Upload, ChevronDown, Filter } from "lucide-react";
import { syncWithDatabase, loadLeads, loadAccount } from "@/lib/store";
import type { Account, Lead } from "@/lib/data";

export default function SignupsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMagnet, setFilterMagnet] = useState("All lead magnets");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load local data instantly
    const localLeads = loadLeads();
    const localAccount = loadAccount();
    if (localLeads.length > 0) setLeads(localLeads);
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setLeads(data.leads || []);
      }
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const uniqueMagnets = Array.from(new Set(leads.map((l) => l.page)));

  // Filtered leads
  const filtered = leads.filter((l) => {
    const matchMagnet = filterMagnet === "All lead magnets" || l.page === filterMagnet;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.email.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.page.toLowerCase().includes(q);
    return matchMagnet && matchSearch;
  });

  // Unique emails (deduped)
  const uniqueSignups = new Set(leads.map((l) => l.email)).size;
  const latestSignup = leads.length > 0 ? leads[0] : null;

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const header = ["Email", "Name", "Lead Magnet", "First Signup", "Signups", "Sequence"];
    const rows = leads.map((l) => [
      l.email,
      l.name,
      l.page,
      l.signedUpAt,
      "1",
      l.sequence || "—",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signups.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = () => alert("CSV import coming soon!");
    input.click();
  };

  const handleAddManually = () => {
    alert("Add manually coming soon!");
  };

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E10]">
        <div className="text-sm text-[#9B9085]">Loading signups...</div>
      </div>
    );
  } return (
    <DashboardShell account={account} title="Signups">
      <div className="flex flex-col min-h-[calc(100vh-3rem)]">
        <div className="flex-1 px-6 py-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-900 dark:text-white">
              Signups
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#3a3a3f] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Everyone who has signed up to a magnet</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Unique signups */}
            <div className="flex items-center rounded-2xl border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-6 py-5 shadow-sm transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-[#FAF8F5] dark:border-[#2e2e38] dark:bg-[#252529] text-zinc-700 dark:text-[#9B9085] mr-5">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">UNIQUE SIGNUPS</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">{uniqueSignups}</p>
              </div>
            </div>

            {/* Latest signup */}
            <div className="flex items-center rounded-2xl border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-6 py-5 shadow-sm transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-[#FAF8F5] dark:border-[#2e2e38] dark:bg-[#252529] text-zinc-700 dark:text-[#9B9085] mr-5">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">LATEST SIGNUP</p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white truncate max-w-[210px] leading-tight">
                  {latestSignup ? latestSignup.email : "No signups yet"}
                </p>
              </div>
            </div>

            {/* Export */}
            <button
              onClick={handleExportCSV}
              className="flex items-center rounded-2xl border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-6 py-5 text-left hover:border-zinc-300 dark:hover:border-[#2e2e35] shadow-sm transition-colors w-full cursor-pointer"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-[#FAF8F5] dark:border-[#2e2e38] dark:bg-[#252529] text-zinc-700 dark:text-[#9B9085] mr-5">
                <Download className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">EXPORT</p>
                <p className="text-base font-semibold text-[#FE6F34] leading-tight">CSV ready to download</p>
              </div>
            </button>
          </div>

          {/* All signups section */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
            {/* Section header */}
            <div className="px-5 pt-5 pb-4 border-b border-zinc-200 dark:border-[#2e2e38]">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">All signups</h3>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">One row per email, deduplicated across every magnet on this account.</p>

              {/* Filter / Search / Action bar */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {/* Magnet filter dropdown */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setFilterOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-zinc-300 dark:hover:border-[#2e2e35] hover:text-zinc-900 dark:hover:text-white transition"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {filterMagnet}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {filterOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-md border border-zinc-200 dark:border-[#2a2a30] bg-white dark:bg-[#18181B] shadow-lg py-1">
                      {["All lead magnets", ...uniqueMagnets].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setFilterMagnet(opt); setFilterOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition ${filterMagnet === opt
                            ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-[#252529] font-medium"
                            : "text-zinc-600 dark:text-[#9B9085] hover:bg-zinc-50 dark:hover:bg-[#252529] hover:text-zinc-900 dark:hover:text-white"
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2 flex-1 min-w-48 focus-within:border-[#FE6F34]">
                  <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-[#9B9085] shrink-0" />
                  <input
                    type="text"
                    placeholder="Search email, name, or magnet"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#9B9085] w-full"
                  />
                </div>

                {/* Add manually */}
                <button
                  onClick={handleAddManually}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-zinc-300 dark:hover:border-[#2e2e35] hover:text-zinc-900 dark:hover:text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add manually
                </button>

                {/* Import CSV */}
                <button
                  onClick={handleImportCSV}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-zinc-300 dark:hover:border-[#2e2e35] hover:text-zinc-900 dark:hover:text-white transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import CSV
                </button>

                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-zinc-300 dark:hover:border-[#2e2e35] hover:text-zinc-900 dark:hover:text-white transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-[#2e2e38]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Email</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Name</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Lead magnets</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">First signup</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Signups</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Sequence</th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#1C1C20]">
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181B]/40 transition">
                      <td className="px-5 py-3.5 text-xs text-zinc-900 dark:text-white font-medium">{lead.email}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085]">{lead.name}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085] max-w-[200px] truncate">{lead.page}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085] whitespace-nowrap">{lead.signedUpAt}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085]">1</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085]">{lead.sequence || "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="text-xs text-zinc-600 dark:text-[#9B9085] hover:text-zinc-900 dark:hover:text-white transition px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-[#18181B]">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">No signups yet</p>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                    Signups appear here once someone enters their email on a published magnet. Or use{" "}
                    <button onClick={handleImportCSV} className="text-[#FE6F34] hover:underline">Import CSV</button>
                    {" / "}
                    <button onClick={handleAddManually} className="text-[#FE6F34] hover:underline">Add manually</button>.
                  </p>
                </div>
              )}
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