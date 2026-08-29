"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, MousePointerClick, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { pageStats, type MagnetPage } from "@/lib/data";
import { loadPages, savePages, loadAccount, syncWithDatabase } from "@/lib/store";

function PagePreview({ page }: { page: MagnetPage }) {
  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-ink-200 p-1.5 dark:border-ink-700"
      style={{ backgroundColor: page.accent }}
    >
      <div className="absolute inset-x-1.5 top-1.5 h-1 rounded-full bg-white/90" />
      <div className="absolute inset-x-1.5 top-4 h-1 rounded-full bg-white/40" />
      <div className="absolute inset-x-1.5 top-5 h-1 rounded-full bg-white/40" />
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex h-6 items-center justify-center rounded bg-white">
        <span className="truncate px-1 text-[6px] font-semibold text-ink-950">{page.headline}</span>
      </div>
    </div>
  );
}

export default function PagesPage() {
  const router = useRouter();
  const [account, setAccount] = useState(() => loadAccount());
  const [pages, setPages] = useState<MagnetPage[]>(() => loadPages());
  const live = useMemo(() => pages.filter((p) => p.status === "live").length, [pages]);

  useEffect(() => {
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

  return (
    <DashboardShell account={account} title="Pages">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pageStats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95"
            >
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 dark:text-white">{s.value}</p>
              <p className={`mt-1 text-xs font-medium ${s.up ? "text-emerald-600 dark:text-emerald-300" : "text-ink-500"}`}>
                {s.change} this month
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-white">
              Your pages <span className="text-ink-400">({pages.length})</span>
            </h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              {live} live · {pages.length - live} in draft
            </p>
          </div>
          <Link
            href="/dashboard/pages/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950 dark:bg-brand-orange dark:text-ink-950"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New page
          </Link>
        </div>

        <div className="mt-5 divide-y divide-ink-200 rounded-lg border border-ink-200 bg-white dark:divide-ink-700 dark:border-ink-700 dark:bg-ink-900/95">
          {pages.map((page) => (
            <div
              key={page.id}
              className="grid gap-4 p-4 transition hover:bg-ink-50/70 sm:grid-cols-[80px_minmax(0,1fr)_minmax(0,1.4fr)_40px] sm:items-center sm:px-5 dark:hover:bg-white/5"
            >
              <PagePreview page={page} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/pages/${page.id}`}
                    className="truncate text-sm font-semibold text-ink-950 transition hover:text-brand-orange dark:text-white dark:hover:text-brand-orange"
                  >
                    {page.name}
                  </Link>
                  <StatusBadge status={page.status} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <Rocket className="h-3 w-3" aria-hidden="true" />
                    magnets.so/{account.username}/{page.slug}
                  </span>
                  {page.status === "live" && (
                    <a
                      href={`https://magnets.so/${account.username}/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 transition hover:text-ink-900 dark:hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      View
                    </a>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-right sm:gap-6">
                <div>
                  <p className="text-xs font-medium text-ink-950 dark:text-white">{page.views.toLocaleString()}</p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-ink-500 dark:text-ink-400">
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    views
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-950 dark:text-white">{page.signups.toLocaleString()}</p>
                  <p className="text-[11px] text-ink-500 dark:text-ink-400">signups</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-950 dark:text-white">
                    {page.conversionRate ? `${page.conversionRate.toFixed(1)}%` : "—"}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-ink-500 dark:text-ink-400">
                    <MousePointerClick className="h-3 w-3" aria-hidden="true" />
                    conv.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 justify-self-end">
                <Link
                  href={`/dashboard/pages/${page.id}`}
                  aria-label={`Edit ${page.name}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 text-ink-600 transition hover:border-ink-300 hover:text-ink-950 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-500 dark:hover:text-white"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Link>
                <button
                  aria-label={`Delete ${page.name}`}
                  onClick={() => removePage(page.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 text-ink-600 transition hover:border-brand-coral hover:text-brand-coral dark:border-ink-700 dark:text-ink-300 dark:hover:border-brand-coral dark:hover:text-brand-coral"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          {pages.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-orange dark:bg-ink-950">
                <Plus className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-ink-700 dark:text-ink-300">No pages yet</p>
              <p className="max-w-xs text-sm text-ink-500 dark:text-ink-400">
                Create your first lead magnet page. It takes about two minutes.
              </p>
              <Link
                href="/dashboard/pages/new"
                className="mt-1 inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950 dark:bg-brand-orange dark:text-ink-950"
              >
                Create a page
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}