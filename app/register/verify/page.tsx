"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendVerificationEmail", data: { email: email.trim(), name: "User" } }),
      });

      if (res.ok) {
        setMessage("Verification link sent! Please check your email inbox.");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to resend verification email.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={
        <span className="text-center block max-w-sm mx-auto">
          We sent a verification link to <strong className="text-ink-950">{email || "your email"}</strong>. Open it to finish creating your account.
        </span>
      }
      onSubmit={handleResend}
      footer={
        <>
          Already verified?{" "}
          <a className="font-medium text-ink-900 underline-offset-4 hover:underline" href="/login">
            Sign in
          </a>
        </>
      }
    >
      {error && (
        <div className="rounded-md border border-brand-coral/30 bg-brand-coral/10 p-3 text-xs font-semibold text-brand-coral text-center">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-500 text-center">
          {message}
        </div>
      )}
      <div className="w-full flex h-14 items-center justify-center rounded-lg bg-brand-orange/5 border border-brand-orange/15 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
        </svg>
      </div>
      <label className="block">
        <FieldLabel>Need another link?</FieldLabel>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="your-email@example.com"
        />
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Resend verification email"}
      </Button>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading verification details...</div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
