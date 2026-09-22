"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
  Linkedin,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Zap,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  Users,
  ArrowRight,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncWithDatabase, loadAccount, loadPages, loadLeads } from "@/lib/store";
import { getAppUrl } from "@/lib/data";
import type { Account, MagnetPage, Lead } from "@/lib/data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return "••••••••••••••••";
  return secret.slice(0, 6) + "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••" + secret.slice(-4);
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function LinkedInAutomationPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [linkedinLeads, setLinkedinLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Webhook config (fetched separately — not stored in localStorage for security)
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Accordion
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "guide": false,
  });

  const appUrl = getAppUrl();

  // ── Load account + pages + leads from localStorage instantly, then sync ──
  useEffect(() => {
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    const localPages = loadPages();
    if (localPages) setPages(localPages);

    const localLeads = loadLeads();
    if (localLeads) {
      setLinkedinLeads(localLeads.filter((l: Lead) => l.source === "linkedin-comment"));
    }

    setLoading(false);

    // Background sync
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setPages(data.pages || []);
        const liLeads = (data.leads || []).filter((l: Lead) => l.source === "linkedin-comment");
        setLinkedinLeads(liLeads);
      }
    });
  }, []);

  // ── Fetch webhook credentials from secure API endpoint ──
  const fetchLinkedInConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getLinkedInConfig" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWebhookUrl(data.webhookUrl);
          setWebhookSecret(data.secret);
        }
      }
    } catch (err) {
      console.error("[LinkedIn Config] Failed to fetch:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkedInConfig();
  }, [fetchLinkedInConfig]);

  // ── Regenerate secret ──
  const handleRegenerate = async () => {
    setRegenerating(true);
    setShowRegenerateConfirm(false);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerateLinkedInSecret" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWebhookSecret(data.secret);
          setShowSecret(true); // auto-reveal after regenerate so user can copy
        }
      }
    } catch (err) {
      console.error("[LinkedIn Config] Failed to regenerate:", err);
    } finally {
      setRegenerating(false);
    }
  };

  // ── Copy helper ──
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Only live pages are relevant for LinkedIn
  const livePages = pages.filter((p) => p.status === "live");

  // Sample Make.com JSON payload for the guide
  const samplePayload = webhookSecret
    ? JSON.stringify({
        secret: webhookSecret,
        magnetId: "PASTE_YOUR_MAGNET_ID_HERE",
        commenterName: "{{commenter.firstName}} {{commenter.lastName}}",
        commenterEmail: "{{commenter.email}}",
        commenterLinkedIn: "{{commenter.profileUrl}}",
        postUrl: "{{post.url}}",
        commentText: "{{comment.text}}",
      }, null, 2)
    : "";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardShell account={account} title="LinkedIn Auto-Reply">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#F8FBFF] dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8">

          {/* ── Page Heading ── */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2.5 text-3xl font-bold text-zinc-900 dark:text-white">
              <Linkedin className="h-7 w-7 text-[#0A66C2]" />
              LinkedIn Auto-Reply
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
              Automatically deliver your lead magnet to anyone who{" "}
              <span className="text-[#0066B2] font-semibold">comments on your LinkedIn posts</span>.
              Powered by Make.com.
            </p>
          </div>

          {/* ── Stats Banner ── */}
          <div className="conversion-banner-bg relative mb-5 overflow-hidden rounded-2xl border border-[#0A66C2]/30 bg-white py-6 px-8 shadow-sm dark:border-[#0A66C2]/35 dark:bg-[#18181C] transition-colors">
            <div className="mb-3 flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0A66C2]/30 bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0A66C2] dark:border-[#0A66C2]/40 dark:bg-[#0A66C2]/15 dark:text-[#38BDF8]">
                <Linkedin className="h-3.5 w-3.5" />
                LINKEDIN AUTOMATION
              </span>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-lg">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1">
                  Turn every comment into a lead
                </h3>
                <p className="text-sm text-zinc-600 dark:text-[#9B9085]/90 leading-relaxed">
                  Set up once. Make.com watches your LinkedIn posts and calls your personal webhook the moment someone comments — automatically delivering your resource and capturing them as a lead.
                </p>
              </div>

              {/* Stats pills */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#0A66C2]/30 bg-white/80 dark:border-[#0A66C2]/35 dark:bg-[#0E0E10]/70 px-4 py-3 shrink-0 shadow-sm">
                <Users className="h-4 w-4 text-[#0A66C2] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {loading ? "—" : linkedinLeads.length} LinkedIn Leads
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085]">captured so far</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Cards ── */}
          <div className="space-y-4">

            {/* ── Card 1: Webhook Credentials ── */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Your Webhook Credentials</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                    Paste these into Make.com. Your secret is unique to your account — never share it.
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                {/* Webhook URL */}
                <div>
                  <label className="block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">
                    Webhook URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={loadingConfig ? "Loading..." : webhookUrl}
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#09090B] px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-300 font-mono select-all outline-none"
                    />
                    <button
                      type="button"
                      disabled={loadingConfig}
                      onClick={() => copyToClipboard(webhookUrl, "webhookUrl")}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {copiedField === "webhookUrl" ? (
                        <><Check className="h-3.5 w-3.5 text-emerald-500" /><span>Copied</span></>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 text-zinc-400" /><span>Copy URL</span></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Secret Key */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085]">
                      Webhook Secret
                    </label>
                    {/* Regenerate button */}
                    {!showRegenerateConfirm ? (
                      <button
                        type="button"
                        disabled={regenerating || loadingConfig}
                        onClick={() => setShowRegenerateConfirm(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-[#9B9085] hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Regenerate
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-red-500 font-semibold">Old secret stops working immediately.</span>
                        <button
                          onClick={handleRegenerate}
                          disabled={regenerating}
                          className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {regenerating ? "Regenerating..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setShowRegenerateConfirm(false)}
                          className="text-[11px] text-zinc-500 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        readOnly
                        type={showSecret ? "text" : "password"}
                        value={loadingConfig ? "Loading..." : webhookSecret}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#09090B] px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-300 font-mono select-all outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                        title={showSecret ? "Hide secret" : "Reveal secret"}
                      >
                        {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={loadingConfig}
                      onClick={() => copyToClipboard(webhookSecret, "webhookSecret")}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {copiedField === "webhookSecret" ? (
                        <><Check className="h-3.5 w-3.5 text-emerald-500" /><span>Copied</span></>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 text-zinc-400" /><span>Copy</span></>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Never share this secret. If exposed, use Regenerate to invalidate it immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Card 2: Your Magnet IDs ── */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  <Linkedin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Your Lead Magnet IDs</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                    Copy the Magnet ID of the resource you want to deliver in comments and paste it into Make.com as <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[10px]">magnetId</code>.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading magnets...
                </div>
              ) : livePages.length === 0 ? (
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-[#18181C] flex items-start gap-3">
                  <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">No live magnets yet</p>
                    <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Publish a lead magnet first, then come back to connect it to LinkedIn.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {livePages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#121214] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{page.name}</p>
                        <p className="text-[10px] font-mono text-zinc-500 dark:text-[#9B9085] mt-0.5 truncate">{page.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(page.id, `magnet-${page.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition shrink-0 cursor-pointer"
                      >
                        {copiedField === `magnet-${page.id}` ? (
                          <><Check className="h-3 w-3 text-emerald-500" /><span>Copied</span></>
                        ) : (
                          <><Copy className="h-3 w-3 text-zinc-400" /><span>Copy ID</span></>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Card 3: Make.com Setup Guide (Accordion) ── */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => toggle("guide")}
                className="w-full flex items-center justify-between gap-3 p-5 hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Make.com Setup Guide</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Step-by-step: connect Make.com to your LinkedIn and this webhook.
                    </p>
                  </div>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B]">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["guide"] ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expanded Guide */}
              <div className={`grid transition-all duration-300 ease-in-out ${openSections["guide"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="px-5 pb-6 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">

                    {/* Steps */}
                    {[
                      {
                        n: 1,
                        title: "Create a new scenario in Make.com",
                        body: "Go to make.com → Create new scenario. Choose LinkedIn as the trigger app.",
                        link: "https://make.com",
                        linkLabel: "Open Make.com →",
                      },
                      {
                        n: 2,
                        title: "Add trigger: \"Watch Post Comments\"",
                        body: "In the LinkedIn module, select \"Watch Post Comments\". Connect your LinkedIn account via OAuth. Set it to watch your specific post or all posts.",
                      },
                      {
                        n: 3,
                        title: "Add an HTTP module → Make a Request",
                        body: "Add a new module: HTTP → Make a Request. Set Method to POST. Set URL to your webhook URL above.",
                      },
                      {
                        n: 4,
                        title: "Set the request body",
                        body: "Set Body Type to Raw → JSON. Paste this payload and map Make.com variables:",
                      },
                      {
                        n: 5,
                        title: "Add the LinkedIn Reply step",
                        body: "After the HTTP module, add LinkedIn → Create a Comment Reply. In the reply text, type your call-to-action (e.g. \"Check your inbox — I just sent you the resource!\").",
                      },
                      {
                        n: 6,
                        title: "Test & Activate",
                        body: "Click \"Run once\" in Make.com and comment on your own post to test. Check your Leads page to confirm the lead was captured. Then turn the scenario ON.",
                      },
                    ].map((step) => (
                      <div key={step.n} className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 flex items-start gap-4 shadow-2xs">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-white/20 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#202026]">
                          {step.n}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h6 className="text-xs font-bold text-zinc-900 dark:text-white">{step.title}</h6>
                          <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 leading-relaxed">{step.body}</p>
                          {step.link && (
                            <a
                              href={step.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                            >
                              {step.linkLabel} <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {/* Show payload box on step 4 */}
                          {step.n === 4 && webhookSecret && (
                            <div className="mt-3 relative">
                              <pre className="text-[10px] font-mono bg-zinc-900 dark:bg-[#0E0E10] text-emerald-400 rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                                {samplePayload}
                              </pre>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(samplePayload, "payload")}
                                className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-700 hover:bg-zinc-600 text-white transition cursor-pointer"
                              >
                                {copiedField === "payload" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                {copiedField === "payload" ? "Copied" : "Copy"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              </div>
            </div>

            {/* ── Card 4: Recent LinkedIn Leads ── */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Recent LinkedIn Leads</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Leads captured via LinkedIn comment automation.
                    </p>
                  </div>
                </div>
                <a
                  href="/dashboard/leads"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline shrink-0"
                >
                  View all leads <ArrowRight className="h-3 w-3" />
                </a>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-4">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading leads...
                </div>
              ) : linkedinLeads.length === 0 ? (
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-[#121214] text-center">
                  <Linkedin className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-white">No LinkedIn leads yet</p>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-1">
                    Once Make.com is connected and a post comment comes in, leads will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedinLeads.slice(0, 8).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#121214] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{lead.name}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-[#9B9085] truncate">{lead.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {lead.status}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-[#9B9085]">{lead.signedUpAt?.split(",")[0]}</span>
                      </div>
                    </div>
                  ))}
                  {linkedinLeads.length > 8 && (
                    <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] text-center pt-1">
                      +{linkedinLeads.length - 8} more —{" "}
                      <a href="/dashboard/leads" className="text-[#0066B2] hover:underline">view all in Leads</a>
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
