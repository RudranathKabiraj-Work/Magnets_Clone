"use client";

import { useEffect, useState } from "react";
import { User, KeyRound, AlertTriangle, Check, Trash2 } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { saveAccount, syncWithDatabase } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/data";

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

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data && data.account) {
        setAccount(data.account);
        setName(data.account.name || "");
        setEmail(data.account.email || "");
      }
      setLoading(false);
    });
  }, []);

  const handleUpdateName = async () => {
    if (!account) return;
    setUpdatingName(true);
    const updatedAccount = { ...account, name: name.trim() };
    try {
      await saveAccount(updatedAccount);
      setAccount(updatedAccount);
      alert("Name updated successfully!");
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

  const handleDeleteAccount = async () => {
    const confirmation = confirm(
      "WARNING: Deleting your account will permanently delete your magnets, signups, integrations, and domains. This action is irreversible. Are you sure?"
    );
    if (!confirmation) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveAccount", data: {} }),
      });
      if (res.ok) {
        alert("Account successfully deleted.");
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E10]">
        <div className="text-sm text-[#9B9085]">Loading account...</div>
      </div>
    );
  }

  const inputClass =
    "w-full max-w-lg rounded-md border border-[#2e2e38] bg-[#1C1C20] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-[#9B9085] focus:border-[#FE6F34] transition";

  const labelClass = "block text-xs font-medium text-[#9B9085] mb-1.5";

  return (
    <DashboardShell account={account} title="Account">
      <div className="flex flex-col min-h-[calc(100vh-3rem)]">
        <div className="flex-1 px-6 py-6 lg:px-8 w-full">

          {/* Page heading */}
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-white">
              Account
              <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-[#2e2e38] text-xs font-normal text-[#9B9085] hover:bg-[#1C1C20]">?</span>
            </h2>
            <p className="text-xs text-[#9B9085] mt-1">Password, identity, and danger zone.</p>
          </div>

          <div className="space-y-5">

            {/* Who you are */}
            <section className="rounded-lg border border-[#2e2e38] bg-[#1C1C20] p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#2e2e38] bg-[#252529] text-[#9B9085]">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Who you are</h4>
                  <p className="text-xs text-[#9B9085] mt-0.5">{email}</p>
                </div>
              </div>

              <div className="mt-5 pl-11 space-y-4 max-w-2xl">
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className={`${inputClass} opacity-50 cursor-not-allowed`}
                  />
                </div>

                <div className="pt-2 flex justify-end max-w-lg">
                  <button
                    onClick={handleUpdateName}
                    disabled={updatingName}
                    className="flex items-center gap-1.5 rounded-lg bg-[#FE6F34] px-5 py-2.5 text-xs font-semibold text-black hover:bg-[#e55e28] disabled:opacity-60 transition"
                  >
                    <Check className="h-3.5 w-3.5 text-black stroke-[2.5px]" />
                    {updatingName ? "Updating..." : "Update name"}
                  </button>
                </div>
              </div>
            </section>

            {/* Change password */}
            <section className="rounded-lg border border-[#2e2e38] bg-[#1C1C20] p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#2e2e38] bg-[#252529] text-[#9B9085]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Change password</h4>
                  <p className="text-xs text-[#9B9085] mt-0.5">Use at least 8 characters. Pick something you don't reuse elsewhere.</p>
                </div>
              </div>

              <div className="mt-5 pl-11 space-y-4 max-w-2xl">
                <div>
                  <label className={labelClass}>Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="pt-2 flex justify-end max-w-lg">
                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                    className="flex items-center gap-1.5 rounded-lg bg-[#FE6F34] px-5 py-2.5 text-xs font-semibold text-black hover:bg-[#e55e28] disabled:opacity-60 transition"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-black stroke-[2.5px]" />
                    {updatingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section className="rounded-lg border border-[#2e2e38] bg-[#1C1C20] p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#552e2e] bg-[#2a1414] text-[#FF8585]">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#FF8585]">Danger zone</h4>
                </div>
              </div>

              <div className="mt-[-8px] pl-11">
                <p className="text-xs text-[#9B9085] leading-relaxed">
                  Deleting your account removes your magnets, signups, integrations, and any custom domains attached to your account. This is permanent. There is no recovery.
                </p>

                <div className="mt-5 flex justify-start">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-md border border-[#2e2e38] bg-[#1C1C20] px-[14px] py-[8px] text-sm font-extrabold text-[#FF8585] hover:border-red-800 hover:text-red-400 disabled:opacity-60 transition"
                  >
                    <Trash2 className="h-4 w-4 stroke-[3px]" />
                    {deleting ? "Deleting..." : "Delete account"}
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#2e2e38] px-6 py-4 flex items-center justify-between text-xs text-[#9B9085]">
          <span>Magnets</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
          </div>
        </footer>
      </div>
    </DashboardShell>
  );
}