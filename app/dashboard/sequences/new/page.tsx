"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { type Sequence, type SequenceEmail } from "@/lib/data";
import { loadPages, loadSequences, saveSequences, loadAccount, syncWithDatabase } from "@/lib/store";

export default function NewSequence() {
  const router = useRouter();
  const [account, setAccount] = useState(() => loadAccount());
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [pages, setPages] = useState(() => loadPages());

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) setPages(data.pages);
        if (data.account) setAccount(data.account);
      }
    });
  }, []);

  function create(e: React.FormEvent) {
    e.preventDefault();
    const email: SequenceEmail = {
      id: `e_${Date.now()}`,
      subject: subject.trim() || "Your resource is on its way",
      delayLabel: "Instantly",
      delayMinutes: 0,
      status: "draft",
      sent: 0,
      opened: 0,
    };
    const seq: Sequence = {
      id: `s_${Date.now()}`,
      name: name.trim() || "Untitled sequence",
      status: "draft",
      stopOnBooking: false,
      stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0 },
      emails: [email],
    };
    const next = [seq, ...loadSequences()];
    saveSequences(next);
    router.push(`/dashboard/sequences/${seq.id}`);
  }

  return (
    <DashboardShell account={account} title="New sequence">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/dashboard/sequences"
          className="inline-flex h-8 items-center gap-1.5 text-sm font-medium text-ink-600 transition hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to sequences
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand-orange dark:bg-ink-950">
            <Send className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-white">Create a follow-up sequence</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              The first email delivers the resource. Every later email is a follow-up.
            </p>
          </div>
        </div>

        <form onSubmit={create} className="mt-8 space-y-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-900/95">
          <label className="block">
            <FieldLabel>Sequence name</FieldLabel>
            <Input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome sequence"
              maxLength={80}
              required
            />
          </label>
          <label className="block">
            <FieldLabel>Resource email subject</FieldLabel>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your guide is here →"
              maxLength={120}
              required
            />
            <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
              Sent instantly to every new signup. You can edit the full email next.
            </p>
          </label>
          {pages.length > 0 && (
            <div className="flex items-start gap-3 rounded-md border border-ink-200 bg-brand-soft p-3.5 text-xs leading-5 text-ink-600 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
              <Send className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" aria-hidden="true" />
              <span>
                You can attach this sequence to one of your pages later. New signups on that page start the sequence
                automatically.
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-ink-500 dark:text-ink-400">Email delivery is handled by Magnets from a verified sender.</p>
            <Button type="submit">
              Create sequence <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}