"use client";

import { useEffect, useState } from "react";
import { User, KeyRound, ShieldAlert, Loader2 } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
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

    const updatedAccount = {
      ...account,
      name: name.trim(),
    };

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
      "WARNING: Deleting your account will permanently delete your magnets, signups, integrations, and domains. This action is irreversible. Are you sure you want to delete your account?"
    );
    if (!confirmation) return;

    setDeleting(true);

    try {
      // Clear data from MongoDB
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveAccount", data: {} }), // Reset account
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
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading account...</div>
      </div>
    );
  }

  return (
    <DashboardShell account={account} title="Account">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-10">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-ink-950 dark:text-white">
            Account
            <span className="cursor-help rounded-full border border-ink-300 px-1.5 py-0 text-xs font-normal text-ink-500 hover:bg-ink-100">?</span>
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Password, identity, and danger zone.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Who you are */}
          <section className="rounded-lg border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900/95">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-950 dark:text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-ink-400">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4>Who you are</h4>
                <p className="text-[11px] font-normal text-ink-400 mt-0.5">{email}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Name</FieldLabel>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-ink-50 cursor-not-allowed dark:bg-ink-950"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-ink-100 pt-4 dark:border-ink-800">
              <Button onClick={handleUpdateName} disabled={updatingName}>
                {updatingName ? "Updating..." : "Update name"}
              </Button>
            </div>
          </section>

          {/* Change password */}
          <section className="rounded-lg border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900/95">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-950 dark:text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-ink-50 text-ink-600 dark:bg-ink-800 dark:text-ink-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h4>Change password</h4>
                <p className="text-[11px] font-normal text-ink-400 mt-0.5">Use at least 8 characters. Pick something you don't reuse elsewhere.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Current password</FieldLabel>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
              </div>
              <div>
                <FieldLabel>New password</FieldLabel>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div>
                <FieldLabel>Confirm new password</FieldLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-ink-100 pt-4 dark:border-ink-800">
              <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
                {updatingPassword ? "Updating..." : "Update password"}
              </Button>
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-lg border border-red-200/50 bg-red-50/10 p-6 dark:border-red-950/20 dark:bg-red-950/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h4>Danger zone</h4>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              Deleting your account removes your magnets, signups, integrations, and any custom domains attached to your account. This is permanent. There is no recovery.
            </p>

            <div className="mt-5 pt-4 border-t border-red-200/30 dark:border-red-950/20">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700 border-red-600 focus:ring-red-500"
              >
                {deleting ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}