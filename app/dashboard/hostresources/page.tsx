"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
  UploadCloud,
  Lock,
  FileText,
  Trash2,
  Link2,
  Search,
  Check,
  HardDrive,
  Layers,
  Download,
  FileCode,
  Image as ImageIcon,
  Film,
  Archive,
  Sparkles,
  AlertCircle,
  X,
  Send,
  Loader2,
  Plus
} from "lucide-react";
import { syncWithDatabase, loadResources, loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

interface Resource {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function ResourcesPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "docs" | "images" | "media" | "archives">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size" | "name">("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    // Load local data instantly
    const localResources = loadResources().filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
    const localAccount = loadAccount();
    if (localResources.length > 0) setResources(localResources);
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        if (data.resources) {
          const filtered = data.resources.filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
          setResources(filtered);
        }
      }
    });
  }, []);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const uploadFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      addToast("error", "File size exceeds maximum limit of 50 MB.");
      return;
    }

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
        addToast("success", `"${file.name}" uploaded successfully and ready for delivery!`);
      } else {
        addToast("error", json.error || "Failed to upload file");
      }
    } catch (err) {
      console.error("Failed to upload resource", err);
      addToast("error", "Error uploading file. Please try again.");
    } finally {
      setUploading(false);
      setIsDragOver(false);
    }
  };

  const handleSimulatedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const confirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteResource", data: { id: resourceToDelete.id } }),
      });

      if (res.ok) {
        setResources((prev) => {
          const updated = prev.filter((r) => r.id !== resourceToDelete.id);
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUserResources", JSON.stringify(updated));
          }
          return updated;
        });
        addToast("info", `Resource "${resourceToDelete.name}" deleted.`);
      } else {
        addToast("error", "Failed to delete resource");
      }
    } catch (err) {
      console.error("Failed to delete resource", err);
      addToast("error", "Error deleting resource.");
    } finally {
      setIsDeleting(false);
      setResourceToDelete(null);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast("success", "Link copied! Paste it into lead magnets or email sequences.");
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Extension helpers for icons & badges
  const getFileCategory = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["pdf", "doc", "docx", "txt", "rtf", "xlsx", "pptx"].includes(ext)) return "docs";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "images";
    if (["mp4", "mp3", "mov", "avi", "wav", "m4a"].includes(ext)) return "media";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archives";
    return "docs";
  };

  const getFileBadge = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "file";
    const category = getFileCategory(filename);

    switch (category) {
      case "images":
        return {
          icon: <ImageIcon className="h-4 w-4 text-emerald-500" />,
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          ext: ext.toUpperCase(),
        };
      case "media":
        return {
          icon: <Film className="h-4 w-4 text-purple-500" />,
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          ext: ext.toUpperCase(),
        };
      case "archives":
        return {
          icon: <Archive className="h-4 w-4 text-amber-500" />,
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          ext: ext.toUpperCase(),
        };
      default:
        if (ext === "pdf") {
          return {
            icon: <FileText className="h-4 w-4 text-red-500" />,
            bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
            ext: "PDF",
          };
        }
        return {
          icon: <FileCode className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />,
          bg: "bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] border-[#0066B2]/20",
          ext: ext.toUpperCase(),
        };
    }
  };

  // Filtering & Sorting
  const totalSizeBytes = resources.reduce((acc, r) => acc + (r.size || 0), 0);
  const maxStorageBytes = 500 * 1024 * 1024; // 500 MB quota
  const storagePercentage = Math.min(100, Math.round((totalSizeBytes / maxStorageBytes) * 100));

  const filteredResources = resources
    .filter((r: any) => {
      // Exclude page presentation assets/lead magnet images if marked as page assets
      if (r.isPageAsset === true || r.type === "page_asset" || (r.name && r.name.startsWith("page_asset_"))) {
        return false;
      }
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeCategory === "all") return true;
      return getFileCategory(r.name) === activeCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return (b.size || 0) - (a.size || 0);
      if (sortBy === "oldest") return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id); // Default newest
    });

  return (
    <DashboardShell account={account} title="Hosted Resources">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/50 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]"
      >

        {/* Global Drag Overlay when dragging files anywhere onto the page */}
        {isDragOver && resources.length > 0 && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0066B2]/80 backdrop-blur-md text-white p-6 animate-in fade-in duration-200">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-2xl animate-bounce">
              <UploadCloud className="h-10 w-10 text-white" />
            </div>
            <h3 className="mt-4 text-2xl font-bold">Drop your file to upload instantly</h3>
            <p className="mt-1 text-sm text-blue-100">Supports PDF, DOCX, ZIP, MP4, Images up to 50 MB</p>
          </div>
        )}

        <div className="flex-1 px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Hosted Resources
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-3 w-3" /> Ready for Email Delivery
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                Upload lead magnet files once, then seamlessly deliver download links to your leads upon signup.
              </p>
            </div>

            <div className="relative group shrink-0">
              <input
                type="file"
                id="resource-upload-header"
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-20"
                onChange={handleSimulatedUpload}
                disabled={uploading}
              />
              <button
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] group-hover:bg-[#004A85] px-4 py-2.5 text-xs font-semibold text-white shadow-sm group-hover:shadow-md group-hover:shadow-[#0066B2]/30 disabled:opacity-60 transition-colors duration-200 cursor-pointer border border-white/20 group-hover:border-white/40 dark:border-white/10"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Uploading file...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 stroke-[2.25] transition-transform duration-300 group-hover:rotate-90" />
                    <span className="tracking-tight">Upload New Resource</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Premium Overview Metrics Bar */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">Total Resources</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{resources.length} {resources.length === 1 ? "File" : "Files"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-[#0066B2]" /> Storage Used
                </p>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{formatBytes(totalSizeBytes)}</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#25252A]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(storagePercentage, 2)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">Email Delivery Status</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active & Automated
                </p>
              </div>
            </div>
          </div>

          {/* Option 1: SMART EMPTY STATE DROPZONE (Only rendered when user has NO files) */}
          {resources.length === 0 && (
            <div className="relative mt-6 rounded-2xl border-2 border-dashed border-[#0066B2]/40 bg-white/90 p-12 text-center backdrop-blur-sm hover:border-[#0066B2] dark:border-[#0066B2]/40 dark:bg-[#18181B]/90 shadow-sm transition-all">
              <input
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0 z-10"
                onChange={handleSimulatedUpload}
                disabled={uploading}
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                {uploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                {uploading ? "Uploading document..." : "Drag & Drop your first lead magnet file here"}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-[#9B9085]">
                PDF, DOCX, ZIP, Images, MP4, MP3 & any file type · Up to 50 MB per file
              </p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#005291] transition cursor-pointer">
                <UploadCloud className="h-4 w-4" /> Browse File from Device
              </button>
            </div>
          )}

          {/* Email Integration Guarantee Banner */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#0066B2]/30 bg-[#EFF6FF]/80 p-4 text-xs text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/15 dark:text-[#38BDF8] backdrop-blur-sm">
            <Lock className="h-4 w-4 shrink-0 text-[#0066B2] dark:text-[#38BDF8] mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold text-zinc-900 dark:text-white">Email Delivery Guarantee:</strong> All hosted resources generate unique secure links (<code className="px-1.5 py-0.5 bg-white/70 dark:bg-[#18181B] rounded text-[11px] font-mono">/r/[id]</code>) that are automatically attached to your lead magnet signup forms. Your subscribers can instantly download these files upon submitting their email.
            </p>
          </div>

          {/* Search & Filter Toolbar (Only when files exist or searching) */}
          {resources.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {(
                  [
                    { id: "all", label: "All Files" },
                    { id: "docs", label: "Documents" },
                    { id: "images", label: "Images" },
                    { id: "media", label: "Audio & Video" },
                    { id: "archives", label: "Archives" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeCategory === tab.id
                      ? "bg-[#0066B2] text-white shadow-sm"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-[#18181B] dark:text-zinc-400 dark:hover:bg-[#25252A]"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search & Sort */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-white dark:placeholder-zinc-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-zinc-300 cursor-pointer"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="size">Sort: File Size</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>
              </div>
            </div>
          )}

          {/* Resources Table */}
          {resources.length > 0 && (
            <div className="mt-4">
              {filteredResources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 py-12 text-center dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm backdrop-blur-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                    No matching resources found
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-[#9B9085]">
                    Try clearing your search term or changing category filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200/80 dark:divide-[#2e2e38]">
                      <thead className="bg-[#F8FBFF] dark:bg-[#151518]">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Resource Name</th>
                          <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Size</th>
                          <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Uploaded Date & Time</th>
                          <th className="px-6 py-3.5 text-right text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white dark:divide-[#222228] dark:bg-[#18181B]">
                        {filteredResources.map((resource) => {
                          const badge = getFileBadge(resource.name);
                          const isCopied = copiedId === resource.id;

                          return (
                            <tr key={resource.id} className="hover:bg-[#EFF6FF]/40 dark:hover:bg-[#1C1C22]/60 transition-colors">
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${badge.bg}`}>
                                    {badge.icon}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-xs md:max-w-md">
                                      {resource.name}
                                    </p>
                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                      {badge.ext}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {formatBytes(resource.size)}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {resource.uploadedAt}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Direct Download Link */}
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Test download file"
                                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 dark:hover:bg-[#282830] transition shadow-xs"
                                  >
                                    <Download className="h-3.5 w-3.5 text-zinc-500" /> Direct Test
                                  </a>

                                  {/* Copy Link Button */}
                                  <button
                                    onClick={() => copyToClipboard(resource.url, resource.id)}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-xs cursor-pointer ${isCopied
                                      ? "bg-emerald-500 text-white"
                                      : "bg-[#0066B2] text-white hover:bg-[#005291]"
                                      }`}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-white" /> Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Link2 className="h-3.5 w-3.5" /> Copy Link
                                      </>
                                    )}
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => setResourceToDelete(resource)}
                                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition cursor-pointer"
                                    title="Delete Resource"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {resourceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Delete Hosted Resource?</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-[#9B9085]">
                Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{resourceToDelete.name}</strong>? Any active lead magnet forms or emails linking to this file link will no longer be able to access it.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setResourceToDelete(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 dark:hover:bg-[#282830] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Delete Resource</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification Container — Glassmorphic Right Stack */}
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none max-w-sm w-full flex flex-col-reverse gap-2 items-end">
          {toasts.map((toast, idx) => {
            const reverseIdx = toasts.length - 1 - idx;
            const translateY = -reverseIdx * 6;
            const scale = Math.max(0.88, 1 - reverseIdx * 0.04);

            return (
              <div
                key={toast.id}
                style={{
                  transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                  transformOrigin: "bottom right",
                  zIndex: 100 - reverseIdx,
                }}
                className={`w-full pointer-events-auto flex items-center gap-3 rounded-2xl p-4 text-xs font-bold shadow-2xl backdrop-blur-2xl border transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 ring-1 ring-white/10 ${toast.type === "success"
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-100 shadow-black/80"
                  : toast.type === "error"
                    ? "bg-red-950/50 border-red-500/40 text-red-100 shadow-black/80"
                    : "bg-black/60 border-white/20 text-white shadow-black/80"
                  }`}
              >
                {toast.type === "success" && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
                {toast.type === "info" && <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />}
                <span className="flex-1 leading-snug">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-zinc-400 hover:text-white transition cursor-pointer p-0.5 rounded-md hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
