"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Users, Mail, Download, Search, Plus, Upload, ChevronDown, Filter, Trash2 } from "lucide-react";
import { syncWithDatabase, loadLeads, loadAccount, saveLeads, deleteLead } from "@/lib/store";
import type { Account, Lead } from "@/lib/data";

export default function SignupsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMagnet, setFilterMagnet] = useState("All lead magnets");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const handleDeleteLead = (leadId: string) => {
    if (!confirm("Are you sure you want to delete this signup?")) return;
    const updated = leads.filter((l) => l.id !== leadId);
    setLeads(updated);
    deleteLead(leadId);
    if (selectedLead?.id === leadId) {
      setSelectedLead(null);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

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

 return (
    <DashboardShell account={account} title="Signups">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
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
            <div className="flex items-center rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] px-6 py-5 shadow-sm transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mr-5">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0066B2]/70 dark:text-[#38BDF8]/70">UNIQUE SIGNUPS</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">{uniqueSignups}</p>
              </div>
            </div>

            {/* Latest signup */}
            <div className="flex items-center rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] px-6 py-5 shadow-sm transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mr-5">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0066B2]/70 dark:text-[#38BDF8]/70">LATEST SIGNUP</p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white truncate max-w-[210px] leading-tight">
                  {latestSignup ? latestSignup.email : "No signups yet"}
                </p>
              </div>
            </div>

            {/* Export */}
            <button
              onClick={handleExportCSV}
              className="flex items-center rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] px-6 py-5 text-left hover:border-[#0066B2] dark:hover:border-[#0066B2] shadow-sm transition-colors w-full cursor-pointer"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mr-5">
                <Download className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0066B2]/70 dark:text-[#38BDF8]/70">EXPORT</p>
                <p className="text-base font-semibold text-[#0066B2] dark:text-[#38BDF8] leading-tight">CSV ready to download</p>
              </div>
            </button>
          </div>

          {/* All signups section */}
          <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
            {/* Section header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#0066B2]/20 dark:border-[#0066B2]/20">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">All signups</h3>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">One row per email, deduplicated across every magnet on this account.</p>

              {/* Filter / Search / Action bar */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {/* Magnet filter dropdown */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setFilterOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-md border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-[#0066B2] dark:hover:border-[#0066B2] hover:text-[#0066B2] dark:hover:text-white transition"
                  >
                    <Filter className="h-3.5 w-3.5 text-[#0066B2]" />
                    {filterMagnet}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {filterOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-md border border-[#0066B2]/30 dark:border-[#0066B2]/40 bg-white dark:bg-[#18181B] shadow-lg py-1">
                      {["All lead magnets", ...uniqueMagnets].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setFilterMagnet(opt); setFilterOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition ${filterMagnet === opt
                            ? "text-[#0066B2] dark:text-[#38BDF8] bg-[#EFF6FF] dark:bg-[#0066B2]/20 font-medium"
                            : "text-zinc-600 dark:text-[#9B9085] hover:bg-[#F8FBFF] dark:hover:bg-[#0066B2]/15 hover:text-[#0066B2] dark:hover:text-white"
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-md border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#18181B] px-3.5 py-2 flex-1 min-w-48 focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2]">
                  <Search className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
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
                  className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-[#0066B2] dark:hover:border-[#0066B2] hover:text-[#0066B2] dark:hover:text-white transition"
                >
                  <Plus className="h-3.5 w-3.5 text-[#0066B2]" />
                  Add manually
                </button>

                {/* Import CSV */}
                <button
                  onClick={handleImportCSV}
                  className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-[#0066B2] dark:hover:border-[#0066B2] hover:text-[#0066B2] dark:hover:text-white transition"
                >
                  <Upload className="h-3.5 w-3.5 text-[#0066B2]" />
                  Import CSV
                </button>

                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#18181B] px-3.5 py-2 text-xs text-zinc-600 dark:text-[#9B9085] hover:border-[#0066B2] dark:hover:border-[#0066B2] hover:text-[#0066B2] dark:hover:text-white transition"
                >
                  <Download className="h-3.5 w-3.5 text-[#0066B2]" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-[#2e2e38]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Email</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Name</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Lead magnets</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">First signup</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Signups</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Sequence</th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]/60 dark:divide-[#1C1C20]">
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#EFF6FF]/50 dark:hover:bg-[#18181B]/40 transition">
                      <td className="px-5 py-3.5 text-xs text-zinc-900 dark:text-white font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-[11px] font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
                            {(lead.name || lead.email || "U").slice(0, 2)}
                          </div>
                          <span>{lead.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085]">{lead.name}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085] max-w-[200px] truncate">{lead.page}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085] whitespace-nowrap">{lead.signedUpAt}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085]">1</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-600 dark:text-[#9B9085]">{lead.sequence || "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:text-[#005799] font-medium transition px-2.5 py-1 rounded-lg hover:bg-[#EFF6FF] dark:hover:bg-[#0066B2]/20 cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            title="Delete signup"
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
                    <button onClick={handleImportCSV} className="text-[#0066B2] font-semibold hover:underline">Import CSV</button>
                    {" / "}
                    <button onClick={handleAddManually} className="text-[#0066B2] font-semibold hover:underline">Add manually</button>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lead Details Modal */}
        {selectedLead && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#18181B] p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-sm font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
                    {(selectedLead.name || selectedLead.email || "U").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">{selectedLead.name || "Lead Details"}</h3>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085]">{selectedLead.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#25252A] dark:hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                  <span className="text-zinc-500 dark:text-[#9B9085]">Email Address</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{selectedLead.email}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                  <span className="text-zinc-500 dark:text-[#9B9085]">Lead Magnet</span>
                  <span className="font-semibold text-zinc-900 dark:text-white max-w-[220px] truncate">{selectedLead.page}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                  <span className="text-zinc-500 dark:text-[#9B9085]">Signup Date & Time</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{selectedLead.signedUpAt}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                  <span className="text-zinc-500 dark:text-[#9B9085]">Sequence Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedLead.sequence || "Delivered"}</span>
                </div>

                {selectedLead.customAnswer && (
                  <div className="py-2 space-y-1">
                    <span className="block text-zinc-500 dark:text-[#9B9085]">AI Questionnaire Response</span>
                    <p className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white leading-relaxed">
                      "{selectedLead.customAnswer}"
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-white/10 flex justify-between items-center">
                <button
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete signup
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 rounded-xl bg-[#0066B2] text-xs font-semibold text-white hover:bg-[#005799] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto border-t border-[#E2E8F0] dark:border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-zinc-500 dark:text-[#9B9085]">
          <span>LeadMagnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>
    </DashboardShell>
  );
}