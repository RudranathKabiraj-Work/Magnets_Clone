"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, MousePointerClick, Pencil, Plus, Rocket, Search, Sparkles, Trash2, X } from "lucide-react";
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

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) setPages(data.pages);
        if (data.account) setAccount(data.account);
      }
    });

    return () => observer.disconnect();
  }, []);

  function removePage(id: string) {
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    savePages(next);
    router.refresh();
  }

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E10]">
        <div className="text-sm text-[#9B9085]">Loading pages...</div>
      </div>
    );
  }

  return (
    <DashboardShell account={account} title="Lead magnets">
      <div className="flex flex-col min-h-[calc(100vh-3rem)]">
        <div className="flex-1 px-6 py-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-950 dark:text-white">
              Lead magnets
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-normal text-zinc-500 hover:bg-zinc-100 dark:border-[#2e2e38] dark:bg-transparent dark:text-[#9B9085] dark:hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Create, publish, and manage your lead magnets</p>
          </div>

          {/* Conversion Workspace banner */}
          <div className="conversion-banner-bg relative mb-6 overflow-hidden rounded-2xl border border-zinc-200/80 py-7 px-8 shadow-sm dark:border-[#2b2b34]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {/* Badge */}
                <div className="mb-3.5 flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FE6F34]/30 bg-[#FFF0EA] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FE6F34] dark:border-[#5C2E1A] dark:bg-[#2E1810] dark:text-[#FF8C53]">
                    <Sparkles className="h-3.5 w-3.5 text-[#FE6F34] dark:text-[#FF8C53] fill-[#FE6F34]/20" />
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
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-left w-24 flex flex-col justify-between shadow-sm dark:border-[#282830] dark:bg-[#18181C]/90">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86]">PUBLISHED</p>
                  <p className="text-2xl font-bold text-zinc-950 dark:text-white leading-none mt-2">{live}</p>
                </div>
                {/* Total stat */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-left w-24 flex flex-col justify-between shadow-sm dark:border-[#282830] dark:bg-[#18181C]/90">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86]">TOTAL</p>
                  <p className="text-2xl font-bold text-zinc-950 dark:text-white leading-none mt-2">{total}</p>
                </div>
                {/* New page button - opens popup modal */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-black px-5 py-3 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-md whitespace-nowrap dark:bg-[#FE6F34] dark:text-black dark:hover:bg-[#ff7d47] cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-white dark:text-black stroke-[2.5px]" />
                  New page
                </button>
              </div>
            </div>
          </div>

          {/* Search bar + spaces used */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 w-[380px] focus-within:border-[#FE6F34]/50 transition-colors shadow-sm dark:border-[#2e2e38] dark:bg-[#141417]">
              <Search className="h-4 w-4 text-zinc-400 dark:text-[#9B9085] shrink-0" />
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
          <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden dark:border-[#2e2e38] dark:bg-[#0E0E10]">
            {filtered.length === 0 && pages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EA] text-[#FE6F34] mb-5 dark:bg-[#2a1a08]">
                  <Sparkles className="h-7 w-7 text-[#FE6F34]" />
                </div>
                <p className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Create your first lead magnet</p>
                <p className="text-xs text-zinc-500 dark:text-[#9B9085] max-w-xs mb-6 leading-relaxed">
                  Build the landing page, resource email, and follow-up sequence in one guided flow.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition dark:bg-[#FE6F34] dark:hover:bg-[#e55e28] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Create lead magnet
                </button>
              </div>
            ) : filtered.length === 0 ? (
              /* No search results */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <p className="text-sm font-medium text-zinc-950 dark:text-white mb-1">No results found</p>
                <p className="text-xs text-zinc-500 dark:text-[#9B9085]">Try a different title or URI.</p>
              </div>
            ) : (
              /* Pages list */
              <div className="divide-y divide-zinc-200/80 dark:divide-[#252529]">
                {filtered.map((page) => (
                  <div
                    key={page.id}
                    className="flex flex-col gap-4 p-4 transition hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:px-5 dark:hover:bg-[#252529]/40"
                  >
                    {/* Color preview thumbnail */}
                    <div
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-[#2e2e38]"
                      style={{ backgroundColor: page.accent }}
                    >
                      <div className="absolute inset-x-2 top-2 h-1 rounded-full bg-white/80" />
                      <div className="absolute inset-x-2 top-4 h-0.5 rounded-full bg-white/30" />
                      <div className="absolute inset-x-2 top-5.5 h-0.5 rounded-full bg-white/30" />
                      <div className="absolute bottom-2 left-2 right-2 flex h-5 items-center justify-center rounded bg-white/90">
                        <span className="truncate px-1 text-[5px] font-bold text-black">{page.headline}</span>
                      </div>
                    </div>

                    {/* Name + slug */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/pages/${page.id}`}
                          className="truncate text-sm font-semibold text-zinc-950 hover:text-[#FE6F34] transition dark:text-white dark:hover:text-[#FE6F34]"
                        >
                          {page.name}
                        </Link>
                        <StatusBadge status={page.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-[#9B9085] flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Rocket className="h-3 w-3" />
                          /{account.username}/{page.slug}
                        </span>
                        {page.status === "live" && (
                          <a
                            href={`https://magnets.so/${account.username}/${page.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-zinc-950 transition dark:hover:text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-right shrink-0">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">{page.views.toLocaleString()}</p>
                        <p className="flex items-center justify-end gap-1 text-[11px] text-zinc-500 dark:text-[#9B9085]">
                          <Eye className="h-3 w-3" /> views
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">{page.signups.toLocaleString()}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-[#9B9085]">signups</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                          {page.conversionRate ? `${page.conversionRate.toFixed(1)}%` : "—"}
                        </p>
                        <p className="flex items-center justify-end gap-1 text-[11px] text-zinc-500 dark:text-[#9B9085]">
                          <MousePointerClick className="h-3 w-3" /> conv.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/dashboard/pages/${page.id}`}
                        aria-label={`Edit ${page.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition dark:border-[#2e2e38] dark:bg-transparent dark:text-[#9B9085] dark:hover:border-[#3a3a3f] dark:hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        aria-label={`Delete ${page.name}`}
                        onClick={() => removePage(page.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:border-red-600 hover:text-red-600 transition dark:border-[#2e2e38] dark:bg-transparent dark:text-[#9B9085] dark:hover:border-red-800 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-200/80 px-6 py-4 flex items-center justify-between text-xs text-zinc-400 dark:border-[#2e2e38] dark:text-[#9B9085]">
          <span>Magnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>

      {/* 'Create a magnet' Modal Overlay matching exact user screenshot */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="relative w-full max-w-[460px] rounded-2xl border border-[#2e2e38] bg-[#18181c] p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Create a magnet</h3>
                <p className="text-xs text-[#9B9085] mt-1">Name the page and choose its URL.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-[#9B9085] hover:bg-[#25252b] hover:text-white transition-colors cursor-pointer"
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
                  subheadline: "Enter your email to get instant access.",
                  buttonText: "Get instant access",
                  accent: "#FE6F34",
                  views: 0,
                  signups: 0,
                  updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                  deliveryEmail: {
                    subject: "Your resource is inside",
                    previewText: "Here is your link",
                    body: "Thanks for signing up!",
                    linkText: "Access resource",
                    linkUrl: "",
                  },
                };

                const nextPages = [newMagnetPage, ...pages];
                setPages(nextPages);
                savePages(nextPages);
                setShowCreateModal(false);
                router.push(`/dashboard/pages/${newId}`);
              }}
              className="space-y-4"
            >
              {/* Page Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#d4c8bc]">Page name</label>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="AI Pipeline Playbook"
                  className="w-full rounded-xl border border-[#FE6F34]/80 bg-[#121214] px-3.5 py-2.5 text-xs text-white placeholder:text-[#52525b] outline-none focus:ring-1 focus:ring-[#FE6F34] transition-all"
                  required
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#d4c8bc]">URL slug</label>
                <div className="flex items-center rounded-xl border border-[#2e2e38] bg-[#121214] px-3.5 py-2.5 text-xs text-[#9B9085]">
                  <span className="text-[#666675] shrink-0 mr-1.5">/</span>
                  <span className="font-mono text-[#d4c8bc] truncate">{newSlug}</span>
                </div>
                <p className="text-[11px] text-[#666675]">The path of the page. Lowercase, digits, and hyphens only.</p>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#2e2e38] bg-[#222228] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2c2c34] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#FE6F34] px-4 py-2 text-xs font-bold text-black hover:bg-[#ff7d47] transition-all cursor-pointer shadow-sm"
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