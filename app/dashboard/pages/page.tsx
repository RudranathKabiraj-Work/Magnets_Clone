"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, MousePointerClick, Pencil, Plus, Rocket, Search, Sparkles, Trash2 } from "lucide-react";
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

  useEffect(() => {
    // Load local data instantly
    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localPages.length > 0) setPages(localPages);
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) setPages(data.pages);
        if (data.account) setAccount(data.account);
      }
    });
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
            <h2 className="flex items-center gap-2 text-3xl font-bold text-white">
              Lead magnets
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-[#2e2e38] text-xs font-normal text-[#9B9085] hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-[#9B9085] mt-1">Create, publish, and manage your lead magnets</p>
          </div>

          {/* Conversion Workspace banner */}
          <div
            className="relative mb-6 overflow-hidden rounded-2xl border border-[#34343f] py-7 px-8 shadow-xl"
            style={{
              background: "radial-gradient(circle at 6% 50%, rgba(254, 111, 52, 0.22) 0%, transparent 45%), linear-gradient(135deg, #2b201b 0%, #222227 50%, #1d1d22 100%)",
            }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {/* Badge */}
                <div className="mb-3.5 flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FE6F34]/40 bg-[#351b11] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FE6F34]">
                    <Sparkles className="h-3.5 w-3.5 text-[#FE6F34] fill-[#FE6F34]/20" />
                    CONVERSION WORKSPACE
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white tracking-tight mb-1.5">Your lead magnet library</h3>
                <p className="text-sm text-[#a3998e]">
                  Create the signup page, delivery email, follow-up emails, and post-signup page.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Published stat */}
                <div className="rounded-xl border border-[#34343f] bg-[#2a2a30]/90 p-3.5 text-left w-24 flex flex-col justify-between shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#888894]">PUBLISHED</p>
                  <p className="text-2xl font-bold text-white leading-none mt-2">{live}</p>
                </div>
                {/* Total stat */}
                <div className="rounded-xl border border-[#34343f] bg-[#2a2a30]/90 p-3.5 text-left w-24 flex flex-col justify-between shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#888894]">TOTAL</p>
                  <p className="text-2xl font-bold text-white leading-none mt-2">{total}</p>
                </div>
                {/* New page button */}
                <Link
                  href="/dashboard/pages/new"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#FE6F34] px-5 py-3 text-xs font-bold text-white hover:bg-[#ff7d47] transition shadow-md whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 text-white stroke-[2.5px]" />
                  New page
                </Link>
              </div>
            </div>
          </div>

          {/* Search bar + spaces used */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#2e2e38] bg-[#141417] px-4 py-3 w-[380px] focus-within:border-[#FE6F34]/50 transition-colors shadow-sm">
              <Search className="h-4 w-4 text-[#9B9085] shrink-0" />
              <input
                type="text"
                placeholder="Search by title or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-white outline-none placeholder:text-[#9B9085] w-full"
              />
            </div>
            <p className="text-xs text-[#9B9085] shrink-0">{total} of 250 spaces used</p>
          </div>

          {/* Pages list or empty state */}
          <div className="rounded-2xl border border-[#2e2e38] bg-[#0E0E10] overflow-hidden">
            {filtered.length === 0 && pages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a1a08] mb-5">
                  <Sparkles className="h-7 w-7 text-[#FE6F34]" />
                </div>
                <p className="text-lg font-semibold text-white mb-2">Create your first lead magnet</p>
                <p className="text-xs text-[#9B9085] max-w-xs mb-6 leading-relaxed">
                  Build the landing page, resource email, and follow-up sequence in one guided flow.
                </p>
                <Link
                  href="/dashboard/pages/new"
                  className="flex items-center gap-2 rounded-xl bg-[#FE6F34] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55e28] transition"
                >
                  <Plus className="h-4 w-4" />
                  Create lead magnet
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              /* No search results */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <p className="text-sm font-medium text-white mb-1">No results found</p>
                <p className="text-xs text-[#9B9085]">Try a different title or URI.</p>
              </div>
            ) : (
              /* Pages list */
              <div className="divide-y divide-[#252529]">
                {filtered.map((page) => (
                  <div
                    key={page.id}
                    className="flex flex-col gap-4 p-4 transition hover:bg-[#252529]/40 sm:flex-row sm:items-center sm:px-5"
                  >
                    {/* Color preview thumbnail */}
                    <div
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#2e2e38]"
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
                          className="truncate text-sm font-semibold text-white hover:text-[#FE6F34] transition"
                        >
                          {page.name}
                        </Link>
                        <StatusBadge status={page.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#9B9085] flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Rocket className="h-3 w-3" />
                          /{account.username}/{page.slug}
                        </span>
                        {page.status === "live" && (
                          <a
                            href={`https://magnets.so/${account.username}/${page.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-white transition"
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
                        <p className="text-sm font-semibold text-white">{page.views.toLocaleString()}</p>
                        <p className="flex items-center justify-end gap-1 text-[11px] text-[#9B9085]">
                          <Eye className="h-3 w-3" /> views
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{page.signups.toLocaleString()}</p>
                        <p className="text-[11px] text-[#9B9085]">signups</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {page.conversionRate ? `${page.conversionRate.toFixed(1)}%` : "—"}
                        </p>
                        <p className="flex items-center justify-end gap-1 text-[11px] text-[#9B9085]">
                          <MousePointerClick className="h-3 w-3" /> conv.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/dashboard/pages/${page.id}`}
                        aria-label={`Edit ${page.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2e2e38] text-[#9B9085] hover:border-[#3a3a3f] hover:text-white transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        aria-label={`Delete ${page.name}`}
                        onClick={() => removePage(page.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2e2e38] text-[#9B9085] hover:border-red-800 hover:text-red-400 transition"
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