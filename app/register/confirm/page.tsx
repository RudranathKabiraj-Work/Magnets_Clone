"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";

function ConfirmPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    // Simulate updating active user profile state in MongoDB
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Redirect to onboarding
      router.push(`/register/onboarding?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Confirm your email"
      subtitle="One last step. Confirm this address to activate your Magnets account."
      footer={
        <a className="text-xs font-semibold text-ink-500 hover:text-ink-950 transition" href={`/register/verify?email=${encodeURIComponent(email)}`}>
          Request a new link
        </a>
      }
    >
      <div className="w-full flex h-14 items-center justify-center rounded-lg bg-emerald-500/5 border border-emerald-500/15 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <Button onClick={handleConfirm} disabled={loading} className="w-full">
        {loading ? "Activating account..." : "Verify email address"}
      </Button>
    </AuthShell>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading verification details...</div>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
}
