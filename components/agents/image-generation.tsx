"use client";

import React, { useEffect, useRef } from "react";
import { Check, CircleAlert, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export type ImageGenerationStatus =
  | "queued"
  | "generating"
  | "refining"
  | "complete"
  | "error";

export interface ImageGenerationProps {
  /** The completed media. Pass an img, Next Image, canvas, video, or custom preview. */
  children?: React.ReactNode;
  status?: ImageGenerationStatus;
  /** Accessible description. Defaults to a description derived from prompt. */
  label?: string;
  prompt?: string;
  resolution?: string;
  /** CSS aspect ratio reserved before generated media is available. */
  aspectRatio?: React.CSSProperties["aspectRatio"];
  size?: "compact" | "fluid";
  /** Lets the active dither cluster follow fine-pointer movement. */
  interactive?: boolean;
  statusText?: string;
  showStatus?: boolean;
  onRetry?: () => void;
  className?: string;
  mediaClassName?: string;
  statusClassName?: string;
}

const DEFAULT_STATUS_TEXT: Record<ImageGenerationStatus, string> = {
  queued: "Waiting to generate",
  generating: "Generating image",
  refining: "Refining details",
  complete: "Image ready",
  error: "Generation failed",
};

function DitherMark({ status }: { status: ImageGenerationStatus }) {
  if (status === "complete") {
    return <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" />;
  }

  if (status === "error") {
    return <CircleAlert aria-hidden="true" className="h-3.5 w-3.5 text-red-400" />;
  }

  return (
    <motion.span
      aria-hidden="true"
      animate={{ rotate: 360 }}
      transition={{
        duration: 2.4,
        ease: "easeInOut",
        repeat: Infinity,
      }}
      className="grid h-3.5 w-3.5 grid-cols-2 place-items-center gap-0.5 text-indigo-400"
    >
      <span className="h-1 w-1 rounded-[1px] bg-current" />
      <span className="h-1 w-1 rounded-[1px] bg-current opacity-40" />
      <span className="h-1 w-1 rounded-[1px] bg-current opacity-40" />
      <span className="h-1 w-1 rounded-[1px] bg-current" />
    </motion.span>
  );
}

export function ImageGeneration({
  children,
  status = "generating",
  label,
  prompt,
  resolution = "1024 × 1024",
  aspectRatio = "16 / 9",
  size = "fluid",
  interactive = true,
  statusText,
  showStatus = true,
  onRetry,
  className = "",
  mediaClassName = "",
  statusClassName = "",
}: ImageGenerationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic Dither Grid Canvas Effect (beui.dev spec)
  useEffect(() => {
    if (status === "complete" || status === "error") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const width = (canvas.width = canvas.offsetWidth || 400);
      const height = (canvas.height = canvas.offsetHeight || 260);

      ctx.clearRect(0, 0, width, height);

      const dotSpacing = 14;
      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * dotSpacing + 7;
          const y = r * dotSpacing + 7;

          const dist = Math.sin((c * 0.18) + (r * 0.18) - frame * 0.04);
          const opacity = Math.max(0.04, (dist + 1) * 0.22);
          const dotSize = Math.max(1, (dist + 1.2) * 1.5);

          ctx.fillStyle = `rgba(165, 180, 252, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [status]);

  const currentStatusText = statusText || DEFAULT_STATUS_TEXT[status];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#090a0f] text-white shadow-2xl transition-all duration-300 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Background Media Container (Progressive blur refinement) */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out ${
          status === "queued"
            ? "blur-md opacity-0 scale-105"
            : status === "generating"
            ? "blur-sm opacity-25 scale-102"
            : status === "refining"
            ? "blur-[2px] opacity-70 scale-100"
            : status === "complete"
            ? "blur-0 opacity-100 scale-100"
            : "blur-sm opacity-30"
        } ${mediaClassName}`}
      >
        {children}
      </div>

      {/* Dither Grid Overlay */}
      {status !== "complete" && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-10"
        />
      )}

      {/* Shimmer Light Beam */}
      {status !== "complete" && (
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] pointer-events-none" />
      )}

      {/* Status Overlay Container */}
      {showStatus && status !== "complete" && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-between p-4 pointer-events-none ${statusClassName}`}>
          {/* Top Meta Bar */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider opacity-90">
            {prompt ? (
              <span className="truncate max-w-[70%] bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-zinc-300 shadow-sm">
                "{prompt}"
              </span>
            ) : <span />}
            {resolution && (
              <span className="ml-auto bg-black/70 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-zinc-400 shadow-sm">
                {resolution}
              </span>
            )}
          </div>

          {/* Center Loading Badge with DitherMark */}
          <div className="my-auto flex flex-col items-center text-center space-y-2.5 pointer-events-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/80 border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xl">
              <DitherMark status={status} />
              <span>{currentStatusText}</span>
            </div>

            {label && (
              <p className="text-xs text-zinc-400 max-w-[280px] font-medium leading-relaxed">
                {label}
              </p>
            )}

            {status === "error" && onRetry && (
              <button
                onClick={onRetry}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 backdrop-blur-md transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retry
              </button>
            )}
          </div>

          {/* Bottom Progress Line */}
          {status !== "error" && (
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 transition-all duration-500 ${
                  status === "queued"
                    ? "w-[15%]"
                    : status === "generating"
                    ? "w-[50%] animate-pulse"
                    : "w-[85%]"
                }`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
