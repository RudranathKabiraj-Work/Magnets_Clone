"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { Sliders, Link, ChevronDown, ChevronUp, Globe, Mail, ShieldAlert } from "lucide-react";
import { syncWithDatabase, saveAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function WorkspaceSetupPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [saving, setSaving] = useState(false);

  // Accordion sections state
  const [openSection, setOpenSection] = useState<string | null>("public-url");

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setUsername(data.account.username || "");
        setPrivacyPolicy(data.account.privacyPolicy || "");
        setTermsOfService(data.account.termsOfService || "");
      }
      setLoading(false);
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
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <DashboardShell account={account} title="Workspace setup">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
          <div>
            <h2 className="flex items-center gap-1.5 text-lg font-semibold text-ink-950 dark:text-white">
              Workspace setup
              <span className="cursor-help rounded-full border border-ink-300 px-1.5 py-0 text-xs font-normal text-ink-500 hover:bg-ink-100">?</span>
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
              Manage your publishing address, email delivery, and connections.
            </p>
          </div>

        {/* Hero banner */}
        <div className="mt-8 rounded-lg border border-ink-200 bg-brand-soft/20 p-6 dark:border-ink-800 dark:bg-brand-soft/5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-brand-orange/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-orange">
                # Workspace Essentials
              </span>
              <h3 className="mt-2.5 text-base font-semibold text-ink-950 dark:text-white">Set up once, then get back to creating</h3>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 max-w-lg leading-relaxed">
                Your Magnets URL is the only required setting. Domains and integrations stay out of the way until you need them.
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-ink-200 bg-white p-3.5 dark:border-ink-800 dark:bg-ink-900 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="text-xs">
                <p className="font-semibold text-ink-950 dark:text-white">Public URL ready</p>
                <p className="text-ink-400 text-[10px] mt-0.5">magnets.so/{username}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {/* Public URL */}
          <div className="rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 overflow-hidden">
            <button
              onClick={() => toggleSection("public-url")}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                  <Link className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-950 dark:text-white">Public URL</h4>
                  <p className="text-xs text-ink-400 mt-0.5">This is the link you can share immediately. A custom domain is completely optional.</p>
                </div>
              </div>
              {openSection === "public-url" ? <ChevronUp className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
            </button>

            {openSection === "public-url" && (
              <div className="border-t border-ink-150 p-5 bg-ink-50/30 dark:border-ink-800">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <FieldLabel>Magnets URL</FieldLabel>
                    <div className="flex rounded-md border border-ink-300 bg-white shadow-sm focus-within:border-ink-400 focus-within:ring-1 focus-within:ring-ink-400 dark:border-ink-700 dark:bg-ink-950">
                      <span className="flex items-center select-none pl-3 text-xs text-ink-400 font-medium">magnets.so/</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={handleSave}
                        className="w-full min-w-0 border-0 bg-transparent py-2.5 pl-1 pr-3 text-xs text-ink-900 focus:ring-0 dark:text-white"
                        placeholder="your-workspace"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 md:w-80 shrink-0">
                    <p className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">Share this link</p>
                    <p className="mt-1.5 text-xs font-semibold text-brand-orange underline break-all">
                      magnets.so/{username}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Domain */}
          <div className="rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 overflow-hidden">
            <button
              onClick={() => toggleSection("custom-domain")}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-950 dark:text-white">Custom domain</h4>
                  <p className="text-xs text-ink-400 mt-0.5">Use your own domain whenever you are ready. Your Magnets link already works.</p>
                </div>
              </div>
              {openSection === "custom-domain" ? <ChevronUp className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
            </button>

            {openSection === "custom-domain" && (
              <div className="border-t border-ink-150 p-5 bg-ink-50/30 dark:border-ink-800 text-center py-10">
                <p className="text-xs text-ink-500 font-medium">Custom domain features are available on the Pro plan.</p>
                <Button className="mt-3.5 bg-ink-950 text-white hover:bg-ink-900">Upgrade to Pro</Button>
              </div>
            )}
          </div>

          {/* Optional Connections */}
          <div className="rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 overflow-hidden">
            <button
              onClick={() => toggleSection("connections")}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-950 dark:text-white">Optional connections</h4>
                  <p className="text-xs text-ink-400 mt-0.5">Your page and first email work without these. Add a connection only when it helps your workflow.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                  Email ready
                </span>
                {openSection === "connections" ? <ChevronUp className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
              </div>
            </button>

            {openSection === "connections" && (
              <div className="border-t border-ink-150 p-5 bg-ink-50/30 dark:border-ink-800">
                <p className="text-xs text-ink-500 leading-relaxed">
                  Connections are configured in your dashboard sidebar settings. Emails are automatically delivered via Magnets Mail SMTP service at no charge.
                </p>
              </div>
            )}
          </div>

          {/* Legal Links */}
          <div className="rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 overflow-hidden">
            <button
              onClick={() => toggleSection("legal-links")}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-950 dark:text-white">Legal links</h4>
                  <p className="text-xs text-ink-400 mt-0.5">Optionally add your own privacy policy and terms to every page footer.</p>
                </div>
              </div>
              {openSection === "legal-links" ? <ChevronUp className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
            </button>

            {openSection === "legal-links" && (
              <div className="border-t border-ink-150 p-5 bg-ink-50/30 dark:border-ink-800 space-y-4">
                <div>
                  <FieldLabel>Privacy Policy URL</FieldLabel>
                  <Input
                    type="url"
                    placeholder="https://yourwebsite.com/privacy"
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                    onBlur={handleSave}
                  />
                </div>
                <div>
                  <FieldLabel>Terms of Service URL</FieldLabel>
                  <Input
                    type="url"
                    placeholder="https://yourwebsite.com/terms"
                    value={termsOfService}
                    onChange={(e) => setTermsOfService(e.target.value)}
                    onBlur={handleSave}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
