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
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#F8FBFF] dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-900 dark:text-white">
              Workspace setup
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs font-normal text-zinc-500 hover:bg-zinc-100 dark:border-[#2e2e38] dark:text-[#9B9085] dark:hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
              Manage your publishing address,{" "}
              <span className="text-[#0066B2] font-semibold">email delivery</span>, and{" "}
              <span className="text-[#0066B2] font-semibold">connections</span>
            </p>
          </div>

          {/* Workspace Essentials banner */}
          <div
            className="conversion-banner-bg relative mb-5 overflow-hidden rounded-2xl border border-[#0066B2]/30 bg-white py-7 px-8 shadow-sm dark:border-[#0066B2]/35 dark:bg-[#18181C] transition-colors"
          >
            {/* Badge */}
            <div className="mb-4 flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0066B2]/30 bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0066B2] dark:border-[#0066B2]/40 dark:bg-[#0066B2]/15 dark:text-[#38BDF8]">
                <Sparkles className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] fill-[#0066B2]/20" />
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
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#0066B2]/30 bg-white/80 dark:border-[#0066B2]/35 dark:bg-[#0E0E10]/70 px-4 py-3 shrink-0 shadow-sm dark:shadow-none">
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
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              {/* Always-visible header */}
              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
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
                    <div className="flex rounded-xl border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#0E0E10] focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] transition overflow-hidden">
                      <span className="flex items-center select-none border-r border-[#E2E8F0] bg-[#F0F4F8] px-3.5 py-2.5 text-xs font-mono text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#18181C] dark:text-[#38BDF8] whitespace-nowrap">
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
                  <div className="rounded-xl border border-[#0066B2]/30 bg-[#F8FBFF] p-4 shrink-0 md:w-64 dark:border-[#0066B2]/35 dark:bg-[#0E0E10]">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8] mb-2">SHARE THIS LINK</p>
                    <p className="text-xs font-mono font-semibold text-zinc-900 dark:text-white">leadmagnets.so/{username}</p>
                  </div>
                </div>
              </div>

              {/* Custom domain nested box */}
              <div className="rounded-xl border border-[#0066B2]/30 bg-[#F8FBFF] p-3.5 dark:border-[#0066B2]/35 dark:bg-[#121214]">
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["custom-domain"] ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {openSections["custom-domain"] && (
                  <div className="mt-3 border-t border-[#E2E8F0] pt-3 dark:border-[#0066B2]/20">
                    <p className="text-xs text-zinc-600 dark:text-[#9B9085] leading-relaxed">
                      Custom domain features are available on the Pro plan.
                    </p>
                    <button className="mt-2.5 rounded-md bg-[#0066B2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#005799] dark:bg-[#0066B2] dark:text-white dark:hover:bg-[#005799] transition">
                      Upgrade to Pro
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Optional connections card */}
            <div id="connections-section" className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
              <button
                onClick={() => toggle("connections")}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#2a1a08] dark:border-[#5c2d18]">
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["connections"] ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </button>
              {openSections["connections"] && (
                <div className="border-t border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#0E0E10]/50 px-5 py-5 space-y-6">
                  {/* EMAIL & SCHEDULING Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">EMAIL & SCHEDULING</p>
                        <p className="text-xs text-zinc-500 dark:text-[#666675]">Where messages come from and when sequences should stop.</p>
                      </div>
                      <span className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#0066B2] dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-400">
                        Sending ready
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Your sender domain Expandable Card */}
                      <div className={`${openSections["sender-domain"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
                        <div 
                          onClick={() => toggle("sender-domain")}
                          className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF4ED] text-[#FF6A3D] border border-[#FFDEC9] dark:bg-[#2A170F] dark:border-[#422215]">
                              <Mail className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Your sender domain</h5>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Send from your own address instead of Magnets.</p>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["sender-domain"] ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded Sender Domain 3-Step Setup Panel */}
                        <div className={`grid transition-all duration-300 ease-in-out ${openSections["sender-domain"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="px-5 pb-6 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                              {/* Step 1 Box */}
                              <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 flex items-start gap-4 shadow-2xs">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-700 dark:border-white/20 dark:text-white">
                                  1
                                </span>
                                <div>
                                  <h6 className="text-xs font-bold text-zinc-900 dark:text-white">Pick your sending subdomain</h6>
                                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                                    Pick a subdomain to put the sending records under, so they don't collide with anything you already have.
                                  </p>
                                  <p className="text-[11px] text-zinc-400 dark:text-[#666675] mt-2">
                                    Set your root domain in Publishing first.
                                  </p>
                                </div>
                              </div>

                              {/* Step 2 Box */}
                              <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 space-y-3.5 shadow-2xs">
                                <div className="flex items-start gap-4">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-700 dark:border-white/20 dark:text-white">
                                    2
                                  </span>
                                  <div>
                                    <h6 className="text-xs font-bold text-zinc-900 dark:text-white">Set your sender address</h6>
                                    <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                                      Pick the local part. The domain part stays locked to the subdomain you chose above.
                                    </p>
                                  </div>
                                </div>

                                <div className="pl-11 space-y-3">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-[#9B9085] mb-1">
                                      Display name (optional)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Your Brand"
                                      value={account?.senderDisplayName || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setAccount((prev) => prev ? { ...prev, senderDisplayName: val } : prev);
                                      }}
                                      onBlur={() => handleSave()}
                                      className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#FF6A3D] transition"
                                    />
                                    <p className="text-[10px] text-zinc-400 dark:text-[#666675] mt-1">
                                      Shown in the inbox as the sender's name.
                                    </p>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-[#9B9085] mb-1">
                                      Sender address
                                    </label>
                                    <div className="flex items-center rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] overflow-hidden">
                                      <input
                                        type="text"
                                        placeholder="@ hello"
                                        value={account?.senderAddress || ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAccount((prev) => prev ? { ...prev, senderAddress: val } : prev);
                                        }}
                                        onBlur={() => handleSave()}
                                        className="w-full bg-transparent px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none"
                                      />
                                      <span className="px-3 py-2 text-[10px] font-mono text-zinc-400 dark:text-[#555] bg-zinc-50 dark:bg-[#151518] border-l border-zinc-200 dark:border-white/10 shrink-0">
                                        @pick subdomain first
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 dark:text-[#666675] mt-1">
                                      The part before @ is up to you. The suffix is locked to the subdomain you chose above.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Step 3 Box */}
                              <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 flex items-start gap-4 shadow-2xs">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-700 dark:border-white/20 dark:text-white">
                                  3
                                </span>
                                <div>
                                  <h6 className="text-xs font-bold text-zinc-900 dark:text-white">Add the sending DNS records</h6>
                                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                                    These appear once your sender is set.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calendar booking Expandable Card */}
                      <div className={`${openSections["calendar-booking"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
                        <div 
                          onClick={() => toggle("calendar-booking")}
                          className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] dark:bg-[#2e2208]">
                              <Calendar className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Calendar booking</h5>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Stop sequences after a Calendly or Cal.com booking.</p>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["calendar-booking"] ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded Calendar Booking Setup Panel */}
                        <div className={`grid transition-all duration-300 ease-in-out ${openSections["calendar-booking"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                                    Calendar provider
                                  </label>
                                  <select
                                    value={account?.calendarProvider || "Calendly"}
                                    onChange={(e) => {
                                      const prov = e.target.value as "Calendly" | "Cal.com";
                                      setAccount((prev) => prev ? { ...prev, calendarProvider: prov } : prev);
                                      handleSave();
                                    }}
                                    className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#D97706] transition"
                                  >
                                    <option value="Calendly">Calendly</option>
                                    <option value="Cal.com">Cal.com</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                                    {account?.calendarProvider || "Calendly"} personal access token
                                  </label>
                                  <input
                                    type="password"
                                    placeholder={`${account?.calendarProvider || "Calendly"} API token`}
                                    value={account?.calendarToken || ""}
                                    onChange={(e) => {
                                      const tok = e.target.value;
                                      setAccount((prev) => prev ? { ...prev, calendarToken: tok } : prev);
                                    }}
                                    onBlur={() => handleSave()}
                                    className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#D97706] transition"
                                  />
                                  <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                                    {account?.calendarProvider || "Calendly"} requires a paid plan for webhooks.
                                  </p>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                                  One calendar connection applies to the account. Each magnet controls its sequence and stop-on-booking setting in the Sequence tab.
                                </p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!account) return;
                                    const nextConnected = !account.calendarConnected;
                                    const updated = { ...account, calendarConnected: nextConnected };
                                    setAccount(updated);
                                    await saveAccount(updated);
                                    alert(nextConnected ? `${account.calendarProvider || "Calendar"} connected successfully!` : "Calendar disconnected.");
                                  }}
                                  className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm ${
                                    account?.calendarConnected
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                                  }`}
                                >
                                  {account?.calendarConnected ? "Calendar connected ✓" : "Connect calendar"}
                                </button>
                              </div>
                            </div>
                          </div>
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
                      {/* Slack Expandable Card */}
                      <div className={`${openSections["slack-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
                        <div 
                          onClick={() => toggle("slack-webhook")}
                          className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] dark:bg-[#251838] overflow-hidden p-1.5">
                              <img src="/brand/slack.svg" alt="Slack" className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Slack</h5>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Get a compact Slack message whenever a new lead signs up.</p>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["slack-webhook"] ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded Webhook Input Panel with Grid Height Animation */}
                        <div className={`grid transition-all duration-300 ease-in-out ${openSections["slack-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                              <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                                  Slack incoming-webhook URL
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://hooks.slack.com/services/..."
                                  value={account?.slackWebhookUrl || ""}
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    setAccount((prev) => prev ? { ...prev, slackWebhookUrl: url } : prev);
                                  }}
                                  onBlur={() => handleSave()}
                                  className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#0066B2] transition"
                                />
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                                  In Slack, create an Incoming Webhook, choose its channel, then paste the generated hooks.slack.com URL here. Leave it blank to disconnect.
                                </p>
                              </div>

                              <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                                  Slack receives the name, email, lead magnet title, and a link to the page. It never blocks the signup or resource email.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => alert("Test Slack message sent! Please check your channel.")}
                                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0"
                                >
                                  <Slack className="h-3.5 w-3.5" />
                                  Send test
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Zapier Expandable Card */}
                      <div className={`${openSections["zapier-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
                        <div 
                          onClick={() => toggle("zapier-webhook")}
                          className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#FF4F00] border border-[#FFDCD0] dark:bg-[#33180F] dark:border-[#522518]">
                              <Zap className="h-4.5 w-4.5 fill-current" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Zapier</h5>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Trigger a Zap whenever a new lead signs up.</p>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["zapier-webhook"] ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded Zapier Webhook Input Panel with Grid Height Animation */}
                        <div className={`grid transition-all duration-300 ease-in-out ${openSections["zapier-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                              {/* Instruction Note Box */}
                              <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-3 text-xs text-zinc-600 dark:text-[#9B9085]">
                                In Zapier, choose <strong className="text-zinc-900 dark:text-white font-semibold">Webhooks by Zapier</strong> as the trigger, select <strong className="text-zinc-900 dark:text-white font-semibold">Catch Hook</strong>, then copy its webhook URL.
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                                  Zapier Catch Hook URL
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                                  value={account?.zapierWebhookUrl || ""}
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    setAccount((prev) => prev ? { ...prev, zapierWebhookUrl: url } : prev);
                                  }}
                                  onBlur={() => handleSave()}
                                  className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#FF4F00] transition"
                                />
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                                  Paste the unique hooks.zapier.com URL from the Test tab. Leave it blank to disconnect.
                                </p>
                              </div>

                              <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                                  Each event includes the lead, signup ID, lead magnet, and public page URL. Zapier never blocks the signup or resource email.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => alert("Test Zapier event sent! Check your Zap test tab.")}
                                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                  Send test
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pipedrive Expandable Card */}
                      <div className={`${openSections["pipedrive-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
                        <div 
                          onClick={() => toggle("pipedrive-webhook")}
                          className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] dark:bg-[#0f2e1b] overflow-hidden p-1.5">
                              <img src="/brand/pipedrive.svg" alt="Pipedrive" className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Pipedrive</h5>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Create or update a person for each signup using their email address.</p>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["pipedrive-webhook"] ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded Pipedrive API Token Panel with Smooth Height Animation */}
                        <div className={`grid transition-all duration-300 ease-in-out ${openSections["pipedrive-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                              <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                                  Pipedrive API token
                                </label>
                                <input
                                  type="password"
                                  placeholder="Paste your Pipedrive API token"
                                  value={account?.pipedriveApiToken || ""}
                                  onChange={(e) => {
                                    const token = e.target.value;
                                    setAccount((prev) => prev ? { ...prev, pipedriveApiToken: token } : prev);
                                  }}
                                  onBlur={() => handleSave()}
                                  className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#28A745] transition"
                                />
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                                  In Pipedrive, open Personal preferences, then API. Paste the API token here. Leave it blank to disconnect.
                                </p>
                              </div>

                              <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                                  Existing contacts are matched by email. Pipedrive sync never blocks the signup or resource email.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => alert("Pipedrive API connection test successful!")}
                                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0"
                                >
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  Test connection
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kit Expandable Card */}
                      <div className={`${openSections["kit-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
                        <div 
                          onClick={() => toggle("kit-webhook")}
                          className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] dark:bg-[#331118]">
                              <Mail className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Kit</h5>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Add every signup to Kit and tag the lead magnet they requested.</p>
                            </div>
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["kit-webhook"] ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded Kit Authorization Panel with Smooth Height Animation */}
                        <div className={`grid transition-all duration-300 ease-in-out ${openSections["kit-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                              <p className="text-xs text-zinc-600 dark:text-[#9B9085]">
                                Connect with Kit's secure authorization screen. Magnets never asks you to paste an API key and never exposes Kit credentials in the browser.
                              </p>

                              <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                                  Kit sync runs after the resource email is accepted, so a temporary Kit issue never blocks the signup.
                                </p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!account) return;
                                    const nextState = !account.kitConnected;
                                    const updated = { ...account, kitConnected: nextState };
                                    setAccount(updated);
                                    await saveAccount(updated);
                                    alert(nextState ? "Connected to Kit successfully!" : "Disconnected Kit connection.");
                                  }}
                                  className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm ${
                                    account?.kitConnected
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-[#FF6A3D] text-white hover:bg-[#E8592E]"
                                  }`}
                                >
                                  {account?.kitConnected ? "Kit Connected ✓" : "Connect Kit"}
                                </button>
                              </div>
                            </div>
                          </div>
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
                    <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors">
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
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["newsletter"] ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {openSections["newsletter"] && (
                        <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-4 py-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                                <span>Beehiiv publication ID</span>
                                <span className="text-zinc-400 dark:text-[#666675] cursor-help">?</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Publication ID"
                                className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#0066B2] transition"
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
                                className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#0066B2] transition"
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
                              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#0066B2] transition"
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
            <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden hover:bg-[#EFF6FF] dark:hover:bg-[#18181c]">
              <button
                onClick={() => toggle("legal-links")}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#2a1a08] dark:border-[#5c2d18]">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Legal links</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Optionally add your own privacy policy and terms to every page footer.
                    </p>
                  </div>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["legal-links"] ? "rotate-180" : ""}`} />
                </div>
              </button>
              {openSections["legal-links"] && (
                <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-5 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">Privacy policy URL</label>
                      <input
                        type="url"
                        placeholder="https://your-site.com/privacy"
                        value={privacyPolicy}
                        onChange={(e) => setPrivacyPolicy(e.target.value)}
                        onBlur={handleSave}
                        className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition"
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
                        className="w-full rounded-xl border border-[#E5E3DD] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition"
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
        <footer className="mt-auto border-t border-[#E2E8F0] dark:border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-zinc-500 dark:text-[#9B9085]">
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
