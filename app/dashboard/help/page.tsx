"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { CircleHelp, BookOpen, MessageSquare, ArrowRight } from "lucide-react";
import { syncWithDatabase } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function HelpPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
      }
      setLoading(false);
    });
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Message sent! We will get back to you shortly.");
    setMessage("");
    setSending(false);
  };

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading help center...</div>
      </div>
    );
  }

  const guides = [
    {
      title: "Creating your first lead magnet",
      description: "Learn how to build a landing page, customize styling, and add email sequences in minutes.",
    },
    {
      title: "Connecting a custom domain",
      description: "How to point your CNAME records to publish lead magnets on your own branding.",
    },
    {
      title: "Integrating with your CRM",
      description: "Export contacts or automatically push leads to ConvertKit, Mailchimp, or webhooks.",
    },
  ];

  return (
    <DashboardShell account={account} title="Help">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-ink-950 dark:text-white">
            Help Center
            <span className="cursor-help rounded-full border border-ink-300 px-1.5 py-0 text-xs font-normal text-ink-500 hover:bg-ink-100">?</span>
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Browse guides or contact our support team directly.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Documentation Guides */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">
              <BookOpen className="h-4 w-4 text-brand-orange" /> Common Guides
            </span>

            {guides.map((guide, idx) => (
              <div
                key={idx}
                className="group cursor-pointer rounded-lg border border-ink-200 bg-white p-5 transition hover:border-brand-orange dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-ink-950 group-hover:text-brand-orange dark:text-white">
                    {guide.title}
                  </h4>
                  <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-orange" />
                </div>
                <p className="mt-1.5 text-xs text-ink-500 leading-relaxed dark:text-ink-400">
                  {guide.description}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-400 uppercase tracking-wider mb-4">
              <MessageSquare className="h-4 w-4 text-brand-orange" /> Contact Support
            </span>

            <form onSubmit={handleSendMessage} className="rounded-lg border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <div className="space-y-4">
                <div>
                  <FieldLabel>Your Email</FieldLabel>
                  <Input type="email" value={account.email} disabled />
                </div>
                <div>
                  <FieldLabel>How can we help?</FieldLabel>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or request..."
                    className="w-full h-32 rounded-md border border-ink-300 bg-white p-3 text-xs text-ink-900 focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-400 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
