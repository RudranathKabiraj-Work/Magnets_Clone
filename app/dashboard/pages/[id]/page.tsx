"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Eye, FileText, Gift, Image as ImageIcon, Loader2, Palette, PenLine, Rocket, SpellCheck, Type } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { type MagnetPage } from "@/lib/data";
import { loadPages, savePages, loadAccount, syncWithDatabase } from "@/lib/store";

const templates = [
  { id: "classic", label: "Classic", hint: "Simple headline + form" },
  { id: "video", label: "Video", hint: "Lead with a walkthrough" },
  { id: "quiz", label: "Quiz", hint: "Interactive score result" },
] as const;

type TemplateId = (typeof templates)[number]["id"];

const accents = ["#FE6F34", "#FE504F", "#FDC957", "#7FD4DD", "#111111", "#5C554E"];

export default function PageEditor() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState(() => loadAccount());
  const [page, setPage] = useState<MagnetPage | undefined>(() => loadPages().find((p) => p.id === params.id));
  const [tab, setTab] = useState<"content" | "design">("content");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) {
          const found = data.pages.find((p) => p.id === params.id);
          if (found) setPage(found);
        }
        if (data.account) setAccount(data.account);
      }
    });
  }, [params.id]);

  if (!page) {
    return (
      <DashboardShell account={account} title="Page">
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-sm font-medium text-ink-700 dark:text-ink-300">Page not found</p>
          <p className="text-sm text-ink-500 dark:text-ink-400">It may have been deleted or the link is wrong.</p>
          <Link
            href="/dashboard/pages"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950 dark:bg-brand-orange dark:text-ink-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to pages
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const url = `https://magnets.so/${account.username}/${page.slug}`;
  const live = page.status === "live";

  function update(patch: Partial<MagnetPage>) {
    if (!page) return;
    const next = { ...page, ...patch };
    setPage(next);
    const all = loadPages().map((p) => (p.id === next.id ? next : p));
    savePages(all);
  }

  function save() {
    setSaving(true);
    window.setTimeout(() => {
      if (!page) return;
      const next = { ...page, updatedAt: "Just now" };
      setPage(next);
      const all = loadPages().map((p) => (p.id === next.id ? next : p));
      savePages(all);
      setSaving(false);
    }, 400);
  }

  function copyUrl() {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-ink-950">
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-5 dark:border-ink-700 dark:bg-ink-900/95">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/dashboard/pages"
            aria-label="Back to pages"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-600 transition hover:bg-ink-50 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="truncate text-sm font-semibold text-ink-950 dark:text-white">{page.name}</span>
          <StatusBadge status={page.status} />
          {live && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-ink-600 transition hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View live
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            Save
          </Button>
          <Button
            className="hover:border-brand-orange hover:bg-brand-orange hover:text-ink-950"
            onClick={() => update({ status: live ? "paused" : "live", publishedAt: live ? page.publishedAt : new Date().toISOString() })}
          >
            <Rocket className="h-4 w-4" aria-hidden="true" />
            {live ? "Pause" : "Publish"}
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 flex-1 sm:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="border-b border-ink-200 bg-white sm:h-[calc(100dvh-3rem)] sm:overflow-y-auto sm:border-b-0 sm:border-r dark:border-ink-700 dark:bg-ink-900/95">
          <div className="flex gap-1 border-b border-ink-200 px-3 pt-3 dark:border-ink-700">
            {[
              { id: "content" as const, label: "Content", icon: Type },
              { id: "design" as const, label: "Design", icon: Palette },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex h-9 items-center gap-1.5 rounded-t-md px-3 text-sm font-medium transition ${
                  tab === t.id
                    ? "border border-ink-200 border-b-white bg-white text-ink-950 dark:border-ink-700 dark:border-b-ink-900 dark:bg-ink-900 dark:text-white"
                    : "text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-5 p-5">
            {tab === "content" && (
              <>
                <div>
                  <FieldLabel>Headline</FieldLabel>
                  <textarea
                    value={page.headline}
                    onChange={(e) => update({ headline: e.target.value })}
                    rows={3}
                    maxLength={120}
                    className="flex min-h-11 w-full resize-none rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:ring-1 sm:min-h-9 focus:border-brand-orange focus:ring-brand-orange dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                  />
                </div>
                <div>
                  <FieldLabel>Subheadline</FieldLabel>
                  <textarea
                    value={page.subheadline}
                    onChange={(e) => update({ subheadline: e.target.value })}
                    rows={3}
                    maxLength={220}
                    className="flex min-h-11 w-full resize-none rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:ring-1 sm:min-h-9 focus:border-brand-orange focus:ring-brand-orange dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                  />
                </div>
                <div>
                  <FieldLabel>Button text</FieldLabel>
                  <Input value={page.cta} onChange={(e) => update({ cta: e.target.value })} maxLength={40} />
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">The button on the form. Keep it action-focused.</p>
                </div>
                <div>
                  <FieldLabel>What they get</FieldLabel>
                  <Input value={page.deliverable} onChange={(e) => update({ deliverable: e.target.value })} maxLength={60} />
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                    <Gift className="h-3 w-3" aria-hidden="true" />
                    Shown under the signup form to build trust.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-brand-soft p-3.5 dark:border-ink-700 dark:bg-ink-950">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-brand-orange">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-xs leading-5 text-ink-600 dark:text-ink-300">
                    A resource email is sent automatically on every signup. Set it up in the
                    <Link href="/dashboard/sequences" className="font-medium text-ink-900 underline-offset-4 hover:underline dark:text-white">
                      {" "}sequence editor
                    </Link>
                    .
                  </p>
                </div>
              </>
            )}

            {tab === "design" && (
              <>
                <div>
                  <FieldLabel>Template</FieldLabel>
                  <div className="grid gap-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => update({ template: t.id as TemplateId })}
                        className={`flex items-center justify-between rounded-md border p-3 text-left transition ${
                          page.template === t.id
                            ? "border-brand-orange bg-orange-50 ring-1 ring-brand-orange"
                            : "border-ink-200 hover:border-ink-300 dark:border-ink-700 dark:hover:border-ink-500"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium text-ink-950 dark:text-white">{t.label}</span>
                          <span className="block text-xs text-ink-500 dark:text-ink-400">{t.hint}</span>
                        </span>
                        {page.template === t.id && <Check className="h-4 w-4 text-brand-orange" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>Accent color</FieldLabel>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {accents.map((c) => (
                      <button
                        key={c}
                        aria-label={`Accent ${c}`}
                        onClick={() => update({ accent: c })}
                        className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
                          page.accent === c ? "border-ink-950 ring-2 ring-brand-orange" : "border-ink-200 dark:border-ink-700"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {page.accent === c && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                    <ImageIcon className="h-3 w-3" aria-hidden="true" />
                    The accent is used for buttons and highlights.
                  </p>
                </div>
                <div>
                  <FieldLabel>Spell check</FieldLabel>
                  <div className="flex items-center justify-between rounded-md border border-ink-200 p-3 dark:border-ink-700">
                    <span className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-300">
                      <SpellCheck className="h-4 w-4" aria-hidden="true" />
                      Check copy before publishing
                    </span>
                    <button
                      role="switch"
                      aria-checked={true}
                      className="relative h-5 w-9 rounded-full bg-ink-950 transition dark:bg-brand-orange"
                      onClick={() => {}}
                    >
                      <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        <div className="vercel-dot-bg flex min-h-[70vh] items-start justify-center bg-brand-soft px-4 py-10 sm:h-[calc(100dvh-3rem)] sm:min-h-0 sm:overflow-y-auto dark:bg-ink-950">
          <div className="w-full max-w-sm overflow-hidden rounded-lg border border-ink-200 bg-white shadow-hero dark:border-ink-700">
            <div className="flex h-9 items-center justify-between border-b border-ink-100 px-3 dark:border-ink-700">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-coral" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-aqua" />
              </div>
              <span className="truncate pl-6 font-mono text-[10px] text-ink-400">{url.replace("https://", "")}</span>
              <button
                aria-label="Copy URL"
                onClick={copyUrl}
                className="flex h-6 w-6 items-center justify-center rounded text-ink-500 transition hover:text-ink-900 dark:hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              </button>
            </div>
            <div className="px-7 pb-8 pt-10 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-[11px] font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
                <PenLine className="h-3 w-3 text-brand-orange" aria-hidden="true" />
                Powered by Magnets
              </span>
              <h2 className="mx-auto mt-5 text-2xl font-semibold leading-tight text-ink-950" style={{ color: page.accent === "#111111" ? "#111111" : undefined }}>
                {page.headline || "Your headline goes here"}
              </h2>
              <p className="mx-auto mt-3 text-sm leading-6 text-ink-600">{page.subheadline}</p>
              <div className="mt-6 rounded-md border border-ink-200 bg-white p-2.5 text-left dark:border-ink-700">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value=""
                    placeholder="Your best email"
                    className="min-h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:border-ink-700 dark:bg-ink-950"
                  />
                  <button className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: page.accent }}>
                    {page.cta || "Send me the resource"}
                  </button>
                </div>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-ink-500 dark:text-ink-400">
                <Gift className="h-3 w-3" aria-hidden="true" />
                {page.deliverable || "What people get"}
              </p>
              <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-ink-400 dark:text-ink-500">
                <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                No spam, unsubscribe any time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}