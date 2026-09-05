"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, Mail, MousePointerClick, Pencil, Plus, Rocket, Search, Sparkles, Trash2, X, BarChart2, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, savePages, loadAccount, syncWithDatabase } from "@/lib/store";

export default function PagesPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const live = useMemo(() => pages.filter((p) => p.status === "live").length, [pages]);
  const total = pages.length;

  const filtered = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [pages, search]);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    // Load local data instantly
    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localPages.length > 0) setPages(localPages);
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    // Track theme mode
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Helper to fetch latest data silently
    const fetchLatest = () => {
      syncWithDatabase().then((data) => {
        if (data) {
          if (data.pages) setPages(data.pages);
          if (data.account) setAccount(data.account);
        }
      });
    };

    // Sync immediately on mount
    fetchLatest();

    // Sync on window focus and visibility change
    const handleFocus = () => fetchLatest();
    window.addEventListener("focus", handleFocus);

    return () => {
      observer.disconnect();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  function removePage(id: string) {
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    savePages(next);
    router.refresh();
  }



  return (
    <DashboardShell account={account} title="Lead magnets">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-950 dark:text-white">
              Lead magnets
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Create, publish, and manage your lead magnets</p>
          </div>

          {/* Conversion Workspace banner */}
          <div className="conversion-banner-bg relative mb-6 overflow-hidden rounded-2xl border border-[#0066B2]/30 bg-white py-7 px-8 shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181C]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {/* Badge */}
                <div className="mb-3.5 flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0066B2]/30 bg-[#EFF6FF] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0066B2] dark:border-[#0066B2]/40 dark:bg-[#0066B2]/15 dark:text-[#38BDF8]">
                    <Sparkles className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] fill-[#0066B2]/20" />
                    CONVERSION WORKSPACE
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-zinc-950 dark:text-white tracking-tight mb-1.5">Your lead magnet library</h3>
                <p className="text-sm text-zinc-600 dark:text-[#9E968F]">
                  Create the signup page, delivery email, follow-up emails, and post-signup page.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Published stat */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-white p-3.5 text-left w-24 flex flex-col justify-between shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181C]/90">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86]">PUBLISHED</p>
                  <p className="text-2xl font-bold text-zinc-950 dark:text-[#38BDF8] leading-none mt-2">{live}</p>
                </div>
                {/* Total stat */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-white p-3.5 text-left w-24 flex flex-col justify-between shadow-xs dark:border-[#0066B2]/35 dark:bg-[#18181C]/90">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86]">TOTAL</p>
                  <p className="text-2xl font-bold text-zinc-950 dark:text-[#38BDF8] leading-none mt-2">{total}</p>
                </div>
                {/* Sequences Page Button */}
                <Link
                  href="/dashboard/sequences"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 px-4 py-3 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:bg-[#DBEAFE] dark:hover:bg-[#0066B2]/30 transition shadow-xs whitespace-nowrap cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                  View sequences
                </Link>

                {/* New page button - opens popup modal */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0066B2] px-5 py-3 text-xs font-bold text-white hover:bg-[#005799] transition shadow-md whitespace-nowrap dark:bg-[#0066B2] dark:text-white dark:hover:bg-[#005799] cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-white stroke-[2.5px]" />
                  New page
                </button>
              </div>
            </div>
          </div>

          {/* Search bar + spaces used */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#0066B2]/30 bg-white px-4 py-3 w-[380px] focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] transition-colors shadow-xs dark:border-[#0066B2]/35 dark:bg-[#141417]">
              <Search className="h-4 w-4 text-zinc-400 dark:text-[#38BDF8] shrink-0" />
              <input
                type="text"
                placeholder="Search by title or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-[#9B9085] w-full"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] shrink-0">{total} of 250 spaces used</p>
          </div>

          {/* Pages list or empty state */}
          {filtered.length === 0 && pages.length === 0 ? (
            /* Empty state */
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white shadow-xs overflow-hidden dark:border-[#0066B2]/35 dark:bg-[#0E0E10] flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0066B2] mb-5 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                <Sparkles className="h-7 w-7 text-[#0066B2] dark:text-[#38BDF8]" />
              </div>
              <p className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Create your first lead magnet</p>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] max-w-xs mb-6 leading-relaxed">
                Build the landing page, resource email, and follow-up sequence in one guided flow.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#0066B2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005799] transition dark:bg-[#0066B2] dark:text-white dark:hover:bg-[#005799] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create lead magnet
              </button>
            </div>
          ) : filtered.length === 0 ? (
            /* No search results */
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white shadow-xs overflow-hidden dark:border-[#0066B2]/35 dark:bg-[#0E0E10] flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-sm font-medium text-zinc-950 dark:text-white mb-1">No results found</p>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085]">Try a different title or URI.</p>
            </div>
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((page) => (
                <div
                  key={page.id}
                  className="group rounded-2xl border border-[#0066B2]/30 hover:border-[#0066B2] dark:border-[#0066B2]/35 dark:hover:border-[#38BDF8] bg-white dark:bg-[#18181C] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Top Media Area with Status Badge */}
                  <div className="relative h-48 sm:h-52 w-full bg-[#EFF6FF]/60 dark:bg-[#121214] flex items-center justify-center border-b border-[#0066B2]/20 dark:border-[#0066B2]/30 overflow-hidden">
                    {/* Status Badge Top-Left */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/80 border border-[#0066B2]/30 dark:border-white/10 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider shadow-sm">
                        <span className={`h-2 w-2 rounded-full ${page.status === "live" ? "bg-[#10B981]" : "bg-zinc-400"}`} />
                        <span>{page.status === "live" ? "Published" : "Draft"}</span>
                      </span>
                    </div>

                    {page.imageUrl && page.imageUrl.trim() !== "" ? (
                      <img
                        src={page.imageUrl}
                        alt={page.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#0066B2] dark:text-[#38BDF8]">
                        <ImageIcon className="h-8 w-8 mb-1 stroke-[1.5px] text-[#0066B2] dark:text-[#38BDF8]" />
                        <span className="text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8]">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Content Section */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-base font-extrabold text-zinc-950 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition leading-snug pb-0.5">
                        {page.headline || page.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-[#9E968F] line-clamp-2 leading-relaxed pb-0.5">
                        {page.subheadline || "Add a compelling subheadline in the editor."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#0066B2]/20 dark:border-[#0066B2]/30 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#0066B2] dark:text-[#38BDF8]">/{page.slug}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-[#7B7B86]">Updated {page.updatedAt || "recently"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/leadmagnets/${page.id}/analytics`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#0066B2]/30 dark:border-[#0066B2]/35 bg-white dark:bg-[#202024] text-[#0066B2] dark:text-[#38BDF8] hover:bg-[#EFF6FF] hover:border-[#0066B2] dark:hover:bg-[#0066B2]/20 transition cursor-pointer"
                          title="Analytics"
                        >
                          <BarChart2 className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                        </Link>

                        <Link
                          href={`/dashboard/leadmagnets/${page.id}`}
                          className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] dark:bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] dark:hover:bg-[#005799] transition shadow-xs cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#E2E8F0] dark:border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-zinc-500 dark:text-[#9B9085]">
          <span>LeadMagnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>

      {/* 'Create a magnet' Modal Overlay matching exact user screenshot */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-200"
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
              {/* Page Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">Page name</label>
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
    </DashboardShell>
  );
}