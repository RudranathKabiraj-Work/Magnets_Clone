"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Sparkles, Globe, Plug, FileText, ChevronDown, ChevronUp, Check } from "lucide-react";
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
    "legal-links": false,
  });

  useEffect(() => {
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

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E10]">
        <div className="text-sm text-[#9B9085]">Loading settings...</div>
      </div>
    );
  }

  const inputClass =
    "w-full border-0 bg-transparent py-2.5 pl-1 pr-3 text-sm text-white outline-none focus:ring-0 placeholder:text-[#9B9085]";

  const labelClass = "block text-[12.2px] font-semibold text-[#9B9085] mb-1.5";

  return (
    <DashboardShell account={account} title="Workspace setup">
      <div className="flex flex-col min-h-[calc(100vh-3rem)]">
        <div className="flex-1 px-6 py-6 lg:px-8">

          {/* Page heading */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-white">
              Workspace setup
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-[#2e2e38] text-xs font-normal text-[#9B9085] hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-[#9B9085] mt-1">
              Manage your publishing address,{" "}
              <span className="text-[#FE6F34]">email delivery</span>, and{" "}
              <span className="text-[#FE6F34]">connections</span>
            </p>
          </div>

          {/* Workspace Essentials banner */}
          <div
            className="relative mb-5 overflow-hidden rounded-2xl border border-[#2e2e38] bg-[#18181B] pt-7 pb-8 px-8"
            style={{
              background: "linear-gradient(90deg, #2D1A12 0%, #1D1512 30%, #18181B 70%)",
            }}
          >
            {/* Badge */}
            <div className="mb-4 flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5c2d18] bg-[#2a1309] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <Sparkles className="h-3.5 w-3.5 text-[#FE6F34] fill-[#FE6F34]/20" />
                WORKSPACE ESSENTIALS
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-lg">
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2">
                  Set up once, then get back to creating
                </h3>
                <p className="text-sm text-[#9B9085]/90 leading-relaxed">
                  Your Magnets URL is the only required setting. Domains and integrations stay out
                  of the way until you need them.
                </p>
              </div>

              {/* Public URL ready status card */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#2e2e38] bg-[#0E0E10]/70 px-4 py-3 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Public URL ready</p>
                  <p className="text-[11px] text-[#9B9085] mt-0.5">magnets.so/{username}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4">

            {/* Public URL card */}
            <div className="rounded-2xl border border-[#2e2e38] bg-[#18181B] overflow-hidden">
              {/* Always-visible header */}
              <div className="flex items-start gap-3 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#252529] text-[#9B9085]">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[14.2px] font-bold text-white">Public URL</h4>
                  <p className="text-xs text-[#9B9085] mt-0.5">
                    This is the link you can share immediately. A custom domain is completely optional.
                  </p>
                </div>
              </div>

              {/* Magnets URL field + share card */}
              <div className="px-5 pb-4">
                <label className={labelClass}>Magnets URL</label>
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  {/* Input */}
                  <div className="flex-1">
                    <div className="flex rounded-md border border-[#2e2e38] bg-[#0E0E10] focus-within:border-[#FE6F34] transition overflow-hidden">
                      <span className="flex items-center select-none pl-3 text-xs text-[#9B9085] font-medium whitespace-nowrap">
                        magnets.so/
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={handleSave}
                        className={inputClass}
                        placeholder="your-workspace"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#9B9085]">Lowercase letters, numbers, and hyphens.</p>
                  </div>
                  {/* Share this link card */}
                  <div className="rounded-2xl border border-[#2e2e38] bg-[#0E0E10] px-4 py-3 shrink-0 md:w-56">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9B9085] mb-1.5">Share this link</p>
                    <p className="text-sm font-semibold text-white">magnets.so/{username}</p>
                  </div>
                </div>
              </div>

              {/* Custom domain nested row */}
              <div className="border-t border-[#2e2e38] mx-0">
                <button
                  onClick={() => toggle("custom-domain")}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-[#252529]/30 transition"
                >
                   <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#252529] text-[#9B9085]">
                      <Globe className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[14.2px] font-bold text-white">Custom domain</p>
                      <p className="text-xs text-[#9B9085] mt-0.5">Use your own domain whenever you are ready. Your Magnets link already works.</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-[#9B9085] shrink-0 transition-transform ${openSections["custom-domain"] ? "rotate-180" : ""}`} />
                </button>
                {openSections["custom-domain"] && (
                  <div className="border-t border-[#2e2e38] px-5 py-4 bg-[#0E0E10]/30">
                    <p className="text-xs text-[#9B9085] leading-relaxed">
                      Custom domain features are available on the Pro plan.
                    </p>
                    <button className="mt-3 rounded-md bg-[#252529] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2e2e35] transition">
                      Upgrade to Pro
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Optional connections card */}
            <div id="connections-section" className="rounded-2xl border border-[#2e2e38] bg-[#18181B] overflow-hidden">
              <button
                onClick={() => toggle("connections")}
                className="flex w-full items-center justify-between p-5 text-left hover:bg-[#252529]/20 transition"
              >
                 <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2a1a08] text-[#FE6F34]">
                    <Plug className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-white">Optional connections</h4>
                    <p className="text-xs text-[#9B9085] mt-0.5">
                      Your page and first email work without these. Add a connection only when it helps your workflow.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="rounded-full border border-emerald-700/50 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Email ready
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#9B9085] transition-transform ${openSections["connections"] ? "rotate-180" : ""}`} />
                </div>
              </button>
              {openSections["connections"] && (
                <div className="border-t border-[#2e2e38] px-5 py-5 bg-[#0E0E10]/30 space-y-6">
                  {/* AUDIENCE SYNC Section */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B9085]">AUDIENCE SYNC</p>
                      <p className="text-xs text-[#666675]">Forward signups into an existing newsletter audience.</p>
                    </div>

                    {/* Newsletter Box */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#121214] overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-[#18181c] border-b border-[#2e2e38]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2a1a08] text-[#FE6F34]">
                            <Sparkles className="h-4 w-4 text-[#FE6F34]" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-white">Newsletter</h5>
                            <p className="text-xs text-[#9B9085]">
                              Forward signups to Beehiiv or Substack. Connect Kit in Automations. Signups are always saved in Magnets too.
                            </p>
                          </div>
                        </div>
                        <ChevronUp className="h-4 w-4 text-[#9B9085]" />
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1">
                              <span>Beehiiv publication ID</span>
                              <span className="text-[#666675] cursor-help">?</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Publication ID"
                              className="w-full rounded-xl border border-[#FE6F34]/80 bg-[#0E0E10] px-3.5 py-2.5 text-xs text-white placeholder:text-[#52525b] outline-none focus:ring-1 focus:ring-[#FE6F34]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1">
                              <span>Beehiiv API key</span>
                              <span className="text-[#666675] cursor-help">?</span>
                            </label>
                            <input
                              type="password"
                              placeholder="API key"
                              className="w-full rounded-xl border border-[#2e2e38] bg-[#0E0E10] px-3.5 py-2.5 text-xs text-white placeholder:text-[#52525b] outline-none focus:border-[#FE6F34]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1">
                            <span>Substack publication</span>
                            <span className="text-[#666675] cursor-help">?</span>
                          </label>
                          <input
                            type="text"
                            placeholder="myletter"
                            className="w-full rounded-xl border border-[#2e2e38] bg-[#0E0E10] px-3.5 py-2.5 text-xs text-white placeholder:text-[#52525b] outline-none focus:border-[#FE6F34]"
                          />
                          <p className="mt-1 text-[11px] text-[#666675]">Just the subdomain. myletter, not myletter.substack.com</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legal links card */}
            <div className="rounded-2xl border border-[#2e2e38] bg-[#18181B] overflow-hidden">
              <button
                onClick={() => toggle("legal-links")}
                className="flex w-full items-center justify-between p-5 text-left hover:bg-[#252529]/20 transition"
              >
                 <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2a1a08] text-[#FE6F34]">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-white">Legal links</h4>
                    <p className="text-xs text-[#9B9085] mt-0.5">
                      Optionally add your own privacy policy and terms to every page footer.
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#9B9085] shrink-0 transition-transform ${openSections["legal-links"] ? "rotate-180" : ""}`} />
              </button>
              {openSections["legal-links"] && (
                <div className="border-t border-[#2e2e38] px-5 py-5 bg-[#0E0E10]/30 space-y-4">
                  <div>
                    <label className={labelClass}>Privacy Policy URL</label>
                     <input
                      type="url"
                      placeholder="https://yourwebsite.com/privacy"
                      value={privacyPolicy}
                      onChange={(e) => setPrivacyPolicy(e.target.value)}
                      onBlur={handleSave}
                      className="w-full rounded-md border border-[#2e2e38] bg-[#18181B] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FE6F34] placeholder:text-[#9B9085] transition"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Terms of Service URL</label>
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com/terms"
                      value={termsOfService}
                      onChange={(e) => setTermsOfService(e.target.value)}
                      onBlur={handleSave}
                      className="w-full rounded-md border border-[#2e2e38] bg-[#18181B] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FE6F34] placeholder:text-[#9B9085] transition"
                    />
                  </div>
                   <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-md bg-[#FE6F34] px-5 py-2.5 text-[12.2px] font-bold text-black hover:bg-[#e55e28] disabled:opacity-60 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {saving ? "Saving..." : "Save links"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-[#9B9085]">
          <span>Magnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>
    </DashboardShell>
  );
}
