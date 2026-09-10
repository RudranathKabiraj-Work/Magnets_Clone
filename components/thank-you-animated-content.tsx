"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Share2,
  ArrowRight,
  ExternalLink,
  Mail,
  ShieldCheck,
  FileText,
  Zap,
  Lock,
  X,
  Clock,
} from "lucide-react";

interface ThankYouAnimatedContentProps {
  subscriberName: string;
  subscriberEmail: string;
  deliverableName: string;
  downloadUrl?: string | null;
  customAnswer?: string | null;
  aiPersonalizedOutput?: string | null;
  brandColor: string;
  themeMode: "light" | "dark";
  logoUrl?: string | null;
  businessName: string;
  pageName: string;
  magnetSlug: string;
  username: string;
  calendarUrl?: string | null;
}

// Confetti Particle Generator Component
function ConfettiCanvas({ brandColor }: { brandColor: string }) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string; vx: number; vy: number; rotation: number }>
  >([]);

  useEffect(() => {
    const colors = [brandColor, "#38BDF8", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"];
    const count = 30;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 350,
      y: (Math.random() - 0.5) * 150 - 50,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * -6 - 3,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);
  }, [brandColor]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            x: p.x * 2.2,
            y: [p.vy * 8, p.vy * 16 + 250],
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.4],
            rotate: p.rotation + 720,
          }}
          transition={{
            duration: 2.5,
            ease: [0.25, 0.1, 0.25, 1],
            delay: Math.random() * 0.25,
          }}
          className="absolute rounded-sm shadow-sm"
          style={{
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1.4 : 1),
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

export default function ThankYouAnimatedContent({
  subscriberName,
  subscriberEmail,
  deliverableName,
  downloadUrl,
  customAnswer,
  aiPersonalizedOutput,
  brandColor = "#0066B2",
  themeMode = "light",
  logoUrl,
  businessName,
  pageName,
  magnetSlug,
  username,
  calendarUrl,
}: ThankYouAnimatedContentProps) {
  const [copiedAi, setCopiedAi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [selectedDate, setSelectedDate] = useState("Tomorrow");

  const isDark = themeMode === "dark";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${username}/${magnetSlug}`
      : `/${username}/${magnetSlug}`;

  const handleCopyAiOutput = () => {
    if (!aiPersonalizedOutput) return;
    try {
      navigator.clipboard.writeText(aiPersonalizedOutput);
    } catch (_) {
      const el = document.createElement("textarea");
      el.value = aiPersonalizedOutput;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2500);
  };

  const handleCopyShareLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch (_) {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    const targetUrl = downloadUrl || `/r/${magnetSlug}`;

    try {
      if (targetUrl.startsWith("http")) {
        const res = await fetch(targetUrl);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        const filename = deliverableName ? `${deliverableName.replace(/[^a-z0-9]/gi, "_")}` : "resource-file";
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        window.location.href = targetUrl;
      }
    } catch (_) {
      window.open(targetUrl, "_blank");
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  const handleStrategyButtonClick = (e: React.MouseEvent) => {
    if (calendarUrl && calendarUrl.startsWith("http")) {
      window.open(calendarUrl, "_blank");
    } else {
      e.preventDefault();
      setShowBookingModal(true);
    }
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      setShowBookingModal(false);
      setBookingConfirmed(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 py-3 px-4 sm:px-6 relative">
      {/* Confetti Explosion Component */}
      <ConfettiCanvas brandColor={brandColor} />

      {/* Floating Animated Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[300px] pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.55, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full rounded-full blur-[110px]"
          style={{
            background: `radial-gradient(circle, ${brandColor}55 0%, rgba(56, 189, 248, 0.2) 50%, transparent 80%)`,
          }}
        />
      </div>

      {/* Top Hero Checkmark Badge */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: -15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.05 }}
        className="flex flex-col items-center text-center space-y-3 relative z-10"
      >
        <div className="relative flex items-center justify-center">
          {/* Multi-layered Pulsing Rings */}
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-20 w-20 rounded-full blur-xl"
            style={{ backgroundColor: brandColor }}
          />

          <div
            className={`relative flex h-16 w-16 p-3.5 items-center justify-center rounded-2xl shadow-2xl border backdrop-blur-xl ${
              isDark ? "bg-[#141417]/90 border-white/10" : "bg-white/90 border-zinc-200"
            }`}
            style={{
              boxShadow: `0 16px 36px -8px ${brandColor}45`,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            >
              <CheckCircle2 className="h-9 w-9" style={{ color: brandColor }} />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-1.5 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-extrabold tracking-wide uppercase shadow-sm border backdrop-blur-md bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Access Confirmed & Delivered
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            You're All Set{subscriberName ? `, ${subscriberName}` : ""}! 🎉
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
            We've dispatched your copy of{" "}
            <span className="font-extrabold text-zinc-900 dark:text-white underline decoration-brand-blue" style={{ textDecorationColor: brandColor }}>
              "{pageName}"
            </span>{" "}
            to <span className="font-bold underline" style={{ textDecorationColor: brandColor }}>{subscriberEmail || "your inbox"}</span>.
          </p>
        </motion.div>

        {/* Live Delivery Status Timeline Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className={`w-full max-w-xl rounded-xl border py-2 px-4 flex items-center justify-between text-xs backdrop-blur-md ${
            isDark ? "bg-[#18181C]/70 border-white/5 text-zinc-400" : "bg-white/80 border-zinc-200 text-zinc-600 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
              ✓
            </div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[10px]">1. Signed Up</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-gradient-to-r from-emerald-500 to-emerald-500" />

          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
              ✓
            </div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[10px]">2. Asset Generated</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-gradient-to-r from-emerald-500 to-sky-500" />

          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[9px]">
              ⚡
            </div>
            <span className="font-bold text-sky-400 text-[10px]">3. Instant Download</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Cards Container */}
      <div className="max-w-2xl mx-auto space-y-5 relative z-10">
        {/* Compact Premium Download Box */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={`rounded-2xl border p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300 ${
            isDark
              ? "bg-[#0c0c0f]/45 border-white/15 text-white"
              : "bg-white/45 border-white/70 text-zinc-900 shadow-lg"
          }`}
          style={{
            boxShadow: isDark
              ? `0 20px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px ${brandColor}20`
              : `0 15px 30px -10px ${brandColor}25, inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)`,
          }}
        >
          {/* Shimmer top gradient accent */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${brandColor}, #38BDF8, ${brandColor})`,
            }}
          />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-sky-400">
                <Zap className="h-3.5 w-3.5 fill-sky-400" /> Direct High-Speed Download
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 shrink-0" style={{ color: brandColor }} />
                {deliverableName || "Instant Digital Package"}
              </h2>
              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Your file is verified, encrypted, and ready for instant save.
              </p>
            </div>

            <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready
            </span>
          </div>

          {/* Shimmer CTA Download Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadClick}
            disabled={downloading}
            className="w-full relative group overflow-hidden rounded-xl py-3.5 px-5 font-black text-sm text-white shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 border border-white/20"
            style={{
              backgroundColor: brandColor,
              boxShadow: `0 8px 20px -4px ${brandColor}70`,
            }}
          >
            {/* Button Light Shimmer Effect */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />

            <Download className={`h-4.5 w-4.5 ${downloading ? "animate-bounce" : "group-hover:translate-y-0.5 transition-transform"}`} />
            <span className="tracking-wide text-sm">
              {downloading ? "Preparing Download..." : `Download "${deliverableName}" Now`}
            </span>
          </motion.button>

          <div className="mt-3.5 flex items-center justify-between text-xs font-medium text-zinc-400 pt-2.5 border-t border-zinc-100 dark:border-white/10">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" /> 100% Virus-Free & Direct Link
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Lock className="h-3.5 w-3.5" /> SSL Secured
            </span>
          </div>
        </motion.div>

        {/* AI Personalized Output Card (If Prompt Output Exists) */}
        {aiPersonalizedOutput && (
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`rounded-2xl border p-5 shadow-xl space-y-3.5 backdrop-blur-2xl ${
              isDark
                ? "bg-[#0c0c0f]/45 border-amber-500/30 text-white"
                : "bg-gradient-to-br from-amber-500/10 via-white/50 to-white/40 border-amber-500/30 text-zinc-900"
            }`}
            style={{
              boxShadow: isDark
                ? `0 20px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)`
                : `0 15px 30px -10px rgba(0,0,0,0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)`,
            }}
          >
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center shadow-md">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-1">
                    Custom AI-Generated Result
                  </h3>
                  {customAnswer && (
                    <p className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                      Customized for: "{customAnswer}"
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyAiOutput}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-sm transition cursor-pointer"
              >
                {copiedAi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedAi ? "Copied!" : "Copy"}
              </motion.button>
            </div>

            <div
              className={`p-3.5 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border shadow-inner ${
                isDark ? "bg-[#0A0A0C]/70 text-zinc-200 border-white/5" : "bg-zinc-50/70 text-zinc-800 border-zinc-200"
              }`}
            >
              {aiPersonalizedOutput}
            </div>
          </motion.div>
        )}

        {/* Social Share & Spread the Word Card */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={`rounded-2xl border p-4 sm:p-5 space-y-3 backdrop-blur-2xl ${
            isDark ? "bg-[#0c0c0f]/45 border-white/15" : "bg-white/45 border-white/70 shadow-md"
          }`}
          style={{
            boxShadow: isDark
              ? `0 20px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)`
              : `0 15px 30px -10px rgba(0,0,0,0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold">Spread the Word & Help Others</h3>
              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Know colleagues or friends who would benefit from this free guide?
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this free resource: ${pageName}`)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold bg-black text-white hover:bg-zinc-800 border border-white/10 transition shadow-xs cursor-pointer"
            >
              Share on 𝕏
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold bg-[#0A66C2] text-white hover:bg-[#084e96] transition shadow-xs cursor-pointer"
            >
              Share on LinkedIn
            </a>

            <button
              onClick={handleCopyShareLink}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold border transition shadow-xs cursor-pointer ${
                isDark ? "border-white/15 hover:bg-white/10 text-white" : "border-zinc-300 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "Link Copied!" : "Copy Page Link"}
            </button>
          </div>
        </motion.div>

        {/* Return Home Link */}
        <div className="text-center pt-1">
          <a
            href={`/${username}/${magnetSlug}`}
            className={`inline-flex items-center gap-1.5 text-xs font-bold hover:underline transition-colors ${
              isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black"
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Original Magnet Page
          </a>
        </div>
      </div>

      {/* Strategy Session Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl relative space-y-5 ${
                isDark ? "bg-[#141417] border-white/15 text-white" : "bg-white border-zinc-200 text-zinc-900"
              }`}
            >
              <button
                onClick={() => setShowBookingModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>

              {bookingConfirmed ? (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">Strategy Session Reserved!</h3>
                  <p className="text-xs text-zinc-400">
                    We've saved your slot for <strong>{selectedDate} at {selectedTime}</strong>. Confirmation link sent to {subscriberEmail || "your email"}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-2xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black">Reserve 1-on-1 Session</h3>
                      <p className="text-xs text-zinc-400">Choose your preferred strategy call slot with {businessName}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-zinc-400">Select Date:</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {["Today", "Tomorrow", "In 2 Days"].map((d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDate(d)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                              selectedDate === d
                                ? "bg-[#0066B2] text-white border-sky-400"
                                : isDark
                                ? "bg-[#1C1C22] border-white/10 text-zinc-300 hover:border-white/20"
                                : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400">Select Time Slot:</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {["10:00 AM", "02:00 PM", "05:30 PM"].map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                              selectedTime === t
                                ? "bg-[#0066B2] text-white border-sky-400"
                                : isDark
                                ? "bg-[#1C1C22] border-white/10 text-zinc-300 hover:border-white/20"
                                : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition active:scale-98 cursor-pointer mt-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    Confirm Meeting ({selectedDate} @ {selectedTime})
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
