import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckIcon,
  EarthIcon,
  FileTextIcon,
  MailIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/icons";
import {
  Wand2,
  Zap,
  HardDrive,
  BarChart3,
  Layers,
  CheckCircle2,
  ShieldCheck,
  MousePointerClick,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Workflow,
  Share2,
  ChevronDown,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import SiteFooter from "@/layout/site-footer";
import SiteHeader from "@/layout/site-header";
import Reveal from "@/components/reveal";
import { MagnetsMark, GeminiLogo } from "@/components/brand";
import ShowcaseTabs from "@/components/landing/showcase-tabs";
import FaqAccordion from "@/components/landing/faq-accordion";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://leadmagnets.so/#organization",
      name: "LeadMagnets",
      url: "https://leadmagnets.so",
      logo: { "@type": "ImageObject", url: "https://leadmagnets.so/brand/magnets-mark-dark.png" },
    },
    {
      "@type": "WebSite",
      "@id": "https://leadmagnets.so/#website",
      name: "LeadMagnets",
      url: "https://leadmagnets.so",
      publisher: { "@id": "https://leadmagnets.so/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": "https://leadmagnets.so/#webpage",
      name: "AI Lead Magnet Builder & Automated Nurturing Platform",
      description: "Generate opt-in landing pages with AI, host resources securely, send instant downloads, and auto-nurture leads with email sequences.",
      url: "https://leadmagnets.so",
      isPartOf: { "@id": "https://leadmagnets.so/#website" },
      inLanguage: "en",
    },
  ],
};

