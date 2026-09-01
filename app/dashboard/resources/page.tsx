"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import { UploadCloud, Lock, FileText, Trash2, Link2, Inbox } from "lucide-react";
import { syncWithDatabase, loadResources, loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

interface Resource {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export default function ResourcesPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load local data instantly
    const localResources = loadResources();
    const localAccount = loadAccount();
    if (localResources.length > 0) setResources(localResources);
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setResources(data.resources || []);
      }
    });
  }, []);

  const handleSimulatedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const id = Math.random().toString(36).substring(2, 9);
    const newResource: Resource = {
      id,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      url: `${window.location.origin}/r/${id}`,
    };

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addResource", data: newResource }),
      });

      if (res.ok) {
        setResources((prev) => [newResource, ...prev]);
      }
    } catch (err) {
      console.error("Failed to upload resource", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteResource", data: { id } }),
      });

      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete resource", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied link to clipboard!");
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading resources...</div>
      </div>
    );
  }

  return (
    <DashboardShell account={account} title="Hosted resource">
      <div className="flex flex-col min-h-[calc(100vh-3rem)]">
        <div className="flex-1 px-6 py-6 lg:px-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-1.5 text-3xl font-bold text-ink-950 dark:text-white">
                Hosted resource
                <span className="cursor-help rounded-full border border-ink-300 px-1.5 py-0 text-xs font-normal text-ink-500 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-400">?</span>
              </h2>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                Upload files once, then copy their links into any lead magnet.
              </p>
            </div>
            <div className="relative">
              <input
                type="file"
                id="resource-upload"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleSimulatedUpload}
                disabled={uploading}
              />
              <Button className="pointer-events-none">
                {uploading ? "Uploading..." : "+ Upload resource"}
              </Button>
            </div>
          </div>

          {/* Drag & Drop area */}
          <div className="relative mt-6 rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center transition hover:border-ink-400 dark:border-ink-700 dark:bg-ink-900">
            <input
              type="file"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleSimulatedUpload}
              disabled={uploading}
            />
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-ink-900 dark:text-white">
              {uploading ? "Uploading file, please wait..." : "Drop resources here, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-ink-400">
              PDF, ZIP, Office documents, text files and images · 50 MB per file · 1 GB total
            </p>
          </div>

          {/* Info Banner */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-3.5 text-xs text-ink-600 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-400">
            <Lock className="h-4 w-4 shrink-0 text-ink-500 mt-0.5" />
            <p>
              Files are private in storage and only you can manage them. Anyone you give a unique resource link to can{" "}
              <span className="text-brand-orange underline cursor-pointer">download that file</span>.
            </p>
          </div>

          {/* Resources list */}
          <div className="mt-4">
            {resources.length === 0 ? (
              <div className="rounded-2xl border border-ink-100 bg-white py-16 text-center dark:border-ink-800 dark:bg-ink-900">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink-50 text-ink-400 dark:bg-ink-800">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-ink-900 dark:text-white">No hosted resources yet</p>
                <p className="mt-1 text-xs text-ink-400">Upload your first file to get a reusable download link.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
                <table className="min-w-full divide-y divide-ink-200 dark:divide-ink-800">
                  <thead className="bg-ink-50 dark:bg-ink-950/40">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-500 uppercase">File Name</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-500 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-ink-500 uppercase">Uploaded</th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200 bg-white dark:divide-ink-800 dark:bg-ink-900">
                    {resources.map((resource) => (
                      <tr key={resource.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-ink-400" />
                            <span className="text-sm font-medium text-ink-900 dark:text-white">{resource.name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-ink-500">{formatBytes(resource.size)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-ink-500">{resource.uploadedAt}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyToClipboard(resource.url)}
                              className="flex items-center gap-1 rounded bg-brand-soft px-2.5 py-1 text-xs text-brand-orange hover:bg-brand-orange hover:text-white"
                            >
                              <Link2 className="h-3 w-3" /> Copy link
                            </button>
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="p-1 text-ink-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
