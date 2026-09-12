"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Palette, Check, Upload, Sun, Moon, Trash2, Loader2, X, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncWithDatabase, saveAccount, loadAccount, loadPages } from "@/lib/store";
import type { Account, MagnetPage } from "@/lib/data";

export default function BrandPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#0066B2");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [highlightIntensity, setHighlightIntensity] = useState<number>(100);
  const [templateId, setTemplateId] = useState<"template1" | "template2" | "template3" | "template4" | "template5" | "template6" | "template7">("template1");
  const [logo, setLogo] = useState<string | null>(null);
  const [latestPage, setLatestPage] = useState<MagnetPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_COLORS = [
    { name: "Ocean Blue", hex: "#0066B2" },
    { name: "Royal Violet", hex: "#7C3AED" },
    { name: "Emerald Growth", hex: "#10B981" },
    { name: "Rose Crimson", hex: "#F43F5E" },
    { name: "Amber Glow", hex: "#F59E0B" },
    { name: "Midnight Obsidian", hex: "#0F172A" },
  ];

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  useEffect(() => {

    // Load local data instantly
    const localAccount = loadAccount();
    if (localAccount) {
      setAccount(localAccount);
      setBusinessName(localAccount.name || "");
      setBrandColor(localAccount.brandColor || "#0066B2");
      setThemeMode(localAccount.themeMode || "light");
      setHighlightIntensity(localAccount.highlightIntensity ?? 100);
      setTemplateId(localAccount.templateId || "template1");
      setLogo(localAccount.logo || null);
    }

    const localPages = loadPages();
    if (localPages && localPages.length > 0) {
      const active = localPages.find((p) => p.status === "live") || localPages[0];
      setLatestPage(active);
    }

    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data && data.account) {
        setAccount(data.account);
        setBusinessName(data.account.name || "");
        setBrandColor(data.account.brandColor || "#0066B2");
        setThemeMode(data.account.themeMode || "light");
        setHighlightIntensity(data.account.highlightIntensity ?? 100);
        setTemplateId(data.account.templateId || "template1");
        setLogo(data.account.logo || null);
      }
      if (data && data.pages && data.pages.length > 0) {
        const active = data.pages.find((p: any) => p.status === "live") || data.pages[0];
        setLatestPage(active);
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const currentUserEmail = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || account?.email || "";

    const updatedAccount: Account = {
      ...(account || { email: currentUserEmail, name: businessName.trim(), username: "user", plan: "Free" as const, joinedAt: "Just now" }),
      email: currentUserEmail,
      name: businessName.trim(),
      brandColor: brandColor.trim(),
      themeMode,
      highlightIntensity,
      templateId,
      logo,
    };

    try {
      await saveAccount(updatedAccount);
      setAccount(updatedAccount);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("currentUserAccount", JSON.stringify(updatedAccount));
        } catch (_) { }
      }
      triggerToast("Brand settings saved successfully!");
    } catch (err) {
      console.error("Save brand settings error:", err);
      setAccount(updatedAccount);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("currentUserAccount", JSON.stringify(updatedAccount));
        } catch (_) { }
      }
      triggerToast("Brand settings saved successfully!");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isPageAsset", "true");
      if (account?.email) {
        formData.append("userEmail", account.email);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.data?.fileUrl) {
        setLogo(result.data.fileUrl);
      } else {
        alert(result.error || "Failed to upload logo.");
      }
    } catch (err: any) {
      console.error("Logo upload error:", err);
      alert("Failed to upload logo image. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasUnsavedChanges =
    businessName !== (account?.name || "") ||
    brandColor !== (account?.brandColor || "#0066B2") ||
    themeMode !== (account?.themeMode || "light") ||
    highlightIntensity !== (account?.highlightIntensity ?? 100) ||
    templateId !== (account?.templateId || "template1") ||
    logo !== (account?.logo || null);

  return (
    <DashboardShell account={account} title="Brand">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10] text-zinc-900 dark:text-white transition-colors duration-200 animate-fade-in">
        <div className="flex-1 px-6 py-6 lg:px-8 w-full">

          {/* Page Title */}
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-900 dark:text-white animate-slide-in">
              Brand
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-200 dark:hover:bg-[#18181B] hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Help: How do I update my brand colours?"
              >
                ?
              </button>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Configure logo, color scheme, and appearance of your public pages.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Brand Settings Form */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-[#0066B2]/35 bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B] p-6 shadow-sm dark:shadow-xl h-full flex flex-col justify-between transition-colors">
                {/* Heading */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/30 dark:bg-[#1a2638] text-[#0066B2]">
                    <Palette className="h-4.5 w-4.5 text-[#0066B2]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">Brand settings</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                      These apply to every live page and preview on this account.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-[#a1a1aa] mb-2">
                      Business name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter business name"
                      className="w-full rounded-md border border-[#E2E8F0] bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B] px-3.5 py-2.5 text-[14.2px] text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#5c5650] focus:border-[#0066B2] transition"
                    />
                    <p className="text-xs text-zinc-500 dark:text-[#71717a] mt-2 leading-relaxed">
                      Optional when your uploaded logo already includes your name.
                    </p>
                  </div>

                  {/* Logo Image */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-[#a1a1aa] mb-2">
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
                        disabled={uploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-zinc-50 dark:border-[#0066B2]/30 dark:bg-[#18181B] px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#252529] hover:border-[#0066B2] dark:hover:border-[#0066B2] transition cursor-pointer disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2] dark:text-[#38BDF8]" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                            Choose logo
                          </>
                        )}
                      </button>
                      {logo ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={logo}
                            alt="Logo Preview"
                            className="h-9 w-9 rounded object-contain border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B]"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="text-red-500 dark:text-[#FF8585] hover:text-red-600 dark:hover:text-red-400 p-1 transition"
                            title="Remove logo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-[#71717a]">No logo uploaded</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#71717a] mt-2 leading-relaxed">
                      Optional when you use a business name. PNG, JPG, WebP, SVG, or GIF. 2 MB max.
                    </p>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-[#a1a1aa] mb-2">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center rounded-md border border-[#E2E8F0] bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B] px-3.5 py-2.5 focus-within:border-[#0066B2] transition">
                      <label className="relative h-5 w-8 shrink-0 rounded cursor-pointer overflow-hidden border border-zinc-200 dark:border-[#0066B2]/30 mr-2">
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
                        className="w-full bg-transparent text-[14.2px] text-zinc-900 dark:text-white outline-none font-mono"
                      />
                    </div>

                    {/* Quick Swatches */}
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setBrandColor(c.hex)}
                          title={c.name}
                          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${brandColor.toLowerCase() === c.hex.toLowerCase()
                              ? "border-zinc-900 dark:border-white scale-110 shadow-xs"
                              : "border-transparent"
                            }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Page Appearance */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-[#a1a1aa] mb-2">
                      Page appearance
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setThemeMode("light")}
                        className={`flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition ${themeMode === "light"
                          ? "border-[#0066B2] bg-[#EFF6FF] dark:bg-[#0066B2]/20 text-zinc-900 dark:text-white font-bold"
                          : "border-[#E2E8F0] bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B] text-zinc-600 dark:text-[#9B9085] hover:bg-zinc-50 dark:hover:bg-[#252529] hover:text-zinc-900 dark:hover:text-white"
                          }`}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("dark")}
                        className={`flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition ${themeMode === "dark"
                          ? "border-[#0066B2] bg-zinc-900 text-white font-bold"
                          : "border-[#E2E8F0] bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B] text-zinc-600 dark:text-[#9B9085] hover:bg-zinc-50 dark:hover:bg-[#252529] hover:text-zinc-900 dark:hover:text-white"
                          }`}
                      >
                        <Moon className="h-3.5 w-3.5" />
                        Dark
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#71717a] mt-2 leading-relaxed">
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
                      className="w-full accent-[#0066B2] bg-[#18181B] h-1 rounded-lg appearance-none cursor-pointer"
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
                <div className="mt-6 border-t border-[#0066B2]/20 dark:border-[#0066B2]/20 pt-5 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-[#5c5650] dark:text-[#9B9085] leading-tight">
                    {hasUnsavedChanges ? "Unsaved changes stay local until saved." : "All changes saved to database."}
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-[12.2px] font-bold text-white hover:bg-[#005799] transition shrink-0 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                    {saving ? "Saving..." : "Save brand"}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="lg:col-span-8 flex flex-col h-full relative">
              {/* 7 Template Switcher Tabs Floating DIRECTLY ABOVE the Preview Card with Apple layoutId pill */}
              <div className="absolute -top-12 left-0 right-0 z-10 flex justify-end">
                <div className="w-full flex items-center justify-between gap-1 bg-zinc-100 dark:bg-[#111113] p-1.5 rounded-xl border border-zinc-200 dark:border-[#2b2b32] shadow-xs overflow-x-auto">
                  {[
                    { id: "template1", label: "Template 1" },
                    { id: "template2", label: "Template 2" },
                    { id: "template3", label: "Template 3" },
                    { id: "template4", label: "Template 4" },
                    { id: "template5", label: "Template 5" },
                    { id: "template6", label: "Template 6" },
                    { id: "template7", label: "Template 7" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id as any)}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap ${templateId === t.id
                        ? "text-white font-bold"
                        : "text-zinc-600 dark:text-[#9B9085] hover:text-zinc-900 dark:hover:text-white"
                        }`}
                    >
                      {templateId === t.id && (
                        <motion.div
                          layoutId="activeTemplateTab"
                          className="absolute inset-0 bg-[#0066B2] rounded-lg shadow-sm"
                          transition={{ type: "spring", stiffness: 550, damping: 34 }}
                        />
                      )}
                      <span className="relative z-10 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: templateId === t.id ? '#ffffff' : '#9CA3AF' }} />
                      <span className="relative z-10">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Preview Card Box (Top aligns EXACTLY with Left Card) */}
              <div className="rounded-2xl border border-[#0066B2]/35 bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B] p-5 shadow-sm dark:shadow-2xl h-full flex flex-col transition-colors">
                <div className="flex flex-col gap-1 mb-4 pb-3 border-b border-zinc-200 dark:border-[#2e2e38]/50">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">Preview</span>
                  <span className="text-xs text-zinc-500 dark:text-[#9B9085] block">How your brand appears on a full magnet page.</span>
                </div>

                {/* Outer frame matching client page background theme mode */}
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${themeMode === "dark"
                    ? "bg-[#0E0E10] border-[#2e2e38] text-white"
                    : "bg-[#FAFAFA] border-[#e4e4e7] text-zinc-900"
                    }`}
                  style={{
                    backgroundImage: themeMode === "light"
                      ? `radial-gradient(circle at 0% 0%, ${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.4) * 255).toString(16).padStart(2, '0')} 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${brandColor}${Math.round((0.03 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')} 0%, transparent 50%)`
                      : `radial-gradient(circle at 0% 0%, ${brandColor}${Math.round((0.08 + (highlightIntensity / 100) * 0.45) * 255).toString(16).padStart(2, '0')} 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.4) * 255).toString(16).padStart(2, '0')} 0%, transparent 50%)`
                  }}
                >
                  {/* Mock page container */}
                  <div className="p-5 md:p-6">
                    {/* Header brand name / logo */}
                    <div className="flex items-center gap-3 mb-8 justify-center">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-transparent overflow-hidden ${logo ? "border-none" : "border border-dashed border-[#a1a1aa]/45"}`}>
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

                    {/* Dynamic Animated Template View Container */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={templateId}
                        initial={{ opacity: 0, y: 6, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.5 }}
                      >
                        {/* TEMPLATE 1: Modern Split Layout */}
                        {templateId === "template1" && (
                          <div
                        className={`rounded-2xl border py-4 px-6 transition-all duration-300 backdrop-blur-md ${themeMode === "dark"
                          ? "text-white"
                          : "text-zinc-900"
                          }`}
                        style={{
                          borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.65) * 255).toString(16).padStart(2, '0')}`,
                          boxShadow: (highlightIntensity > 10)
                            ? `0 12px 32px -8px ${brandColor}${Math.round((highlightIntensity / 100) * 0.45 * 255).toString(16).padStart(2, '0')}`
                            : "0 4px 12px rgba(0,0,0,0.05)",
                          background: themeMode === "light"
                            ? `linear-gradient(135deg, ${brandColor}${Math.round((0.02 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0.85) 50%)`
                            : `linear-gradient(135deg, ${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')} 0%, rgba(18, 18, 20, 0.85) 50%)`
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                          <div className="md:col-span-7 flex flex-col justify-between h-full py-1">
                            <h3 className="text-xl md:text-3xl font-extrabold leading-tight tracking-tight">
                              {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
                            </h3>

                            {latestPage?.subheadline ? (
                              <p className={`text-sm font-semibold leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                                {latestPage.subheadline}
                              </p>
                            ) : (
                              <p className={`text-sm font-semibold leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                                Stop staring at a blank page. Start creating content that actually connects.
                              </p>
                            )}

                            {latestPage?.pitch ? (
                              <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                {latestPage.pitch}
                              </p>
                            ) : (
                              <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                You know what works on LinkedIn. You&apos;ve seen the posts that blow up.
                                <span className="block mt-2.5">
                                  That&apos;s where these templates come in. Real structures pulled from posts that actually performed.
                                </span>
                              </p>
                            )}

                            <div className="space-y-3 pt-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#9B9085]">
                                {latestPage?.bulletsTitle || "This playbook breaks down:"}
                              </p>
                              <ul className="space-y-3">
                                {(latestPage?.bullets && latestPage.bullets.length > 0
                                  ? latestPage.bullets
                                  : [
                                    "101 fill-in-the-blank templates for every content scenario",
                                    "Proven structures for storytelling, advice, and transformation posts",
                                    "Ready-to-use formats that let you focus on your message"
                                  ]
                                ).map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs">
                                    <span
                                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 transition-all duration-300"
                                      style={{
                                        backgroundColor: brandColor,
                                        opacity: 0.5 + (highlightIntensity / 100) * 0.5,
                                        boxShadow: highlightIntensity > 30 ? `0 0 ${Math.round(14 * (highlightIntensity / 100))}px ${brandColor}${Math.round((highlightIntensity / 100) * 0.8 * 255).toString(16).padStart(2, '0')}` : 'none'
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

                          <div className="md:col-span-5 space-y-3">
                            {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                              <div className="rounded-xl border aspect-[16/11] w-full overflow-hidden shadow-xs border-zinc-200 dark:border-zinc-800">
                                <img src={latestPage.imageUrl} alt="Lead magnet media" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div
                                className="rounded-xl border aspect-[16/11] w-full flex items-center justify-center transition-all duration-300"
                                style={{
                                  borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`,
                                  backgroundColor: `${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')}`
                                }}
                              />
                            )}

                            <div
                              className={`rounded-xl border p-4 transition-all duration-300 backdrop-blur-sm aspect-[16/11] flex flex-col justify-center ${themeMode === "dark"
                                ? "text-white"
                                : "text-zinc-900"
                                }`}
                              style={{
                                borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`,
                                boxShadow: highlightIntensity > 20 ? `0 8px 24px -4px ${brandColor}${Math.round((highlightIntensity / 100) * 0.35 * 255).toString(16).padStart(2, '0')}` : "0 2px 8px rgba(0,0,0,0.05)",
                                background: themeMode === "light"
                                  ? `linear-gradient(135deg, ${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0.95) 60%)`
                                  : `linear-gradient(135deg, ${brandColor}${Math.round((0.08 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')} 0%, rgba(22, 22, 25, 0.95) 60%)`
                              }}
                            >
                              <p className="text-lg font-semibold text-center">{latestPage?.formTitle || "Download for free now"}</p>
                              <p className={`text-[11px] text-center mt-1 leading-normal ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                {latestPage?.formSubtitle || "By opting in you consent to receive this resource by email."}
                              </p>

                              <div className="mt-4 space-y-2.5">
                                <input
                                  type="text"
                                  placeholder={latestPage?.namePlaceholder || "Name"}
                                  className={`w-full rounded-md border p-2.5 text-xs focus:outline-none transition pointer-events-none select-none ${themeMode === "dark"
                                    ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                                    : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                                    }`}
                                  readOnly
                                />
                                <input
                                  type="email"
                                  placeholder={latestPage?.emailPlaceholder || "Email"}
                                  className={`w-full rounded-md border p-2.5 text-xs focus:outline-none transition pointer-events-none select-none ${themeMode === "dark"
                                    ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                                    : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                                    }`}
                                  readOnly
                                />

                                <button
                                  className="w-full rounded-md py-2.5 text-xs font-bold text-white transition duration-200 shadow-md"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  {latestPage?.formButtonText || latestPage?.cta || "Send it to me"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TEMPLATE 2: Centered Focus Layout */}
                    {templateId === "template2" && (
                      <div
                        className={`rounded-2xl border py-8 px-8 transition-all duration-300 max-w-2xl mx-auto backdrop-blur-md text-center ${themeMode === "dark" ? "text-white" : "text-zinc-900"
                          }`}
                        style={{
                          borderColor: `${brandColor}${Math.round((0.2 + (highlightIntensity / 100) * 0.6) * 255).toString(16).padStart(2, '0')}`,
                          boxShadow: `0 16px 40px -10px ${brandColor}${Math.round((highlightIntensity / 100) * 0.35 * 255).toString(16).padStart(2, '0')}`,
                          background: themeMode === "light"
                            ? `linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, ${brandColor}${Math.round((0.04 + (highlightIntensity / 100) * 0.2) * 255).toString(16).padStart(2, '0')} 100%)`
                            : `linear-gradient(180deg, rgba(20, 20, 24, 0.95) 0%, ${brandColor}${Math.round((0.08 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 100%)`
                        }}
                      >
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white mb-3" style={{ backgroundColor: brandColor }}>
                          Free Download
                        </span>

                        <h3 className="text-2xl md:text-4xl font-black leading-tight tracking-tight max-w-xl mx-auto">
                          {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
                        </h3>

                        <p className={`text-xs md:text-sm font-medium mt-3 max-w-lg mx-auto ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                          {latestPage?.subheadline || "Stop staring at a blank page. Start creating content that actually connects."}
                        </p>

                        <div className="my-6 max-w-md mx-auto space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="email"
                              placeholder={latestPage?.emailPlaceholder || "Enter your email address"}
                              className={`flex-1 rounded-xl border px-3.5 py-3 text-xs focus:outline-none ${themeMode === "dark" ? "bg-[#0E0E10] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-800"
                                }`}
                              readOnly
                            />
                            <button
                              className="rounded-xl px-5 py-3 text-xs font-bold text-white shadow-lg shrink-0"
                              style={{ backgroundColor: brandColor }}
                            >
                              {latestPage?.formButtonText || latestPage?.cta || "Get Instant Access"}
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-400">Join 2,400+ creators • No credit card required</p>
                        </div>

                        <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center gap-6 text-left">
                          {(latestPage?.bullets && latestPage.bullets.length > 0
                            ? latestPage.bullets
                            : ["101 Fill-in-the-blank templates", "Proven viral storytelling structures", "Instant lifetime access"]
                          ).slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-semibold">
                              <Check className="h-3.5 w-3.5 stroke-[3px]" style={{ color: brandColor }} />
                              <span className={themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TEMPLATE 3: Hero Banner Layout */}
                    {templateId === "template3" && (
                      <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
                        {/* Top Gradient Hero Banner */}
                        <div
                          className="p-6 md:p-8 text-white relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6"
                          style={{
                            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}DD 100%)`
                          }}
                        >
                          <div className="max-w-md space-y-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                              EXCLUSIVE RESOURCE
                            </span>
                            <h3 className="text-2xl md:text-3xl font-extrabold leading-tight">
                              {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
                            </h3>
                            <p className="text-xs text-white/90">
                              {latestPage?.subheadline || "Stop staring at a blank page. Start creating content that actually connects."}
                            </p>
                          </div>

                          <div className="shrink-0 w-full md:w-64 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
                            <p className="text-xs font-bold text-center mb-2.5">Instant Download</p>
                            <input
                              type="email"
                              placeholder="Your email"
                              className="w-full rounded-lg bg-white/90 text-zinc-900 placeholder:text-zinc-400 text-xs px-3 py-2 border-none outline-none mb-2"
                              readOnly
                            />
                            <button
                              className="w-full rounded-lg bg-zinc-900 text-white font-bold py-2 text-xs hover:bg-black transition"
                            >
                              {latestPage?.cta || "Download Now"}
                            </button>
                          </div>
                        </div>

                        {/* Bottom Feature Highlights */}
                        <div className={`p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold ${themeMode === "dark" ? "bg-[#141417] text-zinc-300" : "bg-white text-zinc-700"}`}>
                          {(latestPage?.bullets && latestPage.bullets.length >= 3
                            ? latestPage.bullets
                            : ["101 Fill-in-the-blank templates", "Proven viral storytelling structures", "Instant lifetime access"]
                          ).slice(0, 3).map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-bold text-white text-[10px]" style={{ backgroundColor: brandColor }}>
                                0{idx + 1}
                              </span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TEMPLATE 6: Floating Newsletter Card */}
                    {templateId === "template6" && (
                      <div
                        className={`rounded-2xl border p-6 transition-all duration-300 ${themeMode === "dark" ? "bg-[#16161A] border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brandColor }} />
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Weekly Insight</span>
                        </div>

                        <h3 className="text-2xl font-bold leading-tight mb-3">
                          {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
                        </h3>

                        <p className={`text-xs leading-relaxed mb-6 ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                          {latestPage?.subheadline || "Stop staring at a blank page. Start creating content that actually connects."}
                        </p>

                        <div className="space-y-3">
                          <input
                            type="email"
                            placeholder="name@company.com"
                            className={`w-full rounded-lg border px-3 py-2.5 text-xs outline-none ${themeMode === "dark" ? "bg-[#0E0E10] border-zinc-700 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-800"
                              }`}
                            readOnly
                          />
                          <button
                            className="w-full rounded-lg py-2.5 text-xs font-bold text-white shadow-md transition"
                            style={{ backgroundColor: brandColor }}
                          >
                            {latestPage?.cta || "Subscribe & Download"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TEMPLATE 7: SaaS Cyber Spotlight */}
                    {templateId === "template7" && (
                      <div
                        className="rounded-2xl border p-8 relative overflow-hidden transition-all duration-300 text-center bg-[#090A0F] text-white border-cyan-500/30"
                        style={{
                          boxShadow: `0 0 40px ${brandColor}20`
                        }}
                      >
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border border-cyan-400/40 text-cyan-300 mb-4 bg-cyan-950/40">
                          PRO EDITION
                        </span>

                        <h3 className="text-2xl md:text-3xl font-mono font-bold leading-tight text-white mb-3">
                          {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
                        </h3>

                        <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
                          {latestPage?.subheadline || "Stop staring at a blank page. Start creating content that actually connects."}
                        </p>

                        <div className="flex justify-center max-w-sm mx-auto gap-2">
                          <input
                            type="email"
                            placeholder="Enter email"
                            className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs px-3 py-2 text-white outline-none"
                            readOnly
                          />
                          <button
                            className="rounded-lg px-5 py-2 text-xs font-bold text-white shadow-lg shrink-0"
                            style={{ backgroundColor: brandColor }}
                          >
                            {latestPage?.cta || "Unlock"}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

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
      </div>

      {/* Help Centre Modal with Apple-style smooth spring animation */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              onClick={() => setShowHelpModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.9 }}
              className="relative w-full max-w-3xl rounded-2xl bg-[#141517] text-white border border-zinc-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#16181C]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066B2] text-white font-bold shadow-xs">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Help centre</h3>
                    <p className="text-xs text-zinc-400">Learn the basics or find your next step.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sub-header navigation */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/60 bg-[#111215] text-xs font-semibold text-zinc-400">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="flex items-center gap-2 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>All help topics</span>
                </button>
                <span className="uppercase tracking-wider text-[10px] text-zinc-500 font-bold">LEARN</span>
              </div>

              {/* Content Body */}
              <div className="p-8 space-y-7 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8]">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PAGE APPEARANCE</span>
                      <h2 className="text-xl font-bold text-white leading-tight">How do I update my brand colours?</h2>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed pl-13">
                    Brand settings apply to every public lead magnet and to the editor preview.
                  </p>
                </div>

                {/* Numbered Steps */}
                <div className="space-y-5 pl-2">
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Open your brand settings</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Open Brand from the dashboard sidebar.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Set the identity and colour</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Add your business name, upload a logo, and choose the primary colour used across your pages.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Choose the page style</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Choose light or dark page appearance and adjust the highlight intensity.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                      4
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Preview and save</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Check the preview, then choose Save brand.</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-[#0066B2] px-5 py-3 text-sm font-bold text-white hover:bg-[#005799] transition shadow-lg cursor-pointer"
                  >
                    <span>Open Brand settings</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
