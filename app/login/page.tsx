"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";

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
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserEmail", email.trim().toLowerCase());
          if (data.account) {
            localStorage.setItem("currentUserAccount", JSON.stringify(data.account));
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
      onSubmit={handleSubmit}
      footer={
        <>
          New here?{" "}
          <a className="font-medium text-ink-900 underline-offset-4 hover:underline" href="/register">
            Create an account
          </a>
        </>
      }
    >
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
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
      <label className="block">
        <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium text-ink-700">
          Password
          <a className="font-medium text-ink-700 underline-offset-4 hover:text-ink-950 hover:underline dark:text-ink-300 dark:hover:text-white" href="/forgot-password">
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
        className="w-full relative overflow-hidden transition-all duration-200"
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