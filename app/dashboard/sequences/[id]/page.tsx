"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarClock, Check, GripVertical, Loader2, MailOpen, Plus, Rocket, StopCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import Button from "@/components/ui/button";
import { type Sequence, type SequenceEmail } from "@/lib/data";
import { loadPages, loadSequences, saveSequences, loadAccount, syncWithDatabase } from "@/lib/store";

const delays = [
  { label: "Instantly", minutes: 0 },
  { label: "1 hour later", minutes: 60 },
  { label: "1 day later", minutes: 1440 },
  { label: "2 days later", minutes: 2880 },
  { label: "3 days later", minutes: 4320 },
  { label: "5 days later", minutes: 7200 },
  { label: "1 week later", minutes: 10080 },
];

export default function SequenceEditor() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState(() => loadAccount());
  const [seq, setSeq] = useState<Sequence | undefined>(() => loadSequences().find((s) => s.id === params.id));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.sequences) {
          const found = data.sequences.find((s) => s.id === params.id);
          if (found) setSeq(found);
        }
        if (data.account) setAccount(data.account);
      }
    });
  }, [params.id]);

  if (!seq) {
    return (
      <DashboardShell account={account} title="Sequence">
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-sm font-medium text-ink-700 dark:text-ink-300">Sequence not found</p>
          <Link
            href="/dashboard/sequences"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950 dark:bg-brand-orange dark:text-ink-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sequences
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const attachedPage = seq.pageId ? loadPages().find((p) => p.id === seq.pageId) : undefined;

  function update(next: Sequence) {
    setSeq(next);
    saveSequences(loadSequences().map((s) => (s.id === next.id ? next : s)));
  }

  function save() {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 400);
  }

  function toggleStatus() {
    if (!seq) return;
    update({ ...seq, status: seq.status === "live" ? "draft" : "live" });
  }

  function patchEmail(id: string, patch: Partial<SequenceEmail>) {
    if (!seq) return;
    update({ ...seq, emails: seq.emails.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }

  function removeEmail(id: string) {
    if (!seq) return;
    update({ ...seq, emails: seq.emails.filter((e) => e.id !== id) });
  }

  function addEmail() {
    if (!seq) return;
    const n = seq.emails.length;
    const email: SequenceEmail = {
      id: `e_${Date.now()}`,
      subject: "Follow-up email",
      delayLabel: delays[Math.min(n, delays.length - 1)].label,
      delayMinutes: delays[Math.min(n, delays.length - 1)].minutes,
      status: "draft",
      sent: 0,
      opened: 0,
    };
    update({ ...seq, emails: [...seq.emails, email] });
  }

  async function copyStartLink() {
    if (!seq) return;
    const link = `https://magnets.stop/${seq.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (_) {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const { signedUp, delivered, opened, replied, stopped } = seq.stats;

  return (
    <DashboardShell account={account} title="Sequence">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard/sequences"
                aria-label="Back to sequences"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-600 transition hover:bg-ink-50 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
              <h2 className="text-lg font-semibold text-ink-950 dark:text-white">{seq.name}</h2>
              <StatusBadge status={seq.status} />
            </div>
            <p className="mt-1.5 pl-10 text-sm text-ink-500 dark:text-ink-400">
              {attachedPage ? (
                <>
                  Attached to{" "}
                  <Link href={`/dashboard/pages/${attachedPage.id}`} className="font-medium text-ink-800 underline-offset-4 hover:underline dark:text-ink-200">
                    {attachedPage.name}
                  </Link>
                </>
              ) : (
                "Not attached to a page yet"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 pl-10 sm:pl-0">
            <Button onClick={copyStartLink} className="w-auto">
              {copied ? <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" /> : <Rocket className="h-4 w-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy stop link"}
            </Button>
            <Button onClick={save} disabled={saving} className="w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              Save
            </Button>
            <Button
              onClick={toggleStatus}
              className="hover:border-brand-orange hover:bg-brand-orange hover:text-ink-950 w-auto"
            >
              {seq.status === "live" ? "Pause" : "Activate"}
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Emails</h3>
            {seq.emails.map((email, i) => (
              <div
                key={email.id}
                className="rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900/95"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-ink-300 dark:text-ink-600" aria-hidden="true" />
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[11px] font-bold text-white dark:bg-brand-orange dark:text-ink-950">
                    {i + 1}
                  </span>
                  <select
                    value={email.delayMinutes}
                    onChange={(e) => {
                      const d = delays.find((x) => x.minutes === Number(e.target.value)) ?? delays[0];
                      patchEmail(email.id, { delayMinutes: d.minutes, delayLabel: d.label });
                    }}
                    aria-label="Email delay"
                    className="flex h-9 items-center rounded-md border border-ink-200 bg-white px-2 text-sm text-ink-900 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                  >
                    {delays.map((d) => (
                      <option key={d.minutes} value={d.minutes}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-ink-500 dark:bg-ink-950 dark:text-ink-400">
                    {email.opened || email.sent ? Math.round(email.sent ? (email.opened / email.sent) * 100 : 0) : 0}%
                  </span>
                  <button
                    aria-label="Delete email"
                    onClick={() => removeEmail(email.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-400 transition hover:text-brand-coral dark:text-ink-500 dark:hover:text-brand-coral"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <input
                  value={email.subject}
                  onChange={(e) => patchEmail(email.id, { subject: e.target.value })}
                  placeholder="Email subject"
                  className="mt-3 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {email.sent.toLocaleString()} sent · {email.opened.toLocaleString()} opened
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      email.status === "live"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/90 dark:text-emerald-300"
                        : "border-ink-200 bg-ink-50 text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${email.status === "live" ? "bg-emerald-500" : "bg-ink-400"}`} />
                    {email.status === "live" ? "Live" : "Draft"}
                  </span>
                </div>
              </div>
            ))}
            <button
              onClick={addEmail}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 py-3 text-sm font-medium text-ink-600 transition hover:border-ink-400 hover:bg-white dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-500 dark:hover:bg-ink-900/95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add email
            </button>
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95">
              <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Performance</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Signed up", value: signedUp, icon: Rocket },
                  { label: "Delivered", value: delivered, icon: MailOpen },
                  { label: "Opened", value: opened, icon: CalendarClock },
                  { label: "Replied", value: replied, icon: ArrowUpRight },
                  { label: "Stopped", value: stopped, icon: StopCircle },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                      <row.icon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      {row.label}
                    </span>
                    <span className="text-sm font-semibold text-ink-950 dark:text-white">{row.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Stop on booking</h3>
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                    End the sequence when a Calendly or Cal.com booking arrives for the same email.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={seq.stopOnBooking}
                  onClick={() => update({ ...seq, stopOnBooking: !seq.stopOnBooking })}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                    seq.stopOnBooking ? "bg-ink-950 dark:bg-brand-orange" : "bg-ink-200 dark:bg-ink-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                      seq.stopOnBooking ? "left-[1.125rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}