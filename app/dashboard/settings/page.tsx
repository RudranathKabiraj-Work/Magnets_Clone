"use client";

import { useEffect, useState } from "react";
import { User, KeyRound, AlertTriangle, Check, Trash2, BarChart3, Database, MailOpen, Zap, HardDrive } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { saveAccount, syncWithDatabase, loadAccount, loadPages, loadLeads, loadSequences, loadResources, safeSetItem } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/data";

import PasswordInputWithStrength from "@/components/ui/password-input-with-strength";
import { getPlanLimits } from "@/lib/plan-limits";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [updatingName, setUpdatingName] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Account Usage & Limits State
  const [leadCount, setLeadCount] = useState(740);
  const [storageMb, setStorageMb] = useState(18.5);
  const [activeSequencesCount, setActiveSequencesCount] = useState(3);

  const planConfig = getPlanLimits(account?.plan || "Pro");
  const leadLimit = planConfig.leadLimit;
  const storageLimitMb = planConfig.storageLimitMb;
  const sequencesLimit = planConfig.sequencesLimit;

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    // Load local data instantly
    const localAccount = loadAccount();
    if (localAccount) {
      setAccount(localAccount);
      setName(localAccount.name || "");
      setEmail(localAccount.email || "");
    }

    const isDemo = !localAccount?.email || localAccount.email === "alex@rivera.studio";
    const localPages = loadPages();
    const localLeads = loadLeads();
    const localSeqs = loadSequences();
    const localRes = loadResources();

    const pageSignups = (localPages || []).reduce((sum: number, p: any) => sum + (p.signups || 0), 0);
    const leadsLen = (localLeads || []).length;
    const realLeads = isDemo ? Math.max(740, pageSignups, leadsLen) : Math.max(pageSignups, leadsLen);
    setLeadCount(realLeads);

    const liveSeqCount = (localSeqs || []).filter((s) => s.status === "live").length;
    setActiveSequencesCount(isDemo ? Math.max(3, liveSeqCount) : liveSeqCount);

    const resourceCount = (localRes || []).length;
    setStorageMb(isDemo ? parseFloat((Math.max(18.5, resourceCount * 2.8)).toFixed(1)) : parseFloat((resourceCount * 2.8).toFixed(1)));

    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        const curAcc = data.account || localAccount;
        const curIsDemo = !curAcc?.email || curAcc.email === "alex@rivera.studio";
        if (data.account) {
          setAccount(data.account);
          setName(data.account.name || "");
          setEmail(data.account.email || "");
        }
        
        const pList = data.pages || localPages || [];
        const lList = data.leads || localLeads || [];
        const sList = data.sequences || localSeqs || [];
        const rList = data.resources || localRes || [];

        const pSignups = pList.reduce((sum: number, p: any) => sum + (p.signups || 0), 0);
        const lCount = lList.length;
        setLeadCount(curIsDemo ? Math.max(740, pSignups, lCount) : Math.max(pSignups, lCount));

        const liveSeqs = sList.filter((s: any) => s.status === "live").length;
        setActiveSequencesCount(curIsDemo ? Math.max(3, liveSeqs) : liveSeqs);

        const rCount = rList.length;
        setStorageMb(curIsDemo ? parseFloat((Math.max(18.5, rCount * 2.8)).toFixed(1)) : parseFloat((rCount * 2.8).toFixed(1)));
      }
    });
  }, []);

  const handleUpdateName = async () => {
    if (!account) return;
    setUpdatingName(true);
    const updatedAccount = { ...account, name: name.trim() };
    try {
      const res = await saveAccount(updatedAccount);
      if (res.success && res.account) {
        setAccount(res.account);
        safeSetItem("currentUserAccount", JSON.stringify(res.account));
      } else {
        setAccount(updatedAccount);
        safeSetItem("currentUserAccount", JSON.stringify(updatedAccount));
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("accountUpdated"));
      }
      alert("Name updated successfully!");
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update name.");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePassword",
          data: { email: account!.email, currentPassword, newPassword },
        }),
      });
      if (res.ok) {
        alert("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }

    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteAccount",
          data: { email: account!.email, password: deletePassword },
        }),
      });
      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("currentUserAccount");
          localStorage.removeItem("currentUserEmail");
          localStorage.removeItem("currentUserPages");
          localStorage.removeItem("currentUserLeads");
          localStorage.removeItem("currentUserSequences");
          localStorage.removeItem("currentUserIntegrations");
          localStorage.removeItem("currentUserResources");
          localStorage.removeItem("sessionExpiry");
        }
        alert("Account successfully deleted.");
        router.push("/");
      } else {
        const errData = await res.json();
        setDeleteError(errData.error || "Failed to delete account.");
      }
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };



  const inputClass =
    "w-full max-w-lg rounded-md border border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2.5 text-[14.2px] text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#9B9085] focus:border-[#0066B2] transition";

  const labelClass = "block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5";

  return (
    <DashboardShell account={account} title="Account">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8 w-full">

          {/* Page heading */}
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-900 dark:text-white">
              Account
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B]">?</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Password, identity, and danger zone.</p>
          </div>

          <div className="space-y-5 rounded-3xl bg-gradient-to-b from-[#EFF6FF]/60 via-transparent to-transparent dark:from-[#0066B2]/5 dark:via-transparent dark:to-transparent p-1.5 sm:p-2">

            {/* Who you are */}
            <section className="rounded-2xl border border-[#0066B2]/40 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/30 dark:bg-[#1a2638] text-[#0066B2]">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Who you are</h4>
                  <p className="text-[12.2px] text-[#71717a] dark:text-[#9B9085] mt-0.5">{email}</p>
                </div>
              </div>

              <div className="mt-5 pl-12 space-y-4 max-w-2xl">
                <div>
                  <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full max-w-lg rounded-md border border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#121214] px-3.5 py-2.5 text-[14.2px] text-zinc-900 dark:text-white outline-none placeholder:text-[#9B9085] focus:border-[#0066B2] transition"
                  />
                </div>
                <div>
                  <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full max-w-lg rounded-md border border-[#E2E8F0] bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#121214] px-3.5 py-2.5 text-[14.2px] text-zinc-500 dark:text-white outline-none opacity-60 cursor-not-allowed transition"
                  />
                </div>

                <div className="pt-2 flex justify-end max-w-lg">
                  <button
                    onClick={handleUpdateName}
                    disabled={updatingName}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-5 py-2.5 text-[12.2px] font-bold text-white hover:bg-[#005799] disabled:opacity-60 transition shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5 text-white stroke-[2.5px]" />
                    {updatingName ? "Updating..." : "Update name"}
                  </button>
                </div>
              </div>
            </section>



            {/* Change password */}
            <section className="rounded-2xl border border-[#0066B2]/40 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/30 dark:bg-[#1a2638] text-[#0066B2]">
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Change password</h4>
                  <p className="text-[12.2px] text-[#71717a] dark:text-[#9B9085] mt-0.5">Use at least 8 characters. Pick something you don't reuse elsewhere.</p>
                </div>
              </div>

              <div className="mt-5 pl-12 space-y-4 max-w-lg">
                <div>
                  <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">Current password</label>
                  <PasswordInputWithStrength
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    showStrengthMeter={false}
                  />
                </div>
                <div>
                  <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">New password</label>
                  <PasswordInputWithStrength
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    showStrengthMeter={true}
                  />
                </div>
                <div>
                  <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">Confirm new password</label>
                  <PasswordInputWithStrength
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Type it again"
                    autoComplete="new-password"
                    showStrengthMeter={false}
                  />
                </div>

                <div className="pt-2 flex justify-end max-w-lg">
                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-5 py-2.5 text-[12.2px] font-bold text-white hover:bg-[#005799] disabled:opacity-60 transition shadow-sm"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-white stroke-[2.5px]" />
                    {updatingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#18181B] p-6 transition-colors shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 dark:border-[#552e2e] dark:bg-[#2a1414] text-red-600 dark:text-[#FF8585]">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14.2px] font-bold text-red-600 dark:text-[#FF8585]">Danger zone</h4>
                  <p className="text-[12.2px] text-[#9B9085] leading-relaxed mt-1">
                    Deleting your account removes your magnets, signups, integrations, and any custom domains attached to your account. This is permanent. There is no recovery.
                  </p>

                  {deleteError && (
                    <div className="mt-3 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded p-2 max-w-md">
                      {deleteError}
                    </div>
                  )}

                  {!showDeleteConfirm ? (
                    <div className="mt-5 flex justify-start">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-[14px] py-[8px] text-sm font-extrabold text-red-600 dark:text-[#FF8585] hover:border-red-400 dark:hover:border-red-800 transition"
                      >
                        <Trash2 className="h-4 w-4 stroke-[3px]" />
                        Delete account
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleDeleteAccount} className="mt-5 space-y-4 max-w-2xl">
                      <div>
                        <label className={labelClass}>
                          Confirm with your password
                        </label>
                        <input
                          type="password"
                          required
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Type DELETE to confirm
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="DELETE"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className={inputClass}
                        />
                        <span className="block text-[10px] text-[#5c5650] mt-1">Case-sensitive.</span>
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword("");
                            setDeleteConfirmText("");
                            setDeleteError("");
                          }}
                          className="rounded-md border border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-[14px] py-[8px] text-sm font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2e2e38] transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={deleting}
                          className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-[14px] py-[8px] text-sm font-extrabold text-red-600 dark:text-[#FF8585] hover:border-red-400 dark:hover:border-red-800 disabled:opacity-60 transition"
                        >
                          <Trash2 className="h-4 w-4 stroke-[3px]" />
                          {deleting ? "Deleting..." : "Delete permanently"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>

        <footer className="mt-auto border-t border-[#E2E8F0] dark:border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-zinc-500 dark:text-[#9B9085]">
          <span>LeadMagnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>
    </DashboardShell>
  );
}