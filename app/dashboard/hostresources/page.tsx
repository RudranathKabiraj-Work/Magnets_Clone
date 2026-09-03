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
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

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
        if (data.resources && data.resources.length > 0) {
          setResources(data.resources);
        }
      }
    });
  }, []);

  const handleSimulatedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const currentUserEmail = localStorage.getItem("currentUserEmail") || account?.email || "";
      if (currentUserEmail) {
        formData.append("userEmail", currentUserEmail);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setResources((prev) => {
          const updated = [json.data, ...prev];
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUserResources", JSON.stringify(updated));
          }
          return updated;
        });
      } else {
        alert(json.error || "Failed to upload file");
      }
    } catch (err) {
      console.error("Failed to upload resource", err);
      alert("Error uploading file");
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

  return (
    <DashboardShell account={account} title="Hosted resource">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-1.5 text-3xl font-bold text-zinc-900 dark:text-white">
                Hosted resource
                <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B]">?</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                Upload files once, then copy their links into any lead magnet.
              </p>
            </div>
            <div className="relative group">
              <input
                type="file"
                id="resource-upload"
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-20"
                onChange={handleSimulatedUpload}
                disabled={uploading}
              />
              <button
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white group-hover:bg-[#005291] group-hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all shadow-sm cursor-pointer"
              >
                <UploadCloud className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                {uploading ? "Uploading..." : "+ Upload resource"}
              </button>
            </div>
          </div>

          {/* Drag & Drop area */}
          <div className="relative mt-6 rounded-2xl border border-dashed border-[#0066B2]/40 bg-white p-12 text-center transition hover:border-[#0066B2] dark:border-[#0066B2]/35 dark:bg-[#18181B] dark:hover:border-[#0066B2]">
            <input
              type="file"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleSimulatedUpload}
              disabled={uploading}
            />
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-white">
              {uploading ? "Uploading file, please wait..." : "Drop resources here, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-[#9B9085]">
              PDF, ZIP, DOCX, XLSX, PPTX, Images, MP4, MP3, Audio, Video & any file type · Up to 50 MB per file
            </p>
          </div>

          {/* Info Banner */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#0066B2]/40 bg-[#EFF6FF] p-3.5 text-xs text-[#0066B2] dark:border-[#0066B2]/35 dark:bg-[#0066B2]/15 dark:text-[#38BDF8]">
            <Lock className="h-4 w-4 shrink-0 text-[#0066B2] dark:text-[#38BDF8] mt-0.5" />
            <p>
              Files are private in storage and only you can manage them. Anyone you give a unique resource link to can{" "}
              <span className="text-[#0066B2] dark:text-[#38BDF8] font-semibold underline cursor-pointer">download that file</span>.
            </p>
          </div>

          {/* Resources list */}
          <div className="mt-4">
            {resources.length === 0 ? (
              <div className="rounded-2xl border border-[#0066B2]/30 bg-white py-16 text-center dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-white">No hosted resources yet</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-[#9B9085]">Upload your first file to get a reusable download link.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm">
                <table className="min-w-full divide-y divide-[#E2E8F0] dark:divide-[#2e2e38]">
                  <thead className="bg-[#F8FBFF] dark:bg-[#151518]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">File Name</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Uploaded</th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/60 bg-white dark:divide-[#1C1C20] dark:bg-[#18181B]">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-[#EFF6FF]/50 dark:hover:bg-[#18181B]/40 transition">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#0066B2] dark:text-[#9B9085]" />
                            <span className="text-sm font-medium text-zinc-900 dark:text-white">{resource.name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-zinc-500 dark:text-[#9B9085]">{formatBytes(resource.size)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-zinc-500 dark:text-[#9B9085]">{resource.uploadedAt}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyToClipboard(resource.url)}
                              className="flex items-center gap-1 rounded bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#0066B2] hover:bg-[#0066B2] hover:text-white transition"
                            >
                              <Link2 className="h-3 w-3" /> Copy link
                            </button>
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="p-1 text-zinc-400 hover:text-red-600 transition"
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
