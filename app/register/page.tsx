"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { saveAccount } from "@/lib/store";

import PasswordInputWithStrength from "@/components/ui/password-input-with-strength";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<"idle" | "creating" | "opening">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setLoadingStatus("creating");
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
          setLoadingStatus("idle");
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
        brandColor: "#0066B2",
        logo: null,
        joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        isNewAccount: true,
      };

      // Save to MongoDB
      const saveRes = await saveAccount(newAccount);
      if (!saveRes.success) {
        setError(saveRes.error || "Failed to create account. Please try again.");
        setLoading(false);
        setLoadingStatus("idle");
        return;
      }

      // Transition button text to Opening dashboard...
      setLoadingStatus("opening");

      // Fire verification email in background — never blocks registration flow
      // (Resend sandbox only delivers to rudranath@bda.co.in; all other emails silently skip)
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendVerificationEmail", data: { email: email.trim(), name: name.trim() } }),
      }).catch(() => { /* silently ignore if Resend sandbox blocks delivery */ });

      // Always go straight to onboarding — no email verification gate
      setTimeout(() => {
        router.push(`/register/onboarding?email=${encodeURIComponent(email.trim())}`);
      }, 600);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
      setLoadingStatus("idle");
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
          <a className="font-medium text-zinc-900 dark:text-white underline-offset-4 hover:underline" href="/login">
            Sign in
          </a>
        </>
      }
    >
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400 text-center">
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
      <div className="block">
        <FieldLabel>Password</FieldLabel>
        <PasswordInputWithStrength
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          showStrengthMeter={true}
        />
      </div>
      <div className="block">
        <FieldLabel>Confirm password</FieldLabel>
        <PasswordInputWithStrength
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Type it again"
          autoComplete="new-password"
          required
          showStrengthMeter={false}
        />
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#191919] p-3 text-xs leading-5 text-zinc-700 dark:text-zinc-300">
        <input
          required
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 dark:border-zinc-700 text-[#0066B2] accent-[#0066B2]"
        />
        <span>
          I accept the{" "}
          <a className="font-medium text-zinc-900 dark:text-white underline-offset-4 hover:underline" href="/terms" rel="noreferrer" target="_blank">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="font-medium text-zinc-900 dark:text-white underline-offset-4 hover:underline" href="/privacy" rel="noreferrer" target="_blank">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#191919] p-3 text-xs leading-5 text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 dark:border-zinc-700 text-[#0066B2] accent-[#0066B2]" />
        <span>
          Email me occasional product updates and practical lead-magnet tips. Optional, and I can unsubscribe at any time.
        </span>
      </label>
      <Button
        type="submit"
        className="w-full bg-[#0066B2] hover:bg-[#005799] text-white font-bold h-11 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || !acceptedTerms}
      >
        {loadingStatus === "creating" && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </span>
        )}
        {loadingStatus === "opening" && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening dashboard...
          </span>
        )}
        {loadingStatus === "idle" && "Create account"}
      </Button>
    </AuthShell>
  );
}