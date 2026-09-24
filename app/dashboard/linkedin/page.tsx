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
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
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

  // Test Webhook
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; alreadySubscribed?: boolean } | null>(null);

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

  // ── Test Webhook ──
  const handleTestWebhook = async () => {
    if (!webhookSecret || loadingConfig) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const testEmail = account?.email || "test@example.com";
      const testMagnetId = livePages[0]?.id || "";

      if (!testMagnetId) {
        setTestResult({
          success: false,
          message: "No live magnet found. Please publish at least one lead magnet first, then test again.",
        });
        setTestLoading(false);
        return;
      }

      const res = await fetch("/api/webhooks/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: webhookSecret,
          magnetId: testMagnetId,
          commenterName: "Test User (Dashboard)",
          commenterEmail: testEmail,
          commenterLinkedIn: "https://linkedin.com/in/test",
          postUrl: "https://linkedin.com/posts/test-post",
          commentText: "[Test] Sent from dashboard webhook tester.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          alreadySubscribed: !!data.alreadySubscribed,
          message: data.alreadySubscribed
            ? `Already subscribed: ${testEmail} was already a lead for this magnet. Pipeline is working — no duplicate was created.`
            : `Pipeline working! Delivery email sent to ${testEmail}. Check your inbox and your Leads page.`,
        });
      } else {
        setTestResult({ success: false, message: data.error || "Something went wrong. Check the console for details." });
      }
    } catch (err) {
      setTestResult({ success: false, message: "Network error. Make sure your dev server or production app is reachable." });
    } finally {
      setTestLoading(false);
    }
  };

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

  // ── Lead Filtering & Funnel Metrics ──
  const [selectedTab, setSelectedTab] = useState<"all" | "converted" | "pending">("all");

  const convertedLeads = linkedinLeads.filter(
    (l) => l.email && !l.email.includes("@linkedin-prospect.com")
  );
  const pendingLeads = linkedinLeads.filter(
    (l) => !l.email || l.email.includes("@linkedin-prospect.com")
  );

  const filteredLeads =
    selectedTab === "converted"
      ? convertedLeads
      : selectedTab === "pending"
      ? pendingLeads
      : linkedinLeads;

  const conversionRate =
    linkedinLeads.length > 0
      ? Math.round((convertedLeads.length / linkedinLeads.length) * 100)
      : 0;

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
              Powered by n8n & Unipile.
            </p>
          </div>

          {/* ── Funnel KPI Cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
            <div className="rounded-2xl border border-[#0A66C2]/20 bg-white p-5 shadow-xs dark:border-[#0A66C2]/25 dark:bg-[#18181C]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-[#9B9085]">Total LinkedIn Inbound</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0A66C2] dark:bg-[#0A66C2]/20 dark:text-[#38BDF8]">
                  <Linkedin className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{loading ? "—" : linkedinLeads.length}</p>
              <p className="text-[11px] text-zinc-400 dark:text-[#9B9085] mt-0.5">Commenters delivered via DM</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-white p-5 shadow-xs dark:border-emerald-500/25 dark:bg-[#18181C]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Converted (Emails Captured)</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{loading ? "—" : convertedLeads.length}</p>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Unlocked PDF & subscribed</p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-white p-5 shadow-xs dark:border-amber-500/25 dark:bg-[#18181C]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Conversion Rate</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  <Zap className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{loading ? "—" : `${conversionRate}%`}</p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">{pendingLeads.length} waiting to signup</p>
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

            {/* ── Card 1b: Test Your Webhook ── */}
            <div className="rounded-2xl border border-emerald-500/30 bg-white dark:border-emerald-500/25 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Test Your Webhook</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                    Send a real test lead using your secret and first live magnet. Confirms the full pipeline works before you set up Make.com.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  type="button"
                  disabled={testLoading || loadingConfig || !webhookSecret}
                  onClick={handleTestWebhook}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {testLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Testing...</>
                  ) : (
                    <><Zap className="h-4 w-4" />Send Test Lead</>                  
                  )}
                </button>
                <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                  Uses your own account email as the test commenter and your first live magnet. A delivery email will be sent to your inbox.
                </p>
              </div>

              {/* Result */}
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                    testResult.success
                      ? "border-emerald-500/30 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400"
                      : "border-red-400/30 bg-red-50/80 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400"
                  }`}
                >
                  {testResult.success ? (
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </motion.div>
              )}
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

                    {/* Flow diagram */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold text-zinc-500 dark:text-[#9B9085] mb-1">
                      <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#0A66C2]/20 text-[#0066B2] dark:text-[#38BDF8] border border-[#0066B2]/20">Rahul comments</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10">Make.com detects</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10">Calls your webhook</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Lead captured + Auto-reply posted</span>
                    </div>

                    {/* Steps */}
                    {[
                      {
                        n: 1,
                        title: "Create a new scenario in Make.com",
                        body: "Go to make.com → click \"Create new scenario\". Search for \"LinkedIn\" and add it as your first module.",
                        link: "https://make.com",
                        linkLabel: "Open Make.com →",
                      },
                      {
                        n: 2,
                        title: 'Add trigger: LinkedIn → "Watch Post Comments"',
                        body: "In the LinkedIn module, select the trigger \"Watch Post Comments\". Click \"Add\" → connect your LinkedIn account via OAuth. Set it to watch all your posts (or a specific post URL). Set interval to every 15 minutes.",
                      },
                      {
                        n: 3,
                        title: 'Add an action: HTTP → "Make a Request"',
                        body: "Click the \"+ \" to add a module after the trigger. Search \"HTTP\" → select \"Make a Request\". Set Method = POST. In the URL field, paste your Webhook URL from Card 1 above.",
                      },
                      {
                        n: 4,
                        title: "Set the request body (paste your payload)",
                        body: "Set Body Type = Raw. Content Type = JSON (application/json). Paste the payload below and replace the Make.com variable placeholders with the actual mapped fields from Step 2's output:",
                      },
                      {
                        n: 5,
                        title: 'Add the auto-reply: LinkedIn → "Create a Comment Reply"',
                        body: 'After the HTTP module, add LinkedIn → "Create a Comment Reply". For Comment ID, map the {{1.id}} field from the trigger. For Message, write your CTA — for example: "Hey {{1.author.firstName}}! 👋 Here is your free resource: https://magnets.bdatech.in/your-username/your-magnet — enjoy! Let me know if you have questions."',
                      },
                      {
                        n: 6,
                        title: "Test & Activate your scenario",
                        body: 'Click "Run once" in Make.com, then go to your LinkedIn post and comment on it yourself. Make.com should pick it up within 15 min. Check your Leads page here to confirm the lead was captured. Once confirmed, flip the scenario toggle to ON.',
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

                    {/* Email limitation note */}
                    <div className="rounded-xl border border-amber-400/30 bg-amber-50/70 dark:bg-amber-500/10 dark:border-amber-400/30 p-4">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11.5px] font-bold text-amber-800 dark:text-amber-300 mb-1">LinkedIn does not expose commenter emails via API</p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                            Make.com&apos;s LinkedIn trigger will give you the commenter&apos;s name and profile URL, but <strong>not their private email</strong>. This is a LinkedIn platform restriction — not a bug.
                            The email delivery step will be skipped, but the <strong>auto-reply comment with the link still posts successfully</strong>.
                            When they click the link and visit your Lead Magnet page, they enter their email there — that&apos;s where full lead capture happens.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* n8n alternative */}
                    <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#1C1C20] p-4">
                      <p className="text-[11.5px] font-bold text-zinc-800 dark:text-white mb-1">Prefer n8n instead of Make.com?</p>
                      <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        n8n has a free community template: <span className="font-semibold text-zinc-700 dark:text-zinc-300">"Automate LinkedIn Comment Replies with GPT"</span>.
                        It polls comments every 10 minutes, calls your same Webhook URL above, and logs everything in a Google Sheet.
                        The setup is identical — just use the same Webhook URL and Secret from Card 1.
                      </p>
                      <a
                        href="https://n8n.io/workflows/7806-automate-linkedin-comment-replies-with-gpt-35-and-track-in-google-sheets/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                      >
                        View n8n template <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* ── Card 4: LinkedIn Funnel Tracker ── */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">LinkedIn Lead Funnel</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Track who received your automated DM vs who signed up with their email.
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

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === "all"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-[#9B9085] dark:hover:text-white"
                  }`}
                >
                  All Inbound ({linkedinLeads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("converted")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === "converted"
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-[#9B9085] dark:hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Converted ({convertedLeads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === "pending"
                      ? "bg-amber-600 text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-[#9B9085] dark:hover:text-white"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> Pending ({pendingLeads.length})
                </button>
              </div>

              {/* Lead Prospect List */}
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading funnel data...
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-6 dark:border-white/10 dark:bg-[#121214] text-center">
                  <Linkedin className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-white">
                    {selectedTab === "all" ? "No LinkedIn leads yet" : `No ${selectedTab} leads found`}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-1">
                    Once n8n or Unipile sends comment data, leads will update in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeads.slice(0, 10).map((lead) => {
                    const isPending = lead.status === "pending_email" || lead.email.endsWith("@linkedin-prospect.com");
                    const profileUrl = lead.customFields?.linkedinProfile || `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.name)}`;
                    const commentSnippet = lead.customFields?.commentText;

                    return (
                      <div
                        key={lead.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-[#121214] p-3.5 transition hover:border-zinc-300 dark:hover:border-white/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] font-bold text-xs">
                              {lead.name?.charAt(0)?.toUpperCase() || "L"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">{lead.name}</span>
                                {profileUrl && (
                                  <a
                                    href={profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[10px] text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                                  >
                                    <Linkedin className="h-2.5 w-2.5" /> Profile <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>

                              <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 truncate">
                                {isPending ? (
                                  <span className="italic text-zinc-400">Waiting for email signup on magnet page</span>
                                ) : (
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{lead.email}</span>
                                )}
                              </p>

                              {commentSnippet && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 rounded-lg px-2.5 py-1">
                                  <MessageSquare className="h-3 w-3 text-zinc-400 shrink-0" />
                                  <span className="truncate">&ldquo;{commentSnippet}&rdquo;</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <Clock className="h-3 w-3" /> DM Sent (Pending)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Converted
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-400 dark:text-[#9B9085]">
                              {lead.signedUpAt?.split(",")[0] || "Today"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredLeads.length > 10 && (
                    <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] text-center pt-2">
                      +{filteredLeads.length - 10} more leads —{" "}
                      <a href="/dashboard/leads" className="text-[#0066B2] hover:underline font-semibold">
                        view all in Leads Dashboard
                      </a>
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
