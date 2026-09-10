"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { Sparkles, BarChart3, Workflow, ExternalLink } from "lucide-react";
import { MailIcon } from "@/components/icons";

export default function ShowcaseTabs() {
  const [activeTab, setActiveTab] = useState<"builder" | "delivery" | "sequence">("builder");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isInViewport, setIsInViewport] = useState(true);
  const showcaseRef = useRef<HTMLDivElement>(null);
  // lineRef points to the server-rendered #timeline-progress-line element in page.tsx
  const lineRef = useRef<HTMLDivElement | null>(null);

  // On mount, grab the server-rendered progress line element by ID
  useEffect(() => {
    lineRef.current = document.getElementById("timeline-progress-line") as HTMLDivElement | null;
  }, []);

  // Buttery-smooth scroll parallax — NO React state on scroll, pure DOM mutation
  useEffect(() => {
    let currentProgress = 0;
    let targetProgress = 0;
    let isRunning = false;
    let animationFrameId: number;

    const progressEl = lineRef.current;

    const updateLoop = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) > 0.02) {
        currentProgress += diff * 0.18;
        // Direct DOM mutation — zero React re-renders
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
        animationFrameId = requestAnimationFrame(updateLoop);
      } else {
        currentProgress = targetProgress;
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
        isRunning = false;
      }
    };

    const handleScroll = () => {
      // 1. Timeline LERP progress
      const timelineEl = document.getElementById("timeline-node-tree");
      if (timelineEl) {
        const rect = timelineEl.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const totalHeight = rect.height;
        const scrollPos = windowHeight * 0.7 - rect.top;
        targetProgress = Math.min(Math.max(scrollPos / totalHeight, 0), 1) * 100;
      }

      // 2. Showcase card parallax — direct DOM mutation
      const showcaseEl = showcaseRef.current;
      if (showcaseEl) {
        const rect = showcaseEl.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        const translateY = (clampedProgress - 0.5) * -35;
        showcaseEl.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
      }

      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(updateLoop);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Pause auto-play when showcase scrolls out of viewport
  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setIsInViewport(entry.isIntersecting); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-play tab cycling every 3.5s
  useEffect(() => {
    if (!isAutoPlaying || !isInViewport) return;
    const tabs: Array<"builder" | "delivery" | "sequence"> = ["builder", "delivery", "sequence"];
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = tabs.indexOf(prev);
        return tabs[(currentIndex + 1) % tabs.length];
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isInViewport]);

  return (
    <>
      {/* Hidden progress line element — controlled via ref, not state */}
      <div
        ref={lineRef}
        id="timeline-progress-line"
        aria-hidden="true"
        style={{ height: "0%" }}
        className="hidden md:block absolute left-1/2 top-6 -translate-x-1/2 w-[2.5px] bg-gradient-to-b from-[#0066B2] via-[#38BDF8] via-purple-500 via-amber-500 to-emerald-500 rounded-full z-0 shadow-[0_0_14px_rgba(56,189,248,0.85)] max-h-[calc(100%-48px)] pointer-events-none"
      />

      {/* INTERACTIVE WORKSPACE SHOWCASE DEMO */}
      <div
        ref={showcaseRef}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        className="relative mt-14 max-w-5xl mx-auto rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#121215]/90 backdrop-blur-xl p-3 sm:p-5 shadow-2xl ring-1 ring-white/20 dark:ring-white/5 transition-shadow duration-500 hover:shadow-blue-500/10"
        style={{ willChange: "transform" }}
      >
        {/* Ambient Background Glow */}
        <div aria-hidden="true" className="absolute -top-12 left-1/2 -translate-x-1/2 -z-10 h-64 w-[80%] rounded-full bg-gradient-to-r from-[#0066B2]/20 via-[#38BDF8]/20 to-purple-500/10 blur-3xl opacity-60 pointer-events-none" />

        {/* Demo Header Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 px-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
            <span className="ml-2 text-xs font-mono font-semibold text-zinc-400 dark:text-zinc-500 hidden sm:inline">leadmagnets.app/live-preview</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#1C1C20] p-1 rounded-xl text-xs font-semibold max-w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              aria-label="Show Opt-In Builder demo"
              onClick={() => { setIsAutoPlaying(false); setActiveTab("builder"); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === "builder" ? "bg-white dark:bg-[#2A2A30] text-[#0066B2] dark:text-[#38BDF8] shadow-md font-bold" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
            >
              ⚡ Opt-In Builder
            </button>
            <button
              type="button"
              aria-label="Show Resource Delivery demo"
              onClick={() => { setIsAutoPlaying(false); setActiveTab("delivery"); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === "delivery" ? "bg-white dark:bg-[#2A2A30] text-[#0066B2] dark:text-[#38BDF8] shadow-md font-bold" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
            >
              📧 Resource Delivery
            </button>
            <button
              type="button"
              aria-label="Show Email Sequences demo"
              onClick={() => { setIsAutoPlaying(false); setActiveTab("sequence"); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === "sequence" ? "bg-white dark:bg-[#2A2A30] text-[#0066B2] dark:text-[#38BDF8] shadow-md font-bold" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
            >
              🔄 Email Sequences
            </button>
          </div>
        </div>

        {/* Interactive Tab Visual Content */}
        <div className="pt-5 pb-3 min-h-[420px] md:min-h-[320px] flex flex-col justify-center">
          {activeTab === "builder" && (
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white/90 dark:bg-[#16161A] p-6 sm:p-8 grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-300 shadow-sm">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] text-[11px] font-extrabold uppercase tracking-wider border border-[#0066B2]/20">
                  <Sparkles className="h-3.5 w-3.5" /> High-Converting Opt-in Page
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-snug">
                  Get the 2026 SaaS Growth Playbook (Free PDF)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Discover 15 proven growth hacks used by top bootstrapped founders to scale MRR cleanly.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      value="alex.founder@startup.co"
                      aria-label="Email address example"
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#202026] px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium shadow-xs"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">Valid</span>
                  </div>
                  <button type="button" className="w-full rounded-xl bg-gradient-to-r from-[#0066B2] to-[#0088FF] py-2.5 text-xs font-bold text-white shadow-md shadow-[#0066B2]/20 hover:opacity-95 transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5">
                    Get Instant Access <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50 to-white dark:from-[#1A1A1E] dark:to-[#141417] p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200/60 dark:border-zinc-800 pb-2.5">
                  <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" /> Live Performance Telemetry</span>
                  <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Real-time</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white dark:bg-[#222228] p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-xs">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Visitors</p>
                    <p className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1">2,840</p>
                    <span className="text-[10px] font-bold text-emerald-500 mt-0.5 inline-block">↑ +18.4% this week</span>
                  </div>
                  <div className="bg-white dark:bg-[#222228] p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-xs">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Opt-In Rate</p>
                    <p className="text-xl font-extrabold text-emerald-500 mt-1">51.2%</p>
                    <span className="text-[10px] font-semibold text-zinc-400 mt-0.5 inline-block">Top 5% benchmark</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#16161A] p-6 sm:p-8 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <MailIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Instant Fulfillment Email Triggered</h4>
                    <p className="text-xs text-zinc-400">To: subscriber@company.com · Sent automatically via LeadMagnets</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Delivered 0s ago</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1D1D22] border border-zinc-200/40 dark:border-zinc-800 text-xs space-y-2">
                <p className="font-bold text-zinc-800 dark:text-zinc-200">Here is your requested download!</p>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Thanks for requesting the 2026 SaaS Growth Playbook. Click the button below to open your resource directly.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-4 py-2 text-xs font-bold text-white shadow-xs">
                    Download Resource PDF <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sequence" && (
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#16161A] p-6 sm:p-8 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" /> Automated Nurture Workflow
                </h4>
                <span className="text-xs font-semibold text-zinc-400">Auto-Stops when Call Booked</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1A1A1E]">
                  <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8]">STEP 1 · IMMEDIATE</span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">Resource Delivery</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">PDF download link delivered</p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1A1A1E]">
                  <span className="text-[10px] font-bold text-purple-400">STEP 2 · +2 DAYS</span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">Value Follow-up</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Top 3 growth case studies</p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1A1A1E]">
                  <span className="text-[10px] font-bold text-amber-400">STEP 3 · +5 DAYS</span>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">Strategy Call Offer</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Direct Calendly invite link</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
