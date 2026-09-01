"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Palette, Check, Upload, Sun, Moon, Trash2 } from "lucide-react";
import { syncWithDatabase, saveAccount, loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function BrandPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#FE6F34");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [highlightIntensity, setHighlightIntensity] = useState<number>(100);
  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load local data instantly
    const localAccount = loadAccount();
    if (localAccount) {
      setAccount(localAccount);
      setBusinessName(localAccount.name || "");
      setBrandColor(localAccount.brandColor || "#FE6F34");
      setThemeMode(localAccount.themeMode || "light");
      setHighlightIntensity(localAccount.highlightIntensity ?? 100);
      setLogo(localAccount.logo || null);
    }
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data && data.account) {
        setAccount(data.account);
        setBusinessName(data.account.name || "");
        setBrandColor(data.account.brandColor || "#FE6F34");
        setThemeMode(data.account.themeMode || "light");
        setHighlightIntensity(data.account.highlightIntensity ?? 100);
        setLogo(data.account.logo || null);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);

    const updatedAccount: Account = {
      ...account,
      name: businessName.trim(),
      brandColor: brandColor.trim(),
      themeMode,
      highlightIntensity,
      logo,
    };

    try {
      const result = await saveAccount(updatedAccount);
      if (result.success) {
        setAccount(updatedAccount);
        alert("Brand settings saved successfully!");
      } else {
        alert(result.error || "Failed to save brand settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save brand settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E10]">
        <div className="text-sm text-[#9B9085]">Loading brand settings...</div>
      </div>
    );
  }

  const hasUnsavedChanges =
    businessName !== (account.name || "") ||
    brandColor !== (account.brandColor || "#FE6F34") ||
    themeMode !== (account.themeMode || "light") ||
    highlightIntensity !== (account.highlightIntensity ?? 100) ||
    logo !== account.logo;

  return (
    <DashboardShell account={account} title="Brand">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#0E0E10] text-white animate-fade-in">
        <div className="flex-1 px-6 py-6 lg:px-8 w-full">

          {/* Page Title */}
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-white animate-slide-in">
              Brand
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-[#2e2e38] text-xs font-normal text-[#9B9085] hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-[#9B9085] mt-1">Configure logo, color scheme, and appearance of your public pages.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

            {/* Brand Settings Form */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-[#2e2e38] bg-[#18181B] p-6 shadow-xl h-full flex flex-col justify-between">
                {/* Heading */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#2e2e38] bg-[#252529] text-[#9B9085]">
                    <Palette className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Brand settings</h4>
                    <p className="text-xs text-[#9B9085] mt-1">
                      These apply to every live page and preview on this account.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#a1a1aa] mb-2">
                      Business name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter business name"
                      className="w-full rounded-md border border-[#2e2e38] bg-[#18181B] px-3.5 py-2.5 text-[14.2px] text-white outline-none placeholder:text-[#5c5650] focus:border-[#FE6F34] transition"
                    />
                    <p className="text-xs text-[#71717a] mt-2 leading-relaxed">
                      Optional when your uploaded logo already includes your name.
                    </p>
                  </div>

                  {/* Logo Image */}
                  <div>
                    <label className="block text-sm font-semibold text-[#a1a1aa] mb-2">
                      Logo image
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-md border border-[#2e2e38] bg-[#18181B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#252529] hover:border-[#5c5650] transition"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#9B9085]" />
                        Choose logo
                      </button>
                      {logo ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={logo}
                            alt="Logo Preview"
                            className="h-9 w-9 rounded object-contain border border-[#2e2e38] bg-[#18181B]"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="text-[#FF8585] hover:text-red-400 p-1 transition"
                            title="Remove logo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#71717a]">No logo uploaded</span>
                      )}
                    </div>
                    <p className="text-xs text-[#71717a] mt-2 leading-relaxed">
                      Optional when you use a business name. PNG, JPG, WebP, or GIF. 10 MB max.
                    </p>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-semibold text-[#a1a1aa] mb-2">
                      Primary
                    </label>
                    <div className="flex items-center rounded-md border border-[#2e2e38] bg-[#18181B] px-3.5 py-2.5 focus-within:border-[#FE6F34] transition">
                      <label className="relative h-5 w-8 shrink-0 rounded cursor-pointer overflow-hidden border border-[#2e2e38] mr-2">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                        />
                        <div className="h-full w-full" style={{ backgroundColor: brandColor }} />
                      </label>
                      <input
                        type="text"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-full bg-transparent text-[14.2px] text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Page Appearance */}
                  <div>
                    <label className="block text-sm font-semibold text-[#a1a1aa] mb-2">
                      Page appearance
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setThemeMode("light")}
                        className={`flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition ${themeMode === "light"
                          ? "border-[#5c5650] bg-[#252529] text-white"
                          : "border-[#2e2e38] bg-[#18181B] text-[#9B9085] hover:bg-[#252529] hover:text-white"
                          }`}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("dark")}
                        className={`flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition ${themeMode === "dark"
                          ? "border-[#5c5650] bg-[#252529] text-white"
                          : "border-[#2e2e38] bg-[#18181B] text-[#9B9085] hover:bg-[#252529] hover:text-white"
                          }`}
                      >
                        <Moon className="h-3.5 w-3.5" />
                        Dark
                      </button>
                    </div>
                    <p className="text-xs text-[#71717a] mt-2 leading-relaxed">
                      Applied to every public magnet and editor preview.
                    </p>
                  </div>

                  {/* Highlight Intensity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#a1a1aa]">
                        Highlight intensity
                      </label>
                      <span className="rounded bg-[#252529] px-1.5 py-0.5 text-xs font-mono font-bold text-white">
                        {highlightIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={highlightIntensity}
                      onChange={(e) => setHighlightIntensity(Number(e.target.value))}
                      className="w-full accent-[#FE6F34] bg-[#18181B] h-1 rounded-lg appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${brandColor} 0%, ${brandColor} ${highlightIntensity}%, #2e2e38 ${highlightIntensity}%, #2e2e38 100%)`
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-[#5c5650] mt-1.5 font-semibold uppercase tracking-wider">
                      <span>Subtle</span>
                      <span>Balanced</span>
                      <span>Bold</span>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="mt-6 border-t border-[#2e2e38] pt-5 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-[#5c5650] leading-tight">
                    {hasUnsavedChanges ? "Unsaved changes stay local until saved." : "All changes saved to database."}
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className="flex items-center gap-1.5 rounded-lg bg-[#FE6F34] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-[12.2px] font-bold text-black hover:bg-[#e55e28] transition shrink-0"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                    {saving ? "Saving..." : "Save brand"}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-[#2e2e38] bg-[#18181B] p-5 shadow-2xl h-full flex flex-col">
                <div className="flex flex-col gap-1 mb-4 pb-3 border-b border-[#2e2e38]/50">
                  <span className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Preview</span>
                  <span className="text-xs text-[#9B9085]">How your brand appears on a full magnet page.</span>
                </div>
                {/* Outer frame matching client page background theme mode */}
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${themeMode === "dark"
                    ? "bg-[#0E0E10] border-[#2e2e38] text-white"
                    : "bg-[#FAFAFA] border-[#e4e4e7] text-zinc-900"
                    }`}
                  style={{
                    backgroundImage: themeMode === "light"
                      ? `radial-gradient(circle at 0% 0%, ${brandColor}22 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${brandColor}1b 0%, transparent 50%)`
                      : `radial-gradient(circle at 0% 0%, ${brandColor}28 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${brandColor}1f 0%, transparent 50%)`
                  }}
                >
                  {/* Mock page container */}
                  <div className="p-5 md:p-6">
                    {/* Header brand name / logo */}
                    <div className="flex items-center gap-3 mb-8 justify-center">
                      <div className="h-11 w-11 rounded-xl border border-dashed border-[#a1a1aa]/45 flex items-center justify-center bg-transparent overflow-hidden">
                        {logo ? (
                          <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-5 w-5 rounded-sm border border-dashed border-[#a1a1aa]" />
                        )}
                      </div>
                      <span className={`text-base font-extrabold tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-black"}`}>
                        {businessName || "BDA"}
                      </span>
                    </div>

                    {/* Main Card Wrapper */}
                    <div
                      className={`rounded-2xl border py-4 px-6 shadow-2xl transition-all duration-300 backdrop-blur-md ${themeMode === "dark"
                        ? "text-white"
                        : "text-zinc-900"
                        }`}
                      style={{
                        borderColor: `${brandColor}45`,
                        background: themeMode === "light"
                          ? `linear-gradient(135deg, ${brandColor}0d 0%, rgba(255, 255, 255, 0.8) 50%)`
                          : `linear-gradient(135deg, ${brandColor}15 0%, rgba(18, 18, 20, 0.8) 50%)`
                      }}
                    >
                      {/* Main Grid Content */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                        {/* Left Details */}
                        <div className="md:col-span-7 flex flex-col justify-between h-full py-1">
                          <h3 className="text-xl md:text-3xl font-extrabold leading-tight tracking-tight">
                            101 Winning Viral Templates That Get Results
                          </h3>

                          <p className={`text-sm font-semibold leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                            Stop staring at a blank page. Start creating content that actually connects.
                          </p>

                          <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                            You know what works on LinkedIn. You've seen the posts that blow up.
                            <span className="block mt-2.5">
                              That&apos;s where these templates come in. Real structures pulled from posts that actually performed.
                            </span>
                          </p>

                          <div className="space-y-3 pt-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#9B9085]">
                              This playbook breaks down:
                            </p>
                            <ul className="space-y-3">
                              {[
                                "101 fill-in-the-blank templates for every content scenario",
                                "Proven structures for storytelling, advice, and transformation posts",
                                "Ready-to-use formats that let you focus on your message"
                              ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs">
                                  <span
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 transition-all duration-300"
                                    style={{
                                      backgroundColor: brandColor
                                    }}
                                  >
                                    <Check className="h-3 w-3 text-white stroke-[3px]" />
                                  </span>
                                  <span className={themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}>
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Right CTA Form & Media Placeholder */}
                        <div className="md:col-span-5 space-y-3">
                          {/* Media Placeholder Card */}
                          <div
                            className="rounded-xl border aspect-[16/11] w-full flex items-center justify-center transition-colors duration-300"
                            style={{
                              borderColor: `${brandColor}35`,
                              backgroundColor: `${brandColor}18`
                            }}
                          />

                          {/* Signup Card */}
                          <div
                            className={`rounded-xl border p-4 shadow-lg transition-all duration-300 backdrop-blur-sm aspect-[16/11] flex flex-col justify-center ${themeMode === "dark"
                              ? "text-white"
                              : "text-zinc-900"
                              }`}
                            style={{
                              borderColor: `${brandColor}35`,
                              background: themeMode === "light"
                                ? `linear-gradient(135deg, ${brandColor}18 0%, rgba(255, 255, 255, 0.95) 60%)`
                                : `linear-gradient(135deg, ${brandColor}2b 0%, rgba(22, 22, 25, 0.95) 60%)`
                            }}
                          >
                            <p className="text-lg font-semibold text-center">Download for free now</p>
                            <p className={`text-[11px] text-center mt-1 leading-normal ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                              By opting in you consent to receive <br /> this resource by email.
                            </p>

                            <div className="mt-4 space-y-2.5">
                              <input
                                type="text"
                                placeholder="Name"
                                className={`w-full rounded-md border p-2.5 text-xs focus:outline-none transition pointer-events-none select-none ${themeMode === "dark"
                                  ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                                  : "border-[#e4e4e7] text-zinc-800 focus:border-[#FE6F34]/50"
                                  }`}
                                style={{
                                  backgroundColor: themeMode === "light" ? "#ffffff" : undefined
                                }}
                                readOnly
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                className={`w-full rounded-md border p-2.5 text-xs focus:outline-none transition pointer-events-none select-none ${themeMode === "dark"
                                  ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                                  : "border-[#e4e4e7] text-zinc-800 focus:border-[#FE6F34]/50"
                                  }`}
                                style={{
                                  backgroundColor: themeMode === "light" ? "#ffffff" : undefined
                                }}
                                readOnly
                              />

                              <button
                                className="w-full rounded-md py-2.5 text-xs font-bold text-white transition duration-200 active:scale-95 shadow-md bg-[#0E0E10] hover:bg-[#161619]"
                              >
                                Get the templates
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer inside Preview */}
                    <div className={`mt-10 text-center text-[10px] border-t pt-4 transition-all duration-300 ${themeMode === "dark" ? "border-zinc-800 text-zinc-500" : "border-zinc-200 text-zinc-400"
                      }`}>
                      All rights reserved 2026
                    </div>
                  </div>
                </div>
              </div>
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
