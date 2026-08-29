"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { syncWithDatabase } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", data: { email: email.trim(), password } }),
      });

      if (res.ok) {
        const loginData = await res.json();
        if (loginData.success) {
          router.push("/dashboard/pages");
        } else {
          setError("Failed to login. Please check database connection.");
        }
      } else {
        const errData = await res.json();
        setError(errData.error || "Incorrect password or account not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
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
          <a className="font-medium text-ink-700 underline-offset-4 hover:text-ink-950 hover:underline" href="/forgot-password">
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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </AuthShell>
  );
}