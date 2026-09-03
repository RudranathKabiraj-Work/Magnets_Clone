"use client";

import { useState, useRef } from "react";
import { X, Download, Copy, Check, Sparkles, Image as ImageIcon, Share2, Layers } from "lucide-react";
import Button from "@/components/ui/button";
import { type MagnetPage, type Account } from "@/lib/data";

interface SocialCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: MagnetPage;
  account: Account | null;
}

export default function SocialCardModal({ isOpen, onClose, page, account }: SocialCardModalProps) {
  const [theme, setTheme] = useState<"gradient" | "sunset" | "emerald" | "neon" | "dark" | "minimal" | "custom">("gradient");
  const [colorStart, setColorStart] = useState("#FE6F34");
  const [colorEnd, setColorEnd] = useState("#7C3AED");
  const [format, setFormat] = useState<"linkedin" | "twitter" | "story" | "facebook">("linkedin");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const creatorName = account?.name || "Creator";
  const username = account?.username || "alexrivera";

  // Clean origin URL or local development fallback URL
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const displayUrl = `${origin}/${username}/${page.slug}`;

  // Robust Canvas PNG Exporter using HTML Canvas API
  function handleDownload() {
    const isLandscape = format === "twitter" || format === "facebook";
    const width = format === "story" ? 1080 : 1200;
    const height = format === "story" ? 1920 : format === "linkedin" ? 1200 : 675;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background Styling
    if (theme === "dark") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "minimal") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 12;
      ctx.strokeRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (theme === "gradient") {
        grad.addColorStop(0, "#FE6F34");
        grad.addColorStop(0.5, "#7C3AED");
        grad.addColorStop(1, "#4F46E5");
      } else if (theme === "sunset") {
        grad.addColorStop(0, "#F43F5E");
        grad.addColorStop(1, "#F59E0B");
      } else if (theme === "emerald") {
        grad.addColorStop(0, "#0D9488");
        grad.addColorStop(1, "#059669");
      } else if (theme === "neon") {
        grad.addColorStop(0, "#4338CA");
        grad.addColorStop(1, "#DB2777");
      } else if (theme === "custom") {
        grad.addColorStop(0, colorStart);
        grad.addColorStop(1, colorEnd);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    const paddingX = format === "story" ? 90 : 80;
    const maxTextWidth = width - (paddingX * 2);

    // Text & Content Styling
    ctx.fillStyle = theme === "minimal" ? "#0F172A" : "#FFFFFF";

    // Badge
    const badgeY = format === "story" ? 180 : isLandscape ? 70 : 120;
    const badgeFontSize = isLandscape ? 20 : 26;
    ctx.font = `bold ${badgeFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillText("🎁 FREE RESOURCE", paddingX, badgeY);

    // Headline (Multi-line wrapper)
    const fontSize = format === "story" ? 64 : format === "linkedin" ? 50 : 34;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    const words = (page.headline || page.name).split(" ");
    let line = "";
    let y = badgeY + fontSize + (isLandscape ? 14 : 20);

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && i > 0) {
        ctx.fillText(line, paddingX, y);
        line = words[i] + " ";
        y += fontSize * 1.25;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, paddingX, y);

    // Subheadline (Multi-line wrapper)
    if (page.subheadline) {
      y += isLandscape ? 22 : 35;
      const subFontSize = format === "story" ? 32 : isLandscape ? 20 : 28;
      ctx.font = `${subFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = theme === "minimal" ? "#475569" : "rgba(255, 255, 255, 0.9)";
      const subWords = page.subheadline.split(" ");
      let subLine = "";
      for (let i = 0; i < subWords.length; i++) {
        const testLine = subLine + subWords[i] + " ";
        if (ctx.measureText(testLine).width > maxTextWidth && i > 0) {
          ctx.fillText(subLine, paddingX, y);
          subLine = subWords[i] + " ";
          y += subFontSize * 1.3;
        } else {
          subLine = testLine;
        }
      }
      ctx.fillText(subLine, paddingX, y);
    }

    // 🎨 Visual Mockup Box with Dynamic Height & Multi-line Bullet Wrapping
    const bulletItems = page.bullets && page.bullets.length > 0
      ? page.bullets.slice(0, 3)
      : [
        "100% actionable framework built specifically for your niche",
        "Includes pre-built copy-paste templates and workflow checklists",
        "Zero fluff: designed to give you implementation results instantly"
      ];

    const bulletFontSize = format === "story" ? 28 : isLandscape ? 18 : 24;
    ctx.font = `bold ${bulletFontSize}px system-ui, -apple-system, sans-serif`;
    const bulletLineHeight = bulletFontSize * 1.35;
    const bulletTextWidth = maxTextWidth - 80;
    const bulletItemGap = isLandscape ? 10 : 20;
    const boxPaddingTopBottom = isLandscape ? 24 : 40;

    // First calculate total height required for wrapped bullets
    let calculatedBulletsHeight = boxPaddingTopBottom;
    bulletItems.forEach((bText) => {
      const bWords = bText.split(" ");
      let bLine = "";
      let linesCount = 1;
      for (let i = 0; i < bWords.length; i++) {
        const testLine = bLine + bWords[i] + " ";
        if (ctx.measureText(testLine).width > bulletTextWidth && i > 0) {
          linesCount++;
          bLine = bWords[i] + " ";
        } else {
          bLine = testLine;
        }
      }
      calculatedBulletsHeight += (linesCount * bulletLineHeight) + bulletItemGap;
    });

    const cardBoxY = y + (isLandscape ? 20 : 45);
    const cardBoxHeight = calculatedBulletsHeight;

    // Draw Translucent Content Box
    ctx.fillStyle = theme === "minimal" ? "rgba(15, 23, 42, 0.04)" : "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(paddingX, cardBoxY, maxTextWidth, cardBoxHeight, isLandscape ? 16 : 24);
    ctx.fill();

    ctx.strokeStyle = theme === "minimal" ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render Wrapped Bullet Lines inside Box
    let bulletY = cardBoxY + (isLandscape ? 26 : 45);
    const checkX = paddingX + (isLandscape ? 20 : 30);
    const textX = checkX + (isLandscape ? 32 : 45);

    bulletItems.forEach((bText) => {
      ctx.fillStyle = "#34D399"; // emerald checkmark
      ctx.font = `bold ${bulletFontSize + 2}px system-ui, -apple-system, sans-serif`;
      ctx.fillText("✓", checkX, bulletY);

      ctx.fillStyle = theme === "minimal" ? "#0F172A" : "#FFFFFF";
      ctx.font = `bold ${bulletFontSize}px system-ui, -apple-system, sans-serif`;

      const bWords = bText.split(" ");
      let bLine = "";
      let lineY = bulletY;

      for (let i = 0; i < bWords.length; i++) {
        const testLine = bLine + bWords[i] + " ";
        if (ctx.measureText(testLine).width > bulletTextWidth && i > 0) {
          ctx.fillText(bLine, textX, lineY);
          bLine = bWords[i] + " ";
          lineY += bulletLineHeight;
        } else {
          bLine = testLine;
        }
      }
      ctx.fillText(bLine, textX, lineY);
      bulletY = lineY + bulletLineHeight + (isLandscape ? 10 : 16);
    });

    // Footer divider line
    const footerY = height - (isLandscape ? 110 : 170);
    ctx.strokeStyle = theme === "minimal" ? "#E2E8F0" : "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingX, footerY);
    ctx.lineTo(width - paddingX, footerY);
    ctx.stroke();

    // Author & Username
    ctx.fillStyle = theme === "minimal" ? "#0F172A" : "#FFFFFF";
    ctx.font = `bold ${isLandscape ? 24 : 32}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`By ${creatorName}`, paddingX, height - (isLandscape ? 60 : 100));

    ctx.font = `${isLandscape ? 18 : 24}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = theme === "minimal" ? "#64748B" : "rgba(255, 255, 255, 0.75)";
    ctx.fillText(`@${username}`, paddingX, height - (isLandscape ? 32 : 65));

    // URL Pill Background Box
    const urlText = displayUrl.replace(/^https?:\/\//, "");
    const pillFontSize = isLandscape ? 20 : 26;
    ctx.font = `bold ${pillFontSize}px system-ui, -apple-system, sans-serif`;
    const textWidth = ctx.measureText(urlText).width;
    const pillWidth = textWidth + (isLandscape ? 32 : 44);
    const pillHeight = isLandscape ? 44 : 56;
    const pillX = width - pillWidth - paddingX;
    const pillY = height - (isLandscape ? 74 : 110);

    // Draw White Pill for URL
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, isLandscape ? 12 : 16);
    ctx.fill();

    // Draw URL Text inside Pill
    ctx.fillStyle = "#FE6F34";
    ctx.fillText(urlText, pillX + (isLandscape ? 16 : 22), pillY + (isLandscape ? 29 : 37));

    // Trigger PNG Download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${page.slug || "lead-magnet"}-social-card.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleCopyPromoText() {
    const text = `🚀 I just launched "${page.name}"!\n\n${page.headline}\n\n👉 Download your free copy here: ${displayUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl dark:border-ink-700 dark:bg-ink-900 sm:p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-orange border border-brand-orange/20 shadow-xs dark:bg-ink-800">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-ink-950 dark:text-white flex items-center gap-2">
              Social Card & Promotion Studio
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Export high-converting social media preview images for LinkedIn, X & Instagram.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-3 border-b border-ink-100 pb-2.5 dark:border-ink-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] font-semibold text-ink-500 mr-0.5">Theme:</span>
              {[
                { id: "gradient", label: "Vibrant Glow" },
                { id: "sunset", label: "Sunset Fire" },
                { id: "emerald", label: "Emerald Cyber" },
                { id: "neon", label: "Midnight" },
                { id: "dark", label: "Dark Tech" },
                { id: "minimal", label: "Clean White" },
                { id: "custom", label: "Custom 🎨" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${theme === t.id
                    ? "bg-brand-orange text-white shadow-sm"
                    : "bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-ink-500 mr-0.5">Preset:</span>
              {[
                {
                  id: "linkedin",
                  title: "LinkedIn Post (1:1)",
                  icon: (
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  )
                },
                {
                  id: "twitter",
                  title: "X / Twitter Banner (16:9)",
                  icon: (
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )
                },
                {
                  id: "story",
                  title: "Instagram Story (9:16)",
                  icon: (
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  )
                },
                {
                  id: "facebook",
                  title: "Facebook Feed (16:9)",
                  icon: (
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )
                },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  title={f.title}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${format === f.id
                    ? "bg-brand-orange text-white shadow-md scale-105"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 hover:text-ink-950 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                    }`}
                >
                  {f.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Custom Gradient Color Picker Inputs */}
          {theme === "custom" && (
            <div className="flex items-center gap-4 bg-ink-100/70 dark:bg-ink-800/60 py-1.5 px-2.5 rounded-xl border border-ink-200 dark:border-ink-700 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">Start Color:</label>
                <input
                  type="color"
                  value={colorStart}
                  onChange={(e) => setColorStart(e.target.value)}
                  className="h-5 w-7 cursor-pointer rounded border border-ink-300 dark:border-ink-600 bg-transparent p-0"
                />
                <span className="text-[11px] font-mono text-ink-500 uppercase">{colorStart}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">End Color:</label>
                <input
                  type="color"
                  value={colorEnd}
                  onChange={(e) => setColorEnd(e.target.value)}
                  className="h-5 w-7 cursor-pointer rounded border border-ink-300 dark:border-ink-600 bg-transparent p-0"
                />
                <span className="text-[11px] font-mono text-ink-500 uppercase">{colorEnd}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Visual Card Preview Container */}
        <div className={`mt-2.5 flex w-full items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-ink-950 p-2.5 dark:border-ink-800 transition-all duration-200 ${theme === "custom" ? "h-[360px]" : "h-[400px]"
          }`}>
          <div
            className={`transition-all duration-300 flex items-center justify-center ${format === "story"
              ? theme === "custom" ? "scale-[0.59]" : "scale-[0.66]"
              : format === "linkedin"
                ? theme === "custom" ? "scale-[0.82]" : "scale-[0.88]"
                : theme === "custom" ? "scale-[0.92]" : "scale-[1]"
              }`}
          >
            <div
              ref={cardRef}
              style={
                theme === "custom"
                  ? { background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`, color: "#ffffff" }
                  : theme === "sunset"
                    ? { background: "linear-gradient(135deg, #F43F5E, #F59E0B)", color: "#ffffff" }
                    : theme === "emerald"
                      ? { background: "linear-gradient(135deg, #0D9488, #059669)", color: "#ffffff" }
                      : theme === "neon"
                        ? { background: "linear-gradient(135deg, #4338CA, #DB2777)", color: "#ffffff" }
                        : undefined
              }
              className={`flex flex-col justify-between rounded-3xl p-6 shadow-2xl transition-all duration-300 ${format === "twitter" || format === "facebook"
                ? "w-[480px] aspect-[16/9]"
                : format === "story"
                  ? "w-[310px] aspect-[9/16]"
                  : "w-[360px] aspect-square"
                } ${theme === "dark"
                  ? "bg-slate-900 text-white border border-slate-800"
                  : theme === "gradient"
                    ? "bg-gradient-to-br from-brand-orange via-purple-600 to-indigo-700 text-white"
                    : theme === "minimal"
                      ? "bg-white text-ink-950 border border-ink-200 shadow-lg"
                      : ""
                }`}
            >
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme === "minimal"
                    ? "bg-brand-soft text-brand-orange"
                    : "bg-white/20 text-white backdrop-blur-md"
                    }`}
                >
                  <Sparkles className="h-3.5 w-3.5" /> FREE DOWNLOAD
                </span>

                <h4 className="mt-3 text-base sm:text-lg font-extrabold leading-snug">
                  {page.headline}
                </h4>
                <p className="mt-1.5 text-xs sm:text-sm leading-snug opacity-90">
                  {page.subheadline}
                </p>

                {/* Visual Mockup Box inside UI preview */}
                <div className="mt-3 rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                  <div className="space-y-2 text-xs font-semibold">
                    {(page.bullets && page.bullets.length > 0 ? page.bullets.slice(0, 2) : [
                      "100% actionable framework for your niche",
                      "Pre-built templates and checklists"
                    ]).map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-tight">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-current/20 pt-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate">By {creatorName}</p>
                  <p className="text-xs opacity-75 truncate">@{username}</p>
                </div>
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-brand-orange shadow-md shrink-0">
                  {displayUrl.replace(/^https?:\/\//, "")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Action Bar */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyPromoText}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-950 dark:text-ink-400 dark:hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Promo post copied!" : "Copy promotional post text"}
          </button>

          <div className="flex items-center gap-3">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4" /> Download Card PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
