"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { CheckCircle2, Loader2, KeyRound } from "lucide-react";

import PasswordInputWithStrength from "@/components/ui/password-input-with-strength";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resetPassword",
          data: { token, newPassword: password },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2500);
      } else {
        setError(data.error || "Failed to reset password. The link may have expired.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        title="Invalid Reset Link"
        subtitle="This password reset link is invalid or incomplete."
        footer={
          <a className="font-medium text-ink-900 underline-offset-4 hover:underline" href="/forgot-password">
            Request a new reset link
          </a>
        }
      >
        <div className="rounded-md border border-brand-coral/30 bg-brand-coral/10 p-3 text-xs font-semibold text-brand-coral text-center">
          Missing reset token in URL parameters.
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell
        title="Password updated!"
        subtitle="Your password has been reset successfully."
        footer={
          <a className="font-medium text-ink-900 underline-offset-4 hover:underline" href="/login">
            Sign in with your new password
          </a>
        }
      >
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
          <p className="text-sm font-medium text-ink-700">
            Redirecting to login page in a moment...
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create new password"
      subtitle="Enter a new password for your account."
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
      <div className="block">
        <FieldLabel>New Password</FieldLabel>
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
        <FieldLabel>Confirm New Password</FieldLabel>
        <PasswordInputWithStrength
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          required
          showStrengthMeter={false}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating password...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>Reset password</span>
          </span>
        )}
      </Button>
    </AuthShell>
  );
}
