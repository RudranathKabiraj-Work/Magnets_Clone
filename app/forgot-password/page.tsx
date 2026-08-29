"use client";

import { useState } from "react";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendResetEmail", data: { email: email.trim() } }),
      });

      if (res.ok) {
        const resetData = await res.json();
        if (resetData.success) {
          setMessage("Reset link sent! Please check your email inbox.");
          setEmail("");
        } else {
          setError("Failed to send reset link. Please try again.");
        }
      } else {
        const errData = await res.json();
        setError(errData.error || "No account found with this email.");
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
      title="Reset your password"
      subtitle="We will email you a link to choose a new one."
      onSubmit={handleSubmit}
      footer={
        <>
          Remembered it?{" "}
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
      <label className="block">
        <FieldLabel>Email</FieldLabel>
        <Input
          autoComplete="email"
          autoFocus
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Email me a reset link"}
      </Button>
    </AuthShell>
  );
}