"use client";

import { useState } from "react";
import { Wand2, HardDrive, Workflow, BarChart3, ChevronDown } from "lucide-react";
import Link from "next/link";
import { MailIcon } from "@/components/icons";
import { Sparkles } from "lucide-react";
import { MessageSquare } from "lucide-react";

const faqs = [
  {
    category: "SETUP & DOMAINS",
    question: "Do I need technical skills or a custom domain to start?",
    answer: "Not at all. You can generate and publish your lead magnet on a free LeadMagnets subdomain in 60 seconds. Custom CNAME subdomain integration (e.g. get.yourdomain.com) with auto-SSL is available whenever you are ready.",
    icon: Wand2,
    badgeColor: "bg-blue-500/10 text-[#0066B2] dark:text-[#38BDF8] border-[#0066B2]/20",
  },
  {
    category: "RESOURCE STORAGE",
    question: "How does instant resource delivery work?",
    answer: "When a visitor enters their email, LeadMagnets immediately fires a personalized delivery email containing their file or document link directly from native platform storage — zero Google Drive or third-party links required.",
    icon: HardDrive,
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    category: "EMAIL AUTOMATION",
    question: "Can I automatically sequence follow-up emails?",
    answer: "Yes! Set up automated email sequences with customized day delays (e.g. Day 1, Day 3, Day 7). You can also set smart stop conditions so sequences stop automatically when leads book a call on Calendly.",
    icon: Workflow,
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    category: "STACK INTEGRATIONS",
    question: "Can I sync leads to my existing CRM or email stack?",
    answer: "Absolutely. Seamlessly sync contacts with Beehiiv, Kit (ConvertKit), Substack, Slack, Pipedrive, Zapier, and custom webhooks in real time.",
    icon: BarChart3,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
];

export default function FaqAccordion() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Interactive Glass Accordion Cards */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {faqs.map((faq, idx) => {
          const IconComponent = faq.icon;
          const isOpen = openFaq === idx;
          const panelId = `faq-panel-${idx}`;
          const headerId = `faq-header-${idx}`;
          return (
            <div
              key={faq.question}
              className={`group relative rounded-2xl border backdrop-blur-xl transition-all duration-300 overflow-hidden ${isOpen
                ? "border-[#0066B2]/50 dark:border-[#38BDF8]/50 bg-gradient-to-b from-white/95 via-blue-50/40 to-white/95 dark:from-[#1C1C24]/90 dark:via-[#161620]/90 dark:to-[#14141C]/90 shadow-2xl ring-1 ring-[#0066B2]/30 dark:ring-[#38BDF8]/30 scale-[1.01]"
                : "border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-[#141418]/60 hover:border-[#0066B2]/40 dark:hover:border-white/20 hover:bg-white/90 dark:hover:bg-[#1A1A22]/80 shadow-md hover:shadow-xl"
                }`}
            >
              <button
                id={headerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full text-left p-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2] focus-visible:ring-offset-2 rounded-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border backdrop-blur-md ${faq.badgeColor}`}>
                        <IconComponent className="h-3 w-3" aria-hidden="true" />
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">
                      {faq.question}
                    </h3>
                  </div>
                  <div aria-hidden="true" className={`mt-1 shrink-0 h-8 w-8 rounded-xl flex items-center justify-center border transition-all duration-300 ${isOpen
                    ? "bg-[#0066B2] text-white border-[#0066B2] rotate-180 shadow-md"
                    : "bg-white/80 dark:bg-[#20202A]/80 text-zinc-400 border-zinc-200/80 dark:border-white/10 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                    }`}>
                    <ChevronDown className="h-4 w-4 transition-transform duration-300" />
                  </div>
                </div>
              </button>

              {/* Expandable Answer */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 px-6 pb-6 pt-2">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Live Assistance Card */}
      <div className="mt-12 sm:mt-16 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-gradient-to-r from-blue-50/70 via-white/80 to-purple-50/70 dark:from-[#181824]/80 dark:via-[#14141C]/80 dark:to-[#1C1828]/80 backdrop-blur-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="h-12 w-12 rounded-2xl bg-[#0066B2]/10 dark:bg-[#38BDF8]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#0066B2]/20 shadow-inner">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">Still have questions?</h4>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              Our team is here to help you set up your high-converting lead magnet engines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/register"
            className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 text-xs font-bold text-white shadow-md shadow-[#0066B2]/20 transition-all hover:scale-[1.02] active:scale-98"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Start Free Today
          </Link>
          <Link
            href="mailto:support@leadmagnets.app"
            className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#20202A]/80 backdrop-blur-md px-4 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <MailIcon className="h-3.5 w-3.5" aria-hidden="true" /> Contact Support
          </Link>
        </div>
      </div>
    </>
  );
}
