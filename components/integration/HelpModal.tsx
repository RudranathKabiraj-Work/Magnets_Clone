"use client";

import React, { useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, ArrowLeft } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = memo(function HelpModal({ isOpen, onClose }: HelpModalProps) {
  // Lock background scroll & pause Lenis when Help Modal is open
  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (isOpen) {
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
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
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
            onClick={onClose}
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
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Help centre</h3>
                  <p className="text-xs text-zinc-400">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-header navigation */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/60 bg-[#111215] text-xs font-semibold text-zinc-400">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>All help topics</span>
              </button>
              <span className="uppercase tracking-wider text-[10px] text-zinc-500 font-bold">LEARN</span>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-7 overflow-y-auto overscroll-contain" data-lenis-prevent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8]">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">YOUR ACCOUNT FOUNDATIONS</span>
                    <h2 className="text-xl font-bold text-white leading-tight">What belongs in Integration?</h2>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Integration controls where your pages live, where emails come from, and which other tools receive new signups. You do not need to connect every option before creating a lead magnet.
                </p>
              </div>

              {/* 5 Feature Cards Grid matching screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="rounded-xl border border-zinc-800/80 bg-[#181A1F] p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-white">LeadMagnets URL</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Choose the included leadmagnets.so address used by your published pages.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="rounded-xl border border-zinc-800/80 bg-[#181A1F] p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-white">Custom domain</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Optionally use a branded page address on a domain you own.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="rounded-xl border border-zinc-800/80 bg-[#181A1F] p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-white">Email and scheduling</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Optionally use your own sender domain or stop a sequence when someone books.
                  </p>
                </div>

                {/* Card 4 */}
                <div className="rounded-xl border border-zinc-800/80 bg-[#181A1F] p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-white">Connections</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Optionally send signups to a newsletter, Slack, Zapier, Kit, or Pipedrive.
                  </p>
                </div>

                {/* Card 5 */}
                <div className="rounded-xl border border-zinc-800/80 bg-[#181A1F] p-4 space-y-1.5 md:col-span-2">
                  <h4 className="text-sm font-bold text-white">Legal links</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Add your privacy policy and terms to the footer of every public lead magnet page.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

