"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";

import { safeSetItem, setSessionExpiry } from "@/lib/store";

import GoogleAuthButton from "@/components/ui/google-auth-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "authenticating" | "opening_dashboard">("idle");
  const [error, setError] = useState("");

  const loading = status !== "idle";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("authenticating");
    setError("");

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", data: { email: email.trim(), password } }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.success) {
        // Set HTTP-Only session cookie via auth endpoint
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), name: data.account?.name }),
        }).catch(console.error);

        if (typeof window !== "undefined") {
          safeSetItem("currentUserEmail", email.trim().toLowerCase());
          setSessionExpiry(7);
          if (data.account) {
            safeSetItem("currentUserAccount", JSON.stringify(data.account));
          }
        }
        setStatus("opening_dashboard");
        router.push("/dashboard/leadmagnets");
      } else {
        setError(data?.error || (res.ok ? "Failed to login. Please check database connection." : "Incorrect password or account not found."));
        setStatus("idle");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err?.message || "Failed to sign in. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Use your email and password to continue."
      showSidecar={false}
      onSubmit={handleSubmit}
      footer={
        <>
          New here?{" "}
          <Link className="font-semibold text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline" href="/register">
            Create an account
          </Link>
        </>
      }
    >
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}
      {/* Continue with Google Button */}
      <GoogleAuthButton callbackUrl="/dashboard/leadmagnets" disabled={loading} />

      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200/70 dark:border-zinc-800/80" />
        </div>
        <span className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-0.5 rounded-full border border-zinc-200/40 dark:border-zinc-800/60 text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
          or sign in with email
        </span>
      </div>

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
      <label className="block">
        <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Password
          <a className="font-semibold text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline" href="/forgot-password">
            Forgot password?
          </a>
        </span>
        <Input
          autoComplete="current-password"
          type="password"
          placeholder="At least 8 characters"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      <Button
        type="submit"
        className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        disabled={loading}
      >
        {status === "authenticating" && (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-white/90" />
            <span>Signing in...</span>
          </span>
        )}
        {status === "opening_dashboard" && (
          <span className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
            <span>Opening dashboard...</span>
            <Loader2 className="h-3.5 w-3.5 animate-spin opacity-80" />
          </span>
        )}
        {status === "idle" && (
          <span className="flex items-center gap-1.5">
            <span>Sign in</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </Button>
    </AuthShell>
  );
}