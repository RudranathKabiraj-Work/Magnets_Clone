"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { type MagnetPage } from "@/lib/data";
import { loadPages, savePages, loadAccount, syncWithDatabase } from "@/lib/store";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "untitled-page"
  );
}

export default function NewPage() {
  const router = useRouter();
  const [account, setAccount] = useState(() => loadAccount());
  const [name, setName] = useState("");
  const slug = slugify(name);

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data && data.account) setAccount(data.account);
    });
  }, []);

  function create(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const page: MagnetPage = {
      id: `p_${Date.now()}`,
      name: name.trim() || "Untitled page",
      slug,
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: "Your headline goes here",
      subheadline: "Tell visitors what they get and why it is worth their email.",
      cta: "Send me the resource",
      deliverable: "Describe what people receive",
      updatedAt: "Just now",
      publishedAt: null,
      template: "classic",
      accent: "#FE6F34",
    };
    const next = [page, ...loadPages()];
    savePages(next);
    router.push(`/dashboard/leadmagnets/${page.id}`);
  }

  return (
    <DashboardShell account={account} title="New page">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/dashboard/leadmagnets"
          className="inline-flex h-8 items-center gap-1.5 text-sm font-medium text-ink-600 transition hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to pages
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand-orange dark:bg-ink-950">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-white">Create a new page</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">Name your lead magnet. You can change everything later.</p>
          </div>
        </div>

        <form onSubmit={create} className="mt-8 space-y-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-900/95">
          <label className="block">
            <FieldLabel>Page name</FieldLabel>
            <Input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The 5-Minute Content Engine"
              maxLength={80}
              required
            />
          </label>
          <div>
            <FieldLabel>Your Magnets URL</FieldLabel>
            <div className="flex h-9 items-center gap-1 overflow-hidden rounded-md border border-ink-200 bg-ink-50 px-3 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
              <span className="text-ink-500 dark:text-ink-400">magnets.so/{account.username}/</span>
              <span className="truncate font-medium">{slug}</span>
            </div>
            <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
              Publish on this link immediately. You can connect your own domain later.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-ink-500 dark:text-ink-400">Free forever. No credit card.</p>
            <Button type="submit">
              Create page <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}