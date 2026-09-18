"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Palette, Check, Upload, Sun, Moon, Trash2, Loader2, X, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncWithDatabase, saveAccount, loadAccount, loadPages, savePages } from "@/lib/store";
import type { Account, MagnetPage } from "@/lib/data";

function compressLogoImage(file: File, maxDimension = 400, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.FileReader || !window.HTMLCanvasElement) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/webp",
            quality
          );
        } catch (err) {
          resolve(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function BrandPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#0066B2");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [highlightIntensity, setHighlightIntensity] = useState<number>(100);
  const [templateId, setTemplateId] = useState<string>("template1");
  const [hoveredTemplateTab, setHoveredTemplateTab] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [stateLatestPage, setLatestPage] = useState<MagnetPage | null>(null);
  const [allPages, setAllPages] = useState<MagnetPage[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Lock background scroll & pause Lenis when Help Modal is open
  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (showHelpModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (lenis && typeof lenis.stop === "function") lenis.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    };
  }, [showHelpModal]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_COLORS = useMemo(() => [
    { name: "Ocean Blue", hex: "#0066B2" },
    { name: "Royal Violet", hex: "#7C3AED" },
    { name: "Emerald Growth", hex: "#10B981" },
    { name: "Rose Crimson", hex: "#F43F5E" },
    { name: "Amber Glow", hex: "#F59E0B" },
    { name: "Midnight Obsidian", hex: "#0F172A" },
  ], []);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const normalizeTemplateId = useCallback((t: any): string => {
    if (!t) return "template1";
    const s = String(t).trim();
    if (/^\d+$/.test(s)) return `template${s}`;
    return s;
  }, []);

  useEffect(() => {
    // 1. Load local Account & Pages instantly
    const localAccount = loadAccount();
    const rawLocalPages = loadPages();
    const localPages = rawLocalPages ? rawLocalPages.map(p => ({ ...p, template: normalizeTemplateId(p.template) as any })) : [];
    const activeLocal = localPages && localPages.length > 0 ? (localPages.find((p) => p.status === "live") || localPages[0]) : null;

    if (localPages && localPages.length > 0) {
      setAllPages(localPages);
      if (activeLocal) setLatestPage(activeLocal);
    }

    if (localAccount) {
      setAccount(localAccount);
      setBusinessName(localAccount.name || "");
      setBrandColor(localAccount.brandColor || "#0066B2");
      setThemeMode(localAccount.themeMode || "light");
      setHighlightIntensity(localAccount.highlightIntensity ?? 100);
      setLogo(localAccount.logo || null);

      if (localAccount.templateId) {
        setTemplateId(localAccount.templateId);
      } else if (activeLocal?.template) {
        setTemplateId(activeLocal.template);
      }
    } else if (activeLocal?.template) {
      setTemplateId(activeLocal.template);
    }

    setLoading(false);

    // 2. Sync with database in background
    syncWithDatabase().then((data) => {
      if (data && data.account) {
        setAccount(data.account);
        setBusinessName(data.account.name || "");
        setBrandColor(data.account.brandColor || "#0066B2");
        setThemeMode(data.account.themeMode || "light");
        setHighlightIntensity(data.account.highlightIntensity ?? 100);
        setLogo(data.account.logo || null);

        if (data.account.templateId) {
          setTemplateId(data.account.templateId);
        }
      }
      if (data && data.pages && data.pages.length > 0) {
        setAllPages(data.pages);
        const active = data.pages.find((p: any) => p.status === "live") || data.pages[0];
        setLatestPage(active);

        if (!data?.account?.templateId && active?.template) {
          setTemplateId(active.template);
        }
      }
    });

    const refreshPages = () => {
      const acc = loadAccount();
      if (acc?.templateId) {
        setTemplateId(acc.templateId);
      }
      const localPages = loadPages();
      if (localPages && localPages.length > 0) {
        setAllPages(localPages);
        const active = localPages.find((p: any) => p.status === "live") || localPages[0];
        setLatestPage(active);
      }
    };

    window.addEventListener("storage", refreshPages);
    window.addEventListener("focus", refreshPages);

    return () => {
      window.removeEventListener("storage", refreshPages);
      window.removeEventListener("focus", refreshPages);
    };
  }, [normalizeTemplateId]);

  const handleSave = useCallback(async () => {
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
      const res = await saveAccount(updatedAccount);
      const savedAcc = res.account || updatedAccount;
      setAccount(savedAcc);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("currentUserAccount", JSON.stringify(savedAcc));
          window.dispatchEvent(new Event("accountUpdated"));
        } catch (_) { }
      }
      triggerToast("Brand settings saved successfully!");
    } catch (err) {
      console.error("Save brand settings error:", err);
      setAccount(updatedAccount);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("currentUserAccount", JSON.stringify(updatedAccount));
          window.dispatchEvent(new Event("accountUpdated"));
        } catch (_) { }
      }
      triggerToast("Brand settings saved successfully!");
    } finally {
      setSaving(false);
    }
  }, [account, businessName, brandColor, themeMode, highlightIntensity, templateId, logo, triggerToast]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadFile = await compressLogoImage(file);
      const formData = new FormData();
      formData.append("file", uploadFile);
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
  }, [account?.email]);

  const removeLogo = useCallback(() => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    return (
      businessName !== (account?.name || "") ||
      brandColor !== (account?.brandColor || "#0066B2") ||
      themeMode !== (account?.themeMode || "light") ||
      highlightIntensity !== (account?.highlightIntensity ?? 100) ||
      templateId !== (account?.templateId || "template1") ||
      logo !== (account?.logo || null)
    );
  }, [businessName, brandColor, themeMode, highlightIntensity, templateId, logo, account]);

  const latestPage = useMemo(() => {
    const reversed = [...allPages].reverse();
    const pageForTemplate =
      reversed.find((p) => (p.template as string) === templateId && p.status === "live") ||
      reversed.find((p) => (p.template as string) === templateId);

    if (pageForTemplate) return pageForTemplate;

    if (stateLatestPage && (stateLatestPage.template as string) === templateId) {
      return stateLatestPage;
    }

    return undefined;
  }, [allPages, templateId, stateLatestPage]);

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
                <div
                  className="w-full flex items-center justify-between gap-1 bg-zinc-100 dark:bg-[#111113] p-1.5 rounded-xl border border-zinc-200 dark:border-[#2b2b32] shadow-xs overflow-x-auto"
                  onMouseLeave={() => setHoveredTemplateTab(null)}
                >
                  {[
                    { id: "template1", label: "Template 1" },
                    { id: "template2", label: "Template 2" },
                    { id: "template3", label: "Template 3" },
                    { id: "template4", label: "Template 4" },
                    { id: "template5", label: "Template 5" },
                    { id: "template6", label: "Template 6" },
                    { id: "template7", label: "Template 7" },
                  ].map((t) => {
                    const isActive = templateId === t.id;
                    const isHovered = hoveredTemplateTab === t.id;

                    return (
                      <motion.button
                        key={t.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredTemplateTab(t.id)}
                        onClick={() => setTemplateId(t.id as any)}
                        className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap ${isActive
                          ? "text-white font-bold"
                          : "text-zinc-600 dark:text-[#9B9085] dark:hover:text-white"
                          }`}
                      >
                        {/* Active Solid Pill */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTemplateTab"
                            className="absolute inset-0 bg-[#0066B2] rounded-lg shadow-sm"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          />
                        )}
                        {/* Hover Morphing Pill */}
                        {!isActive && isHovered && (
                          <motion.div
                            layoutId="hoverTemplateTab"
                            className="absolute inset-0 bg-zinc-200/80 dark:bg-[#25252a] rounded-lg"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: isActive ? '#ffffff' : '#9CA3AF' }} />
                        <span className="relative z-10">{t.label}</span>
                      </motion.button>
                    );
                  })}
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

                        {/* TEMPLATE 2: Lead Capture Split Panel Layout */}
                        {templateId === "template2" && (
                          <div
                            className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${themeMode === "dark" ? "bg-[#111827] text-white border-zinc-800" : "bg-white text-zinc-900 border-zinc-200"
                              }`}
                            style={{
                              borderColor: `${brandColor}${Math.round((0.25 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`,
                              boxShadow: `0 16px 40px -10px ${brandColor}${Math.round((highlightIntensity / 100) * 0.25 * 255).toString(16).padStart(2, '0')}`
                            }}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
                              {/* Left Panel: Cover Image + Gradient Scrim + Bullets (~60%) */}
                              <div className="md:col-span-7 relative flex flex-col justify-end p-6 md:p-8 overflow-hidden min-h-[260px] md:min-h-full bg-zinc-900 text-white">
                                <img
                                  src={
                                    latestPage?.imageUrl && latestPage.imageUrl.trim() !== ""
                                      ? latestPage.imageUrl
                                      : "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
                                  }
                                  alt={latestPage?.name || "Lead capture image"}
                                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-[#0a0c16]/60 to-transparent pointer-events-none" />

                                <div className="relative z-10 space-y-3">
                                  <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
                                    {latestPage?.headline || latestPage?.name || "Build forms that convert"}
                                  </h3>
                                  <p className="text-xs md:text-sm font-semibold text-white/90">
                                    {latestPage?.subheadline || "The friendly form builder for growing teams"}
                                  </p>
                                  {latestPage?.pitch && (
                                    <p className="text-[11px] text-white/70 leading-relaxed">
                                      {latestPage.pitch}
                                    </p>
                                  )}

                                  {latestPage?.bullets && latestPage.bullets.length > 0 && (
                                    <ul className="space-y-2 pt-2 border-t border-white/10">
                                      {latestPage.bullets.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-[11px] text-white/90">
                                          <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={brandColor || "#a5b4fc"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>

                              {/* Right Panel: Form (~40%) */}
                              <div className={`md:col-span-5 p-6 md:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l ${themeMode === "dark" ? "border-zinc-800 bg-[#18181B]" : "border-zinc-200 bg-white"}`}>
                                <div className="space-y-3">
                                  <p className="w-full text-center text-lg font-bold text-zinc-900 dark:text-white">
                                    {latestPage?.formTitle || "Download for free"}
                                  </p>
                                  <p className="w-full text-center text-xs text-zinc-400">
                                    {latestPage?.formSubtitle || "Pop your email in and we'll send it straight over."}
                                  </p>

                                  <div className="space-y-2 pt-2">
                                    <input
                                      type="text"
                                      placeholder={latestPage?.namePlaceholder || "Name *"}
                                      readOnly
                                      className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                    />
                                    <input
                                      type="email"
                                      placeholder={latestPage?.emailPlaceholder || "Email *"}
                                      readOnly
                                      className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                    />

                                    {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                                      latestPage.customFormFields.map((field) => (
                                        <input
                                          key={field.id}
                                          type="text"
                                          placeholder={`${field.label}${field.required ? " *" : ""}`}
                                          readOnly
                                          className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                        />
                                      ))
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="w-full rounded-xl py-3 px-4 text-xs font-bold text-white shadow-md transition duration-200 hover:opacity-95 mt-2"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    {latestPage?.formButtonText || latestPage?.cta || "Send it to me"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TEMPLATE 3: Aurora Reveal — Portrait image left with aurora glow, rich editorial form panel right */}
                        {templateId === "template3" && (
                          <div
                            className="rounded-3xl overflow-hidden relative transition-all duration-300"
                            style={{
                              background: themeMode === "dark" ? "#0c0c12" : "#f7f8fc",
                              border: `1px solid ${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.2) * 255).toString(16).padStart(2, '0')}`,
                              boxShadow: `0 24px 70px -12px ${brandColor}${Math.round((0.22 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')}`,
                            }}
                          >
                            <div className="grid grid-cols-12 min-h-[440px]">

                              {/* ── LEFT: Aurora Image Tile (4 cols) ── */}
                              <div className="col-span-5 relative overflow-hidden">
                                {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                                  <img
                                    src={latestPage.imageUrl}
                                    alt={latestPage?.name || "Cover"}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#121215]">
                                    <div className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/80 text-white">
                                      <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" strokeWidth="2" />
                                      </svg>
                                      <span className="text-xs font-bold text-white">Add a cover image</span>
                                      <span className="text-[11px] text-zinc-400">PNG, JPG, WebP or GIF · 10 MB max</span>
                                    </div>
                                  </div>
                                )}
                                {/* Right fade into card */}
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={{ background: themeMode === "dark" ? "linear-gradient(to right, transparent 55%, #0c0c12 100%)" : "linear-gradient(to right, transparent 55%, #f7f8fc 100%)" }}
                                />
                                {/* Bottom fade */}
                                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
                              </div>

                              {/* ── RIGHT: Editorial Form Panel (7 cols) ── */}
                              <div
                                className="col-span-7 flex flex-col justify-center p-6 space-y-4"
                                style={{
                                  borderLeft: `1px solid ${themeMode === "dark" ? `${brandColor}22` : `${brandColor}15`}`,
                                }}
                              >
                                {/* Top eyebrow */}
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
                                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                                    {latestPage?.bulletsTitle || "Free Resource · Instant Access"}
                                  </span>
                                </div>

                                {/* Headline */}
                                <div className="space-y-1.5">
                                  <h3 className={`text-xl md:text-2xl font-black leading-tight tracking-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                                    {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates"}
                                  </h3>
                                  <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                    {latestPage?.subheadline || "Stop staring at a blank page. Start creating content that actually connects."}
                                  </p>
                                </div>

                                {/* Bullet list */}
                                {latestPage?.bullets && latestPage.bullets.length > 0 && (
                                  <div className="space-y-1.5">
                                    {latestPage.bullets.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <div
                                          className="h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
                                          style={{ background: `${brandColor}22`, border: `1px solid ${brandColor}44` }}
                                        >
                                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                                            <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </div>
                                        <span className={`text-[11px] font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Accent divider */}
                                <div className="flex items-center gap-2">
                                  <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}44, transparent)` }} />
                                  <span className={`text-[9px] font-bold uppercase tracking-widest ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Sign Up Free</span>
                                  <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}44, transparent)` }} />
                                </div>

                                {/* Form */}
                                <div className="space-y-2">
                                  {latestPage?.formTitle && (
                                    <p className={`w-full text-center text-xs font-bold ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                                      {latestPage.formTitle}
                                    </p>
                                  )}
                                  <input
                                    type="text"
                                    placeholder={latestPage?.namePlaceholder || "Name *"}
                                    readOnly
                                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                  />
                                  <input
                                    type="email"
                                    placeholder={latestPage?.emailPlaceholder || "Email *"}
                                    readOnly
                                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                  />

                                  {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                                    latestPage.customFormFields.map((field) => (
                                      <input
                                        key={field.id}
                                        type="text"
                                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                                        readOnly
                                        className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                      />
                                    ))
                                  )}

                                  <button
                                    type="button"
                                    className="w-full rounded-xl py-3 px-4 text-xs font-bold text-white shadow-md transition duration-200 hover:opacity-95 mt-2"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    {latestPage?.formButtonText || latestPage?.cta || "Get early access"}
                                  </button>

                                  <p className={`text-center text-[9px] ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>
                                    {latestPage?.formSubtitle || "🔒 No spam · Instant delivery · Unsubscribe anytime"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}



                        {/* TEMPLATE 4: Neon Orbit — Circular glowing image portal right, editorial copy left, glassmorphic form below */}
                        {templateId === "template4" && (
                          <div
                            className="rounded-3xl overflow-hidden transition-all duration-300 relative"
                            style={{
                              background: themeMode === "dark"
                                ? `radial-gradient(ellipse 80% 60% at 70% 30%, ${brandColor}14 0%, #08080f 55%, #0d0012 100%)`
                                : `radial-gradient(ellipse 80% 60% at 70% 30%, ${brandColor}0d 0%, #f4f5fb 55%, #f8f4ff 100%)`,
                              border: `1px solid ${themeMode === "dark" ? `${brandColor}22` : `${brandColor}18`}`,
                              boxShadow: `0 0 0 1px ${brandColor}12, 0 32px 80px -16px ${brandColor}${Math.round((0.22 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')}`,
                            }}
                          >
                            {/* ── TOP ROW: Copy left + Orbital image right ── */}
                            <div className="grid grid-cols-12 min-h-[360px] p-5 gap-4 items-center">

                              {/* LEFT: Editorial copy panel */}
                              <div className="col-span-6 flex flex-col justify-center space-y-4">

                                {/* Eyebrow with animated dot */}
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}` }}
                                  />
                                  <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                                    {latestPage?.bulletsTitle || "Free Resource · Limited Time"}
                                  </span>
                                </div>

                                {/* Big headline */}
                                <h3
                                  className={`text-xl md:text-2xl font-black leading-tight tracking-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}
                                >
                                  {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates"}
                                </h3>

                                {/* Subheadline */}
                                <p className={`text-[11px] leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                  {latestPage?.subheadline || "Field-tested frameworks. Proven content structures. Built for creators who move fast."}
                                </p>

                                {latestPage?.pitch && (
                                  <p className={`text-[11px] leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                    {latestPage.pitch}
                                  </p>
                                )}

                                {/* Bullets with neon check marks */}
                                {latestPage?.bullets && latestPage.bullets.length > 0 && (
                                  <div className="space-y-2">
                                    {latestPage.bullets.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2.5">
                                        <div
                                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md"
                                          style={{
                                            background: `${brandColor}18`,
                                            border: `1px solid ${brandColor}44`,
                                            boxShadow: highlightIntensity > 40 ? `0 0 8px ${brandColor}44` : "none",
                                          }}
                                        >
                                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                                            <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </div>
                                        <span className={`text-[11px] font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Divider with label */}
                                <div className="flex items-center gap-2 pt-1">
                                  <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}55, transparent)` }} />
                                  <span className={`text-[8px] font-bold uppercase tracking-widest ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Secure Sign Up</span>
                                  <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}55, transparent)` }} />
                                </div>

                                {/* Compact stacked form */}
                                <div className="space-y-2">
                                  {latestPage?.formTitle && (
                                    <p className={`w-full text-center text-xs font-bold ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                                      {latestPage.formTitle}
                                    </p>
                                  )}
                                  <input
                                    type="text"
                                    placeholder={latestPage?.namePlaceholder || "Name *"}
                                    readOnly
                                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                  />
                                  <input
                                    type="email"
                                    placeholder={latestPage?.emailPlaceholder || "Email *"}
                                    readOnly
                                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                  />

                                  {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                                    latestPage.customFormFields.map((field) => (
                                      <input
                                        key={field.id}
                                        type="text"
                                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                                        readOnly
                                        className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                      />
                                    ))
                                  )}

                                  <button
                                    type="button"
                                    className="w-full rounded-xl py-3 text-xs font-black text-white tracking-wide transition-all duration-200 relative overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                                      boxShadow: `0 6px 26px -4px ${brandColor}${Math.round((0.5 + (highlightIntensity / 100) * 0.45) * 255).toString(16).padStart(2, '0')}`,
                                    }}
                                  >
                                    <span className="relative z-10">{latestPage?.formButtonText || latestPage?.cta || "Unlock Free Access →"}</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                  </button>

                                  <p className={`text-center text-[9px] ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>
                                    {latestPage?.formSubtitle || "🔒 No spam · Instant delivery · Unsubscribe anytime"}
                                  </p>
                                </div>
                              </div>

                              {/* RIGHT: Orbital image portal */}
                              <div className="col-span-6 flex items-center justify-center relative" style={{ minHeight: "360px" }}>
                                {/* Ambient glow */}
                                <div
                                  className="absolute rounded-full pointer-events-none"
                                  style={{
                                    width: "380px", height: "380px",
                                    background: `radial-gradient(circle, ${brandColor}${Math.round((0.12 + (highlightIntensity / 100) * 0.2) * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                                    filter: "blur(28px)",
                                  }}
                                />
                                {/* Ring 1 — outermost dashed orbit */}
                                <div className="absolute rounded-full border border-dashed pointer-events-none" style={{ width: "340px", height: "340px", borderColor: `${brandColor}25` }} />
                                {/* Ring 2 */}
                                <div className="absolute rounded-full pointer-events-none" style={{ width: "295px", height: "295px", border: `1px solid ${brandColor}${Math.round((0.18 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 20px ${brandColor}${Math.round((0.1 + (highlightIntensity / 100) * 0.2) * 255).toString(16).padStart(2, '0')}` }} />
                                {/* Ring 3 — inner neon halo */}
                                <div className="absolute rounded-full pointer-events-none" style={{ width: "260px", height: "260px", border: `2px solid ${brandColor}${Math.round((0.35 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 32px ${brandColor}${Math.round((0.2 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')}, inset 0 0 16px ${brandColor}${Math.round((0.08 + (highlightIntensity / 100) * 0.15) * 255).toString(16).padStart(2, '0')}` }} />

                                {/* Image / Placeholder circle */}
                                <div
                                  className="relative rounded-full overflow-hidden z-10"
                                  style={{
                                    width: "230px", height: "230px",
                                    border: `3px solid ${brandColor}${Math.round((0.5 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`,
                                    boxShadow: `0 0 40px -8px ${brandColor}${Math.round((0.45 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`,
                                  }}
                                >
                                  {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                                    <img src={latestPage.imageUrl} alt={latestPage?.name || "Cover"} className="w-full h-full object-cover" />
                                  ) : (
                                    <div
                                      className="w-full h-full flex flex-col items-center justify-center gap-2"
                                      style={{ background: `linear-gradient(145deg, ${brandColor}${Math.round((0.5 + (highlightIntensity / 100) * 0.4) * 255).toString(16).padStart(2, '0')} 0%, #0a0018 100%)` }}
                                    >
                                      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 7px)" }} />
                                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="opacity-60 relative z-10">
                                        <rect x="2" y="2" width="26" height="26" rx="5" stroke="white" strokeWidth="1.2" strokeDasharray="3 2" />
                                        <path d="M2 21l7-6 5 4 4-3 10 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="9" cy="10" r="2.5" stroke="white" strokeWidth="1.2" />
                                      </svg>
                                      <span className="text-white text-[7px] font-bold uppercase tracking-[0.2em] opacity-50 relative z-10">Image</span>
                                    </div>
                                  )}
                                  <div className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 100%)" }} />
                                </div>


                                {/* Orbit dot at 3 o'clock */}
                                <div
                                  className="absolute z-20 h-3 w-3 rounded-full"
                                  style={{
                                    right: "calc(50% - 175px)", top: "50%", transform: "translateY(-50%)",
                                    backgroundColor: brandColor,
                                    boxShadow: `0 0 10px ${brandColor}, 0 0 20px ${brandColor}66`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* ── BOTTOM TRUST STRIP ── */}
                            <div className={`px-5 pb-4 pt-2 flex items-center justify-between border-t ${themeMode === "dark" ? "border-white/[0.05]" : "border-zinc-100"}`}>
                              <div className="flex items-center gap-2">
                                {logo ? (
                                  <img src={logo} alt="Logo" className="h-5 w-5 rounded object-contain" />
                                ) : (
                                  <div className="h-5 w-5 rounded flex items-center justify-center text-white text-[8px] font-black" style={{ backgroundColor: brandColor }}>
                                    {(businessName || "B").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className={`text-[10px] font-bold ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{businessName || "Brand"}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {["10K+ Downloads", "Verified Free", "Instant Access"].map((tag, i) => (
                                  <span key={i} className={`flex items-center gap-1 text-[9px] font-semibold ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: brandColor }} />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}




                        {/* TEMPLATE 5: Magazine Cover Overlay — full-bleed image hero, cinematic scrim, overlaid copy, floating glass sign-up tray */}
                        {templateId === "template5" && (
                          <div
                            className="rounded-3xl overflow-hidden relative transition-all duration-300"
                            style={{
                              border: `1px solid ${brandColor}${Math.round((0.14 + (highlightIntensity / 100) * 0.22) * 255).toString(16).padStart(2, '0')}`,
                              boxShadow: `0 24px 70px -12px ${brandColor}${Math.round((0.18 + (highlightIntensity / 100) * 0.28) * 255).toString(16).padStart(2, '0')}`,
                              background: themeMode === "dark" ? "#0d0d11" : "#f0f2f7",
                            }}
                          >
                            {/* ── COVER IMAGE BLOCK ── */}
                            <div className="relative w-full" style={{ paddingBottom: "45%" }}>
                              {/* Image or neutral placeholder */}
                              {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                                <img
                                  src={latestPage.imageUrl}
                                  alt={latestPage?.name || "Cover"}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#121215]">
                                  <div className="flex flex-col items-center gap-2 opacity-40">
                                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                      <rect x="3" y="3" width="30" height="30" rx="6" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" />
                                      <path d="M3 24l8-7 6 5 5-4 11 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <circle cx="11" cy="13" r="3" stroke="white" strokeWidth="1.5" />
                                    </svg>
                                    <span className="text-white text-[9px] font-semibold uppercase tracking-widest">Cover Image</span>
                                  </div>
                                </div>
                              )}

                              {/* Cinematic bottom-to-top scrim */}
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.05) 100%)"
                                }}
                              />
                              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to right, ${brandColor}33 0%, transparent 60%)` }} />

                              {/* ── TOP-LEFT BRAND BADGE ── */}
                              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                {logo ? (
                                  <img src={logo} alt="Logo" className="h-7 w-7 rounded-lg object-contain" />
                                ) : (
                                  <div
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
                                    style={{ backgroundColor: brandColor, boxShadow: `0 0 12px ${brandColor}88` }}
                                  >
                                    {(businessName || "B").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-white text-[11px] font-bold tracking-wide drop-shadow-lg">
                                  {businessName || "Brand"}
                                </span>
                              </div>

                              {/* ── OVERLAID HEADLINE (bottom of image) ── */}
                              <div className="absolute bottom-0 left-0 right-0 z-10 p-5 md:p-6 space-y-1">
                                <h3 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-xl">
                                  {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
                                </h3>
                                <p className="text-xs text-white/80 leading-relaxed font-medium drop-shadow">
                                  {latestPage?.subheadline || "Short subhead. say what they will get"}
                                </p>
                              </div>
                            </div>

                            {/* ── FLOATING SIGN-UP TRAY ── */}
                            <div
                              className="relative z-20 mx-4 md:mx-8 -mt-5 mb-6 rounded-2xl p-5 space-y-4"
                              style={{
                                background: themeMode === "dark"
                                  ? "rgba(12,12,18,0.92)"
                                  : "rgba(255,255,255,0.96)",
                                border: `1px solid ${themeMode === "dark" ? `${brandColor}30` : `${brandColor}20`}`,
                                backdropFilter: "blur(20px)",
                                boxShadow: `0 8px 40px rgba(0,0,0,0.18)`,
                              }}
                            >
                              {/* Pitch Text */}
                              {latestPage?.pitch && (
                                <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                                  {latestPage.pitch}
                                </p>
                              )}

                              {/* Bullets Section Header */}
                              <h4 className={`text-xs font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                {latestPage?.bulletsTitle || "What they will learn"}
                              </h4>

                              {/* Bullets List */}
                              {latestPage?.bullets && latestPage.bullets.length > 0 && (
                                <div className="space-y-2">
                                  {latestPage.bullets.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5">
                                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                      </div>
                                      <span className={`text-xs ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Form Inputs Section */}
                              <div className="space-y-2 pt-2 border-t border-zinc-200/20 dark:border-zinc-800/40">
                                <p className={`text-center text-xs font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                                  {latestPage?.formTitle || "Get your free copy now"}
                                </p>

                                <input
                                  type="text"
                                  placeholder={latestPage?.namePlaceholder || "Name *"}
                                  readOnly
                                  className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                />
                                <input
                                  type="email"
                                  placeholder={latestPage?.emailPlaceholder || "Email *"}
                                  readOnly
                                  className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                />

                                {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                                  latestPage.customFormFields.map((field) => (
                                    <div key={field.id}>
                                      <input
                                        type="text"
                                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                                        readOnly
                                        className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                      />
                                    </div>
                                  ))
                                )}

                                <button
                                  type="button"
                                  className="w-full rounded-xl py-3 text-xs font-black text-white cursor-pointer mt-1"
                                  style={{
                                    background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                                    boxShadow: `0 6px 24px -4px ${brandColor}88`,
                                  }}
                                >
                                  {latestPage?.formButtonText || latestPage?.cta || "Get Instant Access →"}
                                </button>
                              </div>
                            </div>

                            {/* ── BOTTOM FEATURE STRIP ── */}
                            <div
                              className={`mx-4 mb-4 mt-3 pt-3 border-t flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${themeMode === "dark" ? "border-white/[0.06]" : "border-zinc-200/80"}`}
                            >
                              {(latestPage?.bullets && latestPage.bullets.length > 0
                                ? latestPage.bullets.slice(0, 3)
                                : [
                                  "101 fill-in-the-blank templates",
                                  "Proven viral structures",
                                  "Works for any niche",
                                ]
                              ).map((item, idx) => (
                                <span
                                  key={idx}
                                  className={`flex items-center gap-1.5 text-[10px] font-semibold ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}
                                >
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5.25" stroke={brandColor} strokeWidth="1.25" />
                                    <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  {item}
                                </span>
                              ))}
                            </div>

                          </div>
                        )}

                        {/* TEMPLATE 6: Full Bleed Image Card Preview */}
                        {templateId === "template6" && (
                          <div
                            className="rounded-3xl overflow-hidden relative min-h-[420px] flex flex-col justify-between transition-all duration-300 shadow-2xl"
                            style={{
                              border: `1px solid ${themeMode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                              boxShadow: themeMode === "dark"
                                ? `0 0 0 1px ${brandColor}22, 0 28px 70px -14px rgba(0,0,0,0.8)`
                                : `0 0 0 1px ${brandColor}18, 0 20px 60px -12px ${brandColor}22`,
                            }}
                          >
                            {/* FULL CARD BACKGROUND IMAGE / GRADIENT */}
                            {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                              <img
                                src={latestPage.imageUrl}
                                alt={latestPage?.name || "Cover"}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="absolute inset-0 w-full h-full flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(145deg, ${brandColor}${Math.round((0.5 + (highlightIntensity / 100) * 0.4) * 255).toString(16).padStart(2, '0')} 0%, #080912 100%)`,
                                }}
                              >
                                <div className="relative flex flex-col items-center gap-2 opacity-50 text-white">
                                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect x="2" y="2" width="28" height="28" rx="5" stroke="white" strokeWidth="1.4" strokeDasharray="3 2.5" />
                                    <path d="M2 22l7-6 5 4 4-3 10 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="10" cy="11" r="2.5" stroke="white" strokeWidth="1.4" />
                                  </svg>
                                  <span className="text-white text-[8px] font-bold uppercase tracking-[0.2em]">Full Cover Image</span>
                                </div>
                              </div>
                            )}

                            {/* DARK SCRIM OVERLAY */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/75 to-black/45" />

                            {/* CARD CONTENT FLOATING OVER IMAGE */}
                            <div className="relative z-10 p-5 space-y-4 flex-1 flex flex-col justify-between">
                              <div className="space-y-3">
                                <h3 className="text-xl md:text-2xl font-black leading-tight tracking-tight text-white drop-shadow-md">
                                  {latestPage?.headline || latestPage?.name || "Your headline here"}
                                </h3>
                                <p className="text-xs font-medium text-zinc-200 drop-shadow-sm">
                                  {latestPage?.subheadline || "Short subhead. say what they will get"}
                                </p>
                                {latestPage?.pitch && (
                                  <p className="text-xs leading-relaxed text-zinc-300">
                                    {latestPage.pitch}
                                  </p>
                                )}

                                {/* Bullets Section */}
                                {((latestPage?.bullets && latestPage.bullets.length > 0) || latestPage?.bulletsTitle) && (
                                  <div className="space-y-1.5 pt-2">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="h-1.5 w-1.5 rounded-full animate-pulse"
                                        style={{ backgroundColor: brandColor, boxShadow: `0 0 6px ${brandColor}` }}
                                      />
                                      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-300">
                                        {latestPage?.bulletsTitle || "What they will learn"}
                                      </span>
                                    </div>
                                    {latestPage?.bullets && latestPage.bullets.length > 0 && (
                                      <div className="space-y-1.5">
                                        {latestPage.bullets.map((item: string, idx: number) => (
                                          <div key={idx} className="flex items-center gap-2">
                                            <span
                                              className="h-1.5 w-1.5 rounded-full shrink-0"
                                              style={{ backgroundColor: brandColor }}
                                            />
                                            <span className="text-xs font-semibold text-zinc-100">{item}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* SMART FORM GRID */}
                              <div className="pt-3 space-y-3">
                                {(!latestPage?.customFormFields || latestPage.customFormFields.length === 0) ? (
                                  /* Default single inline pill bar when Name & Email only */
                                  <div className="flex items-center rounded-2xl p-1.5 gap-2 bg-black/50 border border-white/15 backdrop-blur-xl">
                                    <div className="flex-1 flex items-center gap-2 px-3">
                                      <span className="text-xs text-zinc-400">👤</span>
                                      <span className="text-xs text-zinc-400">Name *</span>
                                    </div>
                                    <div className="w-px h-5 shrink-0 bg-white/20" />
                                    <div className="flex-1 flex items-center gap-2 px-3">
                                      <span className="text-xs text-zinc-400">✉️</span>
                                      <span className="text-xs text-zinc-400">Email *</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
                                      style={{
                                        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                                        boxShadow: `0 4px 16px -4px ${brandColor}88`,
                                      }}
                                    >
                                      {latestPage?.formButtonText || latestPage?.cta || "Get Instant Access →"}
                                    </button>
                                  </div>
                                ) : (
                                  /* Compact 2-Column Form Grid Card when Custom Fields are added */
                                  <div className="rounded-2xl p-4 bg-black/50 border border-white/15 backdrop-blur-xl space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                      <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                                        <span className="text-xs text-zinc-400">👤</span>
                                        <span className="text-xs text-zinc-400">Name *</span>
                                      </div>
                                      <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                                        <span className="text-xs text-zinc-400">✉️</span>
                                        <span className="text-xs text-zinc-400">Email *</span>
                                      </div>
                                      {latestPage.customFormFields.map((field: any) => (
                                        <div
                                          key={field.id}
                                          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10 ${field.type === "textarea" ? "col-span-1 md:col-span-2" : ""
                                            }`}
                                        >
                                          <span className="text-xs text-zinc-400 truncate">
                                            {field.label || field.placeholder}{field.required ? " *" : ""}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      className="w-full rounded-xl py-3 text-xs font-extrabold text-white cursor-pointer text-center"
                                      style={{
                                        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                                        boxShadow: `0 4px 16px -4px ${brandColor}88`,
                                      }}
                                    >
                                      {latestPage?.formButtonText || latestPage?.cta || "Get Instant Access →"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TEMPLATE 7: Spotlight Hero — Premium two-panel layout, image left with headline overlay, glassmorphic form panel right */}
                        {templateId === "template7" && (
                          <div
                            className="rounded-3xl overflow-hidden transition-all duration-300"
                            style={{
                              padding: "2px",
                              background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}55 50%, ${brandColor} 100%)`,
                              boxShadow: `0 30px 80px -16px ${brandColor}${Math.round((0.3 + (highlightIntensity / 100) * 0.4) * 255).toString(16).padStart(2, '0')}`,
                            }}
                          >
                            {/* Inner card */}
                            <div
                              className="rounded-[22px] overflow-hidden"
                              style={{
                                background: themeMode === "dark" ? "#0b0b10" : "#ffffff",
                                minHeight: "480px",
                              }}
                            >
                              <div className="flex flex-col md:flex-row" style={{ minHeight: "480px" }}>

                                {/* LEFT: Full-bleed image panel */}
                                <div className="relative md:w-[55%] h-52 md:h-auto overflow-hidden flex-shrink-0">
                                  {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                                    <img
                                      src={latestPage.imageUrl}
                                      alt={latestPage?.name || "Cover"}
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(155deg, ${brandColor}${Math.round((0.6 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')} 0%, #060610 55%, #12001a 100%)`,
                                      }}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                        {[160, 110, 66, 32].map((size, i) => (
                                          <div
                                            key={i}
                                            className="absolute rounded-full border border-white"
                                            style={{ width: size, height: size, opacity: 1 - i * 0.2 }}
                                          />
                                        ))}
                                      </div>
                                      <div
                                        className="absolute inset-0 opacity-[0.05]"
                                        style={{ backgroundImage: "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 8px)" }}
                                      />
                                    </div>
                                  )}
                                  {/* Right-edge scrim */}
                                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)" }} />
                                  {/* Bottom scrim */}
                                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />
                                  {/* Headline overlay at bottom-left */}
                                  <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
                                    <div className="space-y-1.5 max-w-xs">
                                      <h3 className="text-2xl md:text-3xl font-black text-white leading-[1.0] tracking-tight drop-shadow-2xl">
                                        {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates"}
                                      </h3>
                                      <p className="text-[11px] text-white/70 leading-relaxed font-medium drop-shadow-sm">
                                        {latestPage?.subheadline || "Content that connects, converts, and compounds."}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* RIGHT: Glassmorphic form panel */}
                                <div
                                  className="relative md:w-[45%] flex flex-col justify-center p-5 md:p-6 space-y-3"
                                  style={{
                                    borderLeft: `1px solid ${themeMode === "dark" ? `${brandColor}30` : `${brandColor}20`}`,
                                  }}
                                >
                                  {/* Eyebrow + title + subtitle */}
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: brandColor }}>
                                      {latestPage?.bulletsTitle || "Exclusive · Free Access"}
                                    </p>
                                    <h4 className={`text-sm font-black leading-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                                      {latestPage?.formTitle || "Claim Your Free Copy"}
                                    </h4>
                                    <p className={`text-[10px] leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                                      {latestPage?.formSubtitle || "Instant delivery. No card needed."}
                                    </p>
                                  </div>

                                  {/* Bullets */}
                                  {latestPage?.bullets && latestPage.bullets.length > 0 && (
                                    <div className="space-y-1.5">
                                      {latestPage.bullets.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                          <div
                                            className="flex h-3.5 w-3.5 shrink-0 mt-0.5 items-center justify-center rounded-full"
                                            style={{ backgroundColor: `${brandColor}22`, border: `1px solid ${brandColor}55` }}
                                          >
                                            <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                                              <path d="M1 3l1.5 1.5L5 1.5" stroke={brandColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                          </div>
                                          <span className={`text-[10px] leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                                            {item}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Divider */}
                                  <div className="flex items-center gap-2">
                                    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}44, transparent)` }} />
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${themeMode === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Sign Up Free</span>
                                    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}44, transparent)` }} />
                                  </div>

                                  {/* Form fields */}
                                  <div className="space-y-2">
                                    {/* Name */}
                                    <div
                                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                      style={{
                                        background: themeMode === "dark" ? "rgba(255,255,255,0.05)" : "#f4f5f8",
                                        border: `1px solid ${themeMode === "dark" ? `${brandColor}22` : `${brandColor}20`}`,
                                      }}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                                        <circle cx="6" cy="4" r="2.5" stroke={brandColor} strokeWidth="1.4" />
                                        <path d="M1.5 10.5C1.5 8.567 3.567 7 6 7s4.5 1.567 4.5 3.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" />
                                      </svg>
                                      <input
                                        type="text"
                                        placeholder={latestPage?.namePlaceholder || "Full name"}
                                        readOnly
                                        className={`w-full bg-transparent text-[11px] outline-none pointer-events-none select-none ${themeMode === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
                                      />
                                    </div>
                                    {/* Email */}
                                    <div
                                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                      style={{
                                        background: themeMode === "dark" ? "rgba(255,255,255,0.05)" : "#f4f5f8",
                                        border: `1px solid ${themeMode === "dark" ? `${brandColor}22` : `${brandColor}20`}`,
                                      }}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                                        <rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke={brandColor} strokeWidth="1.4" />
                                        <path d="M1 4l5 3.5L11 4" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" />
                                      </svg>
                                      <input
                                        type="email"
                                        placeholder={latestPage?.emailPlaceholder || "Email address"}
                                        readOnly
                                        className={`w-full bg-transparent text-[11px] outline-none pointer-events-none select-none ${themeMode === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
                                      />
                                    </div>
                                    {/* Custom fields */}
                                    {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                                      latestPage.customFormFields.map((field) => (
                                        <div
                                          key={field.id}
                                          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                          style={{
                                            background: themeMode === "dark" ? "rgba(255,255,255,0.05)" : "#f4f5f8",
                                            border: `1px solid ${themeMode === "dark" ? `${brandColor}22` : `${brandColor}20`}`,
                                          }}
                                        >
                                          {field.type === "select" ? (
                                            <select disabled className={`w-full bg-transparent text-[11px] outline-none appearance-none ${themeMode === "dark" ? "text-white" : "text-zinc-800"}`}>
                                              <option>{field.placeholder || field.label}</option>
                                              {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
                                            </select>
                                          ) : field.type === "textarea" ? (
                                            <textarea
                                              placeholder={field.placeholder || field.label}
                                              rows={2}
                                              readOnly
                                              className={`w-full bg-transparent text-[11px] outline-none resize-none ${themeMode === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
                                            />
                                          ) : (
                                            <input
                                              type={field.type === "number" ? "number" : "text"}
                                              placeholder={field.placeholder || field.label}
                                              readOnly
                                              className={`w-full bg-transparent text-[11px] outline-none pointer-events-none ${themeMode === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
                                            />
                                          )}
                                        </div>
                                      ))
                                    )}
                                    {/* CTA button */}
                                    <button
                                      type="button"
                                      className="w-full rounded-xl py-3 text-xs font-black text-white relative overflow-hidden transition-all duration-200"
                                      style={{
                                        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}bb 100%)`,
                                        boxShadow: `0 0 24px -4px ${brandColor}${Math.round((0.55 + (highlightIntensity / 100) * 0.45) * 255).toString(16).padStart(2, '0')}, 0 4px 12px rgba(0,0,0,0.2)`,
                                      }}
                                    >
                                      <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide">
                                        <span>{latestPage?.formButtonText || latestPage?.cta || "Unlock Free Access"}</span>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                          <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      </span>
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] pointer-events-none" />
                                    </button>
                                  </div>

                                  {/* Social proof avatar strip */}
                                  <div className="flex items-center gap-2 pt-1">
                                    <div className="flex -space-x-2">
                                      {["#e879f9", "#38bdf8", "#4ade80", "#fb923c"].map((color, i) => (
                                        <div
                                          key={i}
                                          className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-[7px] font-black text-white"
                                          style={{
                                            backgroundColor: i === 0 ? brandColor : color,
                                            borderColor: themeMode === "dark" ? "#0b0b10" : "#ffffff",
                                          }}
                                        >
                                          {["A", "B", "C", "D"][i]}
                                        </div>
                                      ))}
                                    </div>
                                    <p className={`text-[9px] font-semibold ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                                      Join <span style={{ color: brandColor }} className="font-black">12,000+</span> creators already inside
                                    </p>
                                  </div>
                                </div>
                              </div>
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overscroll-contain"
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
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
              className="relative w-full max-w-3xl rounded-2xl bg-[#141517] text-white border border-zinc-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh] z-10 overscroll-contain"
              data-lenis-prevent
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
