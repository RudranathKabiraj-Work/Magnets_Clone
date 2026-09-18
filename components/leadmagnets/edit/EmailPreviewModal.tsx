"use client";

import { useState, useEffect } from "react";
import { Mail, X } from "lucide-react";
import { type Account, type MagnetPage } from "@/lib/data";

interface EmailPreviewModalProps {
  emailSubject: string;
  emailPreviewText: string;
  emailBody: string;
  page: MagnetPage;
  account: Account | null;
  pageId: string;
  onClose: () => void;
}

export default function EmailPreviewModal({
  emailSubject,
  emailPreviewText,
  emailBody,
  page,
  account,
  pageId,
  onClose,
}: EmailPreviewModalProps) {
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailSentMsg, setTestEmailSentMsg] = useState<string | null>(null);

  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    document.body.style.overflow = "hidden";
    if (lenis && typeof lenis.stop === "function") lenis.stop();

    return () => {
      document.body.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    };
  }, []);

  const handleSendTestEmail = async () => {
    setTestEmailSending(true);
    setTestEmailSentMsg(null);
    try {
      const userEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);
      if (userEmail) {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addLead",
            data: {
              id: `l_test_preview_${Date.now()}`,
              name: account?.name || "Owner Test",
              email: userEmail,
              page: page?.name || "Preview Test",
              pageId: page?.id || pageId,
              pageSlug: page?.slug || pageId,
              userEmail: userEmail,
              status: "new",
              source: "leadmagnets",
              signedUpAt: new Date().toLocaleTimeString(),
            },
          }),
        });
        if (res.ok) {
          setTestEmailSentMsg(`✅ Test deliverable sent to ${userEmail}!`);
        }
      }
    } catch (e) {
      setTestEmailSentMsg("❌ Failed to send test email.");
    } finally {
      setTestEmailSending(false);
    }
  };

  const isDark = (account?.themeMode || "light") === "dark";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overscroll-contain transition-all duration-200 animate-in fade-in zoom-in-95"
    >
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[85vh] shrink-0 transition-colors duration-200 ${isDark ? "border-[#27272A] bg-[#141417] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 shrink-0 ${isDark ? "border-[#27272A] bg-[#18181C]" : "border-zinc-200 bg-zinc-50"}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0066B2]/10 text-[#0066B2]">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Subscriber Email Preview</h3>
              <p className="text-[11px] text-zinc-400">Live preview of what subscribers receive in their inbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition cursor-pointer ${isDark ? "text-zinc-400 hover:bg-zinc-800 hover:text-white" : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Email Header Bar */}
        <div className={`border-b px-6 py-3 space-y-2 text-xs shrink-0 ${isDark ? "border-[#27272A] bg-[#18181B]" : "border-zinc-100 bg-zinc-50/50"}`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400 w-16">From:</span>
            <span className="font-medium">{account?.senderDisplayName || account?.name || "LeadMagnets"} &lt;{account?.senderAddress || "non-reply@bdatech.in"}&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400 w-16">To:</span>
            <span className="font-medium text-zinc-400">subscriber@example.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400 w-16">Subject:</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>{emailSubject || `Here is your resource: ${page?.name || "Lead Magnet"}`}</span>
          </div>
        </div>

        {/* Email Body Content Container (Isolated Scroll Box) */}
        <div
          id="email-preview-scroll-container"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 overscroll-contain ${isDark ? "bg-[#0B0F17]" : "bg-[#F8FAFC]"}`}
        >
          <div className={`max-w-xl mx-auto rounded-2xl border p-6 sm:p-8 shadow-sm space-y-6 ${isDark ? "border-zinc-800 bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
            <h1 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-zinc-900"}`}>
              {page?.name || "Lead Magnet Resource"}
            </h1>
            <div
              className={`text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"} [&_p]:mb-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  const raw = (emailBody || "Hey {name},\n\nThank you for requesting this resource! Click the button below to get instant access.\n\nEnjoy!")
                    .replace(/\{name\}/g, "Subscriber");
                  const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
                  let formatted = hasHtml ? raw : raw.replace(/\n/g, "<br/>");

                  // Auto-convert standalone YouTube links into clickable video cards if not inside href
                  formatted = formatted.replace(
                    /(?<!href=["'])(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11}))/g,
                    (_match: string, url: string, ytId: string) => {
                      const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                      return `<div style="text-align: center; margin: 16px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${thumb}" alt="Watch Video on YouTube" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></a><br/><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066B2; font-weight: 600; text-decoration: underline;">▶ Watch Video on YouTube</a></div>`;
                    }
                  );
                  return formatted;
                })(),
              }}
            />

            <div className="text-center py-2">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ backgroundColor: account?.brandColor || "#0066B2" }}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 transition cursor-pointer"
              >
                <span>📥 Access Your Lead Magnet →</span>
              </a>
            </div>

            <hr className={isDark ? "border-zinc-800" : "border-zinc-200"} />
            <p className="text-[11px] text-zinc-400 text-center">
              Sent by {account?.name || "LeadMagnets"} · Instant Delivery
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-between border-t px-6 py-4 shrink-0 ${isDark ? "border-[#27272A] bg-[#18181C]" : "border-zinc-200 bg-white"}`}>
          {testEmailSentMsg ? (
            <span className="text-xs font-semibold text-emerald-500">{testEmailSentMsg}</span>
          ) : (
            <span className="text-xs text-zinc-400">Live preview matching actual subscriber deliverable</span>
          )}
          <div className="flex items-center gap-3">
            <button
              disabled={testEmailSending}
              onClick={handleSendTestEmail}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-50 ${isDark ? "border-zinc-700 hover:bg-zinc-800 text-white" : "border-zinc-300 hover:bg-zinc-100 text-zinc-800"}`}
            >
              {testEmailSending ? "Sending test..." : "📧 Send Test Email to Me"}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-[#0066B2] hover:bg-[#005799] px-4 py-2 text-xs font-bold text-white transition shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
