"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
  Users,
  Mail,
  Download,
  Search,
  Plus,
  Upload,
  ChevronDown,
  Filter,
  Trash2,
  Check,
  AlertCircle,
  X,
  Sparkles,
  FileSpreadsheet,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Send,
  Eye,
  Copy,
  ExternalLink,
  Tag,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { syncWithDatabase, loadLeads, loadAccount, loadPages, loadSequences, saveLeads, deleteLead } from "@/lib/store";
import type { Account, Lead, MagnetPage, Sequence } from "@/lib/data";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function SignupsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [magnetPages, setMagnetPages] = useState<MagnetPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Search
  const [search, setSearch] = useState("");
  const [filterMagnet, setFilterMagnet] = useState("All lead magnets");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadMagnet, setNewLeadMagnet] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importedLeadsPreview, setImportedLeadsPreview] = useState<Partial<Lead>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");

  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection & Bulk Delete State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    // Load local data instantly
    const localLeads = loadLeads();
    const localAccount = loadAccount();
    const localPages = loadPages();

    if (localLeads.length > 0) setLeads(localLeads);
    if (localAccount) setAccount(localAccount);
    if (localPages.length > 0) setMagnetPages(localPages);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setLeads(data.leads || []);
        if (data.pages) setMagnetPages(data.pages);
      }
    });
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when any modal is open
  const isAnyModalOpen = Boolean(selectedLead || showAddModal || showImportModal || leadToDelete);
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyModalOpen]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Delete Lead (Modal Powered)
  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);

    try {
      const updated = leads.filter((l) => l.id !== leadToDelete.id);
      setLeads(updated);
      deleteLead(leadToDelete.id);
      setSelectedLeadIds((prev) => prev.filter((id) => id !== leadToDelete.id));

      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null);
      }

      addToast("info", `Removed ${leadToDelete.email} from signups.`);
    } catch (err) {
      console.error("Error deleting lead:", err);
      addToast("error", "Failed to delete signup.");
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
    }
  };

  // Bulk Selection Helpers & Handler
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === paginatedLeads.length && paginatedLeads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    setIsBulkDeleting(true);

    try {
      const idsToDelete = new Set(selectedLeadIds);
      const updated = leads.filter((l) => !idsToDelete.has(l.id));
      setLeads(updated);

      selectedLeadIds.forEach((id) => deleteLead(id));

      addToast("info", `Successfully deleted ${selectedLeadIds.length} selected signups.`);
      setSelectedLeadIds([]);
      setShowBulkDeleteModal(false);
    } catch (err) {
      console.error("Error bulk deleting leads:", err);
      addToast("error", "Failed to delete selected signups.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // 2. Add Lead Manually (Modal Powered)
  const handleAddManuallySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadEmail.trim()) {
      addToast("error", "Email address is required.");
      return;
    }

    setIsAdding(true);

    try {
      const magnetTitle = newLeadMagnet || (magnetPages.length > 0 ? magnetPages[0].name : "Direct Signup");
      const pageId = magnetPages.find((p) => p.name === magnetTitle)?.id || "";

      const newLead: Lead = {
        id: Math.random().toString(36).substring(2, 9),
        email: newLeadEmail.trim().toLowerCase(),
        name: newLeadName.trim() || newLeadEmail.split("@")[0],
        page: magnetTitle,
        pageId: pageId,
        signedUpAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }),
        sequence: `${magnetTitle} Sequence`,
        status: "new",
        source: "leadmagnets",
        tags: [],
      };

      const updated = [newLead, ...leads];
      setLeads(updated);
      saveLeads(updated);

      // Trigger backend addLead endpoint to send lead alerts & sync MongoDB
      const currentUserEmail = localStorage.getItem("currentUserEmail") || account?.email || "";
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addLead",
          data: newLead,
          email: currentUserEmail,
        }),
      }).catch(console.error);

      addToast("success", `Added ${newLead.email} to signups.`);
      setNewLeadName("");
      setNewLeadEmail("");
      setNewLeadMagnet("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add lead", err);
      addToast("error", "Failed to add signup.");
    } finally {
      setIsAdding(false);
    }
  };

  // 3. Import CSV File & Parse Contacts
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        addToast("error", "CSV file is empty.");
        return;
      }

      const parsed: Partial<Lead>[] = [];
      const defaultMagnet = magnetPages.length > 0 ? magnetPages[0].name : "Imported Magnet";

      // Simple CSV parsing handling commas & headers
      const startIndex = lines[0].toLowerCase().includes("email") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length > 0 && cols[0].includes("@")) {
          parsed.push({
            id: Math.random().toString(36).substring(2, 9),
            email: cols[0].toLowerCase(),
            name: cols[1] || cols[0].split("@")[0],
            page: cols[2] || defaultMagnet,
            signedUpAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            sequence: "Imported Contact",
          });
        } else if (cols.length > 1 && cols[1].includes("@")) {
          // If name is first, email second
          parsed.push({
            id: Math.random().toString(36).substring(2, 9),
            email: cols[1].toLowerCase(),
            name: cols[0] || cols[1].split("@")[0],
            page: cols[2] || defaultMagnet,
            signedUpAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            sequence: "Imported Contact",
          });
        }
      }

      if (parsed.length === 0) {
        addToast("error", "Could not find valid email addresses in CSV.");
        return;
      }

      setImportedLeadsPreview(parsed);
      setShowImportModal(true);
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmCSVImport = async () => {
    if (importedLeadsPreview.length === 0) return;
    setIsImporting(true);

    try {
      const fullLeads = importedLeadsPreview as Lead[];
      const updated = [...fullLeads, ...leads];
      setLeads(updated);
      saveLeads(updated);

      addToast("success", `Successfully imported ${fullLeads.length} signups!`);
      setShowImportModal(false);
      setImportedLeadsPreview([]);
      setCsvFileName("");
    } catch (err) {
      console.error("Failed to import CSV", err);
      addToast("error", "Error importing CSV file.");
    } finally {
      setIsImporting(false);
    }
  };

  // 4. Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      addToast("info", "No signups available to export.");
      return;
    }

    const activeSequences = loadSequences();

    const header = ["Email", "Name", "Lead Magnet", "First Signup", "Signups Count", "Sequence Status"];
    const rows = leads.map((l) => {
      const page = magnetPages.find((p) => p.id === l.pageId || p.name === l.page);
      const foundSeq = activeSequences.find((s) => s.id === page?.id || s.pageId === page?.id || (page && s.name.includes(page.name)));
      const isEnabled = page ? (page.sequenceEnabled || (page.sequenceEmails && page.sequenceEmails.length > 0)) : false;
      const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
      const totalSteps = foundSeq?.emails?.length || page?.sequenceEmails?.length || 1;

      let computedStatus = `Step 1 of ${totalSteps} (In Progress)`;
      if (!isSeqLive) {
        computedStatus = "Sequence Ended";
      } else if (l.status === "stopped") {
        computedStatus = "Stopped";
      } else if (l.status === "completed" || l.status === "delivered") {
        computedStatus = `Completed (${totalSteps}/${totalSteps} steps)`;
      }

      // Format page name with leading tab/apostrophe if it looks like a date so Excel displays it literally
      const cleanPageName = (l.page || "").replace(/"/g, '""');
      const excelSafePage = /^\d{1,2}\/\d{1,2}/.test(cleanPageName) ? `="${cleanPageName}"` : `"${cleanPageName}"`;

      return [
        `"${(l.email || "").replace(/"/g, '""')}"`,
        `"${(l.name || "").replace(/"/g, '""')}"`,
        excelSafePage,
        `"${(l.signedUpAt || "").replace(/"/g, '""')}"`,
        "1",
        `"${computedStatus}"`,
      ];
    });

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead_signups_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Exported CSV file successfully.");
  };

  const copyEmailToClipboard = (emailStr: string) => {
    navigator.clipboard.writeText(emailStr);
    addToast("success", `Copied ${emailStr} to clipboard!`);
  };

  // Magnet Options for Filters
  const uniqueMagnets = Array.from(new Set(leads.map((l) => l.page).filter(Boolean)));

  // Filtered leads
  const filtered = leads.filter((l) => {
    const matchMagnet = filterMagnet === "All lead magnets" || l.page === filterMagnet;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.email.toLowerCase().includes(q) ||
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.page && l.page.toLowerCase().includes(q));
    return matchMagnet && matchSearch;
  });

  // 5. Pagination Logic
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedLeads = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Metrics
  const uniqueSignups = new Set(leads.map((l) => l.email)).size;
  const recentMonthCount = leads.filter((l) => {
    if (!l.signedUpAt) return true;
    const d = new Date(l.signedUpAt);
    if (isNaN(d.getTime())) return true;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return d >= thirtyDaysAgo;
  }).length;

  const avgConversion = magnetPages.length > 0
    ? (magnetPages.reduce((acc, p) => acc + (p.conversionRate || 0), 0) / magnetPages.length).toFixed(1)
    : "0.0";

  return (
    <DashboardShell account={account} title="Signups">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/50 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">

          {/* Page heading */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Signups & Leads
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-3 w-3" /> Live Email Alerts Active
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                Subscribers who entered their email across your lead magnet signup forms.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005291] transition shadow-md cursor-pointer"
              >
                <UserPlus className="h-4 w-4" /> + Add Subscriber
              </button>

              <label className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-zinc-300 dark:hover:bg-[#25252A] transition cursor-pointer shadow-xs">
                <Upload className="h-4 w-4 text-[#0066B2]" /> Import CSV
                <input type="file" accept=".csv" onChange={handleCSVFileSelect} className="hidden" />
              </label>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-zinc-300 dark:hover:bg-[#25252A] transition cursor-pointer shadow-xs"
              >
                <Download className="h-4 w-4 text-[#0066B2]" /> Export CSV
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {/* Unique signups */}
            <div className="flex items-center rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-[#2e2e38] dark:bg-[#18181B]/80 px-6 py-5 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mr-4">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Unique Subscribers</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5 leading-none">{uniqueSignups}</p>
              </div>
            </div>

            {/* Monthly Growth */}
            <div className="flex items-center rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-[#2e2e38] dark:bg-[#18181B]/80 px-6 py-5 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 mr-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">New This Month</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5 leading-none">+{recentMonthCount}</p>
              </div>
            </div>

            {/* Average Conversion Rate */}
            <div className="flex items-center rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-[#2e2e38] dark:bg-[#18181B]/80 px-6 py-5 shadow-sm backdrop-blur-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mr-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Avg Conversion Rate</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5 leading-none">{avgConversion}%</p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm overflow-hidden">

            {/* Toolbar */}
            <div className="p-5 border-b border-zinc-200/80 dark:border-[#2e2e38]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">All Subscribers</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Deduplicated email records across all published magnets.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Bulk Delete Selected Button */}
                  {selectedLeadIds.length > 0 && (
                    <button
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Selected ({selectedLeadIds.length})</span>
                    </button>
                  )}

                  {/* Filter by Magnet */}
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setFilterOpen((v) => !v)}
                      className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 hover:border-[#0066B2] dark:hover:border-[#0066B2] transition cursor-pointer"
                    >
                      <Filter className="h-3.5 w-3.5 text-[#0066B2]" />
                      <span className="truncate max-w-[140px]">{filterMagnet}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                    </button>
                    {filterOpen && (
                      <div className="absolute right-0 sm:left-0 top-full z-20 mt-1.5 w-56 rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#18181B] shadow-xl py-1">
                        {["All lead magnets", ...uniqueMagnets].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setFilterMagnet(opt); setFilterOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-3.5 py-2 text-xs transition cursor-pointer ${filterMagnet === opt
                                ? "text-[#0066B2] dark:text-[#38BDF8] bg-[#EFF6FF] dark:bg-[#0066B2]/20 font-bold"
                                : "text-zinc-700 dark:text-[#9B9085] hover:bg-zinc-50 dark:hover:bg-[#25252A] hover:text-zinc-900 dark:hover:text-white"
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search email, name, or magnet..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-8 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200/80 dark:divide-[#2e2e38]">
                <thead className="bg-[#F8FBFF] dark:bg-[#151518]">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={paginatedLeads.length > 0 && selectedLeadIds.length === paginatedLeads.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                        title="Select All On Page"
                      />
                    </th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Subscriber</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Lead Magnet</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Signup Date</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Sequence</th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white dark:divide-[#222228] dark:bg-[#18181B]">
                  {paginatedLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);

                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors ${isSelected ? "bg-[#EFF6FF] dark:bg-[#0066B2]/15" : "hover:bg-[#EFF6FF]/40 dark:hover:bg-[#1C1C22]/60"}`}
                      >
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLead(lead.id)}
                            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                          />
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-xs font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
                            {(lead.name || lead.email || "U").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              {lead.email}
                              <button
                                onClick={() => copyEmailToClipboard(lead.email)}
                                title="Copy Email"
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </p>
                            {lead.name && lead.name !== lead.email.split("@")[0] && (
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">{lead.name}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-[#222228] px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {lead.page}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {lead.signedUpAt}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const page = magnetPages.find((p) => p.id === lead.pageId || p.name === lead.page);
                          const activeSequences = loadSequences();
                          const foundSeq = activeSequences.find((s) => s.id === page?.id || s.pageId === page?.id || (page && s.name.includes(page.name)));
                          const isEnabled = page ? (page.sequenceEnabled || (page.sequenceEmails && page.sequenceEmails.length > 0)) : false;
                          const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
                          const totalSteps = foundSeq?.emails?.length || page?.sequenceEmails?.length || 2;

                          if (!isSeqLive) {
                            return (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                                Sequence Ended
                              </span>
                            );
                          }

                          if (lead.status === "stopped") {
                            return (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                🛑 Stopped
                              </span>
                            );
                          }

                          if (lead.status === "completed" || lead.status === "delivered") {
                            return (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-purple-600 dark:text-purple-400 text-xs font-bold">
                                <Check className="h-3 w-3" /> Completed ({totalSteps}/{totalSteps} steps)
                              </span>
                            );
                          }

                          return (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Step 1 of {totalSteps} (In Progress)
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-200 dark:hover:bg-[#282830] transition cursor-pointer shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> View Details
                          </button>
                          <button
                            onClick={() => setLeadToDelete(lead)}
                            title="Delete signup"
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                    {search ? "No matching signups found" : "No signups yet"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                    {search
                      ? "Try searching for a different name, email, or magnet."
                      : "Signups appear automatically when users enter their email on a published magnet."}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination & Records Count Bar */}
            {filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-zinc-200/80 dark:border-[#2e2e38] bg-[#F8FBFF]/50 dark:bg-[#151518]/50 text-xs text-zinc-600 dark:text-[#9B9085]">
                <div>
                  Showing <strong className="text-zinc-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                  <strong className="text-zinc-900 dark:text-white">{Math.min(currentPage * pageSize, filtered.length)}</strong> of{" "}
                  <strong className="text-zinc-900 dark:text-white">{filtered.length}</strong> signups
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 font-semibold text-zinc-900 dark:text-white">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 1. Add Subscriber Manually Modal */}
        {showAddModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Add Subscriber Manually</h3>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085]">Manually add a contact to your lead list.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddManuallySubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="subscriber@example.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white focus:border-[#0066B2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white focus:border-[#0066B2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Associated Lead Magnet</label>
                  <select
                    value={newLeadMagnet}
                    onChange={(e) => setNewLeadMagnet(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-medium text-zinc-700 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 focus:border-[#0066B2] focus:outline-none cursor-pointer"
                  >
                    {magnetPages.map((page) => (
                      <option key={page.id} value={page.name}>
                        {page.name}
                      </option>
                    ))}
                    <option value="Direct Manual Add">Direct Manual Add</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-5 py-2 text-xs font-bold text-white hover:bg-[#005291] transition cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    <span>Save Subscriber</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Import CSV Preview Modal */}
        {showImportModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Import Contacts from CSV</h3>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085]">{csvFileName || "CSV File Preview"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  Ready to import <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{importedLeadsPreview.length} contacts</strong> from your CSV file. Preview below:
                </p>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] p-3 divide-y divide-zinc-200/60 dark:divide-white/5">
                  {importedLeadsPreview.slice(0, 5).map((previewLead, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">{previewLead.email}</span>
                      <span className="text-zinc-500 dark:text-[#9B9085]">{previewLead.name}</span>
                    </div>
                  ))}
                  {importedLeadsPreview.length > 5 && (
                    <p className="pt-2 text-[11px] text-zinc-400 text-center italic">
                      + {importedLeadsPreview.length - 5} more contacts...
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/10 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isImporting}
                  onClick={confirmCSVImport}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Import {importedLeadsPreview.length} Contacts</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Delete Lead Modal */}
        {leadToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Delete Subscriber?</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-[#9B9085]">
                Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{leadToDelete.email}</strong>? They will be removed from your lead magnet subscriber list.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setLeadToDelete(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDeleteLead}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Delete Subscriber</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                Delete {selectedLeadIds.length} Selected Subscribers?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-[#9B9085]">
                Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{selectedLeadIds.length} subscribers</strong>? This action cannot be undone and will remove them from your active lead list.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  disabled={isBulkDeleting}
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isBulkDeleting}
                  onClick={confirmBulkDelete}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  {isBulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Delete {selectedLeadIds.length} Subscribers</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lead Details Modal */}
        {selectedLead && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-sm font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
                    {(selectedLead.name || selectedLead.email || "U").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">{selectedLead.name || "Subscriber Details"}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085]">{selectedLead.email}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${!selectedLead.email.endsWith("@gmail.com") && !selectedLead.email.endsWith("@yahoo.com")
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        }`}>
                        <Sparkles className="h-2.5 w-2.5" />
                        {!selectedLead.email.endsWith("@gmail.com") && !selectedLead.email.endsWith("@yahoo.com") ? "🔥 Hot Prospect (80 pts)" : "⚡ Warm Lead (60 pts)"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#25252A] dark:hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                  <span className="text-zinc-500 dark:text-[#9B9085]">Email Address</span>
                  <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    {selectedLead.email}
                    <button onClick={() => copyEmailToClipboard(selectedLead.email)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                  <span className="text-zinc-500 dark:text-[#9B9085]">Lead Magnet</span>
                  <span className="font-semibold text-zinc-900 dark:text-white max-w-[220px] truncate">{selectedLead.page}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                  <span className="text-zinc-500 dark:text-[#9B9085]">Signup Date & Time</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{selectedLead.signedUpAt}</span>
                </div>

                {/* Sequence Delivery Breakdown Card */}
                {(() => {
                  const page = magnetPages.find((p) => p.id === selectedLead.pageId || p.name === selectedLead.page);
                  const activeSequences = loadSequences();
                  const foundSeq = activeSequences.find((s) => s.id === page?.id || s.pageId === page?.id || (page && s.name.includes(page.name)));
                  const isEnabled = page ? (page.sequenceEnabled || (page.sequenceEmails && page.sequenceEmails.length > 0)) : false;
                  const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
                  const totalSteps = foundSeq?.emails?.length || page?.sequenceEmails?.length || 2;
                  const stepsList = foundSeq?.emails || page?.sequenceEmails || [
                    { id: "1", subject: "Initial Delivery Email", delayLabel: "Instantly" },
                    { id: "2", subject: "Follow-up Check-in Email", delayLabel: "1 day later" }
                  ];

                  return (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                          Follow-up Funnel Progress
                        </span>
                        {!isSeqLive ? (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            Sequence Ended
                          </span>
                        ) : selectedLead.status === "stopped" ? (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                            🛑 Stopped
                          </span>
                        ) : selectedLead.status === "completed" || selectedLead.status === "delivered" ? (
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            {totalSteps}/{totalSteps} Steps Completed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            1/{totalSteps} Steps Delivered
                          </span>
                        )}
                      </div>

                      {/* Step Items List */}
                      <div className="space-y-1.5 pt-1">
                        {stepsList.map((step: any, idx: number) => {
                          const isDone = !isSeqLive ? false : (selectedLead.status === "completed" || selectedLead.status === "delivered" || idx === 0);
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-white dark:bg-[#18181B] p-2 rounded-lg border border-zinc-100 dark:border-white/5">
                              <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                {isDone ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <span className="h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400">{idx + 1}</span>
                                )}
                                <span className="font-semibold">{step.subject || `Step #${idx + 1}`}</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {step.delayLabel || (idx === 0 ? "Instantly" : `${idx} day later`)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {selectedLead.customAnswer && (
                  <div className="py-2 space-y-1">
                    <span className="block text-zinc-500 dark:text-[#9B9085]">Custom Form Response</span>
                    <p className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white leading-relaxed">
                      "{selectedLead.customAnswer}"
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/data", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "resendLeadEmail",
                            data: {
                              leadId: selectedLead.id,
                              email: selectedLead.email,
                              name: selectedLead.name,
                              pageTitle: selectedLead.page,
                              ownerEmail: account?.email,
                            },
                          }),
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          addToast("success", `📧 Resource delivery email resent to ${selectedLead.email}!`);
                        } else {
                          addToast("error", data.error || "Failed to resend email.");
                        }
                      } catch (err: any) {
                        addToast("error", err.message);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#202026] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#282830] transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 text-emerald-500" /> Resend Email
                  </button>
                  <button
                    onClick={() => {
                      const target = selectedLead;
                      setSelectedLead(null);
                      setLeadToDelete(target);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
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

        {/* Floating Toast Notification Container */}
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl p-4 text-xs font-medium shadow-xl backdrop-blur-md border transition-all animate-in slide-in-from-bottom-5 duration-300 ${toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100"
                  : toast.type === "error"
                    ? "bg-red-950/90 border-red-500/30 text-red-100"
                    : "bg-zinc-900/90 border-zinc-700/40 text-zinc-100"
                }`}
            >
              {toast.type === "success" && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
              {toast.type === "info" && <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}