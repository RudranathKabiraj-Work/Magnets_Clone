"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { motion } from "framer-motion";
import {
  MailOpen,
  Pause,
  Play,
  Plus,
  Rocket,
  StopCircle,
  Trash2,
  Search,
  SlidersHorizontal,
  Copy,
  MoreVertical,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  LayoutGrid,
  List,
  Sparkles,
  Send,
  Check,
  BarChart3,
  Eye,
  X,
  Filter,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { type Sequence, type SequenceEmail, type Account, type Lead, type MagnetPage } from "@/lib/data";
import {
  loadSequences,
  loadPages,
  loadLeads,
  loadAccount,
  saveSequences,
  savePages,
  deleteSequence,
  syncWithDatabase,
} from "@/lib/store";

type FilterStatus = "all" | "live" | "draft" | "has_leads";
type SortOption = "recent" | "name" | "subscribers" | "delivered" | "open_rate";
type ViewMode = "grid" | "table";

export default function SequencesPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Dropdown menu tracking
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [activeMenuId]);

  useEffect(() => {
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    const localSeq = loadSequences();
    const localPages = loadPages();
    const localLeads = loadLeads();

    setPages(localPages);
    setLeads(localLeads);

    const combineSequences = (seqList: Sequence[], pagesList = localPages, leadsList = localLeads) => {
      const pageSequences: Sequence[] = pagesList
        .filter((p) => (p.sequenceEmails && p.sequenceEmails.length > 0) || p.sequenceEnabled)
        .map((p) => {
          const associatedLeads = leadsList.filter((l) => l.pageId === p.id || l.page === p.name);
          const signupCount = Math.max(associatedLeads.length, p.signups || 0);

          const deliveredCount =
            associatedLeads.filter(
              (l) =>
                l.status === "delivered" ||
                l.status === "opened" ||
                l.status === "completed" ||
                l.status === "replied"
            ).length || (signupCount > 0 ? signupCount : 0);

          const openedCount = associatedLeads.filter(
            (l) => l.status === "opened" || l.status === "replied"
          ).length;

          const completedCount = associatedLeads.filter(
            (l) =>
              l.status === "completed" ||
              (l.sequenceStep && l.sequenceStep.toLowerCase().includes("completed"))
          ).length;

          const repliedCount = associatedLeads.filter((l) => l.status === "replied").length;
          const stoppedCount = associatedLeads.filter((l) => l.status === "stopped").length;

          const emailsList: SequenceEmail[] =
            p.sequenceEmails && p.sequenceEmails.length > 0
              ? p.sequenceEmails.map((e, idx) => ({
                  id: e.id || `se_${p.id}_${idx + 1}`,
                  subject: e.subject || `Follow-up #${idx + 1}`,
                  delayLabel: `${e.delayDays || 1} day${(e.delayDays || 1) > 1 ? "s" : ""} delay`,
                  delayMinutes: (e.delayDays || 1) * 1440,
                  status: (p.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
                  sent: deliveredCount,
                  opened: openedCount,
                }))
              : [
                  {
                    id: `se_${p.id}_1`,
                    subject: `${p.name} Follow-up #1`,
                    delayLabel: "1 day delay",
                    delayMinutes: 1440,
                    status: "live" as const,
                    sent: deliveredCount,
                    opened: openedCount,
                  },
                  {
                    id: `se_${p.id}_2`,
                    subject: `${p.name} Follow-up #2`,
                    delayLabel: "3 days delay",
                    delayMinutes: 4320,
                    status: "live" as const,
                    sent: deliveredCount,
                    opened: openedCount,
                  },
                ];

          return {
            id: p.id,
            name: `${p.name} Follow-up`,
            pageId: p.id,
            status: (p.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
            emails: emailsList,
            stopOnBooking: p.stopOnCall || false,
            stats: {
              signedUp: signupCount,
              delivered: deliveredCount,
              opened: openedCount,
              replied: repliedCount,
              stopped: stoppedCount,
              completed: completedCount,
            },
          };
        });

      const map = new Map<string, Sequence>();
      for (const s of pageSequences) map.set(s.id, s);
      for (const s of seqList) {
        const associatedLeads = leadsList.filter(
          (l) => (s.pageId && l.pageId === s.pageId) || l.sequence === s.name
        );
        if (associatedLeads.length > 0) {
          const liveOpened = associatedLeads.filter(
            (l) => l.status === "opened" || l.status === "replied"
          ).length;
          const liveDelivered =
            associatedLeads.filter(
              (l) =>
                l.status === "delivered" ||
                l.status === "opened" ||
                l.status === "completed" ||
                l.status === "replied"
            ).length || s.stats.delivered;
          const liveCompleted = associatedLeads.filter(
            (l) =>
              l.status === "completed" ||
              (l.sequenceStep && l.sequenceStep.toLowerCase().includes("completed"))
          ).length;
          s.stats = {
            ...s.stats,
            signedUp: Math.max(s.stats.signedUp || 0, associatedLeads.length),
            delivered: Math.max(s.stats.delivered || 0, liveDelivered),
            opened: Math.max(s.stats.opened || 0, liveOpened),
            completed: Math.max(s.stats.completed || 0, liveCompleted),
          };
        }
        map.set(s.id, s);
      }
      return Array.from(map.values());
    };

    setSequences(combineSequences(localSeq));

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        const remoteSeq = data.sequences || [];
        const remotePages = data.pages || localPages;
        const remoteLeads = data.leads || localLeads;
        if (data.pages) setPages(data.pages);
        if (data.leads) setLeads(data.leads);
        setSequences(combineSequences(remoteSeq, remotePages, remoteLeads));
      }
    });
  }, []);

  // Quick Action Handlers
  const handleToggleStatus = (seq: Sequence, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus: "draft" | "live" = seq.status === "live" ? "draft" : "live";
    const updated: Sequence[] = sequences.map((s) => (s.id === seq.id ? { ...s, status: newStatus } : s));
    setSequences(updated);
    saveSequences(updated);

    if (seq.pageId) {
      const currentPages = loadPages();
      const updatedPages = currentPages.map((p) =>
        p.id === seq.pageId ? { ...p, sequenceEnabled: newStatus === "live" } : p
      );
      savePages(updatedPages);
      setPages(updatedPages);
    }
    showToast(`"${seq.name}" is now ${newStatus === "live" ? "Active (Live)" : "Paused (Draft)"}`);
    setActiveMenuId(null);
  };

  const handleDuplicate = (seq: Sequence, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newId = `seq_${Date.now().toString(36)}`;
    const newSeq: Sequence = {
      ...seq,
      id: newId,
      name: `${seq.name} (Copy)`,
      status: "draft",
      pageId: undefined,
      stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0, completed: 0 },
      emails: seq.emails.map((email, idx) => ({
        ...email,
        id: `se_${newId}_${idx + 1}`,
        sent: 0,
        opened: 0,
      })),
    };
    const updated = [newSeq, ...sequences];
    setSequences(updated);
    saveSequences(updated);
    showToast(`Duplicated as "${newSeq.name}"`);
    setActiveMenuId(null);
  };

  const handleDelete = (seq: Sequence, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${seq.name}"? This action cannot be undone.`)) {
      deleteSequence(seq.id);
      setSequences((prev) => prev.filter((item) => item.id !== seq.id));
      showToast(`Deleted "${seq.name}"`);
    }
    setActiveMenuId(null);
  };

  // Top Aggregated Executive KPI Stats
  const metrics = useMemo(() => {
    let totalSignedUp = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalCompleted = 0;
    let totalReplied = 0;
    let liveCount = 0;
    let pausedCount = 0;

    for (const seq of sequences) {
      if (seq.status === "live") liveCount++;
      else pausedCount++;

      totalSignedUp += seq.stats.signedUp || 0;
      totalDelivered += seq.stats.delivered || 0;
      totalOpened += seq.stats.opened || 0;
      totalCompleted += seq.stats.completed || (seq.stats.delivered > 0 ? seq.stats.delivered : 0);
      totalReplied += seq.stats.replied || 0;
    }

    const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
    const completionRate = totalSignedUp > 0 ? Math.round((totalCompleted / totalSignedUp) * 100) : 0;
    const replyRate = totalDelivered > 0 ? Math.round((totalReplied / totalDelivered) * 100) : 0;

    return {
      totalSequences: sequences.length,
      liveCount,
      pausedCount,
      totalSignedUp,
      totalDelivered,
      totalOpened,
      totalCompleted,
      totalReplied,
      openRate,
      completionRate,
      replyRate,
    };
  }, [sequences]);

  // Filter & Sort Logic
  const filteredSequences = useMemo(() => {
    let list = [...sequences];

    // Status Tab Filter
    if (statusFilter === "live") {
      list = list.filter((s) => s.status === "live");
    } else if (statusFilter === "draft") {
      list = list.filter((s) => s.status === "draft");
    } else if (statusFilter === "has_leads") {
      list = list.filter((s) => (s.stats.signedUp || 0) > 0);
    }

    // Search Query Filter
    const q = deferredSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.pageId && s.pageId.toLowerCase().includes(q)) ||
          s.emails.some((e) => e.subject.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "subscribers") {
        return (b.stats.signedUp || 0) - (a.stats.signedUp || 0);
      }
      if (sortBy === "delivered") {
        return (b.stats.delivered || 0) - (a.stats.delivered || 0);
      }
      if (sortBy === "open_rate") {
        const rateA = a.stats.delivered > 0 ? (a.stats.opened || 0) / a.stats.delivered : 0;
        const rateB = b.stats.delivered > 0 ? (b.stats.opened || 0) / b.stats.delivered : 0;
        return rateB - rateA;
      }
      // default: recent
      return 0;
    });

    return list;
  }, [sequences, statusFilter, deferredSearch, sortBy]);

  return (
    <DashboardShell account={account} title="Sequences">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10 dark:bg-zinc-800 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-4 w-4 text-[#38BDF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-3.5">
          
          {/* Header Section */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Follow-up Sequences
                </h1>
                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  {sequences.length} Total
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {metrics.liveCount} active · Automate email delivery & nurture high-intent leads while the problem is top of mind.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard/leads"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-2xs"
              >
                <Users className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                View all leads
              </Link>
              <Link
                href="/dashboard/sequences/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0066B2] px-3.5 text-xs font-bold text-white shadow-xs hover:bg-[#005799] transition dark:bg-[#0066B2] dark:hover:bg-[#005799] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5px]" aria-hidden="true" />
                New sequence
              </Link>
            </div>
          </div>

          {/* Top Executive KPI Performance Cards */}
          {sequences.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:gap-3">
              {/* Card 1: Active Sequences */}
              <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-3.5 shadow-2xs transition hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Active Sequences</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Rocket className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-white">{metrics.liveCount}</span>
                  <span className="text-[11px] font-medium text-zinc-400">/ {metrics.totalSequences} total</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{metrics.pausedCount === 0 ? "100% active flows" : `${metrics.pausedCount} paused`}</span>
                </div>
              </div>

              {/* Card 2: Total Delivered */}
              <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-3.5 shadow-2xs transition hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Emails Delivered</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#0066B2] dark:bg-blue-950/50 dark:text-[#38BDF8]">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
                    {metrics.totalDelivered.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">sent</span>
                </div>
                <div className="mt-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  Across {metrics.totalSignedUp} total subscribers
                </div>
              </div>

              {/* Card 3: Avg Open Rate */}
              <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-3.5 shadow-2xs transition hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Avg. Open Rate</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-white">{metrics.openRate}%</span>
                  <span className="text-[11px] font-medium text-zinc-400">({metrics.totalOpened} opened)</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="h-3 w-3" />
                  <span>{metrics.openRate >= 40 ? "High engagement" : "Target: >40%"}</span>
                </div>
              </div>

              {/* Card 4: Sequence Completed */}
              <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-3.5 shadow-2xs transition hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Completed Flows</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
                    {metrics.totalCompleted.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">finished</span>
                </div>
                <div className="mt-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  {metrics.totalReplied} direct replies received
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter & View Controls Bar with Framer Motion Layout Animation */}
          {sequences.length > 0 && (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              
              {/* Status Tabs with Apple / Framer Motion Sliding Pill */}
              <div
                onMouseLeave={() => setHoveredTab(null)}
                className="relative flex flex-wrap sm:flex-nowrap items-center gap-1 scrollbar-none"
              >
                {[
                  { id: "all", label: "All", count: sequences.length },
                  { id: "live", label: "Active", count: metrics.liveCount },
                  { id: "draft", label: "Paused", count: metrics.pausedCount },
                  {
                    id: "has_leads",
                    label: "With Leads",
                    count: sequences.filter((s) => (s.stats.signedUp || 0) > 0).length,
                  },
                ].map((tab) => {
                  const active = statusFilter === tab.id;
                  const isHovered = hoveredTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as FilterStatus)}
                      onMouseEnter={() => setHoveredTab(tab.id)}
                      className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? "text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      {/* Active Tab Solid Sliding Pill */}
                      {active && (
                        <motion.div
                          layoutId="sequencesActiveStatusTab"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-[#0066B2] shadow-2xs"
                        />
                      )}

                      {/* Hover Morphing Pill */}
                      {!active && isHovered && (
                        <motion.div
                          layoutId="sequencesHoverStatusTab"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-zinc-200/60 dark:bg-white/10"
                        />
                      )}

                      <span className="relative z-10">{tab.label}</span>
                      <span
                        className={`relative z-10 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold transition-colors ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-zinc-200/70 text-zinc-700 dark:bg-white/10 dark:text-zinc-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right controls: Search, Sort, View Toggle */}
              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search sequences or steps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] py-1.5 pl-8 pr-7 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#0066B2] dark:focus:border-[#38BDF8] focus:outline-none transition shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-8 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:border-[#0066B2] focus:outline-none transition cursor-pointer shadow-2xs"
                  >
                    <option value="recent">Sort: Most Recent</option>
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="subscribers">Sort: Subscribers</option>
                    <option value="delivered">Sort: Most Delivered</option>
                    <option value="open_rate">Sort: Highest Open %</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#18181B] p-0.5 shadow-2xs">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Card Grid View"
                    className={`rounded-lg p-1.5 transition cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white text-[#0066B2] shadow-xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    title="Table List View"
                    className={`rounded-lg p-1.5 transition cursor-pointer ${
                      viewMode === "table"
                        ? "bg-white text-[#0066B2] shadow-xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Sequences List / Grid */}
          {filteredSequences.length > 0 ? (
            viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid gap-3.5 lg:grid-cols-2">
                {filteredSequences.map((seq) => {
                  const { signedUp, delivered, opened, replied } = seq.stats;
                  const completed = seq.stats.completed || (delivered > 0 ? delivered : 0);
                  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
                  const linkHref = seq.pageId
                    ? `/dashboard/leadmagnets/${seq.pageId}?tab=sequence`
                    : `/dashboard/sequences/${seq.id}`;
                  const attachedName = seq.name.replace(" Follow-up", "").replace(" (Copy)", "");
                  const isMenuOpen = activeMenuId === seq.id;

                  return (
                    <div
                      key={seq.id}
                      className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#18181B] p-4 sm:p-5 transition-all duration-200 hover:border-[#0066B2] dark:hover:border-[#38BDF8] shadow-2xs hover:shadow-sm"
                    >
                      {/* Top Row: Icon, Title, Actions */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <Link href={linkHref} className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] group-hover:scale-105 transition">
                              <Rocket className="h-4.5 w-4.5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm sm:text-base font-bold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition">
                                  {seq.name}
                                </p>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                                Attached to <span className="font-semibold text-zinc-700 dark:text-zinc-200">"{attachedName}"</span> · {seq.emails.length}{" "}
                                {seq.emails.length === 1 ? "email step" : "email steps"}
                              </p>
                            </div>
                          </Link>

                          {/* Top Right Controls & Menu */}
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={seq.status} />

                            {/* 3-Dot Dropdown Actions Menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveMenuId(isMenuOpen ? null : seq.id);
                                }}
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition cursor-pointer"
                                title="Sequence options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] py-1 shadow-xl animate-in fade-in zoom-in-95"
                                >
                                  <Link
                                    href={linkHref}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-zinc-400" />
                                    Edit Sequence Steps
                                  </Link>

                                  <button
                                    onClick={(e) => handleToggleStatus(seq, e)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer text-left"
                                  >
                                    {seq.status === "live" ? (
                                      <>
                                        <Pause className="h-3.5 w-3.5 text-amber-500" />
                                        Pause Sequence
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3.5 w-3.5 text-emerald-500" />
                                        Resume Sequence
                                      </>
                                    )}
                                  </button>

                                  <Link
                                    href={`/dashboard/leads?search=${encodeURIComponent(attachedName)}`}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                                  >
                                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                                    View Sequence Leads
                                  </Link>

                                  <button
                                    onClick={(e) => handleDuplicate(seq, e)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer text-left"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                                    Duplicate Sequence
                                  </button>

                                  <div className="my-1 border-t border-zinc-100 dark:border-white/5" />

                                  <button
                                    onClick={(e) => handleDelete(seq, e)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-left"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Sequence
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Visual Step Timeline Node Preview */}
                        {seq.emails && seq.emails.length > 0 && (
                          <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-white/[0.02] p-2 scrollbar-none">
                            {seq.emails.slice(0, 3).map((email, idx) => (
                              <div key={email.id || idx} className="flex items-center gap-1 shrink-0">
                                {idx > 0 && <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />}
                                <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-white/10 px-2 py-1 text-[10.5px] shadow-2xs max-w-[130px]">
                                  <Clock className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                                  <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                                    {email.delayLabel || `Step ${idx + 1}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {seq.emails.length > 3 && (
                              <span className="rounded-lg bg-zinc-200/70 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                                +{seq.emails.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Performance Metrics Grid */}
                      <div className="mt-3.5 grid grid-cols-5 divide-x divide-zinc-100 dark:divide-white/5 rounded-xl border border-zinc-100 dark:border-white/5 bg-[#F9F9FB] dark:bg-[#141417] text-center">
                        <Link
                          href={`/dashboard/leads?search=${encodeURIComponent(attachedName)}`}
                          className="px-1 py-2.5 hover:bg-zinc-100/60 dark:hover:bg-white/5 transition rounded-l-xl"
                          title="View signed up leads"
                        >
                          <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                            {signedUp.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Signed up</p>
                        </Link>

                        <div className="px-1 py-2.5">
                          <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                            {delivered.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Delivered</p>
                        </div>

                        <div className="px-1 py-2.5">
                          <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                            {opened.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                            {openRate > 0 ? `${openRate}% Open` : "Opened"}
                          </p>
                        </div>

                        <div className="px-1 py-2.5">
                          <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                            {completed.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Completed</p>
                        </div>

                        <div className="px-1 py-2.5">
                          <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                            {replied.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Replied</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#18181B] shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 pl-5 pr-3">Sequence & Magnet</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Steps</th>
                        <th className="py-3 px-3 text-right">Signed Up</th>
                        <th className="py-3 px-3 text-right">Delivered</th>
                        <th className="py-3 px-3 text-right">Open Rate</th>
                        <th className="py-3 px-3 text-right">Completed</th>
                        <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-xs">
                      {filteredSequences.map((seq) => {
                        const { signedUp, delivered, opened, replied } = seq.stats;
                        const completed = seq.stats.completed || (delivered > 0 ? delivered : 0);
                        const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
                        const linkHref = seq.pageId
                          ? `/dashboard/leadmagnets/${seq.pageId}?tab=sequence`
                          : `/dashboard/sequences/${seq.id}`;
                        const attachedName = seq.name.replace(" Follow-up", "").replace(" (Copy)", "");

                        return (
                          <tr
                            key={seq.id}
                            className="group hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition"
                          >
                            <td className="py-3 pl-5 pr-3">
                              <Link href={linkHref} className="flex items-center gap-2.5">
                                <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                                  <Rocket className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition truncate">
                                    {seq.name}
                                  </p>
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                    "{attachedName}"
                                  </p>
                                </div>
                              </Link>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <StatusBadge status={seq.status} />
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                              {seq.emails.length} steps
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-white">
                              {signedUp.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-white">
                              {delivered.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center font-bold text-indigo-600 dark:text-indigo-400">
                                {openRate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {completed.toLocaleString()}
                            </td>
                            <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => handleToggleStatus(seq, e)}
                                  title={seq.status === "live" ? "Pause sequence" : "Resume sequence"}
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition cursor-pointer"
                                >
                                  {seq.status === "live" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                </button>
                                <Link
                                  href={linkHref}
                                  title="Edit sequence"
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  onClick={(e) => handleDelete(seq, e)}
                                  title="Delete sequence"
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* Empty State for Search or 0 Sequences */
            sequences.length > 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-[#18181B]/50 p-8 text-center">
                <Search className="mx-auto h-7 w-7 text-zinc-400" />
                <h3 className="mt-2.5 text-sm font-bold text-zinc-900 dark:text-white">
                  No matching sequences found
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  No sequences matched your search or status filter. Try clearing the filters to view all.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              /* Global Empty State */
              <>
                <div className="mt-2 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-8 sm:p-10 text-center shadow-2xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0066B2]/10 dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] mb-4 border border-[#0066B2]/20">
                    <MailOpen className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                    No follow-up sequences yet
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Automate your email delivery, send scheduled follow-ups, and convert new subscribers into clients automatically.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <Link
                      href="/dashboard/sequences/new"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005799] transition dark:bg-[#0066B2] dark:hover:bg-[#005799]"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5px]" />
                      Create your first sequence
                    </Link>
                  </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
                  <div className="flex gap-3 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-4 shadow-2xs">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                      <MailOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">Instant Trigger</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        The first email sends the moment someone signs up. No manual work.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-4 shadow-2xs">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                      <Pause className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">Custom Delays</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Control the delay for each email. Pause or stop the sequence anytime.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-4 shadow-2xs">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                      <StopCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">Smart Calendar Stop</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Stops automatically when a lead books a call via Calendly or Cal.com.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </DashboardShell>
  );
}