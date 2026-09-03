"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Sparkles, Globe, Plug, FileText, ChevronDown, ChevronUp, Check, Mail, Calendar, Slack, Zap } from "lucide-react";
import { syncWithDatabase, saveAccount, loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function WorkspaceSetupPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [saving, setSaving] = useState(false);

  // Accordions — "public-url" open by default, custom-domain always visible inside it
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "public-url": true,
    "connections": false,
    "legal-links": true,
    "newsletter": true,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    // Load local data instantly
    const localAccount = loadAccount();
    if (localAccount) {
      setAccount(localAccount);
      setUsername(localAccount.username || "");
      setPrivacyPolicy(localAccount.privacyPolicy || "");
      setTermsOfService(localAccount.termsOfService || "");
    }
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setUsername(data.account.username || "");
        setPrivacyPolicy(data.account.privacyPolicy || "");
        setTermsOfService(data.account.termsOfService || "");
      }
    });
  }, []);

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);
    const updatedAccount: Account = {
      ...account,
      username: username.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
      privacyPolicy: privacyPolicy.trim(),
      termsOfService: termsOfService.trim(),
    };
    try {
      await saveAccount(updatedAccount);
      setAccount(updatedAccount);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA] dark:bg-[#0E0E10]">
        <div className="text-sm text-zinc-500 dark:text-[#9B9085]">Loading settings...</div>
      </div>
    );
  }

  const inputClass =
    "w-full border-0 bg-transparent py-2.5 pl-1 pr-3 text-sm text-zinc-900 dark:text-white outline-none focus:ring-0 placeholder:text-zinc-400 dark:placeholder:text-[#9B9085]";

  const labelClass = "block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5";

  return (
    <DashboardShell account={account} title="Workspace setup">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#FAFAF8] dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-900 dark:text-white">
              Workspace setup
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs font-normal text-zinc-500 hover:bg-zinc-100 dark:border-[#2e2e38] dark:text-[#9B9085] dark:hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
              Manage your publishing address,{" "}
              <span className="text-[#FE6F34]">email delivery</span>, and{" "}
              <span className="text-[#FE6F34]">connections</span>
            </p>
          </div>

          {/* Workspace Essentials banner */}
          <div
            className="relative mb-5 overflow-hidden rounded-2xl border border-[#FE6F34]/30 bg-gradient-to-r from-[#FFF0EA] via-[#FFF5F1] to-white dark:border-[#2e2e38] dark:from-[#2D1A12] dark:via-[#1D1512] dark:to-[#18181B] pt-7 pb-8 px-8 shadow-sm transition-colors"
          >
            {/* Badge */}
            <div className="mb-4 flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FE6F34]/30 bg-[#FFF0EA] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FE6F34] dark:border-[#5c2d18] dark:bg-[#2a1309] dark:text-white">
                <Sparkles className="h-3.5 w-3.5 text-[#FE6F34] fill-[#FE6F34]/20" />
                WORKSPACE ESSENTIALS
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-lg">
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
                  Set up once, then get back to creating
                </h3>
                <p className="text-sm text-zinc-600 dark:text-[#9B9085]/90 leading-relaxed">
                  Your LeadMagnets URL is the only required setting. Domains and integrations stay out
                  of the way until you need them.
                </p>
              </div>

              {/* Public URL ready status card */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-300 bg-white/80 dark:border-[#2e2e38] dark:bg-[#0E0E10]/70 px-4 py-3 shrink-0 shadow-sm dark:shadow-none">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">Public URL ready</p>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">leadmagnets.so/{username}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4">

            {/* Public URL card */}
            <div className="rounded-2xl border border-[#E5E3DD] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] shadow-sm transition-colors p-5">
              {/* Always-visible header */}
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-700 shadow-sm dark:border-[#2e2e38] dark:bg-[#252529] dark:text-[#9B9085]">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Public URL</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                    This is the link you can share immediately. A custom domain is completely optional.
                  </p>
                </div>
              </div>

              {/* LeadMagnets URL field + share card */}
              <div className="mb-4">
                <label className={labelClass}>LeadMagnets URL</label>
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  {/* Input */}
                  <div className="flex-1">
                    <div className="flex rounded-xl border border-[#E5E3DD] bg-white dark:border-[#2e2e38] dark:bg-[#0E0E10] focus-within:border-[#FE6F34] transition overflow-hidden">
                      <span className="flex items-center select-none border-r border-[#E5E3DD] bg-[#F5F3EE] px-3.5 py-2.5 text-xs font-mono text-[#8C827A] dark:border-[#2e2e38] dark:bg-[#18181C] dark:text-[#9B9085] whitespace-nowrap">
                        leadmagnets.so/
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={handleSave}
                        className="w-full bg-transparent px-3 py-2.5 text-xs font-mono text-zinc-900 outline-none dark:text-white placeholder:text-zinc-400"
                        placeholder="your-workspace"
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-400 dark:text-[#9B9085]">Lowercase letters, numbers, and hyphens.</p>
                  </div>
                  {/* Share this link card */}
                  <div className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F0] p-4 shrink-0 md:w-64 dark:border-[#2e2e38] dark:bg-[#0E0E10]">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#9E8B7A] dark:text-[#9B9085] mb-2">SHARE THIS LINK</p>
                    <p className="text-xs font-mono font-semibold text-zinc-900 dark:text-white">leadmagnets.so/{username}</p>
                  </div>
                </div>
              </div>

              {/* Custom domain nested box */}
              <div className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F0] p-3.5 dark:border-[#2e2e38] dark:bg-[#121214]">
                <button
                  onClick={() => toggle("custom-domain")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0F2F1] text-[#00897B] dark:bg-[#1A2E2B] dark:text-[#2DD4BF]">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Custom domain</p>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Use your own domain whenever you are ready. Your LeadMagnets link already works.</p>
                    </div>
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["custom-domain"] ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {openSections["custom-domain"] && (
                  <div className="mt-3 border-t border-[#EBE7DF] pt-3 dark:border-[#2e2e38]">
                    <p className="text-xs text-zinc-600 dark:text-[#9B9085] leading-relaxed">
                      Custom domain features are available on the Pro plan.
                    </p>
                    <button className="mt-2.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-[#252529] dark:text-white dark:hover:bg-[#2e2e35] transition">
                      Upgrade to Pro
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Optional connections card */}
            <div id="connections-section" className="rounded-2xl border border-[#E5E3DD] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
              <button
                onClick={() => toggle("connections")}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#FE6F34] border border-[#FDE5D8] dark:bg-[#2a1a08] dark:border-[#5c2d18]">
                    <Plug className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Optional connections</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Your page and first email work without these. Add a connection only when it helps your workflow.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16a34a] dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Email ready
                  </span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["connections"] ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </button>
              {openSections["connections"] && (
                <div className="border-t border-[#E5E3DD] bg-white dark:border-[#2e2e38] dark:bg-[#0E0E10]/50 px-5 py-5 space-y-6">
                  {/* EMAIL & SCHEDULING Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">EMAIL & SCHEDULING</p>
                        <p className="text-xs text-zinc-500 dark:text-[#666675]">Where messages come from and when sequences should stop.</p>
                      </div>
                      <span className="rounded-full border border-[#FFEDD5] bg-[#FFF7ED] px-2.5 py-0.5 text-[11px] font-semibold text-[#EA580C] dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-400">
                        Sending ready
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Your sender domain */}
                      <div className="rounded-2xl border border-[#E5E3DD] bg-white p-4 dark:border-[#2e2e38] dark:bg-[#121214] flex items-center justify-between shadow-sm hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#FE6F34] border border-[#FDE5D8] dark:bg-[#2a1a08]">
                            <Mail className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Your sender domain</h5>
                            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Send from your own address instead of LeadMagnets.</p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Calendar booking */}
                      <div className="rounded-2xl border border-[#E5E3DD] bg-white p-4 dark:border-[#2e2e38] dark:bg-[#121214] flex items-center justify-between shadow-sm hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] dark:bg-[#2e2208]">
                            <Calendar className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Calendar booking</h5>
                            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Stop sequences after a Calendly or Cal.com booking.</p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AUTOMATIONS Section */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">AUTOMATIONS</p>
                      <p className="text-xs text-zinc-500 dark:text-[#666675]">Send each new signup to the tools your team already uses.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Slack */}
                      <div className="rounded-2xl border border-[#E5E3DD] bg-white p-4 dark:border-[#2e2e38] dark:bg-[#121214] flex items-center justify-between shadow-sm hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] dark:bg-[#251838] overflow-hidden p-1.5">
                            <img src="https://leadmagnets.so/brand/slack.svg" alt="Slack" className="h-full w-full object-contain" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Slack</h5>
                            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Get a compact Slack message whenever a new lead signs up.</p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Zapier */}
                      <div className="rounded-2xl border border-[#E5E3DD] bg-white p-4 dark:border-[#2e2e38] dark:bg-[#121214] flex items-center justify-between shadow-sm hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#FE6F34] border border-[#FDE5D8] dark:bg-[#2a1a08]">
                            <Zap className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Zapier</h5>
                            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Trigger a Zap whenever a new lead signs up.</p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Pipedrive */}
                      <div className="rounded-2xl border border-[#E5E3DD] bg-white p-4 dark:border-[#2e2e38] dark:bg-[#121214] flex items-center justify-between shadow-sm hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] dark:bg-[#0f2e1b] overflow-hidden p-1.5">
                            <img src="https://leadmagnets.so/brand/pipedrive.svg" alt="Pipedrive" className="h-full w-full object-contain" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Pipedrive</h5>
                            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Create or update a person for each signup using their email address.</p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Kit */}
                      <div className="rounded-2xl border border-[#E5E3DD] bg-white p-4 dark:border-[#2e2e38] dark:bg-[#121214] flex items-center justify-between shadow-sm hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] dark:bg-[#331118]">
                            <Mail className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Kit</h5>
                            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Add every signup to Kit and tag the lead magnet they requested.</p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AUDIENCE SYNC Section */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">AUDIENCE SYNC</p>
                      <p className="text-xs text-zinc-500 dark:text-[#666675]">Forward signups into an existing newsletter audience.</p>
                    </div>

                    {/* Newsletter Box */}
                    <div className="group rounded-2xl border border-[#E5E3DD] bg-white dark:border-[#2e2e38] dark:bg-[#121214] overflow-hidden shadow-sm hover:bg-[#F7F5F0] dark:hover:bg-[#18181c] transition-colors">
                      <button
                        onClick={() => toggle("newsletter")}
                        className="flex w-full items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] dark:bg-[#2e2208]">
                            <Sparkles className="h-4.5 w-4.5 text-[#D97706]" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Newsletter</h5>
                            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                              Forward signups to Beehiiv or Substack. Connect Kit in Automations. Signups are always saved in LeadMagnets too.
                            </p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["newsletter"] ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {openSections["newsletter"] && (
                        <div className="border-t border-[#E5E3DD] dark:border-[#2e2e38] px-4 py-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                                <span>Beehiiv publication ID</span>
                                <span className="text-zinc-400 dark:text-[#666675] cursor-help">?</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Publication ID"
                                className="w-full rounded-xl border border-[#E5E3DD] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#FE6F34] transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                                <span>Beehiiv API key</span>
                                <span className="text-zinc-400 dark:text-[#666675] cursor-help">?</span>
                              </label>
                              <input
                                type="password"
                                placeholder="API key"
                                className="w-full rounded-xl border border-[#E5E3DD] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#FE6F34] transition"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                              <span>Substack publication</span>
                              <span className="text-zinc-400 dark:text-[#666675] cursor-help">?</span>
                            </label>
                            <input
                              type="text"
                              placeholder="myletter"
                              className="w-full rounded-xl border border-[#E5E3DD] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#FE6F34] transition"
                            />
                            <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Just the subdomain. myletter, not myletter.substack.com</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legal links card */}
            <div className="group rounded-2xl border border-[#E5E3DD] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden hover:bg-[#F7F5F0] dark:hover:bg-[#18181c]">
              <button
                onClick={() => toggle("legal-links")}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#FE6F34] border border-[#FDE5D8] dark:bg-[#2a1a08] dark:border-[#5c2d18]">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Legal links</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Optionally add your own privacy policy and terms to every page footer.
                    </p>
                  </div>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DD] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["legal-links"] ? "rotate-180" : ""}`} />
                </div>
              </button>
              {openSections["legal-links"] && (
                <div className="border-t border-[#E5E3DD] dark:border-[#2e2e38] px-5 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">Privacy policy URL</label>
                      <input
                        type="url"
                        placeholder="https://your-site.com/privacy"
                        value={privacyPolicy}
                        onChange={(e) => setPrivacyPolicy(e.target.value)}
                        onBlur={handleSave}
                        className="w-full rounded-xl border border-[#E5E3DD] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#FE6F34] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Leave blank to hide this link.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">Terms URL</label>
                      <input
                        type="url"
                        placeholder="https://your-site.com/terms"
                        value={termsOfService}
                        onChange={(e) => setTermsOfService(e.target.value)}
                        onBlur={handleSave}
                        className="w-full rounded-xl border border-[#E5E3DD] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#FE6F34] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Leave blank to hide this link.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#E5E3DD] dark:border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-zinc-500 dark:text-[#9B9085]">
          <span>LeadMagnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>
    </DashboardShell>
  );
}
