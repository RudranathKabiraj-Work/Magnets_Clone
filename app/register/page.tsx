"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { saveAccount } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First, check if email is already registered
      const checkRes = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkEmail", data: { email: email.trim() } }),
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setError("An account already exists for that email. Sign in instead.");
          setLoading(false);
          return;
        }
      }

      const generatedUsername = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15) || "user";
      const newAccount = {
        name: name.trim(),
        email: email.trim(),
        username: generatedUsername,
        password: password,
        plan: "Free" as const,
        brandColor: "#FE6F34",
        logo: null,
        joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      };

      // Save to MongoDB
      await saveAccount(newAccount);

      // Fire verification email in background — never blocks registration flow
      // (Resend sandbox only delivers to rudranath@bda.co.in; all other emails silently skip)
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendVerificationEmail", data: { email: email.trim(), name: name.trim() } }),
      }).catch(() => { /* silently ignore if Resend sandbox blocks delivery */ });

      // Always go straight to onboarding — no email verification gate
      router.push(`/register/onboarding?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. No credit card."
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account?{" "}
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
      <label className="block">
        <FieldLabel>Name</FieldLabel>
        <Input
          autoComplete="name"
          autoFocus
          type="text"
          placeholder="What should we call you?"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <FieldLabel>Email</FieldLabel>
        <Input
          autoComplete="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <FieldLabel>Password</FieldLabel>
        <Input
          autoComplete="new-password"
          type="password"
          placeholder="At least 8 characters"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <FieldLabel>Confirm password</FieldLabel>
        <Input
          autoComplete="new-password"
          type="password"
          placeholder="Type it again"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </label>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-ink-200 bg-ink-50 p-3 text-xs leading-5 text-ink-700">
        <input required type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-ink-950 accent-ink-950" />
        <span>
          I accept the{" "}
          <a className="font-medium text-ink-950 underline-offset-4 hover:underline" href="/terms" rel="noreferrer" target="_blank">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="font-medium text-ink-950 underline-offset-4 hover:underline" href="/privacy" rel="noreferrer" target="_blank">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-ink-200 bg-white p-3 text-xs leading-5 text-ink-700">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-ink-950 accent-ink-950" />
        <span>
          Email me occasional product updates and practical lead-magnet tips. Optional, and I can unsubscribe at any time.
        </span>
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </AuthShell>
  );
}