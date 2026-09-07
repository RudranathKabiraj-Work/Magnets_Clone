"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  HelpCircle,
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Plus,
  Rocket,
  Send,
  Sparkles,
  StopCircle,
  Trash2,
  Users,
  Eye,
  ExternalLink,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import StatusBadge from "@/components/dashboard/status-badge";
import { type Sequence, type SequenceEmail, type Account, type MagnetPage } from "@/lib/data";
import { loadPages, loadSequences, saveSequences, deleteSequence, loadAccount, syncWithDatabase } from "@/lib/store";

const delays = [
  { label: "Instantly", minutes: 0 },
  { label: "1 hour later", minutes: 60 },
  { label: "1 day later", minutes: 1440 },
  { label: "2 days later", minutes: 2880 },
  { label: "3 days later", minutes: 4320 },
  { label: "5 days later", minutes: 7200 },
  { label: "1 week later", minutes: 10080 },
];

const AI_SUBJECT_SUGGESTIONS = [
  "Quick question about your download...",
  "Did you get a chance to check out the resource?",
  "Here is a bonus resource to help you get started faster 🚀",
  "3 simple steps to double your conversion rate today",
  "Following up: How did the template work for you?",
];

interface ExtendedSequenceEmail extends SequenceEmail {
  body?: string;
}

