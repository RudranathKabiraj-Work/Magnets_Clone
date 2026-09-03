"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  FileText,
  Gift,
  Image as ImageIcon,
  Loader2,
  Palette,
  Rocket,
  Type,
  Mail,
  Clock,
  Home,
  Undo2,
  Redo2,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  BarChart2,
  QrCode,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
  HelpCircle,
  Monitor,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type MagnetPage } from "@/lib/data";
import { loadPages, savePages, deletePage, loadAccount, loadResources, syncWithDatabase } from "@/lib/store";
import AIMagnetModal from "@/components/leadmagnets/ai-magnet-modal";
import SocialCardModal from "@/components/leadmagnets/social-card-modal";

function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function EditLeadMagnetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState(() => loadAccount());
  const [page, setPage] = useState<MagnetPage | undefined>(() => loadPages().find((p) => p.id === params.id));

  // Modal & Menu States
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [hostedResources, setHostedResources] = useState<any[]>([]);
  const [showInsertResourceMenu, setShowInsertResourceMenu] = useState(false);

  useEffect(() => {
    // 1. Instantly load local resources
    const local = loadResources();
    if (local && local.length > 0) {
      setHostedResources(local);
      const latestResource = local[0];
      if (latestResource && latestResource.url) {
        setEmailBody((prev) => (!prev.includes("http") ? `${prev}\n\n${latestResource.url}` : prev));
      }
    }

    // 2. Sync with database
    syncWithDatabase().then((data) => {
      if (data && data.resources && data.resources.length > 0) {
        setHostedResources(data.resources);
        const latestResource = data.resources[0];
        if (latestResource && latestResource.url) {
          setEmailBody((prev) => (!prev.includes("http") ? `${prev}\n\n${latestResource.url}` : prev));
        }
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<"landing" | "email" | "sequence" | "after">("landing");

  // Page Content Initial Values
  const initialHeadline = page ? (page.headline && page.headline !== "hi" ? page.headline : (page.name || "")) : "";
  const initialSubheadline = page ? (page.subheadline && page.subheadline !== "Enter your email to get instant access." ? page.subheadline : "") : "";
  const initialPitch = page?.pitch || "";
  const initialBullets = page?.bullets || [];
  const initialImage = page?.imageUrl !== undefined ? page.imageUrl : null;
  const initialEmailSubject = page?.emailSubject || "Here is your requested resource";
  const initialEmailPreviewText = page?.emailPreviewText || "Click below to access your free download.";
  const initialEmailBody = page?.emailBody || "Hey {name},\n\nThank you for requesting this resource! Click the link below to get instant access.\n\nEnjoy!";

  // Page Content State (Tab 1: Landing)
  const [headline, setHeadline] = useState(initialHeadline);
  const [subheadline, setSubheadline] = useState(initialSubheadline);
  const [pitch, setPitch] = useState(initialPitch);
  const [bullets, setBullets] = useState<string[]>(initialBullets);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const [newBulletText, setNewBulletText] = useState("");
  const [showAddBullet, setShowAddBullet] = useState(false);

  // Delivery Email State (Tab 2: Delivery Email)
  const [emailSubject, setEmailSubject] = useState(initialEmailSubject);
  const [emailPreviewText, setEmailPreviewText] = useState(initialEmailPreviewText);
  const [emailBody, setEmailBody] = useState(initialEmailBody);

  // Sequence State (Tab 3: Sequence)
  const [sequenceEnabled, setSequenceEnabled] = useState(page?.sequenceEnabled || false);
  const [stopOnCall, setStopOnCall] = useState(page?.stopOnCall !== undefined ? page.stopOnCall : true);
  const [sequenceEmails, setSequenceEmails] = useState<{ id: string; subject: string; delayDays: number; body: string }[]>(page?.sequenceEmails || []);

  // Feature 2: Smart Auto-Personalized Deliverable State
  const [customPromptQuestion, setCustomPromptQuestion] = useState(page?.customPromptQuestion || "What is your main goal or bottleneck?");
  const [customPromptPlaceholder, setCustomPromptPlaceholder] = useState(page?.customPromptPlaceholder || "e.g. Scaling outreach, Lead generation");
  const [enableAiPersonalizedDeliverable, setEnableAiPersonalizedDeliverable] = useState(page?.enableAiPersonalizedDeliverable || false);

  // After Signup State (Tab 4: After Signup)
  const [afterSignupOption, setAfterSignupOption] = useState<"standard" | "elsewhere" | "custom">(page?.afterSignupOption || "standard");
  const [destinationUrl, setDestinationUrl] = useState(page?.destinationUrl || "");
  const [customHeading, setCustomHeading] = useState(page?.customHeading || "");
  const [customMessage, setCustomMessage] = useState(page?.customMessage || "");
  const [videoUrl, setVideoUrl] = useState(page?.videoUrl || "");
  const [buttonLabel, setButtonLabel] = useState(page?.buttonLabel || "");
  const [buttonUrl, setButtonUrl] = useState(page?.buttonUrl || "");
  const [quizFunnelEnabled, setQuizFunnelEnabled] = useState(page?.quizFunnelEnabled || false);

  // Comprehensive Undo/Redo History State across All 4 Tabs
  const [history, setHistory] = useState<{
    headline: string;
    subheadline: string;
    pitch: string;
    bullets: string[];
    imageUrl: string | null;
    emailSubject: string;
    emailPreviewText: string;
    emailBody: string;
    sequenceEnabled: boolean;
    stopOnCall: boolean;
    sequenceEmails: { id: string; subject: string; delayDays: number; body: string }[];
    afterSignupOption: "standard" | "elsewhere" | "custom";
    destinationUrl: string;
    customHeading: string;
    customMessage: string;
    videoUrl: string;
    buttonLabel: string;
    buttonUrl: string;
    quizFunnelEnabled: boolean;
  }[]>(() => [
    {
      headline: initialHeadline,
      subheadline: initialSubheadline,
      pitch: initialPitch,
      bullets: initialBullets,
      imageUrl: initialImage,
      emailSubject: initialEmailSubject,
      emailPreviewText: initialEmailPreviewText,
      emailBody: initialEmailBody,
      sequenceEnabled: page?.sequenceEnabled || false,
      stopOnCall: page?.stopOnCall !== undefined ? page.stopOnCall : true,
      sequenceEmails: page?.sequenceEmails || [],
      afterSignupOption: page?.afterSignupOption || "standard",
      destinationUrl: page?.destinationUrl || "",
      customHeading: page?.customHeading || "",
      customMessage: page?.customMessage || "",
      videoUrl: page?.videoUrl || "",
      buttonLabel: page?.buttonLabel || "",
      buttonUrl: page?.buttonUrl || "",
      quizFunnelEnabled: page?.quizFunnelEnabled || false,
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoRef = useRef(false);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autosave Status State
  const [saveStatus, setSaveStatus] = useState<"autosaved" | "saving">("autosaved");
  const isInitialMount = useRef(true);

  // Media & Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const subheadlineRef = useRef<HTMLTextAreaElement>(null);
  const pitchRef = useRef<HTMLTextAreaElement>(null);

  // Undo / Redo Actions & Conditions
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0 || !history[historyIndex - 1]) return;
    const prevIndex = historyIndex - 1;
    const target = history[prevIndex];
    isUndoRedoRef.current = true;
    setHeadline(target.headline);
    setSubheadline(target.subheadline);
    setPitch(target.pitch);
    setBullets([...target.bullets]);
    setImageUrl(target.imageUrl);

    setEmailSubject(target.emailSubject);
    setEmailPreviewText(target.emailPreviewText);
    setEmailBody(target.emailBody);

    setSequenceEnabled(target.sequenceEnabled);
    setStopOnCall(target.stopOnCall);
    setSequenceEmails([...target.sequenceEmails]);

    setAfterSignupOption(target.afterSignupOption);
    setDestinationUrl(target.destinationUrl);
    setCustomHeading(target.customHeading);
    setCustomMessage(target.customMessage);
    setVideoUrl(target.videoUrl);
    setButtonLabel(target.buttonLabel);
    setButtonUrl(target.buttonUrl);
    setQuizFunnelEnabled(target.quizFunnelEnabled);

    setHistoryIndex(prevIndex);
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < 0 || historyIndex >= history.length - 1 || !history[historyIndex + 1]) return;
    const nextIndex = historyIndex + 1;
    const target = history[nextIndex];
    isUndoRedoRef.current = true;
    setHeadline(target.headline);
    setSubheadline(target.subheadline);
    setPitch(target.pitch);
    setBullets([...target.bullets]);
    setImageUrl(target.imageUrl);

    setEmailSubject(target.emailSubject);
    setEmailPreviewText(target.emailPreviewText);
    setEmailBody(target.emailBody);

    setSequenceEnabled(target.sequenceEnabled);
    setStopOnCall(target.stopOnCall);
    setSequenceEmails([...target.sequenceEmails]);

    setAfterSignupOption(target.afterSignupOption);
    setDestinationUrl(target.destinationUrl);
    setCustomHeading(target.customHeading);
    setCustomMessage(target.customMessage);
    setVideoUrl(target.videoUrl);
    setButtonLabel(target.buttonLabel);
    setButtonUrl(target.buttonUrl);
    setQuizFunnelEnabled(target.quizFunnelEnabled);

    setHistoryIndex(nextIndex);
  }, [historyIndex, history]);

  // A/B Testing State
  const [hasVariantB, setHasVariantB] = useState(page?.hasVariantB || false);
  const [testStarted, setTestStarted] = useState(page?.testStarted || false);
  const [variantBImage, setVariantBImage] = useState<string | null>(page?.variantBImage !== undefined ? page.variantBImage : null);
  const [variantBTitle, setVariantBTitle] = useState(page?.variantBTitle || "");
  const variantBFileInputRef = useRef<HTMLInputElement>(null);

  const handleVariantBImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputTarget = e.target;
    const file = inputTarget.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setVariantBImage(compressed);
      } catch (err) {
        console.error("Variant B image compression error", err);
      }
      inputTarget.value = "";
    }
  };



  const addSequenceEmail = () => {
    setSequenceEmails([
      ...sequenceEmails,
      {
        id: Date.now().toString(),
        subject: `Follow-up #${sequenceEmails.length + 1}`,
        delayDays: sequenceEmails.length === 0 ? 1 : sequenceEmails.length * 2,
        body: "Hey {name}, just checking in to see if you had a chance to look at the resource!",
      },
    ]);
    setSequenceEnabled(true);
  };

  const removeSequenceEmail = (id: string) => {
    const updated = sequenceEmails.filter((e) => e.id !== id);
    setSequenceEmails(updated);
    if (updated.length === 0) setSequenceEnabled(false);
  };

  // General States
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("currentUserEmail")) {
      window.location.href = "/login";
      return;
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) {
          const found = data.pages.find((p) => p.id === params.id);
          if (found) {
            setPage(found);
            const cleanSubheadline = found.subheadline && found.subheadline !== "Enter your email to get instant access." ? found.subheadline : "";
            const cleanHeadline = found.headline && found.headline !== "hi" ? found.headline : (found.name || "");
            setHeadline(cleanHeadline);
            setSubheadline(cleanSubheadline);
            if (found.pitch) setPitch(found.pitch);
            if (found.bullets) setBullets(found.bullets);
            if (found.imageUrl !== undefined) setImageUrl(found.imageUrl);
          }
        }
        if (data.account) setAccount(data.account);
      }
    });
  }, [params.id]);

  useEffect(() => {
    if (page) {
      const cleanSubheadline = page.subheadline && page.subheadline !== "Enter your email to get instant access." ? page.subheadline : "";
      const cleanHeadline = page.headline && page.headline !== "hi" ? page.headline : (page.name || "");
      setHeadline(cleanHeadline);
      setSubheadline(cleanSubheadline);
      if (page.pitch) setPitch(page.pitch);
      if (page.bullets) setBullets(page.bullets);
      if (page.imageUrl !== undefined) setImageUrl(page.imageUrl);
    }
  }, [page]);

  const adjustTextareaHeights = useCallback(() => {
    requestAnimationFrame(() => {
      if (headlineRef.current) {
        headlineRef.current.style.height = "auto";
        headlineRef.current.style.height = `${Math.max(headlineRef.current.scrollHeight + 16, 60)}px`;
      }
      if (subheadlineRef.current) {
        subheadlineRef.current.style.height = "auto";
        subheadlineRef.current.style.height = `${Math.max(subheadlineRef.current.scrollHeight + 16, 40)}px`;
      }
      if (pitchRef.current) {
        pitchRef.current.style.height = "auto";
        pitchRef.current.style.height = `${Math.max(pitchRef.current.scrollHeight + 16, 40)}px`;
      }
    });
  }, []);

  useEffect(() => {
    adjustTextareaHeights();
    const timer = setTimeout(adjustTextareaHeights, 50);
    return () => clearTimeout(timer);
  }, [headline, subheadline, pitch, activeTab, adjustTextareaHeights]);

  // Debounced History Tracking Effect for User Edits across All 4 Tabs
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }

    historyDebounceRef.current = setTimeout(() => {
      const currentSnapshot = {
        headline,
        subheadline,
        pitch,
        bullets,
        imageUrl,
        emailSubject,
        emailPreviewText,
        emailBody,
        sequenceEnabled,
        stopOnCall,
        sequenceEmails,
        afterSignupOption,
        destinationUrl,
        customHeading,
        customMessage,
        videoUrl,
        buttonLabel,
        buttonUrl,
        quizFunnelEnabled,
      };

      const lastSnapshot = history[historyIndex];

      if (
        !lastSnapshot ||
        JSON.stringify(lastSnapshot) !== JSON.stringify(currentSnapshot)
      ) {
        const updatedHistory = history.slice(0, historyIndex + 1);
        updatedHistory.push(currentSnapshot);
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);
      }
    }, 250);

    return () => {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current);
      }
    };
  }, [
    headline, subheadline, pitch, bullets, imageUrl,
    emailSubject, emailPreviewText, emailBody,
    sequenceEnabled, stopOnCall, sequenceEmails,
    afterSignupOption, destinationUrl, customHeading, customMessage, videoUrl, buttonLabel, buttonUrl, quizFunnelEnabled,
    historyIndex, history
  ]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Dynamic Autosave Effect across All 4 Tabs
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      if (page) {
        const next = {
          ...page,
          headline,
          subheadline,
          pitch,
          bullets,
          imageUrl,
          emailSubject,
          emailPreviewText,
          emailBody,
          sequenceEnabled,
          stopOnCall,
          sequenceEmails,
          afterSignupOption,
          destinationUrl,
          customHeading,
          customMessage,
          videoUrl,
          buttonLabel,
          buttonUrl,
          quizFunnelEnabled,
          hasVariantB,
          testStarted,
          variantBImage,
          variantBTitle,
          customPromptQuestion,
          customPromptPlaceholder,
          enableAiPersonalizedDeliverable,
          updatedAt: "Just now"
        };
        setPage(next);
        const all = loadPages().map((p) => (p.id === next.id ? next : p));
        savePages(all);
      }
      setSaveStatus("autosaved");
    }, 600);

    return () => clearTimeout(timer);
  }, [
    headline, subheadline, pitch, bullets, imageUrl,
    emailSubject, emailPreviewText, emailBody,
    sequenceEnabled, stopOnCall, sequenceEmails,
    afterSignupOption, destinationUrl, customHeading, customMessage, videoUrl, buttonLabel, buttonUrl, quizFunnelEnabled,
    hasVariantB, testStarted, variantBImage, variantBTitle,
    customPromptQuestion, customPromptPlaceholder, enableAiPersonalizedDeliverable
  ]);

  const handleGoBack = () => {
    if (page) {
      const next = {
        ...page,
        headline,
        subheadline,
        pitch,
        bullets,
        imageUrl,
        emailSubject,
        emailPreviewText,
        emailBody,
        sequenceEnabled,
        stopOnCall,
        sequenceEmails,
        afterSignupOption,
        destinationUrl,
        customHeading,
        customMessage,
        videoUrl,
        buttonLabel,
        buttonUrl,
        quizFunnelEnabled,
        hasVariantB,
        testStarted,
        variantBImage,
        variantBTitle,
        updatedAt: "Just now"
      };
      const all = loadPages().map((p) => (p.id === next.id ? next : p));
      savePages(all);
    }
  };

  if (!page) {
    return (
      <DashboardShell account={account} title="Edit lead magnet">
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lead magnet page not found</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">It may have been deleted or the link is wrong.</p>
          <Link
            href="/dashboard/leadmagnets"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-[#FE6F34] hover:text-black dark:bg-[#FE6F34] dark:text-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Lead magnets
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const url = `https://leadmagnets.so/${account?.username || ""}/${page.slug}`;
  const live = page.status === "live";

  function update(patch: Partial<MagnetPage>) {
    if (!page) return;
    const next = { ...page, headline, subheadline, pitch, bullets, imageUrl, ...patch };
    setPage(next);
    const all = loadPages().map((p) => (p.id === next.id ? next : p));
    savePages(all);
  }

  function save() {
    setSaving(true);
    window.setTimeout(() => {
      if (!page) return;
      const next = { ...page, headline, subheadline, pitch, bullets, imageUrl, updatedAt: "Just now" };
      setPage(next);
      const all = loadPages().map((p) => (p.id === next.id ? next : p));
      savePages(all);
      setSaving(false);
    }, 400);
  }

  function copyUrl() {
    navigator.clipboard?.writeText(url).catch(() => { });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const handleAnalytics = () => {
    setShowMenu(false);
    router.push(`/dashboard/leadmagnets/${params.id}/analytics`);
  };

  const handleDownloadQR = () => {
    setShowMenu(false);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${page.slug || "lead-magnet"}-qr.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeletePage = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    if (!page) return;
    deletePage(page.id);
    router.push("/dashboard/leadmagnets");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputTarget = e.target;
    const file = inputTarget.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImageUrl(compressed);
      } catch (err) {
        console.error("Image compression error", err);
      }
      inputTarget.value = "";
    }
  };

  const addBullet = () => {
    if (newBulletText.trim()) {
      setBullets([...bullets, newBulletText.trim()]);
      setNewBulletText("");
      setShowAddBullet(false);
    }
  };

  const removeBullet = (index: number) => {
    setBullets(bullets.filter((_, i) => i !== index));
  };

  return (
    <DashboardShell account={account} title="Edit lead magnet">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10] text-zinc-900 dark:text-white transition-colors duration-200">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">

          {/* Page Top Title Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                Edit lead magnet
                <span className="cursor-help flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B]" title="Edit the page copy, design, emails, and post-signup flow">?</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                Edit the page, emails, and post-signup experience
              </p>
            </div>
          </div>

          {/* Main Editor Card Frame - 100% Locked Light Mode Card */}
          <div className="magnet-page--light rounded-2xl border border-[#E2E8F0] bg-white text-zinc-900 shadow-xl overflow-hidden">

            {/* Inner Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-zinc-200 px-4 py-3 sm:px-6 bg-white dark:bg-white text-zinc-900 dark:text-zinc-900">
              {/* Left Back link & Page Name/Slug */}
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/leadmagnets"
                  onClick={handleGoBack}
                  className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] dark:border-zinc-300 bg-white dark:bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-800 hover:bg-[#EFF6FF] hover:text-[#0066B2] dark:hover:bg-zinc-50 transition shadow-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5px]" />
                  <span>Lead magnets</span>
                </Link>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-900 uppercase tracking-wide leading-tight">{page.name}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-400 leading-none mt-0.5">/{page.slug}</span>
                </div>
              </div>

              {/* Right Status & Actions */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium flex items-center gap-1">
                  <Check className={`h-3.5 w-3.5 stroke-[3px] ${saveStatus === "saving" ? "text-zinc-400" : "text-[#0066B2]"}`} />
                  {saveStatus === "saving" ? "Waiting to autosave..." : "Autosaved"}
                </span>

                {/* AI Co-pilot & Social Studio */}
                <button
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] hover:bg-[#005799] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
                  title="AI Co-pilot: Regenerate headlines & copy"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Co-pilot</span>
                </button>

                <button
                  onClick={() => setShowSocialModal(true)}
                  className="group flex items-center gap-1.5 rounded-lg border border-[#0066B2]/30 bg-[#EFF6FF] px-3 py-1.5 text-xs font-bold text-[#0066B2] hover:bg-[#0066B2] hover:text-white transition shadow-xs cursor-pointer"
                  title="Generate Social Media Graphic Cards"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-[#0066B2] group-hover:text-white transition-colors" />
                  <span>Social Cards</span>
                </button>

                <div className="h-4 w-px bg-[#E2E8F0] dark:bg-zinc-200 mx-1" />

                {/* Undo / Redo */}
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`p-1.5 rounded-lg transition ${canUndo
                    ? "text-zinc-700 hover:text-[#0066B2] hover:bg-[#EFF6FF] cursor-pointer"
                    : "text-zinc-300 cursor-not-allowed opacity-40"
                    }`}
                  title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`p-1.5 rounded-lg transition ${canRedo
                    ? "text-zinc-700 hover:text-[#0066B2] hover:bg-[#EFF6FF] cursor-pointer"
                    : "text-zinc-300 cursor-not-allowed opacity-40"
                    }`}
                  title={canRedo ? "Redo (Ctrl+Y)" : "Nothing to redo"}
                >
                  <Redo2 className="h-4 w-4" />
                </button>

                {/* Copy Link / Open Preview */}
                <a
                  href={`/${account?.username || "rudranathkabira"}/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-[#0066B2] dark:hover:text-white hover:bg-[#EFF6FF] dark:hover:bg-zinc-100 transition cursor-pointer"
                  title="Open live page in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>

                {/* Overflow menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-100 transition cursor-pointer"
                    title="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-9 w-48 rounded-2xl border border-[#E2E8F0] dark:border-zinc-200/90 bg-white dark:bg-white p-1.5 shadow-xl z-50 text-zinc-800 dark:text-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={handleAnalytics}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-[#EFF6FF] hover:text-[#0066B2] dark:hover:bg-zinc-100 transition cursor-pointer"
                      >
                        <BarChart2 className="h-4 w-4 text-zinc-600" />
                        <span>Analytics</span>
                      </button>

                      <button
                        onClick={handleDownloadQR}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-[#EFF6FF] hover:text-[#0066B2] dark:hover:bg-zinc-100 transition cursor-pointer"
                      >
                        <QrCode className="h-4 w-4 text-zinc-600" />
                        <span>Download QR code</span>
                      </button>

                      <div className="my-1 h-px bg-[#E2E8F0] dark:bg-zinc-100" />

                      <button
                        onClick={handleDeletePage}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                        <span>Delete lead magnet</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Pill */}
                <button
                  onClick={() => update({ status: live ? "draft" : "live", publishedAt: live ? page.publishedAt : new Date().toISOString() })}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs ${live
                    ? "bg-[#1C1A19] text-[#10B981] border border-[#2E2A28]"
                    : "bg-zinc-100 dark:bg-zinc-100 text-zinc-600 dark:text-zinc-600 border border-[#E2E8F0] dark:border-zinc-200 hover:bg-zinc-200"
                    }`}
                >
                  <span className={`h-2 w-2 rounded-full ${live ? "bg-[#10B981]" : "bg-zinc-400"}`} />
                  <span>{live ? "Published" : "Draft"}</span>
                </button>
              </div>
            </div>

            {/* 4 Tabs Bar - Full Width Even Distribution & Slim Height */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#E2E8F0] dark:border-zinc-200 bg-[#F8FBFF] dark:bg-[#F9F9FB] p-2.5 sm:p-3 gap-2.5 sm:gap-4 w-full">
              {/* Tab 1: Landing Page */}
              <button
                onClick={() => setActiveTab("landing")}
                className={`flex items-center justify-center gap-3 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition w-full cursor-pointer ${activeTab === "landing"
                  ? "bg-white dark:bg-white border border-[#E2E8F0] dark:border-zinc-200/90 text-[#0066B2] dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-600 hover:text-[#0066B2] dark:hover:text-zinc-900 hover:bg-[#EFF6FF] dark:hover:bg-zinc-200/40 border border-transparent"
                  }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0066B2]">
                  <Monitor className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-900">Landing page</span>
                  <span className="block text-[10px] font-normal text-zinc-400 dark:text-zinc-400">Design the page</span>
                </div>
              </button>

              {/* Tab 2: Delivery email */}
              <button
                onClick={() => setActiveTab("email")}
                className={`flex items-center justify-center gap-3 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition w-full cursor-pointer ${activeTab === "email"
                  ? "bg-white dark:bg-white border border-[#E2E8F0] dark:border-zinc-200/90 text-[#0066B2] dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-600 hover:text-[#0066B2] dark:hover:text-zinc-900 hover:bg-[#EFF6FF] dark:hover:bg-zinc-200/40 border border-transparent"
                  }`}
              >
                <Mail className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
                <div className="text-left leading-tight">
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-900">Delivery email</span>
                  <span className="block text-[10px] font-normal text-zinc-400 dark:text-zinc-400">Send the resource</span>
                </div>
              </button>

              {/* Tab 3: Sequence */}
              <button
                onClick={() => setActiveTab("sequence")}
                className={`flex items-center justify-center gap-3 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition w-full cursor-pointer ${activeTab === "sequence"
                  ? "bg-white dark:bg-white border border-[#E2E8F0] dark:border-zinc-200/90 text-[#0066B2] dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-600 hover:text-[#0066B2] dark:hover:text-zinc-900 hover:bg-[#EFF6FF] dark:hover:bg-zinc-200/40 border border-transparent"
                  }`}
              >
                <Clock className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
                <div className="text-left leading-tight">
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-900">Sequence</span>
                  <span className="block text-[10px] font-normal text-zinc-400 dark:text-zinc-400">Nurture leads</span>
                </div>
              </button>

              {/* Tab 4: After signup */}
              <button
                onClick={() => setActiveTab("after")}
                className={`flex items-center justify-center gap-3 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition w-full cursor-pointer ${activeTab === "after"
                  ? "bg-white dark:bg-white border border-[#E2E8F0] dark:border-zinc-200/90 text-[#0066B2] dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-600 hover:text-[#0066B2] dark:hover:text-zinc-900 hover:bg-[#EFF6FF] dark:hover:bg-zinc-200/40 border border-transparent"
                  }`}
              >
                <Home className="h-4 w-4 text-[#0066B2] dark:text-zinc-400" />
                <div className="text-left leading-tight">
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-900">After signup</span>
                  <span className="block text-[10px] font-normal text-zinc-400 dark:text-zinc-400">Choose the next step</span>
                </div>
              </button>
            </div>

            {/* Editor Body Tab Content - 100% Light Mode */}
            <div className="p-4 sm:p-6 bg-white dark:bg-white text-zinc-900 dark:text-zinc-900">

              {/* TAB 1: LANDING PAGE EDITOR */}
              {activeTab === "landing" && (
                <div className="space-y-8">
                  {/* Canvas Outer Container (Card removed) */}
                  <div className="text-zinc-900 dark:text-zinc-900 py-2">

                    {/* Brand Name Header */}
                    <div className="mb-8 text-center">
                      <h1 className="text-3xl sm:text-4xl font-black tracking-wide text-black dark:text-black uppercase">
                        {account?.name || "BDA"}
                      </h1>
                    </div>

                    {/* Canvas Main Card */}
                    <div className="mx-auto max-w-6xl rounded-[24px] border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white text-zinc-900 dark:text-zinc-900 p-8 sm:p-10 shadow-2xl">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* Left Column: Copy & Bullets */}
                        <div className="lg:col-span-7 space-y-6">
                          {/* Headline */}
                          <div>
                            <textarea
                              ref={headlineRef}
                              rows={1}
                              value={headline}
                              onChange={(e) => {
                                setHeadline(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight + 24}px`;
                              }}
                              placeholder="BDA"
                              className="w-full text-3xl sm:text-5xl font-black text-black dark:text-black bg-transparent dark:bg-transparent outline-none border-none ring-0 shadow-none rounded-xl px-3 py-3 cursor-text hover:bg-[#F8F6F2] dark:hover:bg-[#F8F6F2] focus:border focus:border-zinc-300 focus:!bg-white focus:!text-black focus:shadow-2xs focus:ring-1 focus:ring-zinc-400 transition-all duration-150 resize-none overflow-hidden leading-snug"
                            />
                          </div>

                          {/* Subheadline */}
                          <div>
                            <textarea
                              ref={subheadlineRef}
                              rows={1}
                              value={subheadline}
                              onChange={(e) => {
                                setSubheadline(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight + 24}px`;
                              }}
                              placeholder="Short subhead. say what they will get"
                              className="w-full text-sm sm:text-base font-semibold text-zinc-600 dark:text-zinc-600 bg-transparent dark:bg-transparent outline-none border-none ring-0 shadow-none rounded-xl px-3 py-3 cursor-text hover:bg-[#F8F6F2] dark:hover:bg-[#F8F6F2] focus:border focus:border-zinc-300 focus:!bg-white focus:!text-zinc-900 focus:shadow-2xs focus:ring-1 focus:ring-zinc-400 transition-all duration-150 resize-none overflow-hidden leading-relaxed"
                            />
                          </div>

                          {/* Pitch */}
                          <div>
                            <textarea
                              ref={pitchRef}
                              rows={1}
                              value={pitch}
                              onChange={(e) => {
                                setPitch(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight + 24}px`;
                              }}
                              placeholder="Write a short pitch. Press Enter twice to start a new paragraph."
                              className="w-full text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 bg-transparent dark:bg-transparent outline-none border-none ring-0 shadow-none rounded-xl px-3 py-3 cursor-text hover:bg-[#F8F6F2] dark:hover:bg-[#F8F6F2] focus:border focus:border-zinc-300 focus:!bg-white focus:!text-zinc-900 focus:shadow-2xs focus:ring-1 focus:ring-zinc-400 transition-all duration-150 resize-none overflow-hidden leading-relaxed"
                            />
                          </div>

                          {/* Bullets List Section */}
                          <div className="group relative rounded-2xl border border-transparent hover:border-zinc-300 dark:hover:border-zinc-300 p-3 transition-all duration-200 space-y-3">
                            {/* Floating Pencil Edit Badge (Visible on hover) */}
                            <div className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black dark:bg-black text-white dark:text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <Pencil className="h-3.5 w-3.5" />
                            </div>

                            <p className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-700">
                              What they will learn
                            </p>

                            {bullets.length === 0 ? (
                              <p className="text-xs italic text-zinc-400 dark:text-zinc-400">
                                No bullets yet. click + to add one.
                              </p>
                            ) : (
                              <ul className="space-y-3">
                                {bullets.map((b, idx) => (
                                  <li key={idx} className="group relative flex items-center gap-3">
                                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-[#FE6F34] text-white font-bold shadow-xs">
                                      <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                    </span>
                                    <input
                                      type="text"
                                      value={b}
                                      onChange={(e) => {
                                        const updated = [...bullets];
                                        updated[idx] = e.target.value;
                                        setBullets(updated);
                                      }}
                                      className="w-full text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-800 bg-transparent outline-none border-none ring-0 rounded-xl px-3 py-1.5 hover:bg-[#F7F5F0] focus:bg-white focus:border focus:border-zinc-300 transition-all duration-150"
                                    />
                                    <button
                                      onClick={() => removeBullet(idx)}
                                      className="text-zinc-400 hover:text-zinc-600 transition p-1 shrink-0"
                                      title="Remove bullet"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Add Bullet Button & Inline Form */}
                            {showAddBullet ? (
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={newBulletText}
                                  onChange={(e) => setNewBulletText(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && addBullet()}
                                  placeholder="Type bullet point..."
                                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-300 bg-white dark:bg-white px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-900 outline-none focus:border-[#FE6F34]"
                                />
                                <button
                                  onClick={addBullet}
                                  className="rounded-xl bg-[#FE6F34] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#ff7d47] transition shrink-0"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => setShowAddBullet(false)}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAddBullet(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-300 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-700 hover:border-[#FE6F34] hover:text-[#FE6F34] transition bg-white dark:bg-white shadow-2xs cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add bullet</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Media Dropzone & Form Card */}
                        <div className="lg:col-span-5 space-y-4">
                          {/* Image Dropzone */}
                          <div className="rounded-2xl transition">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            {imageUrl ? (
                              <div className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-200 bg-zinc-50 shadow-xs">
                                <img src={imageUrl} alt="Uploaded magnet media" className="w-full object-cover max-h-72 rounded-2xl" />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fileInputRef.current?.click();
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-800 shadow-md border border-zinc-200/80 transition cursor-pointer pointer-events-auto"
                                  >
                                    <ImageIcon className="h-4 w-4 text-zinc-600" />
                                    <span>Replace</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setImageUrl(null);
                                    }}
                                    className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-white hover:bg-red-50 px-3.5 py-2 text-xs font-bold text-red-500 dark:text-red-500 shadow-md border border-zinc-200/80 transition cursor-pointer pointer-events-auto"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-200 bg-[#FAFAFA] dark:bg-[#FAFAFA] text-zinc-800 dark:text-zinc-800 p-6 text-center transition hover:border-[#FE6F34]/60">
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex flex-col items-center justify-center w-full py-4 cursor-pointer"
                                >
                                  <ImageIcon className="h-7 w-7 text-zinc-400 dark:text-zinc-400 mb-2" />
                                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-800">Add an image</span>
                                  <span className="text-[11px] text-zinc-400 dark:text-zinc-400 mt-0.5">PNG, JPG, WebP, or GIF. 10 MB max.</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Signup Form Card - Soft Warm Accent Background */}
                          <div className="rounded-2xl border border-[#FFD0BD] dark:border-[#FFD0BD] bg-gradient-to-b from-[#FFF4EE] to-[#FFF9F6] dark:from-[#FFF4EE] dark:to-[#FFF9F6] p-6 text-center shadow-xs">
                            <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-900">Download for free</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                              Pop your email in and we&apos;ll send it straight over.
                            </p>

                            <div className="mt-5 space-y-3">
                              <input
                                type="text"
                                placeholder="Name"
                                readOnly
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-4 py-3 text-xs text-zinc-900 dark:text-zinc-900 placeholder:text-zinc-400 dark:placeholder:text-zinc-400 outline-none shadow-xs"
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                readOnly
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-4 py-3 text-xs text-zinc-900 dark:text-zinc-900 placeholder:text-zinc-400 dark:placeholder:text-zinc-400 outline-none shadow-xs"
                              />
                              <button
                                className="w-full rounded-xl bg-[#1D2433] hover:bg-[#273043] dark:bg-[#1D2433] dark:hover:bg-[#273043] px-4 py-3.5 text-xs font-bold text-white dark:text-white shadow-md transition"
                              >
                                Send it to me
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Canvas Footer */}
                    <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-400">
                      All rights reserved 2026
                    </div>
                  </div>

                  {/* A/B Split Test Section */}
                  <div className="space-y-4 text-zinc-900 dark:text-zinc-900">
                    {/* Top Header Bar separated by lines above and below */}
                    <div className="border-t border-b border-zinc-200 dark:border-zinc-200 py-4 my-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-100 text-zinc-600 dark:text-zinc-600">
                              <BarChart2 className="h-4 w-4" />
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-900">
                              Test title and image
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                            LeadMagnets splits new visitors evenly and keeps each person on the same version for an accurate result.
                          </p>
                        </div>

                        <button
                          onClick={() => setTestStarted(!testStarted)}
                          className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-50 transition cursor-pointer shadow-2xs"
                        >
                          <span className={`h-2 w-2 rounded-full ${testStarted ? "bg-emerald-500" : "bg-zinc-300"}`} />
                          <span>{testStarted ? "Pause test" : "Start test"}</span>
                        </button>
                      </div>
                    </div>

                    {/* A/B Versions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Control Variant Card */}
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white overflow-hidden shadow-xs">
                        {/* Top Gray Media Area - Flush to top/left/right */}
                        <div className="relative h-64 sm:h-72 w-full bg-[#F8F9FA] dark:bg-[#F8F9FA] flex flex-col items-center justify-center border-b border-zinc-100 dark:border-zinc-100">
                          <div className="absolute top-4 left-4 z-10">
                            <span className="inline-flex items-center rounded-full bg-black dark:bg-black px-3.5 py-1 text-[11px] font-extrabold text-white dark:text-white uppercase tracking-wider">
                              {hasVariantB ? "CONTROL · 50%" : "CONTROL · 100%"}
                            </span>
                          </div>

                          {imageUrl && imageUrl.trim() !== "" ? (
                            <img
                              src={imageUrl}
                              alt="Control media"
                              onError={() => setImageUrl(null)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-400">
                              <ImageIcon className="h-7 w-7 mb-1.5 stroke-[1.5px]" />
                              <span className="text-xs font-medium">No image</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom White Section */}
                        <div className="p-5 space-y-3 bg-white dark:bg-white">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 block mb-1">
                              CURRENT PAGE
                            </span>
                            <h5 className="text-sm font-black text-zinc-900 dark:text-zinc-900">
                              {headline || page.name || "BDA"}
                            </h5>
                          </div>

                          <div className="h-px bg-zinc-100 dark:bg-zinc-100 w-full" />

                          <p className="text-xs text-zinc-400 dark:text-zinc-400 pt-0.5">
                            Results appear after the test starts
                          </p>
                        </div>
                      </div>

                      {/* Variant B Card if created */}
                      {hasVariantB && (
                        <div className="group animate-card-pop-in rounded-2xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white overflow-hidden shadow-xs hover:border-zinc-300 transition-all duration-300">
                          {/* Top Gray Media Area - Flush to top/left/right */}
                          <div className="relative h-64 sm:h-72 w-full bg-[#F8F9FA] dark:bg-[#F8F9FA] flex flex-col items-center justify-center border-b border-zinc-100 dark:border-zinc-100">
                            <div className="absolute top-4 left-4 z-10">
                              <span className="inline-flex items-center rounded-full bg-[#F4F4F5] dark:bg-[#F4F4F5] px-3.5 py-1 text-[11px] font-extrabold text-zinc-700 dark:text-zinc-700 uppercase tracking-wider">
                                VERSION B · 50%
                              </span>
                            </div>

                            <input
                              type="file"
                              ref={variantBFileInputRef}
                              onChange={handleVariantBImageUpload}
                              accept="image/*"
                              className="hidden"
                            />

                            {(() => {
                              const activeVariantBImage = (variantBImage && variantBImage.trim() !== "") ? variantBImage : imageUrl;
                              return activeVariantBImage && activeVariantBImage.trim() !== "" ? (
                                <img
                                  src={activeVariantBImage}
                                  alt="Variant B media"
                                  onError={() => setVariantBImage(null)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-400">
                                  <ImageIcon className="h-7 w-7 mb-1.5 stroke-[1.5px]" />
                                  <span className="text-xs font-medium">No image</span>
                                </div>
                              );
                            })()}

                            {/* Hover Actions Container */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  variantBFileInputRef.current?.click();
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-800 shadow-md border border-zinc-200/80 transition cursor-pointer pointer-events-auto active:scale-95"
                              >
                                <ImageIcon className="h-4 w-4 text-zinc-600" />
                                <span>Replace</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHasVariantB(false);
                                  setVariantBImage(null);
                                  setVariantBTitle("");
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-white hover:bg-red-50 px-3.5 py-2 text-xs font-bold text-red-500 dark:text-red-500 shadow-md border border-zinc-200/80 transition cursor-pointer pointer-events-auto active:scale-95"
                                title="Remove Version B split test"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Bottom White Section */}
                          <div className="p-5 space-y-3 bg-white dark:bg-white">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 block mb-1">
                                VERSION TITLE
                              </span>
                              <input
                                type="text"
                                value={variantBTitle || headline || "TECH"}
                                onChange={(e) => setVariantBTitle(e.target.value)}
                                className="w-full text-sm font-black text-zinc-900 dark:text-zinc-900 outline-none border-b border-transparent focus:border-[#FE6F34] py-0.5"
                              />
                            </div>

                            <div className="h-px bg-zinc-100 dark:bg-zinc-100 w-full" />

                            <p className="text-xs text-zinc-400 dark:text-zinc-400 pt-0.5">
                              Results appear after the test starts
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Create Version B Button */}
                    {!hasVariantB && (
                      <button
                        onClick={() => setHasVariantB(true)}
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-300 bg-[#F9FAFB] dark:bg-[#F9FAFB] hover:bg-zinc-100 dark:hover:bg-zinc-100 hover:border-zinc-400 p-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-700 transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-2xs"
                      >
                        <Plus className="h-4 w-4 text-zinc-600 transition-transform duration-200 group-hover:scale-110" />
                        <span>Create version B</span>
                      </button>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: DELIVERY EMAIL */}
              {activeTab === "email" && (
                <div className="space-y-6">
                  {/* Canvas Outer Wrapper */}
                  <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-200/70 bg-[#F9F9FB] dark:bg-[#F9F9FB] p-4 sm:p-8 text-zinc-900 dark:text-zinc-900">

                    {/* Inner White Card Container */}
                    <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white p-6 sm:p-8 shadow-xs text-zinc-900 dark:text-zinc-900 space-y-6">

                      {/* Top Header Bar inside Card */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-200 pb-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-800">
                          <Mail className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
                          <span>Delivery email</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 dark:text-zinc-400 font-mono">
                            LeadMagnets &lt;hello@mail.leadmagnets.so&gt;
                          </span>
                          <button
                            onClick={() => alert("Previewing email as subscriber...")}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-800 hover:bg-zinc-50 transition shadow-xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 block">Subject</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="What people see in the inbox"
                          className="w-full text-2xl sm:text-3xl font-extrabold text-zinc-800 dark:text-zinc-800 placeholder:text-zinc-300 dark:placeholder:text-zinc-300 bg-transparent outline-none border-b border-transparent focus:border-[#FE6F34] transition py-1"
                        />
                      </div>

                      {/* Preview text */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 block">Preview text</label>
                        <input
                          type="text"
                          value={emailPreviewText}
                          onChange={(e) => setEmailPreviewText(e.target.value)}
                          placeholder="A short teaser shown after the subject"
                          className="w-full text-sm font-medium text-zinc-600 dark:text-zinc-600 placeholder:text-zinc-300 dark:placeholder:text-zinc-300 bg-transparent outline-none border-b border-transparent focus:border-[#FE6F34] transition py-1"
                        />
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-zinc-200/80 dark:bg-zinc-200/80 w-full my-4" />

                      {/* Body Section */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-700 block">Body</label>

                        {/* Rich Text Editor Container */}
                        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-200/90 bg-white dark:bg-white overflow-hidden shadow-xs">
                          {/* Toolbar */}
                          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 dark:border-zinc-200 bg-[#F9F9FB] dark:bg-[#F9F9FB] px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-600">
                            <button
                              type="button"
                              onClick={handleUndo}
                              disabled={!canUndo}
                              title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
                              className={`p-1 transition ${canUndo ? "hover:text-zinc-900 cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleRedo}
                              disabled={!canRedo}
                              title={canRedo ? "Redo (Ctrl+Y)" : "Nothing to redo"}
                              className={`p-1 transition ${canRedo ? "hover:text-zinc-900 cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
                            >
                              <Redo2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-300 mx-0.5" />
                            <button type="button" title="Text Size" className="hover:text-zinc-900 font-serif font-bold transition px-1">Aa</button>
                            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-300 mx-0.5" />
                            <button type="button" title="Bold" className="hover:text-zinc-900 font-black transition px-1">B</button>
                            <button type="button" title="Italic" className="hover:text-zinc-900 italic transition px-1">I</button>
                            <button type="button" title="Quote" className="hover:text-zinc-900 font-serif transition px-1">”</button>
                            <button type="button" title="List" className="hover:text-zinc-900 transition px-1">⋮=</button>
                            <button type="button" title="Line" className="hover:text-zinc-900 transition px-1">—</button>
                            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-300 mx-0.5" />
                            <div className="relative">
                               <button 
                                 type="button" 
                                 onClick={() => setShowInsertResourceMenu((v) => !v)}
                                 className="hover:text-[#0066B2] text-[#0066B2] font-semibold transition px-2 py-1 rounded bg-[#EFF6FF] flex items-center gap-1 cursor-pointer"
                               >
                                 <span>+ Insert Resource</span>
                                 <ChevronDown className="h-3 w-3" />
                               </button>

                               {showInsertResourceMenu && (
                                 <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl z-50 text-zinc-800 space-y-1">
                                   <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                     SELECT HOSTED RESOURCE
                                   </div>
                                   {hostedResources.length === 0 ? (
                                     <div className="px-2 py-2 text-xs text-zinc-500 italic">
                                       No hosted resources found. Upload one in Hosted resources first!
                                     </div>
                                   ) : (
                                     hostedResources.map((res) => (
                                       <button
                                         key={res.id}
                                         type="button"
                                         onClick={() => {
                                           const linkText = `\n${res.url}\n`;
                                           setEmailBody((prev) => prev + linkText);
                                           setShowInsertResourceMenu(false);
                                         }}
                                         className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#EFF6FF] hover:text-[#0066B2] text-xs transition flex flex-col gap-0.5 cursor-pointer"
                                       >
                                         <span className="font-semibold truncate">{res.name}</span>
                                         <span className="text-[10px] text-zinc-400 font-mono truncate">{res.url}</span>
                                       </button>
                                     ))
                                   )}
                                 </div>
                               )}
                             </div>
                            <button type="button" title="Link" className="hover:text-zinc-900 transition px-1">🔗</button>
                          </div>

                          {/* Editor Textarea */}
                          <textarea
                            rows={8}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            placeholder="Start writing, or press / for blocks. Use {name} for the recipient."
                            className="w-full min-h-[200px] p-5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-700 placeholder:text-zinc-400 dark:placeholder:text-zinc-400 bg-white dark:bg-white outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Feature 2: Smart Auto-Personalized Deliverable Config Card */}
                      <div className="rounded-2xl border border-[#0066B2]/30 bg-gradient-to-br from-[#EFF6FF] to-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0066B2] text-white shadow-xs">
                              <Sparkles className="h-4 w-4" />
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-zinc-900">AI Personalization Engine (Feature 2)</h4>
                              <p className="text-xs text-zinc-500">Ask leads a question during signup & generate custom AI action plans automatically.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEnableAiPersonalizedDeliverable(!enableAiPersonalizedDeliverable)}
                            className={`flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer border ${enableAiPersonalizedDeliverable
                              ? "bg-[#0066B2] text-white border-[#0066B2]"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                              }`}
                          >
                            <span>{enableAiPersonalizedDeliverable ? "Active" : "Disabled"}</span>
                          </button>
                        </div>

                        {enableAiPersonalizedDeliverable && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#0066B2]/20 animate-in fade-in duration-200">
                            <div>
                              <label className="text-xs font-semibold text-zinc-700 block mb-1">Signup Form Question</label>
                              <input
                                type="text"
                                value={customPromptQuestion}
                                onChange={(e) => setCustomPromptQuestion(e.target.value)}
                                placeholder="e.g. What is your main goal or bottleneck?"
                                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0066B2]"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-zinc-700 block mb-1">Input Placeholder</label>
                              <input
                                type="text"
                                value={customPromptPlaceholder}
                                onChange={(e) => setCustomPromptPlaceholder(e.target.value)}
                                placeholder="e.g. Scaling outreach, Lead generation"
                                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0066B2]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Bottom Banner Card */}
                    <div className="mt-6 mx-auto max-w-4xl rounded-2xl bg-[#080B12] dark:bg-[#080B12] p-6 flex items-center justify-center shadow-lg">
                      <button className="flex items-center gap-2 rounded-xl bg-white dark:bg-white px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-900 shadow-md hover:bg-zinc-100 transition cursor-pointer">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FE6F34] text-black font-extrabold text-[10px]">🧲</span>
                        <span>Build yours free with LeadMagnets</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: SEQUENCE */}
              {activeTab === "sequence" && (
                <div className="space-y-6">
                  {/* Canvas Outer Wrapper */}
                  <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-200/70 bg-[#F9F9FB] dark:bg-[#F9F9FB] p-4 sm:p-8 text-zinc-900 dark:text-zinc-900">
                    <div className="mx-auto max-w-4xl space-y-6">

                      {/* Top Control Card */}
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white p-6 sm:p-8 shadow-xs text-zinc-900 dark:text-zinc-900 space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-900">Follow-up sequence</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                              Send extra emails after the lead magnet email. Delays are counted from the previous email or from signup for the first one.
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                              LeadMagnets creates the events, templates, and automation for this sequence after your sender domain is ready.
                            </p>
                          </div>

                          {/* Toggle Status Pill */}
                          <button
                            onClick={() => setSequenceEnabled(!sequenceEnabled)}
                            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${sequenceEnabled
                              ? "bg-emerald-50 dark:bg-emerald-50 text-emerald-700 dark:text-emerald-700 border-emerald-300 dark:border-emerald-300"
                              : "bg-[#F4F4F6] dark:bg-[#F4F4F6] text-zinc-600 dark:text-zinc-600 border-zinc-200 dark:border-zinc-200"
                              }`}
                          >
                            <span className={`h-2.5 w-2.5 rounded-full ${sequenceEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                            <span>{sequenceEnabled ? "Enabled" : "Disabled"}</span>
                          </button>
                        </div>

                        {/* 2 Sub-cards in grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {/* Sub-card 1: Stop when a call is booked */}
                          <div
                            onClick={() => setStopOnCall(!stopOnCall)}
                            className="rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white p-4 cursor-pointer hover:border-zinc-300 transition shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={stopOnCall}
                                onChange={() => { }}
                                className="rounded border-zinc-300 text-[#FE6F34] focus:ring-[#FE6F34] cursor-pointer"
                              />
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-800">Stop when a call is booked</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-400 mt-1.5 pl-6 leading-relaxed">
                              Calendly and Cal.com booking-created webhooks stop this magnet&apos;s sequence for that email.
                            </p>
                          </div>

                          {/* Sub-card 2: Calendar connection */}
                          <div className="rounded-xl border border-zinc-100 dark:border-zinc-100 bg-[#F9F9FB] dark:bg-[#F9F9FB] p-4">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-700 block">Calendar connection</span>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-400 mt-1.5 leading-relaxed">
                              Connect Calendly or Cal.com in Configure to let booked calls stop this sequence.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Card: Sequence List or Empty State */}
                      {sequenceEmails.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-300 bg-white dark:bg-white p-12 text-center shadow-xs">
                          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-900">No follow-up emails yet</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 mb-5">
                            Add up to 10 emails to build this magnet&apos;s sequence.
                          </p>
                          <button
                            onClick={addSequenceEmail}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-800 hover:bg-zinc-50 transition cursor-pointer shadow-xs"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add first email</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sequenceEmails.map((emailItem, idx) => (
                            <div key={emailItem.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white p-6 shadow-xs space-y-4 text-zinc-900 dark:text-zinc-900">
                              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                                <span className="text-xs font-extrabold text-[#FE6F34] uppercase tracking-wider">Email #{idx + 1}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">Wait</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={emailItem.delayDays}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      setSequenceEmails(sequenceEmails.map((item) => item.id === emailItem.id ? { ...item, delayDays: val } : item));
                                    }}
                                    className="w-14 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-center text-zinc-900 outline-none"
                                  />
                                  <span className="text-xs text-zinc-500">days</span>
                                  <button
                                    onClick={() => removeSequenceEmail(emailItem.id)}
                                    className="text-zinc-400 hover:text-red-500 p-1.5 transition ml-2 cursor-pointer"
                                    title="Remove email step"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-zinc-700 block mb-1">Subject</label>
                                <input
                                  type="text"
                                  value={emailItem.subject}
                                  onChange={(e) => setSequenceEmails(sequenceEmails.map((item) => item.id === emailItem.id ? { ...item, subject: e.target.value } : item))}
                                  placeholder="Follow-up email subject line"
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-[#FE6F34]"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-zinc-700 block mb-1">Email Body</label>
                                <textarea
                                  rows={4}
                                  value={emailItem.body}
                                  onChange={(e) => setSequenceEmails(sequenceEmails.map((item) => item.id === emailItem.id ? { ...item, body: e.target.value } : item))}
                                  placeholder="Write your email body here..."
                                  className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 outline-none focus:border-[#FE6F34] resize-none"
                                />
                              </div>
                            </div>
                          ))}

                          {sequenceEmails.length < 10 && (
                            <button
                              onClick={addSequenceEmail}
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-white p-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer shadow-xs"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Add another sequence email ({sequenceEmails.length}/10)</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AFTER SIGNUP */}
              {activeTab === "after" && (
                <div className="space-y-4">
                  {/* Canvas Outer Wrapper */}
                  <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-200/70 bg-[#F9F9FB] dark:bg-[#F9F9FB] p-3 sm:p-5 text-zinc-900 dark:text-zinc-900">
                    <div className="mx-auto max-w-4xl space-y-4">

                      {/* Top Options Card */}
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white p-4 sm:p-6 shadow-xs text-zinc-900 dark:text-zinc-900 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white text-zinc-700 dark:text-zinc-700 shadow-xs">
                            <Check className="h-4 w-4 stroke-[2.5px]" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-900">What happens after someone opts in?</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                              Keep it simple: show a confirmation, take them straight to another URL, or give them a useful next step on a short page.
                            </p>
                          </div>
                        </div>

                        {/* 3 Interactive Card Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                          {/* Option 1: Standard confirmation */}
                          <button
                            onClick={() => setAfterSignupOption("standard")}
                            className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "standard"
                              ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                              : "bg-white dark:bg-white border border-zinc-200 dark:border-zinc-200 text-zinc-900 dark:text-zinc-900 hover:border-[#0066B2]"
                              }`}
                          >
                            <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "standard" ? "text-white" : "text-zinc-900 dark:text-zinc-900"}`}>
                              Standard confirmation
                            </h4>
                            <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "standard" ? "text-white/90" : "text-zinc-500 dark:text-zinc-500"}`}>
                              Show the email confirmation message.
                            </p>
                          </button>

                          {/* Option 2: Send them elsewhere */}
                          <button
                            onClick={() => setAfterSignupOption("elsewhere")}
                            className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "elsewhere"
                              ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                              : "bg-white dark:bg-white border border-zinc-200 dark:border-zinc-200 text-zinc-900 dark:text-zinc-900 hover:border-[#0066B2]"
                              }`}
                          >
                            <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "elsewhere" ? "text-white" : "text-zinc-900 dark:text-zinc-900"}`}>
                              Send them elsewhere
                            </h4>
                            <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "elsewhere" ? "text-white/90" : "text-zinc-500 dark:text-zinc-500"}`}>
                              Open a URL as soon as the form is submitted.
                            </p>
                          </button>

                          {/* Option 3: Custom next step */}
                          <button
                            onClick={() => setAfterSignupOption("custom")}
                            className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "custom"
                              ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                              : "bg-white dark:bg-white border border-zinc-200 dark:border-zinc-200 text-zinc-900 dark:text-zinc-900 hover:border-[#0066B2]"
                              }`}
                          >
                            <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "custom" ? "text-white" : "text-zinc-900 dark:text-zinc-900"}`}>
                              Custom next step
                            </h4>
                            <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "custom" ? "text-white/90" : "text-zinc-500 dark:text-zinc-500"}`}>
                              Show your own message, video, or offer.
                            </p>
                          </button>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">
                          A quiz funnel is available with Custom next step.
                        </p>

                        {/* DYNAMIC FORM FIELDS DEPENDING ON SELECTED OPTION */}

                        {/* Dynamic Panel 2: Destination URL when "elsewhere" is selected */}
                        {afterSignupOption === "elsewhere" && (
                          <div className="pt-3 space-y-1.5 border-t border-zinc-100 dark:border-zinc-100">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-700 flex items-center gap-1.5">
                              <ExternalLink className="h-3.5 w-3.5 text-[#0066B2]" />
                              <span>Destination URL</span>
                            </label>
                            <input
                              type="url"
                              value={destinationUrl}
                              onChange={(e) => setDestinationUrl(e.target.value)}
                              placeholder="https://your-site.com/next-step"
                              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2]"
                            />
                            <p className="text-xs text-zinc-400 dark:text-zinc-400">
                              They will be taken here straight after a successful signup.
                            </p>
                          </div>
                        )}

                        {/* Dynamic Panel 3: Custom Next Step fields when "custom" is selected */}
                        {afterSignupOption === "custom" && (
                          <div className="pt-3 space-y-3 border-t border-zinc-100 dark:border-zinc-100">
                            <div>
                              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-700 block mb-1">Heading</label>
                              <input
                                type="text"
                                value={customHeading}
                                onChange={(e) => setCustomHeading(e.target.value)}
                                placeholder="You are in. Here is what to do next."
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-900 outline-none focus:border-[#0066B2]"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-700 block mb-1">Message</label>
                              <textarea
                                rows={2}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Set expectations, introduce an offer, or explain the next step."
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white p-2.5 text-xs text-zinc-900 dark:text-zinc-900 outline-none focus:border-[#0066B2] resize-none"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-700 flex items-center gap-1.5 mb-1">
                                <span>🎥 Loom or YouTube URL</span>
                              </label>
                              <input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.loom.com/share/..."
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-900 outline-none focus:border-[#0066B2]"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-700 block mb-1">Button label</label>
                                <input
                                  type="text"
                                  value={buttonLabel}
                                  onChange={(e) => setButtonLabel(e.target.value)}
                                  placeholder="Book a call"
                                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-900 outline-none focus:border-[#0066B2]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-700 block mb-1">Button URL</label>
                                <input
                                  type="url"
                                  value={buttonUrl}
                                  onChange={(e) => setButtonUrl(e.target.value)}
                                  placeholder="https://cal.com/..."
                                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-900 outline-none focus:border-[#0066B2]"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Bottom Card: Quiz Funnel Card */}
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-200 bg-white dark:bg-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-100 text-zinc-700 dark:text-zinc-700">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-900">Add a quiz funnel</h4>
                            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                              Ask a short series of questions after signup. Save every answer, then optionally route people based on their responses.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setQuizFunnelEnabled(!quizFunnelEnabled)}
                          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${quizFunnelEnabled
                            ? "bg-emerald-50 dark:bg-emerald-50 text-emerald-700 dark:text-emerald-700 border-emerald-300 dark:border-emerald-300"
                            : "bg-[#F4F4F6] dark:bg-[#F4F4F6] text-zinc-600 dark:text-zinc-600 border-zinc-200 dark:border-zinc-200"
                            }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${quizFunnelEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          <span>{quizFunnelEnabled ? "On" : "Off"}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* 'Delete this magnet?' Confirmation Modal Overlay */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="relative w-full max-w-[440px] rounded-2xl border border-zinc-800 bg-[#18181C] p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-950/50 border border-red-900/40 text-red-400">
                  <AlertTriangle className="h-5 w-5 stroke-[2.2px]" />
                </div>
                <h3 className="text-base font-bold text-white">Delete this magnet?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3 pt-1">
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                This removes the page and stops it serving. Any signups already collected stay on your list.
              </p>
              <p className="text-xs text-zinc-400 font-medium">
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-zinc-800 bg-[#222226] hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl border border-red-900/60 bg-[#2C1818] hover:bg-red-950 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition cursor-pointer shadow-xs"
              >
                Delete magnet
              </button>
            </div>
          </div>
        </div>
      )}

      <AIMagnetModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={(data) => {
          setHeadline(data.headline);
          setSubheadline(data.subheadline);
          if (data.pitch) setPitch(data.pitch);
          if (data.bullets) setBullets(data.bullets);
          update({
            headline: data.headline,
            subheadline: data.subheadline,
            pitch: data.pitch,
            bullets: data.bullets,
          });
        }}
      />

      {page && (
        <SocialCardModal
          isOpen={showSocialModal}
          onClose={() => setShowSocialModal(false)}
          page={{ ...page, headline, subheadline }}
          account={account}
        />
      )}
    </DashboardShell>
  );
}