"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { MagnetsMark } from "@/components/brand";
import { Gift, Monitor, Rocket, BookOpen, CheckSquare, FileText, PlayCircle, GraduationCap, Tag, ShieldAlert, PlusCircle, ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("there");
  const [userSlug, setUserSlug] = useState("your-workspace");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form values
  const [selectedFormat, setSelectedFormat] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Pick a category");
  const [publishFrequency, setPublishFrequency] = useState("Pick a cadence");

  // Step 4 Modal values
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [creatingPage, setCreatingPage] = useState(false);

  useEffect(() => {
    if (email) {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getAccountByEmail", data: { email } }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.account) {
            const firstName = data.account.name.split(" ")[0];
            setUserName(firstName);
            setUserSlug(data.account.username || "your-workspace");
            if (typeof window !== "undefined") {
              localStorage.setItem("currentUserEmail", email.trim().toLowerCase());
              localStorage.setItem("currentUserAccount", JSON.stringify(data.account));
            }
          }
          setLoadingProfile(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingProfile(false);
        });
    } else {
      setLoadingProfile(false);
    }
  }, [email]);

  // Auto-generate URL slug as page name changes
  const handlePageNameChange = (name: string) => {
    setPageName(name);
    const slugified = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setPageSlug(slugified);
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageName.trim() || !pageSlug.trim()) return;

    setCreatingPage(true);
    const pageId = Math.random().toString(36).substring(2, 9);
    
    const newPage = {
      id: pageId,
      name: pageName.trim(),
      slug: pageSlug.trim(),
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: `Get your free ${pageName.trim()} now`,
      subheadline: "Enter your email address below to receive the resource directly in your inbox.",
      buttonText: "Receive Resource",
      emailSubject: `Your ${pageName.trim()} download link`,
      emailBody: `Hi there,\n\nThank you for requesting the ${pageName.trim()} resource. You can access it immediately by clicking the link below:\n\n[Download Resource]\n\nBest regards,\nThe Magnets Team`,
      accentColor: "#FE6F34",
      socialSharingImage: null,
      checkEmailUnique: false,
      customDomain: null,
    };

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addPage", data: newPage }),
      });

      if (res.ok) {
        router.push(`/dashboard/pages/${pageId}`);
      } else {
        alert("Failed to create page. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create page. Please try again.");
    } finally {
      setCreatingPage(false);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E10] text-[#9B9085]">
        <div className="text-sm">Loading onboarding details...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0E10] p-4 text-white font-sans">
      <div className="relative w-full max-w-2xl rounded-xl border border-[#1C1C20] bg-[#131316] overflow-hidden shadow-2xl flex flex-col min-h-[580px]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1C1C20] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-orange text-white">
              <MagnetsMark size="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block">Welcome to magnets</span>
              <h2 className="text-sm font-semibold text-white mt-0.5">Let's get you started, {userName}.</h2>
            </div>
          </div>
          <span className="text-xs font-semibold text-ink-500">{step} of 4</span>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-brand-orange" : "bg-[#1C1C20]"
              }`}
            />
          ))}
        </div>

        {/* Content Box */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1 rounded bg-[#2A1B15] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FF8C53]">
                  📖 The two-minute version
                </span>
                <h3 className="mt-3 text-lg font-bold text-white">Turn useful knowledge into an audience you can reach</h3>
                <p className="mt-2 text-xs text-ink-400 leading-relaxed max-w-xl">
                  A lead magnet is a useful free resource someone receives in exchange for their email. It gives them a quick win and gives you a relevant way to follow up, even if they are not ready to buy or book today.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[#1C1C20] bg-[#121214]/50 p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[#2A1B15] text-[#FF8C53] mb-3">
                    <Gift className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">Attract the right people</h4>
                  <p className="mt-1 text-[10px] text-ink-400 leading-relaxed">Focus on one problem your ideal customer already wants solved.</p>
                </div>
                <div className="rounded-lg border border-[#1C1C20] bg-[#121214]/50 p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[#2A1B15] text-[#FF8C53] mb-3">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">Capture real interest</h4>
                  <p className="mt-1 text-[10px] text-ink-400 leading-relaxed">Turn a passing visitor into someone you can reach again.</p>
                </div>
                <div className="rounded-lg border border-[#1C1C20] bg-[#121214]/50 p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[#2A1B15] text-[#FF8C53] mb-3">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">Build trust at scale</h4>
                  <p className="mt-1 text-[10px] text-ink-400 leading-relaxed">Deliver a useful result and follow up automatically.</p>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-950/20 bg-emerald-950/10 p-3 text-emerald-400 text-[11px] leading-relaxed">
                <strong>You can launch without a custom domain.</strong> Magnets gives you a working link immediately, and you can connect your own domain later.
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded bg-[#2A1B15] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FF8C53]">
                  🎯 Start small and specific
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">What could you give away?</h3>
                <p className="mt-1 text-xs text-ink-400">
                  The format matters less than the result. Choose one immediate problem, make the promise specific, and give people something they can use quickly.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                {[
                  { id: "ebook", label: "Guide / ebook", desc: "Teach one narrow topic with a clear, practical outcome.", icon: BookOpen },
                  { id: "checklist", label: "Checklist", desc: "Help someone complete a process without missing a step.", icon: CheckSquare },
                  { id: "template", label: "Template", desc: "Give them a useful starting point and save them time.", icon: FileText },
                  { id: "webinar", label: "Webinar replay", desc: "A useful format when it closely matches your audience's next step.", icon: PlayCircle },
                  { id: "course", label: "Course preview", desc: "A useful format when it closely matches your audience's next step.", icon: GraduationCap },
                  { id: "discount", label: "Discount code", desc: "A useful format when it closely matches your audience's next step.", icon: Tag },
                  { id: "audit", label: "Audit / scorecard", desc: "Help them understand where they are and what to do next.", icon: ShieldAlert },
                  { id: "other", label: "Other", desc: "A useful format when it closely matches your audience's next step.", icon: PlusCircle },
                ].map((item) => {
                  const selected = selectedFormat === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFormat(item.id)}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition w-full ${
                        selected
                          ? "border-brand-orange bg-[#241B15]"
                          : "border-[#1C1C20] bg-[#121214]/50 hover:bg-[#1C1C20]/50"
                      }`}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${selected ? "bg-brand-orange text-white" : "bg-[#1C1C20] text-ink-400"}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{item.label}</h4>
                        <p className="mt-0.5 text-[10px] text-[#9B9085] leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="inline-flex items-center gap-1 rounded bg-[#2A1B15] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FF8C53]">
                  ✨ Make it yours
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">Tell us what you're building</h3>
                <p className="mt-1 text-xs text-ink-400">
                  We use this context to give you a sensible publishing address and more relevant writing help.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#9B9085] mb-1.5">Business or creator name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business or creator name"
                    className="w-full rounded-md border border-[#1C1C20] bg-[#0E0E10] px-3.5 py-2.5 text-xs text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9B9085] mb-1.5">What kind of business is it?</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-md border border-[#1C1C20] bg-[#0E0E10] px-3.5 py-2.5 text-xs text-white outline-none focus:border-brand-orange cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239B9085' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                  >
                    <option disabled>Pick a category</option>
                    <option value="Solo creator">Solo creator</option>
                    <option value="Newsletter">Newsletter</option>
                    <option value="Small business">Small business</option>
                    <option value="SaaS product">SaaS product</option>
                    <option value="Agency">Agency</option>
                    <option value="Consultancy">Consultancy</option>
                    <option value="Coach">Coach</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9B9085] mb-1.5">How often do you expect to publish?</label>
                  <select
                    value={publishFrequency}
                    onChange={(e) => setPublishFrequency(e.target.value)}
                    className="w-full rounded-md border border-[#1C1C20] bg-[#0E0E10] px-3.5 py-2.5 text-xs text-white outline-none focus:border-brand-orange cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239B9085' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                  >
                    <option disabled>Pick a cadence</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6 text-center flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Your workspace is ready</span>
                <h3 className="mt-2 text-xl font-extrabold text-white">Let's make your first lead magnet</h3>
                <p className="mt-2 text-xs text-ink-400 leading-relaxed max-w-md mx-auto">
                  Start with one useful outcome. Magnets will guide you through the page, resource email, follow-up, and publishing.
                </p>
              </div>

              <div className="w-full max-w-md rounded-lg border border-[#1C1C20] bg-[#0E0E10]/80 p-4 text-left">
                <span className="text-[9px] font-bold text-[#9B9085] uppercase tracking-widest block">Your free publishing address</span>
                <span className="mt-1 block text-xs font-mono text-white/95">magnets.so/{userSlug}/...</span>
              </div>

              <div className="w-full max-w-sm text-left space-y-3.5 pt-2">
                <div className="flex items-center gap-3.5 text-xs text-ink-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1C1C20] text-[10px] font-bold text-[#FF8C53]">1</span>
                  <span>Create a focused page with a clear promise</span>
                </div>
                <div className="flex items-center gap-3.5 text-xs text-ink-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1C1C20] text-[10px] font-bold text-[#FF8C53]">2</span>
                  <span>Add the resource and delivery email</span>
                </div>
                <div className="flex items-center gap-3.5 text-xs text-ink-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1C1C20] text-[10px] font-bold text-[#FF8C53]">3</span>
                  <span>Preview, publish, and share your link</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-[#1C1C20] flex items-center justify-between bg-[#121214]/50">
          {step < 4 ? (
            <>
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1C1C20] px-4 py-2 text-xs font-semibold text-[#9B9085] hover:bg-[#1C1C20] hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={step === 2 && !selectedFormat}
                className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-bold text-white transition ${
                  step === 2 && !selectedFormat
                    ? "bg-brand-orange/45 cursor-not-allowed"
                    : "bg-brand-orange hover:bg-brand-orange/80"
                }`}
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-[10px] text-ink-500">Help is always available from the sidebar.</span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-orange/80 transition"
              >
                Create my first lead magnet <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

      </div>

      {/* Create Lead Magnet Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl border border-[#1C1C20] bg-[#131316] p-6 shadow-2xl text-white">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Create a magnet</h3>
                <p className="text-xs text-ink-400 mt-1">Name the page and choose its URL.</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); router.push("/dashboard"); }}
                className="rounded-lg p-1 text-ink-400 hover:bg-[#1C1C20] hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePage} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9B9085] mb-1.5">Page name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="AI Pipeline Playbook"
                  value={pageName}
                  onChange={(e) => handlePageNameChange(e.target.value)}
                  className="w-full rounded-md border border-[#1C1C20] bg-[#0E0E10] px-3.5 py-2.5 text-xs text-white outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9B9085] mb-1.5">URL slug</label>
                <div className="flex rounded-md border border-[#1C1C20] bg-[#0E0E10] focus-within:border-brand-orange">
                  <span className="flex items-center select-none pl-3.5 text-xs text-ink-500 font-medium">/</span>
                  <input
                    type="text"
                    required
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="w-full min-w-0 border-0 bg-transparent py-2.5 pl-1.5 pr-3 text-xs text-white outline-none focus:ring-0"
                    placeholder="ai-pipeline-playbook"
                  />
                </div>
                <span className="text-[10px] text-ink-500 block mt-1.5">The path of the page. Lowercase, digits, and hyphens only.</span>
              </div>

              {/* Modal Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1C1C20]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-[#1C1C20] px-4 py-2 text-xs font-semibold text-[#9B9085] hover:bg-[#1C1C20] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPage}
                  className="rounded-lg bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange/80 transition"
                >
                  {creatingPage ? "Creating..." : "+ Create page"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0E0E10] text-[#9B9085]">
        <div className="text-sm">Loading onboarding wizard...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
