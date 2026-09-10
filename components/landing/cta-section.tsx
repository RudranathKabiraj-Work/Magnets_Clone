"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { CheckCircle2, ShieldCheck, Zap, Sparkles, ArrowRight } from "lucide-react";
import Reveal from "@/components/reveal";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  colorDark: string;
  colorLight: string;
  pulseSpeed: number;
}

export default function CtaSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  // Full-bleed Canvas particle animation loop (Sleek ambient floating dust / aurora nodes)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 55;

    // Glowing vibrant tones
    const colorsDark = [
      "rgba(56, 189, 248, ",  // Sky cyan #38BDF8
      "rgba(96, 165, 250, ",  // Electric blue #60A5FA
      "rgba(168, 85, 247, ",  // Aurora purple #A855F7
      "rgba(52, 211, 153, ",  // Emerald #34D399
    ];

    const colorsLight = [
      "rgba(0, 102, 178, ",   // Brand Blue #0066B2
      "rgba(2, 132, 199, ",   // Sky Blue #0284C7
      "rgba(147, 51, 234, ",  // Purple #9333EA
      "rgba(16, 185, 129, ",  // Emerald #10B981
    ];

    const initParticles = (width: number, height: number) => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const maxAlpha = Math.random() * 0.5 + 0.2;
        const colorIdx = Math.floor(Math.random() * colorsDark.length);
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35 - 0.1, // Slight upward float
          size: Math.random() * 2.2 + 0.8,
          alpha: Math.random() * maxAlpha,
          maxAlpha,
          colorDark: colorsDark[colorIdx],
          colorLight: colorsLight[colorIdx],
          pulseSpeed: Math.random() * 0.02 + 0.008,
        });
      }
    };

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Render loop
    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const isDark = document.documentElement.classList.contains("dark");

      // Draw subtle aurora connection streams between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * (isDark ? 0.14 : 0.08);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineAlpha})`
              : `rgba(0, 102, 178, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Update and draw floating particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen seamlessly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Pulse alpha opacity
        p.alpha += p.pulseSpeed;
        if (p.alpha > p.maxAlpha || p.alpha < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        // Soft attraction to mouse hover
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const force = (160 - dist) / 160;
            p.x += (dx / dist) * force * 0.4;
            p.y += (dy / dist) * force * 0.4;
          }
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const colorPrefix = isDark ? p.colorDark : p.colorLight;
        ctx.fillStyle = `${colorPrefix}${Math.max(0, p.alpha)})`;
        ctx.shadowColor = isDark ? "#38BDF8" : "#0066B2";
        ctx.shadowBlur = isDark ? 10 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#F0F7FF] dark:bg-[#0a0a0a] py-24 sm:py-32 lg:py-36 px-5 sm:px-8 lg:px-10 overflow-hidden transition-colors duration-300 border-t border-zinc-200/80 dark:border-zinc-800/80"
    >
      {/* Canvas Layer — Full Bleed Moving Ambient Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80 dark:opacity-90"
        aria-hidden="true"
      />

      {/* Content Container — Full-Bleed Modern Typography */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <Reveal>
          {/* Sleek Pill Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#0066B2]/20 dark:border-white/15 bg-white/80 dark:bg-[#121218]/90 backdrop-blur-xl px-4 py-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] shadow-sm mb-8">
            <Sparkles className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] animate-pulse" aria-hidden="true" />
            <span>Start Converting Visitors Today</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {/* Main Headline */}
          <h2 className="mx-auto text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight max-w-3xl">
            Ready to Build Lead Magnets That{" "}
            <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-purple-500 bg-clip-text text-transparent drop-shadow-xs">
              Actually Convert?
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-normal">
            Publish AI-powered opt-in pages, host resources natively, and automate multi-step nurture emails — in under 60 seconds.
          </p>

          {/* Call to Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-7 text-sm font-semibold text-white shadow-lg shadow-[#0066B2]/20 border border-white/10 transition-colors duration-200 cursor-pointer w-full sm:w-auto"
              href="/register"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4 text-white/90" aria-hidden="true" />
            </Link>

            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] backdrop-blur-md px-6 text-sm font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs transition-colors duration-200 hover:bg-white dark:hover:bg-white/[0.1] hover:border-zinc-400 dark:hover:border-white/20 w-full sm:w-auto"
              href="#how-it-works"
            >
              <span>Explore Features</span>
            </Link>
          </div>

          {/* Clean Trust Checklist Line */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span>Free Forever Tier Included</span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" aria-hidden="true" />
              <span>No Credit Card Required</span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span>Instant 60-Second Setup</span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
