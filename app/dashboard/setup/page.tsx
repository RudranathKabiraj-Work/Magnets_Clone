"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Sparkles, Globe, Plug, FileText, ChevronDown, ChevronUp, Check, Mail, Calendar, Slack, Zap, Copy, RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";
import { syncWithDatabase, saveAccount, loadAccount } from "@/lib/store";
import { type Account, getAppUrl, getAppDomain } from "@/lib/data";

export default function WorkspaceSetupPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [rootDomain, setRootDomain] = useState("");
  const [pageSubdomain, setPageSubdomain] = useState("get");
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [checkingCname, setCheckingCname] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);
  const [cnameVerified, setCnameVerified] = useState(false);
  const [sslStatus, setSslStatus] = useState<"pending" | "active" | "failed">("pending");
  const [domainError, setDomainError] = useState("");
  const [cnameError, setCnameError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [appBaseUrl, setAppBaseUrl] = useState("https://magnets-jade.vercel.app");

  useEffect(() => {
    setAppBaseUrl(getAppUrl());
  }, []);

  const appDisplayDomain = appBaseUrl.replace(/^https?:\/\//, "");
  const [showSlackUrl, setShowSlackUrl] = useState(false);
  const [showZapierUrl, setShowZapierUrl] = useState(false);
  const [showPipedriveToken, setShowPipedriveToken] = useState(false);
  const [showCalendarToken, setShowCalendarToken] = useState(false);
  const [showKitKey, setShowKitKey] = useState(false);
  const [ga4MeasurementId, setGa4MeasurementId] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [substackPublication, setSubstackPublication] = useState("");
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  // Accordions — "public-url" open by default, custom-domain always visible inside it
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "public-url": true,
    "connections": false,
    "legal-links": true,
    "newsletter": true,
    "analytics-tracking": true,
    "branding-preview": true,
  });

  useEffect(() => {

    // Load local data instantly
    const localAccount = loadAccount();
    if (localAccount) {
      setAccount(localAccount);
      setUsername(localAccount.username || "");
      setPrivacyPolicy(localAccount.privacyPolicy || "");
      setTermsOfService(localAccount.termsOfService || "");
      if (localAccount.customDomain) setRootDomain(localAccount.customDomain);
      if (localAccount.customSubdomain) setPageSubdomain(localAccount.customSubdomain);
      if (localAccount.domainVerified) setDomainVerified(localAccount.domainVerified);
      if (localAccount.cnameVerified) setCnameVerified(localAccount.cnameVerified);
      if (localAccount.sslStatus) setSslStatus(localAccount.sslStatus);
      if (localAccount.ga4MeasurementId) setGa4MeasurementId(localAccount.ga4MeasurementId);
      if (localAccount.metaPixelId) setMetaPixelId(localAccount.metaPixelId);
      if (localAccount.faviconUrl) setFaviconUrl(localAccount.faviconUrl);
      if (localAccount.ogImageUrl) setOgImageUrl(localAccount.ogImageUrl);
      if (localAccount.substackPublication) setSubstackPublication(localAccount.substackPublication);
    }
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setUsername(data.account.username || "");
        setPrivacyPolicy(data.account.privacyPolicy || "");
        setTermsOfService(data.account.termsOfService || "");
        if (data.account.customDomain) setRootDomain(data.account.customDomain);
        if (data.account.customSubdomain) setPageSubdomain(data.account.customSubdomain);
        if (data.account.domainVerified) setDomainVerified(data.account.domainVerified);
        if (data.account.cnameVerified) setCnameVerified(data.account.cnameVerified);
        if (data.account.sslStatus) setSslStatus(data.account.sslStatus);
        if (data.account.ga4MeasurementId) setGa4MeasurementId(data.account.ga4MeasurementId);
        if (data.account.metaPixelId) setMetaPixelId(data.account.metaPixelId);
        if (data.account.faviconUrl) setFaviconUrl(data.account.faviconUrl);
        if (data.account.ogImageUrl) setOgImageUrl(data.account.ogImageUrl);
        if (data.account.substackPublication) setSubstackPublication(data.account.substackPublication);
      }
    });
  }, []);

  const handleSave = async (overrides?: Partial<Account>) => {
    const email = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || account?.email || "";
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanUsername) return;

    setSaving(true);
    const updatedAccount: Account = {
      ...(account || { email, name: "Workspace", username: cleanUsername, plan: "Free" as const, joinedAt: "Just now" }),
      email: email || account?.email || "",
      username: cleanUsername,
      privacyPolicy: privacyPolicy.trim(),
      termsOfService: termsOfService.trim(),
      customDomain: rootDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
      customSubdomain: pageSubdomain.trim().toLowerCase(),
      domainVerified,
      cnameVerified,
      sslStatus,
      ga4MeasurementId: ga4MeasurementId.trim(),
      metaPixelId: metaPixelId.trim(),
      faviconUrl: faviconUrl.trim(),
      ogImageUrl: ogImageUrl.trim(),
      substackPublication: substackPublication.trim(),
      ...overrides,
    };

    try {
      const res = await saveAccount(updatedAccount);
      if (res.success && res.account) {
        setAccount(res.account);
        if (res.account.username) {
          setUsername(res.account.username);
        }
      } else {
        setAccount(updatedAccount);
      }
    } catch (err) {
      console.error("Save account error:", err);
      setAccount(updatedAccount);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));



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
                <span className={`h-2 w-2 rounded-full ${cnameVerified || domainVerified ? "bg-emerald-500" : "bg-amber-500"} shrink-0`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {cnameVerified ? "Custom Domain Active" : "Public URL ready"}
                    </p>
                    {cnameVerified && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        SSL Active ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 font-mono">
                    {cnameVerified && rootDomain
                      ? `${pageSubdomain}.${rootDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")}`
                      : `${appBaseUrl}/${username}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4">

            {/* Public URL card */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              {/* Always-visible header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Public URL & Custom Domain</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      This is the link you can share immediately. A custom domain gives your brand a white-label URL.
                    </p>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {domainVerified && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      TXT Verified ✓
                    </span>
                  )}
                  {cnameVerified && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      CNAME Routed ✓
                    </span>
                  )}
                  {sslStatus === "active" && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      SSL Active ✓
                    </span>
                  )}
                  {cnameVerified && rootDomain && (
                    <a
                      href={`https://${pageSubdomain}.${rootDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer"
                    >
                      Visit Live Domain ↗
                    </a>
                  )}
                </div>
              </div>

              {/* LeadMagnets URL field + share card */}
              <div className="mb-4">
                <label className={labelClass}>LeadMagnets Default URL</label>
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  {/* Input */}
                  <div className="flex-1">
                    <div className="flex rounded-xl border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#0E0E10] focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] transition overflow-hidden">
                      <span className="flex items-center select-none border-r border-[#E2E8F0] bg-[#F0F4F8] px-3.5 py-2.5 text-xs font-mono text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#18181C] dark:text-[#38BDF8] whitespace-nowrap">
                        {appBaseUrl}/
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => handleSave()}
                        className="w-full bg-transparent px-3 py-2.5 text-xs font-mono text-zinc-900 outline-none dark:text-white placeholder:text-zinc-400"
                        placeholder="your-workspace"
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-400 dark:text-[#9B9085]">Lowercase letters, numbers, and hyphens.</p>
                  </div>
                  {/* Share this link card */}
                  <div className="rounded-xl border border-[#0066B2]/30 bg-[#F8FBFF] p-4 shrink-0 md:min-w-[320px] dark:border-[#0066B2]/35 dark:bg-[#0E0E10]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">SHARE THIS LINK</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${appBaseUrl}/${username}`);
                          setCopiedField("shareUrl");
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0066B2] hover:underline dark:text-[#38BDF8] cursor-pointer"
                      >
                        {copiedField === "shareUrl" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copiedField === "shareUrl" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-xs font-mono font-semibold text-zinc-900 dark:text-white select-all break-all">{appBaseUrl}/{username}</p>
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
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Custom domain setup</p>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Connect your custom domain and route traffic to your lead magnets.</p>
                    </div>
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["custom-domain"] ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {openSections["custom-domain"] && (
                  <div className="mt-4 border-t border-[#E2E8F0] pt-4 dark:border-[#0066B2]/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Root domain input */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">
                          Root domain
                        </label>
                        <input
                          type="text"
                          value={rootDomain}
                          onChange={(e) => setRootDomain(e.target.value)}
                          onBlur={() => handleSave()}
                          placeholder="example.com"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] dark:border-[#2e2e38] dark:bg-[#0E0E10] dark:text-white dark:placeholder:text-[#52525b] transition-all"
                        />
                        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-[#666675]">No https or page paths.</p>
                      </div>

                      {/* Page subdomain input */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">
                          Page subdomain
                        </label>
                        <input
                          type="text"
                          value={pageSubdomain}
                          onChange={(e) => setPageSubdomain(e.target.value)}
                          onBlur={() => handleSave()}
                          placeholder="get"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] dark:border-[#2e2e38] dark:bg-[#0E0E10] dark:text-white dark:placeholder:text-[#52525b] transition-all"
                        />
                        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-[#666675]">Recommended: get</p>
                      </div>
                    </div>

                    {/* 2-Step Verification Panel */}
                    {rootDomain.trim() ? (
                      <div className="space-y-4 pt-1">
                        {/* Step 1: Prove you own this domain */}
                        <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-zinc-50/60 dark:bg-[#151518] p-5 space-y-4 shadow-2xs">
                          <div className="flex items-start gap-4">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-white/20 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#202026]">
                              1
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h6 className="text-sm font-bold text-zinc-900 dark:text-white">
                                  Step 1: Prove domain ownership (TXT Record)
                                </h6>
                                {domainVerified && (
                                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                    Verified ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                                Add this TXT record to your DNS provider. Then click Check Ownership.
                              </p>

                              {/* TXT Record Box with Copy Buttons */}
                              {(() => {
                                const cleanDom = rootDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
                                const tokenValue = `leadmagnets-verify-${cleanDom.replace(/[^a-z0-9]/g, "")}_8a921c4ef`;
                                return (
                                  <div className="mt-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                                    <div className="flex-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                                        TYPE
                                      </span>
                                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                                        TXT
                                      </span>
                                    </div>

                                    <div className="flex-[2] relative">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                                        HOST
                                      </span>
                                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                                        <span>leadmagnets-verify</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText("leadmagnets-verify");
                                            setCopiedField("host");
                                            setTimeout(() => setCopiedField(null), 2000);
                                          }}
                                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer"
                                          title="Copy Host"
                                        >
                                          {copiedField === "host" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                      </div>
                                      <span className="text-[10px] text-zinc-400 dark:text-[#666675] block mt-1">
                                        Full hostname: leadmagnets-verify.{cleanDom}
                                      </span>
                                    </div>

                                    <div className="flex-[3] relative">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                                        VALUE
                                      </span>
                                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                                        <span className="truncate max-w-[200px] sm:max-w-xs">
                                          {tokenValue}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(tokenValue);
                                            setCopiedField("value");
                                            setTimeout(() => setCopiedField(null), 2000);
                                          }}
                                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer shrink-0"
                                          title="Copy Value"
                                        >
                                          {copiedField === "value" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Interactive "Check ownership" button & status message */}
                              <div className="mt-4 space-y-2">
                                <button
                                  type="button"
                                  disabled={checkingDomain}
                                  onClick={async () => {
                                    setCheckingDomain(true);
                                    setDomainError("");
                                    try {
                                      const res = await fetch("/api/domain/verify", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ domain: rootDomain, subdomain: pageSubdomain }),
                                      });
                                      const data = await res.json();
                                      if (data.isVerified) {
                                        setDomainVerified(true);
                                        if (data.cnameVerified) setCnameVerified(true);
                                        if (data.sslStatus) setSslStatus(data.sslStatus);
                                        setDomainError("Domain ownership verified!");
                                        await handleSave({ domainVerified: true, cnameVerified: data.cnameVerified, sslStatus: data.sslStatus || "active" });
                                      } else {
                                        setDomainError(data.message || `No TXT record found at leadmagnets-verify.${rootDomain.toLowerCase().replace(/^https?:\/\//, "")}. Check your DNS settings.`);
                                      }
                                    } catch (e) {
                                      setDomainError(`No TXT record found at leadmagnets-verify.${rootDomain.toLowerCase().replace(/^https?:\/\//, "")}. Check your DNS provider.`);
                                    } finally {
                                      setCheckingDomain(false);
                                    }
                                  }}
                                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-4 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shadow-xs cursor-pointer disabled:opacity-60"
                                >
                                  {checkingDomain ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                                  ) : (
                                    <RefreshCw className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                                  )}
                                  <span>Check ownership (TXT)</span>
                                </button>

                                {domainError && (
                                  <p className="text-[11.5px] text-zinc-500 dark:text-[#9B9085] leading-relaxed pt-1">
                                    {domainError}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Step 2: Point traffic at your magnets (CNAME Record Box) */}
                        <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-zinc-50/60 dark:bg-[#151518] p-5 space-y-4 shadow-2xs">
                          <div className="flex items-start gap-4">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-white/20 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#202026]">
                              2
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h6 className="text-sm font-bold text-zinc-900 dark:text-white">
                                  Step 2: Route Traffic (CNAME Record)
                                </h6>
                                {cnameVerified && (
                                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                    Traffic Routed ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                                Add this CNAME record to route traffic from your subdomain to your magnets.
                              </p>

                              {/* CNAME Record Guidance Box with Copy Buttons */}
                              {(() => {
                                const cleanDom = rootDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
                                const sub = (pageSubdomain || "get").toLowerCase().trim();
                                const cnameTarget = "cname.leadmagnets.so";
                                return (
                                  <div className="mt-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                                    <div className="flex-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                                        TYPE
                                      </span>
                                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                                        CNAME
                                      </span>
                                    </div>

                                    <div className="flex-[2] relative">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                                        SUBDOMAIN / HOST
                                      </span>
                                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                                        <span>{sub}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(sub);
                                            setCopiedField("cnameHost");
                                            setTimeout(() => setCopiedField(null), 2000);
                                          }}
                                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer"
                                          title="Copy Subdomain Host"
                                        >
                                          {copiedField === "cnameHost" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                      </div>
                                      <span className="text-[10px] text-zinc-400 dark:text-[#666675] block mt-1">
                                        Full Host: {sub}.{cleanDom}
                                      </span>
                                    </div>

                                    <div className="flex-[3] relative">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                                        TARGET VALUE
                                      </span>
                                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                                        <span>{cnameTarget}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(cnameTarget);
                                            setCopiedField("cnameValue");
                                            setTimeout(() => setCopiedField(null), 2000);
                                          }}
                                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer shrink-0"
                                          title="Copy CNAME Target Value"
                                        >
                                          {copiedField === "cnameValue" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Interactive "Check CNAME routing" button */}
                              <div className="mt-4 space-y-2">
                                <button
                                  type="button"
                                  disabled={checkingCname}
                                  onClick={async () => {
                                    setCheckingCname(true);
                                    setCnameError("");
                                    try {
                                      const res = await fetch("/api/domain/verify", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ domain: rootDomain, subdomain: pageSubdomain }),
                                      });
                                      const data = await res.json();
                                      if (data.cnameVerified) {
                                        setCnameVerified(true);
                                        setSslStatus("active");
                                        setCnameError(`Traffic successfully routed! ${data.fullSubdomainHost} points to ${data.cnameTarget}`);
                                        await handleSave({ cnameVerified: true, sslStatus: "active" });
                                      } else {
                                        setCnameError(data.cnameMessage || `No CNAME record detected pointing ${pageSubdomain}.${rootDomain} to cname.leadmagnets.so`);
                                      }
                                    } catch (e) {
                                      setCnameError(`Unable to verify CNAME routing for ${pageSubdomain}.${rootDomain}`);
                                    } finally {
                                      setCheckingCname(false);
                                    }
                                  }}
                                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-4 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shadow-xs cursor-pointer disabled:opacity-60"
                                >
                                  {checkingCname ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                                  ) : (
                                    <RefreshCw className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                                  )}
                                  <span>Verify CNAME routing</span>
                                </button>

                                {cnameError && (
                                  <p className="text-[11.5px] text-zinc-500 dark:text-[#9B9085] leading-relaxed pt-1">
                                    {cnameError}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-[#18181C] flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-[#222228] dark:text-zinc-300">
                          <Globe className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h6 className="text-xs font-bold text-zinc-900 dark:text-white">
                            Enter your root domain and subdomain above to start connecting.
                          </h6>
                          <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                            You will prove ownership with one DNS record, then add a second to route traffic.
                          </p>
                        </div>
                      </div>
                    )}
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8]">
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
                                  <div className="relative">
                                    <input
                                      type={showCalendarToken ? "text" : "password"}
                                      placeholder={`${account?.calendarProvider || "Calendly"} API token`}
                                      value={account?.calendarToken || ""}
                                      onChange={(e) => {
                                        const tok = e.target.value;
                                        setAccount((prev) => prev ? { ...prev, calendarToken: tok } : prev);
                                      }}
                                      onBlur={() => handleSave()}
                                      className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#D97706] transition font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowCalendarToken(!showCalendarToken)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                                      title={showCalendarToken ? "Hide Token" : "Show Token"}
                                    >
                                      {showCalendarToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
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
                                  className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm ${account?.calendarConnected
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
                                <div className="relative">
                                  <input
                                    type={showSlackUrl ? "text" : "password"}
                                    placeholder="https://hooks.slack.com/services/..."
                                    value={account?.slackWebhookUrl || ""}
                                    onChange={(e) => {
                                      const url = e.target.value;
                                      setAccount((prev) => prev ? { ...prev, slackWebhookUrl: url } : prev);
                                    }}
                                    onBlur={() => handleSave()}
                                    className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#0066B2] transition font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowSlackUrl(!showSlackUrl)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                                    title={showSlackUrl ? "Hide URL" : "Show URL"}
                                  >
                                    {showSlackUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
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
                                  onClick={async () => {
                                    if (!account?.slackWebhookUrl) {
                                      alert("Please enter your Slack incoming-webhook URL first.");
                                      return;
                                    }
                                    try {
                                      const res = await fetch("/api/data", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          action: "sendTestSlackAlert",
                                          data: { webhookUrl: account.slackWebhookUrl },
                                          email: account.email,
                                        }),
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        alert("🎉 Test Slack message sent! Check your Slack channel or Slackbot DM.");
                                      } else {
                                        alert(data.error || "Failed to send test message to Slack. Check the webhook URL.");
                                      }
                                    } catch (err: any) {
                                      alert(`Error sending test message: ${err.message}`);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0 cursor-pointer"
                                >
                                  <Slack className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
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
                                <div className="relative">
                                  <input
                                    type={showZapierUrl ? "text" : "password"}
                                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                                    value={account?.zapierWebhookUrl || ""}
                                    onChange={(e) => {
                                      const url = e.target.value;
                                      setAccount((prev) => prev ? { ...prev, zapierWebhookUrl: url } : prev);
                                    }}
                                    onBlur={() => handleSave()}
                                    className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#FF4F00] transition font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowZapierUrl(!showZapierUrl)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                                    title={showZapierUrl ? "Hide URL" : "Show URL"}
                                  >
                                    {showZapierUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
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
                                  onClick={async () => {
                                    if (!account?.zapierWebhookUrl) {
                                      alert("Please enter your Zapier Catch Hook URL first.");
                                      return;
                                    }
                                    try {
                                      const res = await fetch("/api/data", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          action: "sendTestZapierAlert",
                                          data: { webhookUrl: account.zapierWebhookUrl },
                                          email: account.email,
                                        }),
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        alert("⚡ Test Zapier event sent! Check your Zapier test trigger tab.");
                                      } else {
                                        alert(data.error || "Failed to send test payload to Zapier. Check the webhook URL.");
                                      }
                                    } catch (err: any) {
                                      alert(`Error sending test payload: ${err.message}`);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0 cursor-pointer"
                                >
                                  <Zap className="h-3.5 w-3.5 text-[#FF4F00]" />
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
                                <div className="relative">
                                  <input
                                    type={showPipedriveToken ? "text" : "password"}
                                    placeholder="Paste your Pipedrive API token"
                                    value={account?.pipedriveApiToken || ""}
                                    onChange={(e) => {
                                      const token = e.target.value;
                                      setAccount((prev) => prev ? { ...prev, pipedriveApiToken: token } : prev);
                                    }}
                                    onBlur={() => handleSave()}
                                    className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#28A745] transition font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPipedriveToken(!showPipedriveToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                                    title={showPipedriveToken ? "Hide Token" : "Show Token"}
                                  >
                                    {showPipedriveToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
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
                                  onClick={async () => {
                                    if (!account?.pipedriveApiToken) {
                                      alert("Please enter your Pipedrive API token first.");
                                      return;
                                    }
                                    try {
                                      const res = await fetch("/api/data", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          action: "sendTestPipedriveAlert",
                                          data: { apiToken: account.pipedriveApiToken },
                                          email: account.email,
                                        }),
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        alert(`🎉 Pipedrive connection successful! Connected as ${data.user}.`);
                                      } else {
                                        alert(data.error || "Failed to connect to Pipedrive. Please check your API token.");
                                      }
                                    } catch (err: any) {
                                      alert(`Error connecting to Pipedrive: ${err.message}`);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0 cursor-pointer"
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
                              <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                                  Kit API Secret / Key
                                </label>
                                <div className="relative">
                                  <input
                                    type={showKitKey ? "text" : "password"}
                                    placeholder="Paste your Kit API Secret (e.g. FM9REw...) or API Key"
                                    value={account?.kitApiKey || ""}
                                    onChange={(e) => {
                                      const key = e.target.value;
                                      setAccount((prev) => prev ? { ...prev, kitApiKey: key, kitConnected: !!key.trim() } : prev);
                                    }}
                                    onBlur={() => handleSave()}
                                    className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#FF6A3D] transition font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowKitKey(!showKitKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                                    title={showKitKey ? "Hide Key" : "Show Key"}
                                  >
                                    {showKitKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                                  In Kit, open Settings → Advanced, then copy your API Key. Leave blank to disconnect.
                                </p>
                              </div>

                              <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                                  Kit subscriber sync runs automatically after every lead magnet signup.
                                </p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!account?.kitApiKey && !account?.kitConnected) {
                                      alert("Please enter your Kit V3 API Key first.");
                                      return;
                                    }
                                    try {
                                      const res = await fetch("/api/data", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          action: "sendTestKitAlert",
                                          data: { apiKey: account?.kitApiKey },
                                          email: account?.email,
                                        }),
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        setAccount((prev) => prev ? { ...prev, kitConnected: true } : prev);
                                        await handleSave({ kitConnected: true });
                                        alert(`🎉 Kit connection successful! Account: ${data.user}`);
                                      } else {
                                        alert(data.error || "Failed to verify Kit API Key. Check Settings -> Advanced in Kit.");
                                      }
                                    } catch (err: any) {
                                      alert(`Error connecting to Kit: ${err.message}`);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm cursor-pointer ${account?.kitConnected
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-[#FF6A3D] text-white hover:bg-[#E8592E]"
                                    }`}
                                >
                                  {account?.kitConnected ? "Kit Connected ✓" : "Test & Connect Kit"}
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
                              Forward signups to Substack or Kit (ConvertKit). Signups are always saved in LeadMagnets too.
                            </p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B]">
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["newsletter"] ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {openSections["newsletter"] && (
                        <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-5 py-5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                              <span>Substack publication</span>
                              <span className="text-zinc-400 dark:text-[#666675] cursor-help" title="Subdomain of your Substack e.g. myletter for myletter.substack.com">?</span>
                            </label>
                            <input
                              type="text"
                              placeholder="myletter"
                              value={substackPublication}
                              onChange={(e) => setSubstackPublication(e.target.value)}
                              onBlur={() => handleSave()}
                              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#0066B2] transition font-mono"
                            />
                            <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Just the subdomain (e.g. <code className="text-[#0066B2] dark:text-[#38BDF8]">myletter</code> for <code className="text-[#0066B2] dark:text-[#38BDF8]">myletter.substack.com</code>). 100% Free forever.</p>
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8]">
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
                        onBlur={() => handleSave()}
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
                        onBlur={() => handleSave()}
                        className="w-full rounded-xl border border-[#E5E3DD] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Leave blank to hide this link.</p>
                    </div>
                    </div>
                  </div>
                )}
              </div>

            {/* Analytics & Ad Conversion Tracking Card */}
            <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden hover:bg-[#EFF6FF] dark:hover:bg-[#18181c]">
              <button
                onClick={() => toggle("analytics-tracking")}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-emerald-600 border border-[#BBF7D0] dark:bg-[#0f2e1b] dark:border-emerald-800">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Analytics & Conversion Tracking</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Track page views and ad campaign conversions with Google Analytics 4 and Meta Pixel.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(ga4MeasurementId || metaPixelId) && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Tracking Active ✓
                    </span>
                  )}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["analytics-tracking"] ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </button>
              {openSections["analytics-tracking"] && (
                <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-5 py-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                        <span>Google Analytics 4 Measurement ID</span>
                        <span className="text-zinc-400 dark:text-[#666675] cursor-help" title="Find in GA4 Admin -> Data Streams -> Measurement ID (starts with G-)">?</span>
                      </label>
                      <input
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        value={ga4MeasurementId}
                        onChange={(e) => setGa4MeasurementId(e.target.value)}
                        onBlur={() => handleSave()}
                        className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Automatically fires pageviews & lead signup conversion events to GA4.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                        <span>Meta (Facebook) Pixel ID</span>
                        <span className="text-zinc-400 dark:text-[#666675] cursor-help" title="Find in Meta Events Manager -> Data Sources -> Pixel ID">?</span>
                      </label>
                      <input
                        type="text"
                        placeholder="123456789012345"
                        value={metaPixelId}
                        onChange={(e) => setMetaPixelId(e.target.value)}
                        onBlur={() => handleSave()}
                        className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono"
                      />
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Automatically fires Meta `Lead` & `PageView` events for Facebook/Instagram ads.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Social Preview & Favicon Branding Card */}
            <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
              <button
                onClick={() => toggle("branding-preview")}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#1A2E40]">
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Social Sharing Thumbnail & Favicon</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Upload your brand's tab icon and Open Graph thumbnail for social media sharing.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(faviconUrl || ogImageUrl) && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Branding Active ✓
                    </span>
                  )}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["branding-preview"] ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </button>

              {openSections["branding-preview"] && (
                <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-5 py-5 space-y-6">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Favicon Section */}
                    <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-[#121214]">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-900 dark:text-white">
                          Custom Favicon <span className="text-zinc-400 font-normal">(Browser Tab Icon)</span>
                        </label>
                        <span className="text-[10px] font-mono text-zinc-400">32×32 px</span>
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="url"
                          placeholder="https://your-site.com/favicon.ico"
                          value={faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          onBlur={() => handleSave()}
                          className="flex-1 rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono"
                        />
                        {faviconUrl && (
                          <button
                            type="button"
                            title="Clear favicon"
                            onClick={async () => {
                              setFaviconUrl("");
                              await handleSave({ faviconUrl: "" });
                            }}
                            className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer shrink-0"
                          >
                            Clear ✕
                          </button>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-3 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shrink-0">
                          {uploadingFavicon ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" /> : <Sparkles className="h-3.5 w-3.5 text-[#0066B2]" />}
                          <span>{uploadingFavicon ? "Uploading..." : "Upload File"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingFavicon(true);
                              const formData = new FormData();
                              formData.append("file", file);
                              try {
                                const res = await fetch("/api/upload", { method: "POST", body: formData });
                                const data = await res.json();
                                const uploadedUrl = data.data?.fileUrl || data.data?.url || data.url || data.fileUrl;
                                if (uploadedUrl) {
                                  setFaviconUrl(uploadedUrl);
                                  await handleSave({ faviconUrl: uploadedUrl });
                                }
                              } catch (err) {
                                console.error("Upload error:", err);
                              } finally {
                                setUploadingFavicon(false);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Favicon Browser Tab Mockup Preview */}
                      <div className="mt-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-2.5 flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-md bg-zinc-100 dark:bg-[#0E0E10] px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                          {faviconUrl ? (
                            <img src={faviconUrl} alt="Favicon preview" className="h-4 w-4 rounded object-contain shrink-0" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full bg-[#0066B2]" />
                          )}
                          <span className="font-semibold text-[11px] truncate max-w-[120px]">My Lead Magnet Page</span>
                          <span className="text-zinc-400 text-[10px]">×</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-[#9B9085]">
                          Live Tab Icon Preview
                        </p>
                      </div>
                    </div>

                    {/* OG Social Share Image Section */}
                    <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-[#121214]">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-900 dark:text-white">
                          Social Share Thumbnail <span className="text-zinc-400 font-normal">(Open Graph Card)</span>
                        </label>
                        <span className="text-[10px] font-mono text-zinc-400">1200×630 px</span>
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="url"
                          placeholder="https://your-site.com/og-banner.png"
                          value={ogImageUrl}
                          onChange={(e) => setOgImageUrl(e.target.value)}
                          onBlur={() => handleSave()}
                          className="flex-1 rounded-xl border border-[#E2E8F0] dark:border-[#2e2e38] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono"
                        />
                        {ogImageUrl && (
                          <button
                            type="button"
                            title="Clear social share image"
                            onClick={async () => {
                              setOgImageUrl("");
                              await handleSave({ ogImageUrl: "" });
                            }}
                            className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer shrink-0"
                          >
                            Clear ✕
                          </button>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-3 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shrink-0">
                          {uploadingOgImage ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" /> : <Sparkles className="h-3.5 w-3.5 text-[#0066B2]" />}
                          <span>{uploadingOgImage ? "Uploading..." : "Upload File"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingOgImage(true);
                              const formData = new FormData();
                              formData.append("file", file);
                              try {
                                const res = await fetch("/api/upload", { method: "POST", body: formData });
                                const data = await res.json();
                                const uploadedUrl = data.data?.fileUrl || data.data?.url || data.url || data.fileUrl;
                                if (uploadedUrl) {
                                  setOgImageUrl(uploadedUrl);
                                  await handleSave({ ogImageUrl: uploadedUrl });
                                }
                              } catch (err) {
                                console.error("Upload error:", err);
                              } finally {
                                setUploadingOgImage(false);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Real Social Media Share Card Mockup */}
                      <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] overflow-hidden shadow-xs">
                        <div className="h-32 w-full bg-zinc-100 dark:bg-[#0E0E10] relative flex items-center justify-center overflow-hidden">
                          {ogImageUrl ? (
                            <img src={ogImageUrl} alt="Social Card Thumbnail" className="h-full w-full object-cover" />
                          ) : (
                            <div className="text-center p-3">
                              <Globe className="h-6 w-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-1" />
                              <p className="text-[10px] text-zinc-400">No thumbnail set (Displays default generic card)</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-zinc-50/80 dark:bg-[#18181B] border-t border-zinc-100 dark:border-white/5">
                          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            {rootDomain || "leadmagnets.so"}
                          </p>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 truncate">
                            Free Guide: The 10-Step Audience Growth Playbook
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] truncate">
                            Get instant access to strategies used by top creators.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* DKIM & SPF Email Authentication Card */}
            <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden hover:bg-[#EFF6FF] dark:hover:bg-[#18181c]">
              <button
                onClick={() => toggle("email-auth")}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#1F2937]">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">DKIM & SPF Email Deliverability Records</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Ensure your resource delivery emails land in the primary inbox, not spam.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    SPF & DKIM Ready ✓
                  </span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["email-auth"] ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </button>
              {openSections["email-auth"] && (
                <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-5 py-5 space-y-4">
                  <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#151518] p-4 space-y-3">
                    <h6 className="text-xs font-bold text-zinc-900 dark:text-white">Add these DNS records to authenticate your custom sending domain:</h6>
                    
                    {/* SPF Box */}
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 block mb-0.5">SPF (TXT)</span>
                        <span className="text-zinc-900 dark:text-white font-semibold">v=spf1 include:mail.leadmagnets.so ~all</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("v=spf1 include:mail.leadmagnets.so ~all");
                          setCopiedField("spf");
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer shrink-0"
                      >
                        {copiedField === "spf" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* DKIM Box */}
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 block mb-0.5">DKIM CNAME (lm._domainkey)</span>
                        <span className="text-zinc-900 dark:text-white font-semibold">lm.mail.leadmagnets.so</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("lm.mail.leadmagnets.so");
                          setCopiedField("dkim");
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer shrink-0"
                      >
                        {copiedField === "dkim" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
