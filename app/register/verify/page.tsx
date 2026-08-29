"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  // Email verification is not required — redirect straight to onboarding.
  useEffect(() => {
    const dest = email
      ? `/register/onboarding?email=${encodeURIComponent(email)}`
      : "/register/onboarding";
    router.replace(dest);
  }, [email, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
      <div className="text-sm text-ink-500">Redirecting…</div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Redirecting…</div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