const superFeatures = [
  {
    icon: Wand2,
    badge: "AI Powered",
    title: "AI Lead Magnet Generator",
    description: "Generate persuasive headlines, benefit bullets, and opt-in landing pages in under 30 seconds using AI prompts tailored to your niche.",
    highlightColor: "from-blue-500/20 to-cyan-500/20 text-cyan-400",
    iconAnim: "group-hover:rotate-12 group-hover:scale-125 group-hover:text-cyan-300 transition-transform duration-300",
  },
  {
    icon: HardDrive,
    badge: "Native Hosting",
    title: "Instant Resource Storage",
    description: "Host PDFs, templates, Notion docs, or video courses directly on platform with zero extra cloud setup or Google Drive links.",
    highlightColor: "from-purple-500/20 to-pink-500/20 text-purple-400",
    iconAnim: "group-hover:-translate-y-1 group-hover:scale-115 group-hover:text-purple-300 transition-transform duration-300",
  },
  {
    icon: Workflow,
    badge: "Automated Nurture",
    title: "Drip Email Sequences",
    description: "Auto-send timed multi-step follow-ups that turn free subscribers into paying clients — and auto-stop when they book a call.",
    highlightColor: "from-emerald-500/20 to-teal-500/20 text-emerald-400",
    iconAnim: "group-hover:rotate-[180deg] group-hover:scale-115 group-hover:text-emerald-300 transition-transform duration-500",
  },
  {
    icon: BarChart3,
    badge: "Live Telemetry",
    title: "Analytics & Exit-Intent Captures",
    description: "Track unique visitors, conversion percentages, and bounce recovery with smart exit-intent overlays built straight into your pages.",
    highlightColor: "from-amber-500/20 to-orange-500/20 text-amber-400",
    iconAnim: "group-hover:scale-125 group-hover:-translate-y-0.5 group-hover:text-amber-300 transition-transform duration-300",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: HERO SECTION                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="relative bg-[#F0F7FF] dark:bg-[#0a0a0a] border-b border-zinc-200/80 dark:border-zinc-800/80">
        <SiteHeader />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-0 h-[36rem] vercel-dot-bg opacity-30 dark:opacity-15" />

        <div className="relative mx-auto max-w-7xl px-5 pt-12 pb-20 sm:px-8 sm:pt-20 lg:px-10 lg:pb-28">
          {/* Hero text is NOT wrapped in Reveal — H1 is the LCP element and must paint immediately */}
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-white/80 dark:bg-[#18181C]/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] animate-pulse" aria-hidden="true" />
              <span>Next-Gen Lead Nurturing Platform</span>
            </div>

            {/* Main Headline — LCP Element, must be immediately visible */}
            <h1 className="mx-auto mt-6 max-w-5xl text-5xl font-black leading-[1.02] text-zinc-900 dark:text-white sm:text-6xl lg:text-7xl tracking-tight">
              Turn Free Resources Into <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-[#60A5FA] bg-clip-text text-transparent drop-shadow-sm">High-Converting</span> Lead Engines
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-normal">
              AI-generated opt-in pages, instant resource hosting, automated email sequences, and exit-intent analytics — built into one seamless workspace.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row items-center">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-7 text-base font-bold text-white shadow-xl shadow-[#0066B2]/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer w-full sm:w-auto ring-2 ring-[#0066B2]/40"
                href="/register"
              >
                Create Free Lead Magnet <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-[#18181C] px-6 text-base font-bold text-zinc-700 dark:text-zinc-200 shadow-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80 w-full sm:w-auto"
                href="#features"
              >
                Explore Features
              </Link>
            </div>

            {/* Value Checkmarks */}
            <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Free Forever Plan</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Instant Setup (No Domain Needed)</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> AI Magnet Copy Generator</span>
            </div>
          </div>

          {/* INTERACTIVE WORKSPACE SHOWCASE DEMO — isolated client island */}
          <ShowcaseTabs />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: TIMELINE NODE TREE (HOW IT WORKS)                   */}
      {/* ------------------------------------------------------------- */}
      <section className="cv-auto bg-white dark:bg-[#121215] py-20 sm:py-32 border-b border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden" id="how-it-works">
        {/* Subtle Background Glow Spheres */}
        <div aria-hidden="true" className="absolute top-1/3 left-1/2 -translate-x-1/2 -z-0 h-96 w-[600px] rounded-full bg-gradient-to-tr from-[#0066B2]/10 via-purple-500/10 to-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-zinc-50/80 dark:bg-[#18181C]/80 backdrop-blur-md px-4 py-1 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-2xs mb-4">
              <Workflow className="h-3.5 w-3.5" />
              <span>Automated Funnel Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              From Visitor Attention to <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-purple-500 bg-clip-text text-transparent">High-Value Customer</span>
            </h2>
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
              Stop juggling separate form tools, Google Drive links, and email sequence software. LeadMagnets powers your entire lead engine seamlessly.
            </p>
          </Reveal>

          {/* Centered Timeline Axis Tree */}
          <div id="timeline-node-tree" className="relative">
            {/* Background Dim Line Track */}
            <div aria-hidden="true" className="hidden md:block absolute left-1/2 top-6 bottom-6 -translate-x-1/2 w-[2px] bg-zinc-200 dark:bg-zinc-800/80 rounded-full z-0" />

            {/* Scroll-Driven Dynamic Progress Line — height controlled by ShowcaseTabs client component via DOM ref */}
            {/* This element is positioned here in the server-rendered HTML; the client component finds it by ID */}
            <div
              id="timeline-progress-line"
              aria-hidden="true"
              style={{ height: "0%" }}
              className="hidden md:block absolute left-1/2 top-6 -translate-x-1/2 w-[2.5px] bg-gradient-to-b from-[#0066B2] via-[#38BDF8] via-purple-500 via-amber-500 to-emerald-500 rounded-full z-0 shadow-[0_0_14px_rgba(56,189,248,0.85)] max-h-[calc(100%-48px)]"
            />

            <div className="space-y-12 md:space-y-16">
              {/* NODE 1 (Left Side) */}
              <Reveal delay={0}>
                <div className="grid md:grid-cols-2 gap-8 items-center relative z-10 group">
                  <div className="md:text-right space-y-3 md:pr-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] text-[11px] font-extrabold border border-[#0066B2]/20">
                      <span>NODE 01</span> · ⚡ AI Page & CNAME Setup
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      Publish & Custom Domain Subdomain
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md md:ml-auto">
                      Generate opt-in page headlines and benefit bullets in seconds. Publish directly on LeadMagnets or link custom CNAME subdomains (<code className="text-[11px] text-[#0066B2] dark:text-[#38BDF8] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">get.yourdomain.com</code>) with free auto-SSL.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-start md:justify-end pt-1">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">AI Copy Generator</span>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">Auto SSL Certificate</span>
                    </div>
                  </div>

                  {/* Central Node Badge 01 */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/80 dark:bg-[#121218]/90 backdrop-blur-xl border border-[#0066B2]/50 dark:border-[#38BDF8]/50 text-[#0066B2] dark:text-[#38BDF8] font-black text-xs shadow-xl shadow-[#0066B2]/20 ring-4 ring-white dark:ring-[#121215] z-20 group-hover:scale-110 transition-transform duration-300">
                    01
                  </div>

                  <div className="md:pl-10">
                    <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-[#141418]/60 backdrop-blur-xl p-5 shadow-lg space-y-3 group hover:border-[#0066B2]/50 dark:hover:border-white/20 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
                      <div className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-white/10 pb-2.5">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" /> AI Opt-in Page Preview
                        </span>
                        <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">SSL Active</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="font-bold text-zinc-900 dark:text-white">&quot;The 2026 SaaS Growth Playbook&quot;</p>
                        <div className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-[#1D1D24]/80 border border-zinc-200/60 dark:border-white/10 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          https://get.yourbrand.com/saas-playbook
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* NODE 2 (Right Side) */}
              <Reveal delay={0.1}>
                <div className="grid md:grid-cols-2 gap-8 items-center relative z-10 group">
                  <div className="order-2 md:order-1 md:pr-10">
                    <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-[#141418]/60 backdrop-blur-xl p-5 shadow-lg space-y-3 group hover:border-purple-500/50 dark:hover:border-white/20 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
                      <div className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-white/10 pb-2.5">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-purple-400" /> Instant Fulfillment Engine
                        </span>
                        <span className="text-purple-400 font-bold text-[10px] bg-purple-500/10 px-2 py-0.5 rounded">Fired in 0.2s</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/80 dark:bg-[#1D1D24]/80">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">saas-growth-playbook.pdf</span>
                          <span className="text-[10px] font-bold text-purple-400">Native Storage</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Instant delivery email dispatched automatically without third-party links.</p>
                      </div>
                    </div>
                  </div>

                  {/* Central Node Badge 02 */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/80 dark:bg-[#121218]/90 backdrop-blur-xl border border-purple-500/50 text-purple-400 font-black text-xs shadow-xl shadow-purple-500/20 ring-4 ring-white dark:ring-[#121215] z-20 group-hover:scale-110 transition-transform duration-300">
                    02
                  </div>

                  <div className="order-1 md:order-2 space-y-3 md:pl-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-extrabold border border-purple-500/20">
                      <span>NODE 02</span> · 🔒 Native Vault & Instant Delivery
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      Instant Delivery & Secure Resource Hosting
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                      Host PDFs, Notion templates, or video courses directly on LeadMagnets with zero external Google Drive links. Instant fulfillment emails dispatch 0 seconds after opt-in.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">Zero File Links Needed</span>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">Auto-Fulfillment Email</span>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* NODE 3 (Left Side) */}
              <Reveal delay={0.2}>
                <div className="grid md:grid-cols-2 gap-8 items-center relative z-10 group">
                  <div className="md:text-right space-y-3 md:pr-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-extrabold border border-amber-500/20">
                      <span>NODE 03</span> · 📈 Telemetry & Exit-Intent Overlay
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      GA4 Telemetry & Retargeting Pixels
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md md:ml-auto">
                      Fire native Google Analytics 4 Measurement IDs and Meta Pixel custom conversion events automatically. Capture abandoning visitors with smart exit-intent overlays.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-start md:justify-end pt-1">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">GA4 + Meta Pixel</span>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">Exit-Intent Recovery</span>
                    </div>
                  </div>

                  {/* Central Node Badge 03 */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/80 dark:bg-[#121218]/90 backdrop-blur-xl border border-amber-500/50 text-amber-400 font-black text-xs shadow-xl shadow-amber-500/20 ring-4 ring-white dark:ring-[#121215] z-20 group-hover:scale-110 transition-transform duration-300">
                    03
                  </div>

                  <div className="md:pl-10">
                    <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-[#141418]/60 backdrop-blur-xl p-5 shadow-lg space-y-3 group hover:border-amber-500/50 dark:hover:border-white/20 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
                      <div className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-white/10 pb-2.5">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-amber-400" /> Real-time Conversion Telemetry
                        </span>
                        <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">51.2% Conv. Rate</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-zinc-50/80 dark:bg-[#1D1D24]/80">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">GA4 Event</span>
                          <p className="font-bold text-emerald-500 text-[11px] mt-0.5">lead_generated</p>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-50/80 dark:bg-[#1D1D24]/80">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Meta Pixel</span>
                          <p className="font-bold text-purple-400 text-[11px] mt-0.5">Lead (Complete)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* NODE 4 (Right Side) */}
              <Reveal delay={0.3}>
                <div className="grid md:grid-cols-2 gap-8 items-center relative z-10 group">
                  <div className="order-2 md:order-1 md:pr-10">
                    <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-[#141418]/60 backdrop-blur-xl p-5 shadow-lg space-y-3 group hover:border-emerald-500/50 dark:hover:border-white/20 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
                      <div className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-white/10 pb-2.5">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                          <Workflow className="h-4 w-4 text-emerald-500" /> Multi-Step Nurture Workflow
                        </span>
                        <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">Auto-Stop Active</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">Day 1: Case Studies</span>
                          <span className="text-emerald-500 font-bold">Sent</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">Day 4: Strategy Offer</span>
                          <span className="text-amber-400 font-bold">Scheduled</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Central Node Badge 04 */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/80 dark:bg-[#121218]/90 backdrop-blur-xl border border-emerald-500/50 text-emerald-400 font-black text-xs shadow-xl shadow-emerald-500/20 ring-4 ring-white dark:ring-[#121215] z-20 group-hover:scale-110 transition-transform duration-300">
                    04
                  </div>

                  <div className="order-1 md:order-2 space-y-3 md:pl-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-extrabold border border-emerald-500/20">
                      <span>NODE 04</span> · 🔄 Drip Email & Ecosystem Sync
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      Automated Follow-ups & Stack Integration
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                      Auto-send timed multi-step follow-ups that stop automatically when leads book calls via Calendly. Direct real-time sync with Beehiiv, Kit, Substack, Slack, and Zapier.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">Smart Stop on Booking</span>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1E] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800">Beehiiv / Kit / Slack Sync</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Full-Width Workspace Ecosystem Integration Card */}
          <Reveal delay={0.4} className="mt-20" id="integrations">
            <div className="rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-gradient-to-b from-zinc-50/90 via-white/70 to-zinc-50/90 dark:from-[#16161E]/80 dark:via-[#13131A]/80 dark:to-[#101014]/80 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
              {/* Radial Ambient Glow Background */}
              <div aria-hidden="true" className="absolute -top-24 left-1/2 -translate-x-1/2 -z-10 h-72 w-[600px] rounded-full bg-gradient-to-r from-[#0066B2]/20 via-[#38BDF8]/20 to-purple-500/20 blur-3xl pointer-events-none" />

              <div className="grid lg:grid-cols-12 gap-8 items-center">
                {/* Left Text & Status Info */}
                <div className="lg:col-span-5 space-y-3.5 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-extrabold border border-emerald-500/20">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Instant Stack Connectivity</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
                    Seamless 1-Click Ecosystem Sync
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Connect your existing tools in seconds. Every lead is automatically pushed to your favorite newsletter platforms, CRMs, and team notification channels.
                  </p>
                  <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Real-time Webhooks</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Auto-Retry Vault</span>
                  </div>
                </div>

                {/* Right Dual-Row Marquee Ticker */}
                <div className="lg:col-span-7 space-y-3 relative overflow-hidden py-2 marquee-mask">
                  {/* Marquee Row 1 (Moving Left) */}
                  <div className="animate-marquee-left gap-3">
                    {[
                      { name: "Beehiiv", icon: "🐝", category: "Newsletter" },
                      { name: "Kit (ConvertKit)", icon: "📧", category: "CRM & Email" },
                      { name: "Substack", icon: "📑", category: "Publication" },
                      { name: "Slack Alerts", icon: "💬", category: "Notifications" },
                      { name: "Pipedrive", icon: "📊", category: "Sales Pipeline" },
                      { name: "Beehiiv", icon: "🐝", category: "Newsletter" },
                      { name: "Kit (ConvertKit)", icon: "📧", category: "CRM & Email" },
                      { name: "Substack", icon: "📑", category: "Publication" },
                      { name: "Slack Alerts", icon: "💬", category: "Notifications" },
                      { name: "Pipedrive", icon: "📊", category: "Sales Pipeline" },
                    ].map((item, idx) => (
                      <div
                        key={`row1-${idx}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1C1C22] border border-zinc-200/80 dark:border-zinc-800/80 shadow-md hover:border-[#0066B2]/50 transition-all cursor-default shrink-0"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="text-xs font-extrabold text-zinc-900 dark:text-white leading-none">{item.name}</p>
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Marquee Row 2 (Moving Right) */}
                  <div className="animate-marquee-right gap-3">
                    {[
                      { name: "Zapier Automations", icon: "⚡", category: "Workflow" },
                      { name: "Calendly Bookings", icon: "📅", category: "Smart Stop" },
                      { name: "GA4 Telemetry", icon: "📈", category: "Analytics" },
                      { name: "Meta Ads Pixel", icon: "🎯", category: "Retargeting" },
                      { name: "Custom Webhooks", icon: "🔗", category: "API Payload" },
                      { name: "Zapier Automations", icon: "⚡", category: "Workflow" },
                      { name: "Calendly Bookings", icon: "📅", category: "Smart Stop" },
                      { name: "GA4 Telemetry", icon: "📈", category: "Analytics" },
                      { name: "Meta Ads Pixel", icon: "🎯", category: "Retargeting" },
                      { name: "Custom Webhooks", icon: "🔗", category: "API Payload" },
                    ].map((item, idx) => (
                      <div
                        key={`row2-${idx}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1C1C22] border border-zinc-200/80 dark:border-zinc-800/80 shadow-md hover:border-purple-500/50 transition-all cursor-default shrink-0"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="text-xs font-extrabold text-zinc-900 dark:text-white leading-none">{item.name}</p>
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: POWER FEATURES GRID                                */}
      {/* ------------------------------------------------------------- */}
      <section className="cv-auto bg-[#F0F7FF] dark:bg-[#0a0a0a] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="features">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">Engineered For Results</p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Everything You Need to <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-purple-500 bg-clip-text text-transparent">Capture & Convert High-Value Leads</span>
            </h2>
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
              Go beyond simple opt-in forms. LeadMagnets combines AI creation, native hosting, automated sequences, and analytics into one unified tool.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {superFeatures.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="group relative h-full rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white/90 via-white/50 to-white/80 dark:from-[#18181C] dark:via-[#151518] dark:to-[#121215] backdrop-blur-xl p-6 hover:border-[#0066B2]/50 dark:hover:border-[#38BDF8]/50 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-[#0066B2]/10 dark:hover:shadow-[#38BDF8]/10 overflow-hidden ring-1 ring-white/10">
                  {/* Top Ambient Card Glow on Hover */}
                  <div aria-hidden="true" className={`absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br ${f.highlightColor} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.highlightColor} border border-current/20 shadow-xs group-hover:border-current/60 transition-all duration-300`}>
                        <f.icon className="h-5.5 w-5.5" aria-hidden="true" />
                      </div>
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#222228] text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs">
                        {f.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors leading-snug">
                      {f.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                      {f.description}
                    </p>
                  </div>

                  {/* Micro Visual Link */}
                  <div className="mt-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Explore capability <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 group-hover:animate-ping" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: FAQ                                                 */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="cv-auto relative bg-white dark:bg-[#121215] py-24 sm:py-28 px-5 sm:px-8 lg:px-10 border-b border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        {/* Subtle Ambient Background Gradient */}
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-0 h-96 w-[700px] rounded-full bg-gradient-to-r from-[#0066B2]/10 via-purple-500/10 to-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Header */}
          <Reveal className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-[#0066B2]/5 dark:bg-[#18181C]/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-2xs mb-4">
              <HelpCircle className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Got Questions? We Have <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-purple-500 bg-clip-text text-transparent">Answers.</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Everything you need to know about setting up lead magnets, hosting files, automations, and integrations.
            </p>
          </Reveal>

          {/* FAQ Accordion — isolated client island */}
          <FaqAccordion />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: FINAL CTA                                          */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-[#F0F7FF] dark:bg-[#0a0a0a] py-24 sm:py-32 px-5 sm:px-8 lg:px-10 border-t border-zinc-200 dark:border-zinc-800/80">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Exact Brand Logo */}
          <div className="mb-6 flex items-center justify-center">
            <GeminiLogo darkSrc="/brand/gemini-logo-dark.webp" size="h-16 sm:h-20 w-auto" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.08] text-zinc-900 dark:text-white tracking-tight max-w-3xl">
            Ready to Build Lead Magnets That <span className="text-[#0066B2] dark:text-[#38BDF8]">Actually Convert?</span>
          </h2>

          {/* Subtitle */}
          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 font-normal">
            Create your opt-in page, upload your resource, and set up automated nurture emails in less than 5 minutes.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-8 text-base font-bold text-white shadow-lg shadow-[#0066B2]/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer w-full sm:w-auto"
              href="/register"
            >
              Get Started Free <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181C] px-6 text-base font-semibold text-zinc-700 dark:text-zinc-200 shadow-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80 w-full sm:w-auto"
              href="#features"
            >
              Explore Features
            </Link>
          </div>

          {/* Clean Enterprise Trust Line */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Free Forever Plan</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>No Credit Card Required</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>Instant 60-Second Setup</span>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}