export default function SequenceEditor() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [seq, setSeq] = useState<Sequence | undefined>(undefined);
  const [emailsWithBody, setEmailsWithBody] = useState<ExtendedSequenceEmail[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "edit" | "preview">>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatingAiForId, setGeneratingAiForId] = useState<string | null>(null);

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    const localAcc = loadAccount();
    if (localAcc) setAccount(localAcc);

    const resolveSeq = (seqList: Sequence[]) => {
      const found = seqList.find((s) => s.id === params.id);
      if (found) return found;

      const pageFound = loadPages().find((p) => p.id === params.id);
      if (pageFound) {
        const signupCount = pageFound.signups || 1;
        const emailsList = (pageFound.sequenceEmails && pageFound.sequenceEmails.length > 0)
          ? pageFound.sequenceEmails.map((e, idx) => ({
              id: e.id || `se_${pageFound.id}_${idx + 1}`,
              subject: e.subject || `Follow-up #${idx + 1}`,
              delayLabel: `${e.delayDays || 1} day${(e.delayDays || 1) > 1 ? "s" : ""} delay`,
              delayMinutes: (e.delayDays || 1) * 1440,
              status: "live" as const,
              sent: signupCount,
              opened: Math.round(signupCount * 0.8),
              body: e.body || "Hi {first_name},\n\nHope you find this resource valuable!\n\nBest regards,",
            }))
          : [
              {
                id: `se_${pageFound.id}_1`,
                subject: `Your ${pageFound.name} is ready for download!`,
                delayLabel: "Instantly",
                delayMinutes: 0,
                status: "live" as const,
                sent: signupCount,
                opened: Math.round(signupCount * 0.8),
                body: "Hi {first_name},\n\nHere is your requested download link for " + pageFound.name + ".\n\nEnjoy!",
              },
              {
                id: `se_${pageFound.id}_2`,
                subject: `Quick follow-up: Did you get a chance to check out the resource?`,
                delayLabel: "1 day delay",
                delayMinutes: 1440,
                status: "live" as const,
                sent: signupCount,
                opened: Math.round(signupCount * 0.6),
                body: "Hi {first_name},\n\nI wanted to check in and see if you had any questions after reviewing the resource.\n\nLet me know!",
              },
            ];

        return {
          id: pageFound.id,
          name: `${pageFound.name} Sequence`,
          pageId: pageFound.id,
          status: "live" as const,
          emails: emailsList,
          stopOnBooking: pageFound.stopOnCall || false,
          stats: {
            signedUp: signupCount,
            delivered: signupCount,
            opened: Math.round(signupCount * 0.8),
            replied: 0,
            stopped: 0,
          },
        };
      }
      return undefined;
    };

    const foundLocal = resolveSeq(loadSequences());
    if (foundLocal) {
      setSeq(foundLocal);
      setEmailsWithBody(
        foundLocal.emails.map((e) => ({
          ...e,
          body: (e as any).body || "Hi {first_name},\n\nThank you for signing up!\n\nBest,",
        }))
      );
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        const resolvedRemote = resolveSeq(data.sequences || []);
        if (resolvedRemote) {
          setSeq(resolvedRemote);
          setEmailsWithBody(
            resolvedRemote.emails.map((e) => ({
              ...e,
              body: (e as any).body || "Hi {first_name},\n\nThank you for signing up!\n\nBest,",
            }))
          );
        }
      }
    });
  }, [params.id]);

  if (!seq) {
    return (
      <DashboardShell account={account} title="Sequence">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Sequence Not Found</h2>
          <p className="text-sm text-zinc-500 max-w-sm">The requested sequence may have been deleted or moved.</p>
          <Link
            href="/dashboard/sequences"
            className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0066B2] px-5 text-xs font-bold text-white transition hover:bg-[#005291] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sequences
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const attachedPage = seq.pageId ? loadPages().find((p) => p.id === seq.pageId) : undefined;

  function update(next: Sequence, updatedEmails?: ExtendedSequenceEmail[]) {
    setSeq(next);
    if (updatedEmails) setEmailsWithBody(updatedEmails);
    const listToSave = loadSequences().map((s) => (s.id === next.id ? next : s));
    if (!listToSave.some((s) => s.id === next.id)) {
      listToSave.unshift(next);
    }
    saveSequences(listToSave);
  }

  function save() {
    if (!seq) return;
    setSaving(true);
    update({ ...seq, emails: emailsWithBody }, emailsWithBody);
    setTimeout(() => {
      setSaving(false);
      triggerToast("Sequence changes saved!");
    }, 450);
  }

  function toggleStatus() {
    if (!seq) return;
    const nextStatus = seq.status === "live" ? "draft" : "live";
    update({ ...seq, status: nextStatus });
    triggerToast(nextStatus === "live" ? "Sequence is now Live!" : "Sequence paused.");
  }

  function patchEmail(id: string, patch: Partial<ExtendedSequenceEmail>) {
    if (!seq) return;
    const nextEmails = emailsWithBody.map((e) => (e.id === id ? { ...e, ...patch } : e));
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
  }

  function removeEmail(id: string) {
    if (!seq) return;
    const nextEmails = emailsWithBody.filter((e) => e.id !== id);
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    triggerToast("Email step removed.");
  }

  function addEmail() {
    if (!seq) return;
    const n = emailsWithBody.length;
    const newId = `e_${Date.now()}`;
    const delayObj = delays[Math.min(n, delays.length - 1)];
    const email: ExtendedSequenceEmail = {
      id: newId,
      subject: `Follow-up #${n + 1}: Checking in`,
      delayLabel: delayObj.label,
      delayMinutes: delayObj.minutes,
      status: "live",
      sent: 0,
      opened: 0,
      body: "Hi {first_name},\n\nJust following up to see if you had any questions!\n\nBest,",
    };
    const nextEmails = [...emailsWithBody, email];
    setEmailsWithBody(nextEmails);
    update({ ...seq, emails: nextEmails }, nextEmails);
    setExpandedEmailId(newId);
    triggerToast("New email step added!");
  }

  function generateAiSubject(id: string) {
    setGeneratingAiForId(id);
    setTimeout(() => {
      const randomSub = AI_SUBJECT_SUGGESTIONS[Math.floor(Math.random() * AI_SUBJECT_SUGGESTIONS.length)];
      patchEmail(id, { subject: randomSub });
      setGeneratingAiForId(null);
      triggerToast("Generated AI subject!");
    }, 600);
  }

  async function copyStartLink() {
    if (!seq) return;
    const link = `${typeof window !== "undefined" ? window.location.origin : "https://magnets.app"}/stop/${seq.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (_) {}
    setCopied(true);
    triggerToast("Unsubscribe stop link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const { signedUp, delivered, opened, replied, stopped } = seq.stats;
  const overallOpenRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;

  return (
    <DashboardShell account={account} title={`Sequence - ${seq.name}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/50 to-[#F8FAFC] dark:from-[#09090B] dark:via-[#121215] dark:to-[#09090B]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
            <div className="flex items-start gap-4">
              <Link
                href="/dashboard/sequences"
                aria-label="Back to sequences"
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {seq.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-xs ${
                      seq.status === "live"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${seq.status === "live" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {seq.status === "live" ? "Live Automation" : "Paused Drip"}
                  </span>
                </div>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  {attachedPage ? (
                    <>
                      <span>Linked Lead Magnet:</span>
                      <Link
                        href={`/dashboard/leadmagnets/${attachedPage.id}`}
                        className="font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline inline-flex items-center gap-1"
                      >
                        🎯 {attachedPage.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 italic">Standalone sequence (Not attached to page)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions Button Group */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={copyStartLink}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] px-3.5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition shadow-xs cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-zinc-400" />}
                <span>{copied ? "Copied Stop Link" : "Copy Stop Link"}</span>
              </button>

              <button
                onClick={toggleStatus}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer border ${
                  seq.status === "live"
                    ? "border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                    : "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>{seq.status === "live" ? "Pause Sequence" : "Activate Sequence"}</span>
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005291] active:scale-[0.98] transition shadow-md cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete sequence "${seq.name}"?`)) {
                    deleteSequence(seq.id);
                    window.location.href = "/dashboard/sequences";
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition shadow-xs cursor-pointer"
                title="Delete this sequence permanently"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Main Grid Content */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Left Column: Email Timeline (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span>Automated Drip Sequence Steps</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {emailsWithBody.length} scheduled email{emailsWithBody.length !== 1 ? "s" : ""} in this follow-up funnel.
                  </p>
                </div>
                
                <button
                  onClick={addEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] px-3 py-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:bg-blue-50 dark:hover:bg-zinc-800 transition shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Step</span>
                </button>
              </div>

              {/* Email Cards Container */}
              <div className="relative space-y-4">
                {/* Connecting Vertical Line */}
                {emailsWithBody.length > 1 && (
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#0066B2]/40 via-zinc-200 dark:via-zinc-800 to-transparent z-0 pointer-events-none" />
                )}

                {emailsWithBody.map((email, i) => {
                  const isExpanded = expandedEmailId === email.id;
                  const currentTab = activeTab[email.id] || "edit";
                  const openPercentage = email.sent > 0 ? Math.round((email.opened / email.sent) * 100) : 0;

                  return (
                    <div
                      key={email.id}
                      className="relative z-10 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181B] p-5 shadow-sm transition hover:shadow-md backdrop-blur-sm"
                    >
                      {/* Card Top Control Row */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0066B2] text-xs font-extrabold text-white shadow-xs">
                            {i + 1}
                          </span>

                          {/* Delay Selector */}
                          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            <Clock className="h-3.5 w-3.5 text-zinc-400" />
                            <select
                              value={email.delayMinutes}
                              onChange={(e) => {
                                const d = delays.find((x) => x.minutes === Number(e.target.value)) ?? delays[0];
                                patchEmail(email.id, { delayMinutes: d.minutes, delayLabel: d.label });
                              }}
                              aria-label="Email delay"
                              className="bg-transparent font-bold text-xs text-zinc-900 dark:text-white outline-none cursor-pointer"
                            >
                              {delays.map((d) => (
                                <option key={d.minutes} value={d.minutes} className="bg-white dark:bg-zinc-900">
                                  {d.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Eye className="h-3 w-3" />
                            {openPercentage}% Open Rate
                          </span>

                          <button
                            onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            title="Toggle email content editor"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          {emailsWithBody.length > 1 && (
                            <button
                              aria-label="Delete email step"
                              onClick={() => removeEmail(email.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subject Line Input Row */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Subject Line *
                          </label>
                          <button
                            onClick={() => generateAiSubject(email.id)}
                            disabled={generatingAiForId === email.id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {generatingAiForId === email.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            )}
                            <span>AI Subject Suggest</span>
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={email.subject}
                            onChange={(e) => patchEmail(email.id, { subject: e.target.value })}
                            placeholder="Enter compelling email subject..."
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-3 text-xs font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Expandable Email Body & Preview Section */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveTab((prev) => ({ ...prev, [email.id]: "edit" }))}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  currentTab === "edit"
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                }`}
                              >
                                Edit Body
                              </button>
                              <button
                                onClick={() => setActiveTab((prev) => ({ ...prev, [email.id]: "preview" }))}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  currentTab === "preview"
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                }`}
                              >
                                Live Preview
                              </button>
                            </div>

                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                              Variables: {"{first_name}"}, {"{resource_link}"}
                            </span>
                          </div>

                          {currentTab === "edit" ? (
                            <textarea
                              rows={5}
                              value={email.body || ""}
                              onChange={(e) => patchEmail(email.id, { body: e.target.value })}
                              placeholder="Write your email content here..."
                              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none font-sans leading-relaxed"
                            />
                          ) : (
                            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 p-4 text-xs space-y-2">
                              <div className="text-[11px] font-semibold text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                From: Your Brand &lt;hello@yourdomain.com&gt;
                                <br />
                                Subject: {email.subject}
                              </div>
                              <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed pt-1">
                                {(email.body || "")
                                  .replace(/\{first_name\}/g, "Alex")
                                  .replace(/\{resource_link\}/g, "https://download-link.com")}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Footer Info */}
                      <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Send className="h-3 w-3 text-zinc-400" />
                          <span>{email.sent.toLocaleString()} Delivered</span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span>{email.opened.toLocaleString()} Opened</span>
                        </span>

                        <button
                          onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                          className="text-[#0066B2] dark:text-[#38BDF8] hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          {isExpanded ? "Collapse Editor" : "Edit Content & Body →"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Email Step Action Button */}
                <button
                  onClick={addEmail}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-[#18181B]/40 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-[#0066B2] hover:text-[#0066B2] dark:hover:border-[#38BDF8] dark:hover:text-[#38BDF8] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Email Step to Funnel</span>
                </button>
              </div>
            </div>

            {/* Right Column: Performance & Settings (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Performance Metrics Card */}
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181B] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span>Funnel Performance</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {overallOpenRate}% Open Rate
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Signed up", value: signedUp, icon: Users, color: "text-blue-500 bg-blue-500/10" },
                    { label: "Delivered", value: delivered, icon: MailOpen, color: "text-indigo-500 bg-indigo-500/10" },
                    { label: "Opened", value: opened, icon: CalendarClock, color: "text-emerald-500 bg-emerald-500/10" },
                    { label: "Completed", value: seq.stats.completed || (delivered > 0 ? delivered : 0), icon: Check, color: "text-purple-500 bg-purple-500/10" },
                    { label: "Replied", value: replied, icon: MessageSquare, color: "text-amber-500 bg-amber-500/10" },
                    { label: "Stopped", value: stopped, icon: StopCircle, color: "text-rose-500 bg-rose-500/10" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2.5 font-medium text-zinc-600 dark:text-zinc-400">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${row.color}`}>
                          <row.icon className="h-3.5 w-3.5" />
                        </span>
                        {row.label}
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white font-mono">{row.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Open Rate Visual Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>Email Engagement Rate</span>
                    <span>{overallOpenRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0066B2] to-emerald-400"
                      style={{ width: `${Math.min(overallOpenRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stop on Booking Automation Card */}
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#18181B] p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Stop Drip on Booking</span>
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Automatically pause follow-up emails when a lead schedules a call via Calendly or Cal.com.
                    </p>
                  </div>

                  <button
                    role="switch"
                    aria-checked={seq.stopOnBooking}
                    onClick={() => {
                      const nextVal = !seq.stopOnBooking;
                      update({ ...seq, stopOnBooking: nextVal });
                      triggerToast(nextVal ? "Stop on booking enabled!" : "Stop on booking disabled.");
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      seq.stopOnBooking ? "bg-[#0066B2]" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        seq.stopOnBooking ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Unsubscribe & Stop Link Explanation */}
              <div className="rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <HelpCircle className="h-4 w-4" />
                  <span>How Stop Links Work</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Every sequence email automatically attaches your unique stop link at the bottom. When a lead clicks it, their email status changes to <span className="font-bold text-rose-500">Stopped</span> and no further drip emails will be sent.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}