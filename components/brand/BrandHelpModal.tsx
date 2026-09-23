"use client";

import React, { memo } from "react";
import { Palette, X, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BrandHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrandHelpModal = memo(function BrandHelpModal({ isOpen, onClose }: BrandHelpModalProps) {
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
                  <Palette className="h-5 w-5" />
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
                  onClick={onClose}
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
  );
});

export default BrandHelpModal;
