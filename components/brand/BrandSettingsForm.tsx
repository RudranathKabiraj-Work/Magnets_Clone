"use client";

import React, { memo } from "react";
import { Palette, Check, Upload, Sun, Moon, Trash2, Loader2 } from "lucide-react";

interface BrandSettingsFormProps {
  businessName: string;
  setBusinessName: (val: string) => void;
  logo: string | null;
  uploadingLogo: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeLogo: () => void;
  brandColor: string;
  setBrandColor: (val: string) => void;
  presetColors: { name: string; hex: string }[];
  themeMode: "light" | "dark";
  setThemeMode: (val: "light" | "dark") => void;
  highlightIntensity: number;
  setHighlightIntensity: (val: number) => void;
  hasUnsavedChanges: boolean;
  saving: boolean;
  handleSave: () => void;
}

const BrandSettingsForm = memo(function BrandSettingsForm({
  businessName,
  setBusinessName,
  logo,
  uploadingLogo,
  fileInputRef,
  handleLogoUpload,
  removeLogo,
  brandColor,
  setBrandColor,
  presetColors,
  themeMode,
  setThemeMode,
  highlightIntensity,
  setHighlightIntensity,
  hasUnsavedChanges,
  saving,
  handleSave,
}: BrandSettingsFormProps) {
  return (
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
              ref={fileInputRef as any}
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
            {presetColors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setBrandColor(c.hex)}
                title={c.name}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                  brandColor.toLowerCase() === c.hex.toLowerCase()
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
              className={`flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition ${
                themeMode === "light"
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
              className={`flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition ${
                themeMode === "dark"
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
              backgroundImage: `linear-gradient(to right, ${brandColor} 0%, ${brandColor} ${highlightIntensity}%, #2e2e38 ${highlightIntensity}%, #2e2e38 100%)`,
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
  );
});

export default BrandSettingsForm;
