"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Eye,
  Mail,
  MousePointerClick,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  BarChart2,
  Image as ImageIcon,
  Copy,
  Check,
  LayoutGrid,
  List,
  TrendingUp,
  Globe,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  Zap,
  ArrowUpRight,
  Filter,
  AlertTriangle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, savePages, loadAccount, syncWithDatabase, deletePage } from "@/lib/store";

export default function PagesPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">("all");

  // Selected page for the Peek Drawer / Quick Command Sidebar (Option 1)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for 'Delete Magnet' custom confirmation popup
  const [pageToDeleteId, setPageToDeleteId] = useState<string | null>(null);

  // Modal State for 'Create a magnet' popup
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");

  const newSlug = useMemo(() => {
    return newName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") || "untitled-page";
  }, [newName]);

  const liveCount = useMemo(() => pages.filter((p) => p.status === "live").length, [pages]);
  const draftCount = useMemo(() => pages.filter((p) => p.status === "draft").length, [pages]);
  const total = pages.length;

  const totalViews = useMemo(() => pages.reduce((sum, p) => sum + (p.views || 0), 0), [pages]);
  const totalSignups = useMemo(() => pages.reduce((sum, p) => sum + (p.signups || 0), 0), [pages]);
  const avgConversion = useMemo(() => totalViews > 0 ? ((totalSignups / totalViews) * 100).toFixed(1) : "0.0", [totalViews, totalSignups]);

  const filtered = useMemo(() => {
    return pages.filter((p) => {
      const matchesSearch = !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        (p.headline && p.headline.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pages, search, statusFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const totalPagesCount = Math.ceil(filtered.length / itemsPerPage) || 1;

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Active selected page object
  const activePage = useMemo(() => {
    if (!selectedPageId) return filtered[0] || pages[0] || null;
    return pages.find((p) => p.id === selectedPageId) || filtered[0] || pages[0] || null;
  }, [selectedPageId, pages, filtered]);

  useEffect(() => {

    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localPages.length > 0) {
      setPages(localPages);
      if (!selectedPageId && localPages[0]) {
        setSelectedPageId(localPages[0].id);
      }
    }
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    const fetchLatest = () => {
      syncWithDatabase().then((data) => {
        if (data) {
          if (data.pages) {
            setPages(data.pages);
            if (!selectedPageId && data.pages.length > 0) {
              setSelectedPageId(data.pages[0].id);
            }
          }
          if (data.account) setAccount(data.account);
        }
      });
    };

    fetchLatest();

    const handleFocus = () => fetchLatest();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Set default selection if none
  useEffect(() => {
    if (!selectedPageId && filtered.length > 0) {
      setSelectedPageId(filtered[0].id);
    }
  }, [filtered, selectedPageId]);

  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreateModal]);

  function removePage(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setPageToDeleteId(id);
  }

  function confirmPageDeletion() {
    if (!pageToDeleteId) return;
    const id = pageToDeleteId;
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    deletePage(id);
    if (selectedPageId === id) {
      setSelectedPageId(next[0]?.id || null);
    }
    setPageToDeleteId(null);
    router.refresh();
  }

  function handleCopyLink(page: MagnetPage, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const username = account?.username || "demo";
    const fullUrl = `${window.location.origin}/${username}/${page.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(page.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <DashboardShell account={account} title="Lead magnets">
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-[#0B0B0D]">
        {/* Top Executive Header */}
        <div className="px-6 pt-6 lg:px-8 border-b border-zinc-200/80 dark:border-zinc-800/60 bg-white/70 dark:bg-[#121215]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Lead Magnet Control Center
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#0066B2]/30 bg-[#EFF6FF] px-2.5 py-0.5 text-[10px] font-bold text-[#0066B2] dark:border-[#0066B2]/40 dark:bg-[#0066B2]/15 dark:text-[#38BDF8]">
                  <Sparkles className="h-3 w-3" /> PRO HUB
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Manage landing pages, live lead conversion performance, and direct distribution links.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/sequences"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1A1A1E] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition shadow-xs"
              >
                <Mail className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                <span>Email Sequences</span>
              </Link>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-md shadow-[#0066B2]/20 cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
                <span>Create Lead Magnet</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#0066B2]/15 text-[#0066B2] dark:text-[#38BDF8]">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Active Pages</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{liveCount} <span className="text-xs font-normal text-zinc-400">/ {total}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Traffic</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{totalViews.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <MousePointerClick className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Leads Collected</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{totalSignups.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Avg. Conv. Rate</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{avgConversion}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Split-Pane Workspace (Option 1) */}
        <div className="flex-1 px-6 py-6 lg:px-8 flex flex-col lg:flex-row gap-6 items-start">

          {/* Left Column (65% width on large screens): Catalog & Search/Filters */}
          <div className="w-full lg:w-[65%] flex flex-col space-y-4">

            {/* Filter & View Mode Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 rounded-xl bg-zinc-50 dark:bg-[#1C1C20] px-3.5 py-2 border border-zinc-200/60 dark:border-zinc-800 focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2]">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter lead magnets by title or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 w-full"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
                {/* Status Filter Pills */}
                <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1C1C20] rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded-lg transition-all ${statusFilter === "all" ? "bg-white dark:bg-[#2A2A30] text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                  >
                    All ({total})
                  </button>
                  <button
                    onClick={() => setStatusFilter("live")}
                    className={`px-3 py-1 rounded-lg transition-all ${statusFilter === "live" ? "bg-white dark:bg-[#2A2A30] text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                  >
                    Live ({liveCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("draft")}
                    className={`px-3 py-1 rounded-lg transition-all ${statusFilter === "draft" ? "bg-white dark:bg-[#2A2A30] text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                  >
                    Draft ({draftCount})
                  </button>
                </div>

                {/* View Toggles */}
                <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1C1C20] rounded-xl">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-[#2A2A30] text-[#0066B2] dark:text-[#38BDF8] shadow-xs" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white dark:bg-[#2A2A30] text-[#0066B2] dark:text-[#38BDF8] shadow-xs" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* List / Grid Display */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#141417] p-12 text-center flex flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">No lead magnets found</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  {search ? "Try adjusting your search query or clear filters." : "Create your first lead magnet to start collecting emails."}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Create Lead Magnet
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedItems.map((page) => {
                    const isSelected = activePage?.id === page.id;
                    return (
                      <div
                        key={page.id}
                        onClick={() => setSelectedPageId(page.id)}
                        className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col ${isSelected
                          ? "border-[#0066B2] dark:border-[#38BDF8] bg-white dark:bg-[#18181C] ring-2 ring-[#0066B2]/20 dark:ring-[#38BDF8]/20 shadow-md"
                          : "border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141417] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs"
                          }`}
                      >
                        {/* Image Thumbnail Container */}
                        <div className="relative h-40 w-full bg-zinc-100 dark:bg-[#0F0F12] border-b border-zinc-100 dark:border-zinc-800/60 overflow-hidden">
                          {page.imageUrl && page.imageUrl.trim() !== "" ? (
                            <img
                              src={page.imageUrl}
                              alt={page.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-[#121216] dark:to-[#18181D]">
                              <ImageIcon className="h-8 w-8 stroke-[1.5px]" />
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex items-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${page.status === "live"
                                ? "bg-emerald-500/90 text-white border-emerald-400/30"
                                : "bg-zinc-900/80 text-zinc-300 border-zinc-700/50"
                                }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${page.status === "live" ? "bg-white animate-pulse" : "bg-zinc-400"}`} />
                              {page.status === "live" ? "Published" : "Draft"}
                            </span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition">
                              {page.headline || page.name}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                              {page.subheadline || "No description set yet."}
                            </p>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                            <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[140px]">/{page.slug}</span>

                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Link
                                href={`/dashboard/leadmagnets/${page.id}`}
                                className="flex items-center gap-1 rounded-lg bg-[#0066B2]/10 dark:bg-[#0066B2]/20 px-2.5 py-1 text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:bg-[#0066B2] hover:text-white dark:hover:bg-[#0066B2] dark:hover:text-white transition"
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141417] overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                  <thead className="bg-zinc-50/80 dark:bg-[#1A1A1E] text-zinc-400 dark:text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200/80 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">Lead Magnet</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Views</th>
                      <th className="px-4 py-3 text-right">Leads</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {paginatedItems.map((page) => {
                      const isSelected = activePage?.id === page.id;
                      return (
                        <tr
                          key={page.id}
                          onClick={() => setSelectedPageId(page.id)}
                          className={`cursor-pointer transition ${isSelected
                            ? "bg-[#EFF6FF]/60 dark:bg-[#0066B2]/10"
                            : "hover:bg-zinc-50 dark:hover:bg-[#1A1A1E]/50"
                            }`}
                        >
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                                {page.imageUrl ? (
                                  <img src={page.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-zinc-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-white line-clamp-1">{page.name}</p>
                                <p className="text-[11px] font-mono text-zinc-400">/{page.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${page.status === "live"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                }`}
                            >
                              {page.status === "live" ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                            {page.views || 0}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">
                            {page.signups || 0}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => handleCopyLink(page, e)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title="Copy link"
                              >
                                {copiedId === page.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                              <Link
                                href={`/dashboard/leadmagnets/${page.id}`}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Bar */}
            {totalPagesCount > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-[#141417] p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 text-xs shadow-xs">
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">
                  Showing <span className="font-bold text-zinc-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-bold text-zinc-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of{" "}
                  <span className="font-bold text-zinc-900 dark:text-white">{filtered.length}</span> lead magnets
                </p>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1C1C20] text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition"
                  >
                    Previous
                  </button>

                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 px-1">
                    {currentPage} / {totalPagesCount}
                  </span>

                  <button
                    disabled={currentPage === totalPagesCount}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesCount))}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1C1C20] text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* Right Column (35% width on large screens): Interactive Peek Drawer & Live Command Center */}
          <div className="w-full lg:w-[35%] sticky top-[185px] space-y-4 transition-all duration-200">
            {activePage ? (
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141417] p-5 shadow-lg space-y-5">

                {/* Header & Status */}
                <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">
                      SELECTED INSPECTOR
                    </span>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-0.5 line-clamp-1">
                      {activePage.name}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${activePage.status === "live"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}
                  >
                    {activePage.status === "live" ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Live Public Link Card */}
                <div className="rounded-xl bg-zinc-50 dark:bg-[#1A1A1E] p-3 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Public Share URL</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate">
                      /{account?.username || "demo"}/{activePage.slug}
                    </span>
                    <button
                      onClick={() => handleCopyLink(activePage)}
                      className="flex items-center gap-1 rounded-lg bg-white dark:bg-[#25252A] px-2.5 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shrink-0"
                    >
                      {copiedId === activePage.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === activePage.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Performance Breakdown */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Magnet Conversion Metrics
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#1A1A1E]/50">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Total Views</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{activePage.views || 0}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#1A1A1E]/50">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Leads Captured</p>
                      <p className="text-lg font-bold text-[#0066B2] dark:text-[#38BDF8] mt-1">{activePage.signups || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <Link
                    href={`/dashboard/leadmagnets/${activePage.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-sm"
                  >
                    <Pencil className="h-4 w-4" /> Open Full Editor
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/leadmagnets/${activePage.id}/analytics`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C20] px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      <BarChart2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Analytics
                    </Link>

                    <a
                      href={`/${account?.username || "demo"}/${activePage.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C20] px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-400" /> Preview
                    </a>
                  </div>
                </div>

                {/* Secondary Danger Actions */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-end">
                  <button
                    onClick={(e) => removePage(activePage.id, e)}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Magnet
                  </button>
                </div>

              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141417] p-8 text-center text-zinc-400">
                Select a lead magnet to open the live inspector panel.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 'Create a magnet' Modal Overlay */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="relative w-full max-w-[460px] rounded-2xl border border-[#0066B2]/30 bg-white p-6 text-zinc-900 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 dark:border-[#0066B2]/35 dark:bg-[#18181c] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create a magnet</h3>
                <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Name the page and choose its URL.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleanSlug = newSlug;
                const newId = `page-${Date.now()}`;
                const newMagnetPage: MagnetPage = {
                  id: newId,
                  name: newName.trim() || "Untitled Page",
                  slug: cleanSlug,
                  status: "draft",
                  headline: newName.trim() || "Untitled Page",
                  subheadline: "",
                  cta: "Get instant access",
                  deliverable: "Instant Access",
                  accent: "#0066B2",
                  views: 0,
                  signups: 0,
                  conversionRate: 0,
                  updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                  publishedAt: null,
                  template: "classic"
                };

                const nextPages = [newMagnetPage, ...pages];
                setPages(nextPages);
                savePages(nextPages);
                setShowCreateModal(false);
                router.push(`/dashboard/leadmagnets/${newId}`);
              }}
              className="space-y-4"
            >
              {/* Page Name with AI generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">Page name</label>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/ai/optimize", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "suggest_titles", magnetTitle: newName || "Growth Framework" }),
                        });
                        const data = await res.json();
                        if (data.suggestions?.length) {
                          setNewName(data.suggestions[Math.floor(Math.random() * data.suggestions.length)]);
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" /> AI Title Generator
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="AI Pipeline Playbook"
                  className="w-full rounded-xl border border-[#0066B2]/30 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] dark:border-[#0066B2]/60 dark:bg-[#121214] dark:text-white dark:placeholder:text-[#52525b] dark:focus:border-[#0066B2] dark:focus:ring-[#0066B2] transition-all"
                  required
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">URL slug</label>
                <div className="flex items-center rounded-xl border border-[#0066B2]/30 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-600 dark:border-[#0066B2]/35 dark:bg-[#121214] dark:text-[#9B9085]">
                  <span className="text-zinc-400 dark:text-[#666675] shrink-0 mr-1.5">/</span>
                  <span className="font-mono text-zinc-800 dark:text-[#d4c8bc] truncate">{newSlug}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-[#666675]">The path of the page. Lowercase, digits, and hyphens only.</p>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#0066B2]/30 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-[#0066B2]/35 dark:bg-[#222228] dark:text-white dark:hover:bg-[#2c2c34] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] dark:bg-[#0066B2] dark:text-white dark:hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                >
                  <span>+</span>
                  <span>Create page</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 'Delete this magnet?' Custom Confirmation Modal matching user screenshot */}
      {pageToDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-all duration-200 animate-in fade-in duration-150"
          onClick={() => setPageToDeleteId(null)}
        >
          <div
            className="relative w-full max-w-[440px] rounded-3xl border border-zinc-800 bg-[#18181B] p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Danger Warning Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Delete this magnet?</h3>
              </div>
              <button
                onClick={() => setPageToDeleteId(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description Text */}
            <div className="space-y-2 pt-1 text-xs leading-relaxed text-zinc-400">
              <p>
                This removes the page and stops it serving. Any signups already collected stay on your list.
              </p>
              <p className="text-zinc-500 font-medium">
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPageToDeleteId(null)}
                className="rounded-xl border border-zinc-800 bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPageDeletion}
                className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                Delete magnet
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}