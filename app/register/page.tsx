"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
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
      const { saveAccount } = await import("@/lib/store");
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
      subtitle="Free forever • No credit card required"
      onSubmit={handleSubmit}
      footer={
        <div className="text-xs">
          Already have an account?{" "}
          <Link className="font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-4" href="/login">
            Sign in
          </Link>
        </div>
      }
    >
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-semibold text-red-600 dark:text-red-400 text-center shadow-sm">
          {error}
        </div>
      )}

      {/* Continue with Google Button */}
      <button
        type="button"
        onClick={() => {
          const { signIn } = require("next-auth/react");
          signIn("google", { callbackUrl: "/register/onboarding" });
        }}
        className="w-full h-9 flex items-center justify-center gap-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="relative my-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200/60 dark:border-zinc-800/80" />
        </div>
        <span className="relative bg-[#F7F5F1] dark:bg-[#08080c] px-2 text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
          or sign up with email
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <FieldLabel>Full Name</FieldLabel>
          <div className="relative mt-0.5">
            <Input
              autoComplete="name"
              autoFocus
              type="text"
              placeholder="e.g. Alex Morgan"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Work Email</FieldLabel>
          <div className="relative mt-0.5">
            <Input
              autoComplete="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Password</FieldLabel>
          <div className="mt-0.5">
            <PasswordInputWithStrength
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              showStrengthMeter={true}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Confirm Password</FieldLabel>
          <div className="mt-0.5">
            <PasswordInputWithStrength
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
              showStrengthMeter={false}
            />
          </div>
        </div>

        <div className="pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition">
            <input
              required
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="h-3.5 w-3.5 shrink-0 rounded border-zinc-300 dark:border-zinc-700 text-[#0066B2] accent-[#0066B2] transition focus:ring-0 cursor-pointer"
            />
            <span>
              I accept the{" "}
              <a className="font-semibold text-zinc-800 dark:text-zinc-200 underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400" href="/terms" rel="noreferrer" target="_blank">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="font-semibold text-zinc-800 dark:text-zinc-200 underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400" href="/privacy" rel="noreferrer" target="_blank">
                Privacy Policy
              </a>
              .
            </span>
          </label>
        </div>
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          className="group relative w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          disabled={loading || !acceptedTerms}
        >
          {loadingStatus === "creating" && (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating account...
            </span>
          )}
          {loadingStatus === "opening" && (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Opening dashboard...
            </span>
          )}
          {loadingStatus === "idle" && (
            <span className="inline-flex items-center justify-center gap-2">
              Create account
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </div>
    </AuthShell>
  );
}