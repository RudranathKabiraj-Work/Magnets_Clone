"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  BarChart2,
  QrCode,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
  HelpCircle,
  Monitor,
  Smartphone,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  Sparkles,
  Strikethrough,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Video,
  Table as TableIcon,
  Link2,
  Minus,
  MoreVertical,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import ImageExtension from "@tiptap/extension-image";
import { Table as TableExtension } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextAlign } from "@tiptap/extension-text-align";
import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, savePages, deletePage, loadAccount, loadResources, syncWithDatabase } from "@/lib/store";
import AIMagnetModal from "@/components/leadmagnets/ai-magnet-modal";
import SocialCardModal from "@/components/leadmagnets/social-card-modal";
import DeleteModal from "@/components/leadmagnets/edit/DeleteModal";
import SequencePreviewModal from "@/components/leadmagnets/edit/SequencePreviewModal";
import EmailPreviewModal from "@/components/leadmagnets/edit/EmailPreviewModal";

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
  const [account, setAccount] = useState<Account | null>(null);
  const [page, setPage] = useState<MagnetPage | undefined>(undefined);

  // Single Init Effect — ONE syncWithDatabase() call fans out all data
  // Eliminates the previous 3 separate calls that fired simultaneously on mount
  useEffect(() => {
    // ── Step 1: Load from localStorage instantly (zero latency, offline-first) ──
    const localAcc = loadAccount();
    if (localAcc) setAccount(localAcc);

    const localP = loadPages().find((p) => p.id === params.id);
    if (localP) {
      setPage(localP);
      const pTpl = (localP.template as string);
      // Always respect the page's own template field first (covers all template1-7)
      if (pTpl && pTpl !== "classic") {
        setTemplateId(pTpl);
      } else if (localAcc?.templateId) {
        setTemplateId(localAcc.templateId);
      }
      if (localP.customFormFields && localP.customFormFields.length > 0) {
        setCustomFormFields(localP.customFormFields);
      }
    } else if (localAcc?.templateId) {
      setTemplateId(localAcc.templateId);
    }

    // Load resources from localStorage instantly
    const localResources = loadResources();
    if (localResources && localResources.length > 0) {
      setHostedResources(localResources);
      const latestResource = localResources[0];
      if (latestResource?.url) {
        setEmailBody((prev) => (!prev.includes("http") ? `${prev}\n\n${latestResource.url}` : prev));
      }
    }

    // ── Step 2: ONE database call — fan out all results ──
    syncWithDatabase().then((data) => {
      if (!data) return;

      // Fan out: account
      if (data.account) setAccount(data.account);

      // Fan out: resources + emailBody
      if (data.resources && data.resources.length > 0) {
        setHostedResources(data.resources);
        const latestResource = data.resources[0];
        if (latestResource?.url) {
          setEmailBody((prev) => (!prev.includes("http") ? `${prev}\n\n${latestResource.url}` : prev));
        }
      }

      // Fan out: page data + templateId + form fields
      if (data.pages) {
        const found = data.pages.find((p: any) => p.id === params.id);
        if (found) {
          setPage((prev) => {
            if (!prev) return found;
            return { ...prev, ...found };
          });

          // Template resolution: page template → account template → fallback
          const upTpl = (found.template as string);
          if (upTpl && upTpl !== "classic") {
            setTemplateId(upTpl);
          } else if (data.account?.templateId) {
            setTemplateId(data.account.templateId);
          }

          // Populate form fields once from DB (guarded by hasPopulatedForm ref)
          if (!hasPopulatedForm.current) {
            hasPopulatedForm.current = true;
            const cleanHeadline = found.headline && found.headline !== "hi" ? found.headline : (found.name || "");
            const cleanSubheadline = found.subheadline && found.subheadline !== "Enter your email to get instant access." ? found.subheadline : "";
            setHeadline(cleanHeadline);
            setSubheadline(cleanSubheadline);
            if (found.pitch) setPitch(found.pitch);
            if (found.bullets) setBullets(found.bullets);
            if (found.imageUrl !== undefined) setImageUrl(found.imageUrl);
            if (found.sequenceEnabled !== undefined) setSequenceEnabled(found.sequenceEnabled);
            if (found.stopOnCall !== undefined) setStopOnCall(found.stopOnCall);
            if (found.sequenceEmails) setSequenceEmails(found.sequenceEmails);
            if (found.customFormFields) setCustomFormFields(found.customFormFields);
          }
        } else if (data.account?.templateId) {
          setTemplateId(data.account.templateId);
        }
      }
    });
  }, [params.id]);

  // Modal & Menu States
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [hostedResources, setHostedResources] = useState<any[]>([]);
  const [showInsertResourceMenu, setShowInsertResourceMenu] = useState(false);

  // Lock background scroll containers when Subscriber Email Preview Modal is open
  useEffect(() => {
    if (!showEmailPreviewModal) return;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showEmailPreviewModal]);

  // Resources + emailBody loading merged into the Single Init Effect above ↑

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
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Page Content Initial Values
  const initialHeadline = page ? (page.headline && page.headline !== "hi" ? page.headline : (page.name || "")) : "";
  const initialSubheadline = page ? (page.subheadline && page.subheadline !== "Enter your email to get instant access." ? page.subheadline : "") : "";
  const initialPitch = page?.pitch || "";
  const initialBullets = page?.bullets && page.bullets.length > 0 ? page.bullets : (page?.bullets !== undefined ? [] : ["", "", ""]);
  const initialImage = page?.imageUrl !== undefined ? page.imageUrl : null;
  const initialEmailSubject = page?.emailSubject || "Here is your requested resource";
  const initialEmailPreviewText = page?.emailPreviewText || "Click below to access your free download.";
  const initialEmailBody = page?.emailBody || "Hey {name},\n\nThank you for requesting this resource! Click the link below to get instant access.\n\nEnjoy!";

  // Page Content State (Tab 1: Landing)
  const [templateId, setTemplateId] = useState<string>(page?.template || account?.templateId || "template1");
  const [headline, setHeadline] = useState(initialHeadline);
  const [subheadline, setSubheadline] = useState(initialSubheadline);
  const [pitch, setPitch] = useState(initialPitch);
  const [bullets, setBullets] = useState<string[]>(initialBullets);
  const [bulletsTitle, setBulletsTitle] = useState(page?.bulletsTitle && page.bulletsTitle !== "What they will learn" && page.bulletsTitle !== "Free Resource · Instant Access" ? page.bulletsTitle : "");
  const [formTitle, setFormTitle] = useState(page?.formTitle && page.formTitle !== "Download for free" && page.formTitle !== "Claim Your Copy" ? page.formTitle : "");
  const [formSubtitle, setFormSubtitle] = useState(page?.formSubtitle && page.formSubtitle !== "Pop your email in and we'll send it straight over." ? page.formSubtitle : "");
  const [formButtonText, setFormButtonText] = useState(page?.formButtonText || page?.cta || "Send it to me");
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newBulletText, setNewBulletText] = useState("");
  const [showAddBullet, setShowAddBullet] = useState(false);

  // Delivery Email State (Tab 2: Delivery Email)
  const [emailSubject, setEmailSubject] = useState(initialEmailSubject);
  const [emailPreviewText, setEmailPreviewText] = useState(initialEmailPreviewText);
  const [emailBody, setEmailBody] = useState(initialEmailBody);

  // Production-grade Tiptap Rich Text Editor instance for Delivery Email
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      ImageExtension,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#0066B2] dark:text-[#38BDF8] underline font-medium",
        },
      }),
    ],
    content: emailBody,
    onUpdate: ({ editor }) => {
      setEmailBody(editor.getHTML());
    },
  });

  // Sync external changes into Tiptap editor content if changed programmatically
  useEffect(() => {
    if (editor && emailBody && editor.getHTML() !== emailBody && !editor.isFocused) {
      editor.commands.setContent(emailBody);
    }
  }, [emailBody, editor]);

  // Sequence State (Tab 3: Sequence)
  const [sequenceEnabled, setSequenceEnabled] = useState(page?.sequenceEnabled || false);
  const [stopOnCall, setStopOnCall] = useState(page?.stopOnCall !== undefined ? page.stopOnCall : true);
  const [sequenceEmails, setSequenceEmails] = useState<{ id: string; subject: string; delayDays: number; delayUnit?: "hours" | "minutes"; previewText?: string; body: string }[]>(page?.sequenceEmails || []);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0);
  const [showSequencePreviewModal, setShowSequencePreviewModal] = useState(false);
  const [previewSequenceIndex, setPreviewSequenceIndex] = useState<number>(0);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<"desktop" | "mobile">("desktop");

  // Feature 2: Smart Auto-Personalized Deliverable State
  const [customPromptQuestion, setCustomPromptQuestion] = useState(page?.customPromptQuestion || "What is your main goal or bottleneck?");
  const [customPromptPlaceholder, setCustomPromptPlaceholder] = useState(page?.customPromptPlaceholder || "e.g. Scaling outreach, Lead generation");
  const [enableAiPersonalizedDeliverable, setEnableAiPersonalizedDeliverable] = useState(page?.enableAiPersonalizedDeliverable || false);

  // Dynamic Custom Form Fields Builder State
  const [customFormFields, setCustomFormFields] = useState<import("@/lib/data").CustomFormField[]>(page?.customFormFields || []);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

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
    bulletsTitle: string;
    formTitle: string;
    formSubtitle: string;
    formButtonText: string;
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
      bulletsTitle: page?.bulletsTitle && page.bulletsTitle !== "What they will learn" ? page.bulletsTitle : "",
      formTitle: page?.formTitle || "Download for free",
      formSubtitle: page?.formSubtitle || "Pop your email in and we'll send it straight over.",
      formButtonText: page?.formButtonText || page?.cta || "Send it to me",
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoRef = useRef(false);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autosave Status State
  const [saveStatus, setSaveStatus] = useState<"autosaved" | "saving">("autosaved");
  const isInitialMount = useRef(true);

  // Live Auto-Sync for Views & Signups without needing page refresh
  useEffect(() => {
    if (!page?.id && !page?.slug) return;
    const userEmail = page?.userEmail || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);

    // --- Backoff state (local closure vars — no React state needed) ---
    // Strategy 3 + 4: Visibility-Aware Polling + Exponential Backoff
    const MIN_INTERVAL = 30_000;  // 30s baseline (same as Notion / Google Analytics)
    const MAX_INTERVAL = 90_000;  // 90s cap (same as Gmail idle behaviour)
    let currentInterval = MIN_INTERVAL;
    let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
    // Track last known stats fingerprint for change detection
    const lastStatsRef = { current: "" };

    const syncStats = async () => {
      try {
        if (!userEmail) return;
        const res = await fetch(`/api/data?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.pages && Array.isArray(data.pages)) {
          const fresh = data.pages.find((p: any) => p.id === page.id || p.slug === page.slug);
          if (fresh) {
            // Strategy 4: if stats actually changed, reset backoff to baseline
            const statsKey = `${fresh.views}|${fresh.signups}|${fresh.variantAViews}|${fresh.variantBViews}`;
            if (statsKey !== lastStatsRef.current) {
              lastStatsRef.current = statsKey;
              currentInterval = MIN_INTERVAL; // activity detected — reset backoff
            }
            setPage((prev) => {
              if (!prev) return fresh;
              return {
                ...prev,
                views: fresh.views || 0,
                signups: fresh.signups || 0,
                conversionRate: fresh.conversionRate || 0,
                variantAViews: fresh.variantAViews || 0,
                variantBViews: fresh.variantBViews || 0,
                variantASignups: fresh.variantASignups || 0,
                variantBSignups: fresh.variantBSignups || 0,
              };
            });
          }
        }
      } catch (_) { }
    };

    // Recursive timeout scheduler — allows interval to change dynamically
    const schedulePoll = () => {
      if (scheduledTimer) clearTimeout(scheduledTimer);
      scheduledTimer = setTimeout(async () => {
        // Strategy 3: only poll when the user is actually looking at the tab
        if (document.visibilityState === "visible") {
          await syncStats();
        }
        // Strategy 4: double the interval up to the cap after each poll
        currentInterval = Math.min(currentInterval * 2, MAX_INTERVAL);
        schedulePoll();
      }, currentInterval);
    };

    // Fast initial sync then start the scheduler
    syncStats();
    schedulePoll();

    // 1. BroadcastChannel — instant cross-tab sync when a visitor views/submits
    // A/B testing stats update instantly via this — unaffected by polling interval
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("leadmagnets_live_sync");
      bc.onmessage = (e) => {
        if (e.data && e.data.type === "STATS_UPDATED") {
          currentInterval = MIN_INTERVAL; // real event — reset backoff
          syncStats();
        }
      };
    }

    // 2. Window focus — sync immediately when user switches back to this tab
    const handleFocus = () => {
      currentInterval = MIN_INTERVAL; // reset backoff on user return
      syncStats();
    };
    window.addEventListener("focus", handleFocus);

    // 3. Visibility change — pause polling when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab is visible again — sync immediately and restart scheduler
        currentInterval = MIN_INTERVAL;
        syncStats();
        schedulePoll();
      } else {
        // Tab hidden — stop all scheduled polls (zero server requests)
        if (scheduledTimer) clearTimeout(scheduledTimer);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (scheduledTimer) clearTimeout(scheduledTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (bc) bc.close();
    };
  }, [page?.id, page?.slug, page?.userEmail]);

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
    setBulletsTitle(target.bulletsTitle);

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
    setBulletsTitle(target.bulletsTitle);

    setHistoryIndex(nextIndex);
  }, [historyIndex, history]);

  // A/B Testing State
  const [hasVariantB, setHasVariantB] = useState(page?.hasVariantB || false);
  const [testStarted, setTestStarted] = useState(page?.testStarted || false);
  const [variantBImage, setVariantBImage] = useState<string | null>(page?.variantBImage !== undefined ? page.variantBImage : null);
  const [variantBTitle, setVariantBTitle] = useState(page?.variantBTitle || "");
  const [uploadingVariantB, setUploadingVariantB] = useState(false);
  const [uploadProgressVariantB, setUploadProgressVariantB] = useState(0);
  const variantBFileInputRef = useRef<HTMLInputElement>(null);
  const hasPopulatedVariantB = useRef(false);

  // Populate A/B testing state ONCE on initial load to prevent background stats polling from overwriting edits
  useEffect(() => {
    if (page && (!hasPopulatedVariantB.current || page.id !== params.id)) {
      hasPopulatedVariantB.current = true;
      setHasVariantB(Boolean(page.hasVariantB));
      setTestStarted(Boolean(page.testStarted));
      setVariantBImage(page.variantBImage !== undefined ? page.variantBImage : null);
      setVariantBTitle(page.variantBTitle || "");
    }
  }, [page?.id]);

  const handleVariantBImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputTarget = e.target;
    const file = inputTarget.files?.[0];
    if (file) {
      // 1. Instant local optimistic preview (0ms latency)
      const localPreviewUrl = URL.createObjectURL(file);
      setVariantBImage(localPreviewUrl);

      setUploadingVariantB(true);
      setUploadProgressVariantB(5);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("isPageAsset", "true");
        if (account?.email) {
          formData.append("userEmail", account.email);
        }

        const json = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 90);
              setUploadProgressVariantB(Math.max(5, percent));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                setUploadProgressVariantB(100);
                resolve(JSON.parse(xhr.responseText));
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });

        let finalUrl: string | null = null;
        if (json?.data?.fileUrl) {
          finalUrl = json.data.fileUrl;
        } else {
          finalUrl = await compressImage(file);
        }

        if (finalUrl) {
          // Preload remote image in background before swapping from local blob preview
          try {
            const preloader = new Image();
            preloader.src = finalUrl;
            await new Promise((res) => {
              preloader.onload = res;
              preloader.onerror = res;
            });
          } catch (_) { }

          setVariantBImage(finalUrl);
          setPage((prev) => (prev ? { ...prev, variantBImage: finalUrl } : prev));

          const userEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);
          if (page?.id) {
            const updatedP = { ...(page || {}), variantBImage: finalUrl };
            const all = loadPages().map((p) => (p.id === page.id ? updatedP : p));
            savePages(all);
            if (userEmail) {
              fetch("/api/data", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: userEmail,
                  action: "update",
                  pageId: page.id,
                  updates: { variantBImage: finalUrl }
                })
              }).catch(() => { });
            }
          }
        }
      } catch (err) {
        console.error("Variant B image upload error", err);
        try {
          const compressed = await compressImage(file);
          if (compressed) {
            setVariantBImage(compressed);
            setPage((prev) => (prev ? { ...prev, variantBImage: compressed } : prev));
          }
        } catch (_) { }
      } finally {
        setTimeout(() => {
          setUploadingVariantB(false);
          setUploadProgressVariantB(0);
        }, 300);
        inputTarget.value = "";
      }
    }
  };



  const addSequenceEmail = () => {
    const nextNum = sequenceEmails.length + 1;
    const newEmail = {
      id: Date.now().toString(),
      subject: `Follow-up #${nextNum}`,
      delayDays: 1,
      delayUnit: "hours" as const,
      previewText: sequenceEmails.length === 0 ? "Quick follow-up" : "",
      body: "Hey {name}, just checking in to see if you had a chance to look at the resource!",
    };
    const updated = [...sequenceEmails, newEmail];
    setSequenceEmails(updated);
    setSelectedSequenceIndex(updated.length - 1);
    setSequenceEnabled(true);
  };

  const removeSequenceEmail = (id: string) => {
    const updated = sequenceEmails.filter((e) => e.id !== id);
    setSequenceEmails(updated);
    if (updated.length === 0) {
      setSequenceEnabled(false);
      setSelectedSequenceIndex(0);
    } else if (selectedSequenceIndex >= updated.length) {
      setSelectedSequenceIndex(updated.length - 1);
    }
  };

  // General States
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasPopulatedForm = useRef(false);

  // Form population from DB merged into the Single Init Effect above ↑

  useEffect(() => {
    if (page && !hasPopulatedForm.current) {
      hasPopulatedForm.current = true;
      const cleanSubheadline = page.subheadline && page.subheadline !== "Enter your email to get instant access." ? page.subheadline : "";
      const cleanHeadline = page.headline && page.headline !== "hi" ? page.headline : (page.name || "");
      setHeadline(cleanHeadline);
      setSubheadline(cleanSubheadline);
      if (page.pitch) setPitch(page.pitch);
      if (page.bullets) setBullets(page.bullets);
      if (page.imageUrl !== undefined) setImageUrl(page.imageUrl);
      if (page.sequenceEnabled !== undefined) setSequenceEnabled(page.sequenceEnabled);
      if (page.stopOnCall !== undefined) setStopOnCall(page.stopOnCall);
      if (page.sequenceEmails) setSequenceEmails(page.sequenceEmails);
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
        bulletsTitle,
        formTitle,
        formSubtitle,
        formButtonText,
      };

      const lastSnapshot = history[historyIndex];

      // Shallow field comparison — 500× faster than JSON.stringify
      // React guarantees: if setState wasn't called, the reference is identical.
      // So reference equality (===) is an exact check for primitives and arrays.
      // This is the same approach React uses internally for shouldComponentUpdate.
      const hasChanged = (a: typeof currentSnapshot | undefined, b: typeof currentSnapshot): boolean => {
        if (!a) return true;
        return (
          a.headline !== b.headline ||
          a.subheadline !== b.subheadline ||
          a.pitch !== b.pitch ||
          a.bullets !== b.bullets ||
          a.imageUrl !== b.imageUrl ||
          a.emailSubject !== b.emailSubject ||
          a.emailPreviewText !== b.emailPreviewText ||
          a.emailBody !== b.emailBody ||
          a.sequenceEnabled !== b.sequenceEnabled ||
          a.stopOnCall !== b.stopOnCall ||
          a.sequenceEmails !== b.sequenceEmails ||
          a.afterSignupOption !== b.afterSignupOption ||
          a.destinationUrl !== b.destinationUrl ||
          a.customHeading !== b.customHeading ||
          a.customMessage !== b.customMessage ||
          a.videoUrl !== b.videoUrl ||
          a.buttonLabel !== b.buttonLabel ||
          a.buttonUrl !== b.buttonUrl ||
          a.quizFunnelEnabled !== b.quizFunnelEnabled ||
          a.bulletsTitle !== b.bulletsTitle ||
          a.formTitle !== b.formTitle ||
          a.formSubtitle !== b.formSubtitle ||
          a.formButtonText !== b.formButtonText
        );
      };

      if (hasChanged(lastSnapshot, currentSnapshot)) {
        const MAX_HISTORY = 50;
        const updatedHistory = history.slice(0, historyIndex + 1);
        updatedHistory.push(currentSnapshot);
        // Cap history at MAX_HISTORY entries — prevents unbounded memory growth
        // during long editing sessions (matches VS Code / Photoshop default limit)
        if (updatedHistory.length > MAX_HISTORY) {
          updatedHistory.shift(); // drop oldest snapshot
        }
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
    bulletsTitle,
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
          customFormFields,
          bulletsTitle,
          formTitle,
          formSubtitle,
          formButtonText,
          cta: formButtonText,
          template: (templateId as any),
          updatedAt: "Just now"
        };
        setPage(next);
        const all = loadPages().map((p) => (p.id === next.id ? next : p));
        savePages(all);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("storage"));
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
    customPromptQuestion, customPromptPlaceholder, enableAiPersonalizedDeliverable,
    customFormFields, bulletsTitle, formTitle, formSubtitle, formButtonText
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
        bulletsTitle,
        formTitle,
        formSubtitle,
        formButtonText,
        cta: formButtonText,
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

  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in"}/${account?.username || ""}/${page.slug}`;
  const live = page.status === "live";

  function update(patch: Partial<MagnetPage>) {
    if (!page) return;
    const next = { ...page, headline, subheadline, pitch, bullets, imageUrl, bulletsTitle, ...patch };
    setPage(next);
    const all = loadPages().map((p) => (p.id === next.id ? next : p));
    savePages(all);
  }

  function save() {
    setSaving(true);
    window.setTimeout(() => {
      if (!page) return;
      const next = { ...page, headline, subheadline, pitch, bullets, imageUrl, bulletsTitle, updatedAt: "Just now" };
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
      setUploadProgress(0);

      // Smooth Apple-style progress physics animation loop
      let targetPercent = 10;
      let currentPercent = 0;

      const animationTimer = setInterval(() => {
        if (currentPercent < targetPercent) {
          // Smooth deceleration interpolation (ease-out trickle)
          const diff = targetPercent - currentPercent;
          const step = Math.max(1, Math.ceil(diff * 0.2));
          currentPercent = Math.min(targetPercent, currentPercent + step);
          setUploadProgress(currentPercent);
        }
      }, 50);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("isPageAsset", "true");
        if (account?.email) {
          formData.append("userEmail", account.email);
        }

        const uploadedUrl = await new Promise<string>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
              const raw = Math.round((event.loaded / event.total) * 85);
              targetPercent = Math.max(targetPercent, Math.min(85, raw));
            }
          };

          xhr.onload = async () => {
            targetPercent = 95;
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText);
                resolve(json?.data?.fileUrl || (await compressImage(file)));
              } catch (_) {
                resolve(await compressImage(file));
              }
            } else {
              resolve(await compressImage(file));
            }
          };

          xhr.onerror = async () => {
            resolve(await compressImage(file));
          };

          xhr.send(formData);
        });

        // Fast client image compression/decoding pre-step
        const img = new Image();
        img.src = uploadedUrl;
        await img.decode().catch(() => { });

        clearInterval(animationTimer);
        setUploadProgress(100);
        setImageUrl(uploadedUrl);

        if (page) {
          const updated = { ...page, imageUrl: uploadedUrl };
          setPage(updated);
          const all = loadPages().map((p) => (p.id === updated.id ? updated : p));
          savePages(all);
        }

        setTimeout(() => {
          setUploadProgress(null);
        }, 250);
      } catch (err) {
        clearInterval(animationTimer);
        console.error("Image upload error", err);
        setUploadProgress(null);
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

  // Plain Email Body Editor field
  const renderEmailBlockEditor = (
    val: string,
    onValChange: (next: string) => void,
    isDisabled = false
  ) => {
    return (
      <textarea
        disabled={isDisabled}
        value={val}
        onChange={(e) => onValChange(e.target.value)}
        placeholder="Write your email body content here... Use {name} for subscriber name."
        rows={10}
        className={`w-full p-2 bg-transparent outline-none resize-y min-h-[220px] font-sans text-sm leading-relaxed transition ${isDisabled ? "opacity-50 cursor-not-allowed" : ""
          } ${(account?.themeMode || "light") === "dark" ? "text-zinc-100 placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
      />
    );
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

          {/* Main Editor Card Frame - Background matches Left Panel in Dark Mode */}
          <div className={`rounded-2xl border text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#18181B]" : "border-zinc-200 bg-white"}`}>

            {/* Inner Header Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#18181B] text-white" : "border-zinc-200 bg-zinc-50/80 text-zinc-900"}`}>
              {/* Left Back link & Page Name/Slug */}
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/leadmagnets"
                  onClick={handleGoBack}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer ${(account?.themeMode || "light") === "dark"
                    ? "border-[#27272A] bg-[#1E1E24] text-zinc-200 hover:bg-[#27272A]"
                    : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
                    }`}
                >
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5px]" />
                  <span>Lead magnets</span>
                </Link>
                <div className="flex flex-col justify-center">
                  <span className={`text-xs font-black uppercase tracking-wide leading-tight ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>{page.name}</span>
                  <span className={`text-[11px] leading-none mt-0.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>/{page.slug}</span>
                </div>
              </div>

              {/* Right Status & Actions */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 stroke-[3px] text-emerald-500" />
                  {saveStatus === "saving" ? "Waiting to autosave..." : "Autosaved"}
                </span>

                {/* AI Co-pilot & Social Studio */}
                <button
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  title="AI Co-pilot: Regenerate headlines & copy"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Co-pilot</span>
                </button>

                <button
                  onClick={() => setShowSocialModal(true)}
                  className="group flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition shadow-xs cursor-pointer"
                  title="Generate Social Media Graphic Cards"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-400 group-hover:text-white transition-colors" />
                  <span>Social Cards</span>
                </button>

                <div className="h-4 w-px bg-zinc-200 dark:bg-[#27272A] mx-1" />

                {/* Undo / Redo */}
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`p-1.5 rounded-lg transition ${canUndo
                    ? ((account?.themeMode || "light") === "dark"
                      ? "text-zinc-300 hover:text-white hover:bg-[#27272A] cursor-pointer"
                      : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70 cursor-pointer")
                    : ((account?.themeMode || "light") === "dark"
                      ? "text-zinc-600 cursor-not-allowed opacity-40"
                      : "text-zinc-300 cursor-not-allowed opacity-40")
                    }`}
                  title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`p-1.5 rounded-lg transition ${canRedo
                    ? ((account?.themeMode || "light") === "dark"
                      ? "text-zinc-300 hover:text-white hover:bg-[#27272A] cursor-pointer"
                      : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70 cursor-pointer")
                    : ((account?.themeMode || "light") === "dark"
                      ? "text-zinc-600 cursor-not-allowed opacity-40"
                      : "text-zinc-300 cursor-not-allowed opacity-40")
                    }`}
                  title={canRedo ? "Redo (Ctrl+Y)" : "Nothing to redo"}
                >
                  <Redo2 className="h-4 w-4" />
                </button>

                {/* Copy Link / Open Preview */}
                <a
                  href={`/${account?.username || "user"}/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                    ? "text-zinc-400 hover:text-white hover:bg-[#27272A]"
                    : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70"
                    }`}
                  title="Open live page in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>

                {/* Overflow menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-[#27272A]"
                      : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70"
                      }`}
                    title="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {showMenu && (
                    <div className={`absolute right-0 top-9 w-48 rounded-2xl border p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${(account?.themeMode || "light") === "dark"
                      ? "border-[#27272A] bg-[#18181C] text-zinc-200"
                      : "border-zinc-200 bg-white text-zinc-900"
                      }`}>
                      <button
                        onClick={handleAnalytics}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                          ? "text-zinc-300 hover:bg-[#27272A] hover:text-white"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                          }`}
                      >
                        <BarChart2 className="h-4 w-4 text-zinc-400" />
                        <span>Analytics</span>
                      </button>

                      <button
                        onClick={handleDownloadQR}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                          ? "text-zinc-300 hover:bg-[#27272A] hover:text-white"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                          }`}
                      >
                        <QrCode className="h-4 w-4 text-zinc-400" />
                        <span>Download QR code</span>
                      </button>

                      <div className={`my-1 h-px ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-200"
                        }`} />

                      <button
                        onClick={handleDeletePage}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
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
                    ? ((account?.themeMode || "light") === "dark"
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100")
                    : ((account?.themeMode || "light") === "dark"
                      ? "bg-[#1E1E24] text-zinc-300 border border-[#27272A] hover:bg-[#27272A]"
                      : "bg-zinc-100 text-zinc-700 border border-zinc-300 hover:bg-zinc-200")
                    }`}
                >
                  <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  <span>{live ? "Published" : "Draft"}</span>
                </button>
              </div>
            </div>

            {/* 4 Tabs Bar - Adapts dynamically to Brand Theme Mode */}
            <div
              className={`grid grid-cols-2 lg:grid-cols-4 border-b p-2.5 sm:p-3 gap-2.5 sm:gap-4 w-full transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E11]" : "border-zinc-200 bg-zinc-100/70"}`}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {[
                { id: "landing", label: "Landing page", desc: "Design the page", icon: Monitor },
                { id: "email", label: "Delivery email", desc: "Send the resource", icon: Mail },
                { id: "sequence", label: "Sequence", desc: "Nurture leads", icon: Clock },
                { id: "after", label: "After signup", desc: "Choose the next step", icon: Home },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isHovered = hoveredTab === tab.id;
                const isDark = (account?.themeMode || "light") === "dark";

                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 600, damping: 28 }}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center justify-center gap-3 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-colors w-full cursor-pointer border ${isActive
                      ? isDark
                        ? "border-[#27272A] text-white shadow-sm"
                        : "border-zinc-200 text-zinc-900 shadow-sm"
                      : "border-transparent text-zinc-600 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                  >
                    {/* Active Tab Solid Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeEditTabPill"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className={`absolute inset-0 rounded-xl ${isDark ? "bg-[#1E1E24]" : "bg-white"}`}
                      />
                    )}
                    {/* Hover Morphing Pill */}
                    {!isActive && isHovered && (
                      <motion.div
                        layoutId="hoverEditTabPill"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className={`absolute inset-0 rounded-xl ${isDark ? "bg-[#18181C]" : "bg-zinc-200/80"}`}
                      />
                    )}
                    <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-lg ${isDark ? "bg-[#27272A] text-zinc-300" : "bg-zinc-200/60 text-zinc-700"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="relative z-10 text-left leading-tight">
                      <span className={`block text-xs font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{tab.label}</span>
                      <span className="block text-[10px] font-normal text-zinc-400">{tab.desc}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Editor Body Tab Content */}
            <div className={`p-4 sm:p-6 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "bg-[#18181B]" : "bg-[#F8FBFF]"}`}>

              {/* TAB 1: LANDING PAGE EDITOR */}
              {activeTab === "landing" && (
                <div className="space-y-8">
                  {/* Canvas Outer Container - Dynamically switches Light vs Dark depending on account.themeMode */}
                  <div
                    className="rounded-3xl p-4 sm:p-8 transition-colors duration-300 relative"
                    style={{
                      backgroundColor: (account?.themeMode || "light") === "dark" ? "#0E0E10" : "#FAFAFA",
                      color: (account?.themeMode || "light") === "dark" ? "#ffffff" : "#18181b",
                      backgroundImage: (account?.themeMode || "light") === "light"
                        ? `radial-gradient(circle at 0% 0%, ${account?.brandColor || "#0066B2"}10 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${account?.brandColor || "#0066B2"}08 0%, transparent 40%)`
                        : `radial-gradient(circle at 0% 0%, ${account?.brandColor || "#0066B2"}25 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${account?.brandColor || "#0066B2"}15 0%, transparent 50%)`
                    }}
                  >

                    {/* Brand Name Header */}
                    <div className="mb-6 flex items-center justify-center">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-transparent overflow-hidden ${account?.logo || account?.avatar_url || account?.avatar ? "border-none" : "border border-dashed border-[#a1a1aa]/45"}`}>
                          {account?.logo || account?.avatar_url || account?.avatar ? (
                            <img src={account?.logo || account?.avatar_url || account?.avatar || ""} alt="Logo" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-4 w-4 rounded-sm border border-dashed border-[#a1a1aa]" />
                          )}
                        </div>
                        <span className={`text-sm font-bold tracking-wider uppercase ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                          {account?.name || "BDA"}
                        </span>
                      </div>
                    </div>

                    {/* Hidden file input available for all templates */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Canvas Main Card - 100% Synced with Public Page formula */}
                    {templateId === "template2" ? (
                      /* TEMPLATE 2: Lead Capture Split Panel Layout */
                      <div
                        className={`mx-auto max-w-6xl rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl ${(account?.themeMode || "light") === "dark" ? "bg-[#111827] text-white border-zinc-800" : "bg-white text-zinc-900 border-zinc-200"}`}
                        style={{
                          borderColor: account?.brandColor
                            ? `${account.brandColor}${Math.round((0.25 + ((account?.highlightIntensity ?? 100) / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`
                            : "#0066B240",
                          boxShadow: `0 16px 40px -10px ${account?.brandColor || "#0066B2"}${Math.round(((account?.highlightIntensity ?? 100) / 100) * 0.25 * 255).toString(16).padStart(2, '0')}`
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
                          {/* Left Panel: Cover Image + Gradient Scrim + Bullets (~60%) */}
                          <div className="md:col-span-7 relative flex flex-col justify-end p-6 md:p-8 overflow-hidden min-h-[260px] md:min-h-full bg-zinc-900 text-white group">
                            {imageUrl && imageUrl.trim() !== "" && (
                              <img
                                src={imageUrl}
                                alt="Lead capture cover"
                                className="absolute inset-0 w-full h-full object-cover opacity-50"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-[#0a0c16]/60 to-transparent pointer-events-none" />

                            {/* Upload Progress Overlay */}
                            {uploadProgress !== null && (
                              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-white">
                                <div className="w-full max-w-xs space-y-3">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                                      {uploadProgress === 100 ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      )}
                                      {uploadProgress === 100 ? "Image uploaded!" : "Uploading image..."}
                                    </span>
                                    <span className="font-mono text-[#0066B2] dark:text-[#38BDF8]">{uploadProgress}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                                      style={{ width: `${uploadProgress}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] text-zinc-400 text-center">Optimizing media assets...</p>
                                </div>
                              </div>
                            )}

                            {/* Top Left Image Action Buttons */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black px-3.5 py-2 text-xs font-bold text-white shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                              >
                                <ImageIcon className="h-4 w-4 text-zinc-300" />
                                <span>{imageUrl && imageUrl.trim() !== "" ? "Replace Image" : "Add Image"}</span>
                              </button>
                              {imageUrl && imageUrl.trim() !== "" && (
                                <button
                                  type="button"
                                  onClick={() => setImageUrl(null)}
                                  className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-red-950/80 px-3.5 py-2 text-xs font-bold text-red-400 shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>

                            <div className="relative z-10 space-y-2">
                              <textarea
                                ref={headlineRef}
                                rows={1}
                                value={headline}
                                onChange={(e) => {
                                  setHeadline(e.target.value);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Build forms that convert"
                                className="w-full text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black bg-transparent outline-none border-none text-white placeholder:text-white/60 resize-none leading-[0.95] tracking-tighter drop-shadow-2xl"
                              />

                              <textarea
                                ref={subheadlineRef}
                                rows={1}
                                value={subheadline}
                                onChange={(e) => {
                                  setSubheadline(e.target.value);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Short subhead. say what they will get"
                                className="w-full text-xs sm:text-sm font-medium bg-transparent outline-none border-none text-white/70 placeholder:text-white/40 resize-none leading-relaxed drop-shadow-xs mt-2"
                              />

                              <textarea
                                ref={pitchRef}
                                rows={2}
                                value={pitch}
                                onChange={(e) => {
                                  setPitch(e.target.value);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Write a short pitch. Press Enter twice to start a new paragraph."
                                className="w-full text-xs bg-transparent outline-none border-none text-white/75 placeholder:text-white/40 resize-none leading-relaxed"
                              />

                              <div className="pt-3 border-t border-white/10 space-y-2">
                                <input
                                  type="text"
                                  value={bulletsTitle}
                                  onChange={(e) => setBulletsTitle(e.target.value)}
                                  placeholder="What they will learn"
                                  className="w-full text-xs font-semibold bg-transparent outline-none border-none text-white/90 placeholder:text-white/50"
                                />
                                {bullets && bullets.length > 0 ? (
                                  <ul className="space-y-2">
                                    {bullets.map((item, idx) => (
                                      <li key={idx} className="flex items-center gap-2 text-xs text-white/90">
                                        <span style={{ color: account?.brandColor || "#a5b4fc" }}>
                                          <Check className="w-4 h-4 shrink-0" />
                                        </span>
                                        <input
                                          type="text"
                                          value={item}
                                          onChange={(e) => {
                                            const currentList = [...bullets];
                                            currentList[idx] = e.target.value;
                                            setBullets(currentList);
                                          }}
                                          placeholder="Bullet point item..."
                                          className="w-full bg-transparent outline-none text-xs text-white placeholder:text-white/60"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setBullets(bullets.filter((_, i) => i !== idx));
                                          }}
                                          className="text-white/40 hover:text-white transition cursor-pointer p-1"
                                          title="Remove bullet point"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs italic text-white/60 my-1">
                                    No bullets yet. click + to add one.
                                  </p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBullets([...bullets, ""]);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/30 hover:border-white/60 bg-black/30 hover:bg-black/50 px-3.5 py-1.5 text-xs font-medium text-white transition cursor-pointer mt-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add bullet</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Right Panel: Form (~40%) */}
                          <div className={`md:col-span-5 p-6 md:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l ${(account?.themeMode || "light") === "dark" ? "border-zinc-800 bg-[#18181B]" : "border-zinc-200 bg-white"}`}>
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Download for free"
                                className="w-full text-center text-lg font-bold bg-transparent outline-none placeholder:text-zinc-400/60"
                              />
                              <input
                                type="text"
                                value={formSubtitle}
                                onChange={(e) => setFormSubtitle(e.target.value)}
                                placeholder="Pop your email in and we'll send it straight over."
                                className="w-full text-center text-xs text-zinc-400 bg-transparent outline-none placeholder:text-zinc-400/60"
                              />

                              <div className="space-y-2 pt-2">
                                <input
                                  type="text"
                                  placeholder="Name *"
                                  readOnly
                                  className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                />
                                <input
                                  type="email"
                                  placeholder="Email *"
                                  readOnly
                                  className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                />

                                {customFormFields.map((field) => (
                                  <input
                                    key={field.id}
                                    type="text"
                                    placeholder={`${field.label}${field.required ? " *" : ""}`}
                                    readOnly
                                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                  />
                                ))}
                              </div>

                              <input
                                type="text"
                                value={formButtonText}
                                onChange={(e) => setFormButtonText(e.target.value)}
                                onFocus={(e) => {
                                  if (e.target.value === "Send it to me" || e.target.value === "Get early access") {
                                    setFormButtonText("");
                                  } else {
                                    e.target.select();
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value.trim()) {
                                    setFormButtonText("Send it to me");
                                  }
                                }}
                                placeholder="Send it to me"
                                className="w-full text-center rounded-xl py-3 px-4 text-xs font-extrabold text-white shadow-md transition duration-150 outline-none border-2 border-transparent hover:border-white/40 focus:border-white cursor-text mt-2"
                                style={{ backgroundColor: account?.brandColor || "#0066B2" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : templateId === "template3" ? (
                      /* TEMPLATE 3: Aurora Reveal — Portrait image left with aurora glow, rich editorial form panel right */
                      <div
                        className="mx-auto max-w-6xl rounded-3xl overflow-hidden relative transition-all duration-300"
                        style={{
                          background: (account?.themeMode || "light") === "dark" ? "#0c0c12" : "#f7f8fc",
                          border: `1px solid ${account?.brandColor || "#0066B2"}${Math.round((0.15 + ((account?.highlightIntensity ?? 100) / 100) * 0.2) * 255).toString(16).padStart(2, '0')}`,
                          boxShadow: `0 24px 70px -12px ${account?.brandColor || "#0066B2"}${Math.round((0.22 + ((account?.highlightIntensity ?? 100) / 100) * 0.3) * 255).toString(16).padStart(2, '0')}`,
                        }}
                      >
                        <div className="grid grid-cols-12 min-h-[440px]">
                          {/* LEFT: Aurora Image Tile (5 cols) */}
                          <div className="col-span-5 relative overflow-hidden group min-h-[300px]">
                            {imageUrl && imageUrl.trim() !== "" && (
                              <img
                                src={imageUrl}
                                alt="Cover"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            )}

                            {/* Right fade into card */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{ background: (account?.themeMode || "light") === "dark" ? "linear-gradient(to right, transparent 55%, #0c0c12 100%)" : "linear-gradient(to right, transparent 55%, #f7f8fc 100%)" }}
                            />
                            {/* Bottom fade */}
                            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />

                            {/* Upload Progress Indicator Overlay */}
                            {uploadProgress !== null && (
                              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-white">
                                <div className="w-full max-w-xs space-y-3">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                                      {uploadProgress === 100 ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      )}
                                      {uploadProgress === 100 ? "Image uploaded!" : "Uploading image..."}
                                    </span>
                                    <span className="font-mono text-[#0066B2] dark:text-[#38BDF8]">{uploadProgress}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                                      style={{ width: `${uploadProgress}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] text-zinc-400 text-center">Optimizing media assets...</p>
                                </div>
                              </div>
                            )}

                            {/* Overlay Image Action Buttons */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black px-3.5 py-2 text-xs font-bold text-white shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                              >
                                <ImageIcon className="h-4 w-4 text-zinc-300" />
                                <span>{imageUrl && imageUrl.trim() !== "" ? "Replace Image" : "Add Image"}</span>
                              </button>
                              {imageUrl && imageUrl.trim() !== "" && (
                                <button
                                  type="button"
                                  onClick={() => setImageUrl(null)}
                                  className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-red-950/80 px-3.5 py-2 text-xs font-bold text-red-400 shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* RIGHT: Editorial Form Panel (7 cols) */}
                          <div
                            className="col-span-7 flex flex-col justify-center p-6 space-y-4"
                            style={{
                              borderLeft: `1px solid ${(account?.themeMode || "light") === "dark" ? `${account?.brandColor || "#0066B2"}22` : `${account?.brandColor || "#0066B2"}15`}`,
                            }}
                          >
                            {/* Eyebrow / Bullets Title */}
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: account?.brandColor || "#0066B2" }} />
                              <input
                                type="text"
                                value={bulletsTitle}
                                onChange={(e) => setBulletsTitle(e.target.value)}
                                placeholder="Free Resource · Instant Access"
                                className={`text-[9px] font-black uppercase tracking-[0.2em] bg-transparent outline-none w-full ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`}
                              />
                            </div>

                            {/* Headline & Subheadline */}
                            <div className="space-y-1.5">
                              <textarea
                                ref={headlineRef}
                                rows={1}
                                value={headline}
                                onChange={(e) => {
                                  setHeadline(e.target.value);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Your headline here"
                                className={`w-full text-xl md:text-2xl font-black leading-tight bg-transparent outline-none resize-none ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}
                              />
                              <textarea
                                ref={subheadlineRef}
                                rows={1}
                                value={subheadline}
                                onChange={(e) => {
                                  setSubheadline(e.target.value);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Short subhead. say what they will get"
                                className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`}
                              />

                              <textarea
                                ref={pitchRef}
                                rows={2}
                                value={pitch}
                                onChange={(e) => {
                                  setPitch(e.target.value);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Write a short pitch. Press Enter twice to start a new paragraph."
                                className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${(account?.themeMode || "light") === "dark" ? "text-zinc-400 placeholder:text-zinc-500/70" : "text-zinc-600 placeholder:text-zinc-400/70"}`}
                              />
                            </div>

                            {/* Bullets */}
                            <div className="space-y-2">
                              {bullets && bullets.length > 0 ? (
                                <div className="space-y-1.5">
                                  {bullets.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <div
                                        className="h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
                                        style={{ background: `${account?.brandColor || "#0066B2"}22`, border: `1px solid ${account?.brandColor || "#0066B2"}44` }}
                                      >
                                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                                          <path d="M1 3.5l1.7 1.7L6 1.5" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      </div>
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                          const u = [...bullets];
                                          u[idx] = e.target.value;
                                          setBullets(u);
                                        }}
                                        placeholder="Bullet point item..."
                                        className={`w-full bg-transparent outline-none text-[11px] font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-600"}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setBullets(bullets.filter((_, i) => i !== idx))}
                                        className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                                        title="Remove bullet point"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs italic text-zinc-500 dark:text-zinc-400/80 my-1">
                                  No bullets yet. click + to add one.
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => setBullets([...bullets, ""])}
                                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-600/60 hover:border-zinc-400 bg-zinc-900/40 hover:bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition cursor-pointer mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add bullet</span>
                              </button>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${account?.brandColor || "#0066B2"}44, transparent)` }} />
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${(account?.themeMode || "light") === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>Sign Up Free</span>
                              <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${account?.brandColor || "#0066B2"}44, transparent)` }} />
                            </div>

                            {/* Form fields */}
                            <div className="space-y-2">
                              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={`w-full text-center text-xs font-bold bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`} placeholder="Claim Your Copy" />
                              <input type="text" placeholder="Name *" readOnly className={`w-full rounded-xl px-3 py-2 text-xs opacity-60 outline-none border border-zinc-200 dark:border-[#252529] ${(account?.themeMode || "light") === "dark" ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`} />
                              <input type="email" placeholder="Email *" readOnly className={`w-full rounded-xl px-3 py-2 text-xs opacity-60 outline-none border border-zinc-200 dark:border-[#252529] ${(account?.themeMode || "light") === "dark" ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`} />
                              {customFormFields.map((field) => (
                                <input
                                  key={field.id}
                                  type="text"
                                  placeholder={`${field.label}${field.required ? " *" : ""}`}
                                  readOnly
                                  className={`w-full rounded-xl px-3 py-2 text-xs opacity-60 outline-none border border-zinc-200 dark:border-[#252529] ${(account?.themeMode || "light") === "dark" ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`}
                                />
                              ))}
                              <input
                                type="text"
                                value={formButtonText}
                                onChange={(e) => setFormButtonText(e.target.value)}
                                onFocus={(e) => {
                                  if (e.target.value === "Send it to me") {
                                    setFormButtonText("");
                                  } else {
                                    e.target.select();
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value.trim()) {
                                    setFormButtonText("Send it to me");
                                  }
                                }}
                                placeholder="Send it to me"
                                className="w-full text-center rounded-xl py-2.5 px-4 text-xs font-extrabold text-white shadow-xl transition duration-150 outline-none border-2 border-transparent hover:border-white/40 focus:border-white cursor-text"
                                style={{ backgroundColor: account?.brandColor || "#0066B2" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : templateId === "template4" ? (
                      /* TEMPLATE 4: Neon Orbit */
                      <div
                        className="mx-auto max-w-6xl rounded-3xl overflow-hidden relative transition-all duration-300"
                        style={{
                          background: (account?.themeMode || "light") === "dark"
                            ? `radial-gradient(ellipse 80% 60% at 70% 30%, ${account?.brandColor || "#0066B2"}14 0%, #08080f 55%, #0d0012 100%)`
                            : `radial-gradient(ellipse 80% 60% at 70% 30%, ${account?.brandColor || "#0066B2"}0d 0%, #f4f5fb 55%, #f8f4ff 100%)`,
                          border: `1px solid ${(account?.themeMode || "light") === "dark" ? `${account?.brandColor || "#0066B2"}22` : `${account?.brandColor || "#0066B2"}18`}`,
                          boxShadow: `0 32px 80px -16px ${account?.brandColor || "#0066B2"}${Math.round((0.22 + ((account?.highlightIntensity ?? 100) / 100) * 0.35) * 255).toString(16).padStart(2, '0')}`,
                        }}
                      >
                        <div className="grid grid-cols-12 min-h-[460px] p-6 gap-5 items-center">
                          {/* LEFT: Copy + Form */}
                          <div className="col-span-6 flex flex-col justify-center space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: account?.brandColor || "#0066B2" }} />
                              <input
                                type="text"
                                value={bulletsTitle}
                                onChange={(e) => setBulletsTitle(e.target.value)}
                                placeholder="Free Resource · Limited Time"
                                className={`text-[9px] font-black uppercase tracking-[0.22em] bg-transparent outline-none w-full ${(account?.themeMode || "light") === "dark" ? "text-zinc-500" : "text-zinc-400"}`}
                              />
                            </div>
                            <textarea ref={headlineRef} rows={1} value={headline} onChange={(e) => { setHeadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} className={`w-full text-2xl md:text-3xl font-black leading-tight bg-transparent outline-none resize-none ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`} placeholder="Your headline here" />
                            <textarea ref={subheadlineRef} rows={1} value={subheadline} onChange={(e) => { setSubheadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} className={`w-full text-sm bg-transparent outline-none resize-none ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`} placeholder="Short subhead. say what they will get" />
                            <textarea
                              ref={pitchRef}
                              rows={2}
                              value={pitch}
                              onChange={(e) => {
                                setPitch(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              placeholder="Write a short pitch. Press Enter twice to start a new paragraph."
                              className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${(account?.themeMode || "light") === "dark" ? "text-zinc-400 placeholder:text-zinc-500/70" : "text-zinc-600 placeholder:text-zinc-400/70"}`}
                            />
                            {bullets && bullets.length > 0 ? (
                              <div className="space-y-2">
                                {bullets.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2.5">
                                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${account?.brandColor || "#0066B2"}18`, border: `1px solid ${account?.brandColor || "#0066B2"}44` }}>
                                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <input type="text" value={item} onChange={(e) => { const u = [...bullets]; u[idx] = e.target.value; setBullets(u); }} className={`w-full bg-transparent outline-none text-xs ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-600"}`} placeholder="Bullet point item..." />
                                    <button
                                      type="button"
                                      onClick={() => setBullets(bullets.filter((_, i) => i !== idx))}
                                      className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                                      title="Remove bullet point"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs italic text-zinc-500 dark:text-zinc-400/80 my-1">
                                No bullets yet. click + to add one.
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => setBullets([...bullets, ""])}
                              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-600/60 hover:border-zinc-400 bg-zinc-900/40 hover:bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition cursor-pointer mt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add bullet</span>
                            </button>

                            <div className="space-y-2 pt-2">
                              {formTitle && (
                                <input
                                  type="text"
                                  value={formTitle}
                                  onChange={(e) => setFormTitle(e.target.value)}
                                  className={`w-full text-center text-xs font-bold bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}
                                  placeholder="Claim Your Copy"
                                />
                              )}
                              <input type="text" placeholder="Name *" readOnly className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs" />
                              <input type="email" placeholder="Email *" readOnly className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs" />
                              {customFormFields.map((field) => (
                                <input
                                  key={field.id}
                                  type="text"
                                  placeholder={`${field.label}${field.required ? " *" : ""}`}
                                  readOnly
                                  className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                                />
                              ))}
                              <input
                                type="text"
                                value={formButtonText}
                                onChange={(e) => setFormButtonText(e.target.value)}
                                onFocus={(e) => {
                                  if (e.target.value === "Send it to me" || e.target.value === "Unlock Free Access →") {
                                    setFormButtonText("");
                                  } else {
                                    e.target.select();
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value.trim()) {
                                    setFormButtonText("Send it to me");
                                  }
                                }}
                                placeholder="Send it to me"
                                className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-text mt-2 outline-none border-2 border-transparent hover:border-white/40 focus:border-white transition duration-150"
                                style={{ background: `linear-gradient(135deg, ${account?.brandColor || "#0066B2"} 0%, ${account?.brandColor || "#0066B2"}cc 100%)`, boxShadow: `0 6px 24px -4px ${account?.brandColor || "#0066B2"}88` }}
                              />
                            </div>
                          </div>
                          {/* RIGHT: Orbital image */}
                          <div className="col-span-6 flex items-center justify-center relative" style={{ minHeight: "360px" }}>
                            <div className="absolute rounded-full pointer-events-none" style={{ width: "380px", height: "380px", background: `radial-gradient(circle, ${account?.brandColor || "#0066B2"}20 0%, transparent 70%)`, filter: "blur(28px)" }} />
                            <div className="absolute rounded-full border border-dashed pointer-events-none" style={{ width: "340px", height: "340px", borderColor: `${account?.brandColor || "#0066B2"}25` }} />
                            <div className="absolute rounded-full pointer-events-none" style={{ width: "295px", height: "295px", border: `1px solid ${account?.brandColor || "#0066B2"}33`, boxShadow: `0 0 20px ${account?.brandColor || "#0066B2"}22` }} />
                            <div className="absolute rounded-full pointer-events-none" style={{ width: "260px", height: "260px", border: `2px solid ${account?.brandColor || "#0066B2"}55`, boxShadow: `0 0 32px ${account?.brandColor || "#0066B2"}33` }} />
                            <div className="relative rounded-full overflow-hidden z-10 group" style={{ width: "230px", height: "230px", border: `3px solid ${account?.brandColor || "#0066B2"}88`, boxShadow: `0 0 40px -8px ${account?.brandColor || "#0066B2"}88` }}>
                              {/* Upload Progress Overlay for Orbit circle */}
                              {uploadProgress !== null && (
                                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white">
                                  <div className="w-full max-w-[170px] space-y-2 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                                      {uploadProgress === 100 ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      )}
                                      <span>{uploadProgress === 100 ? "Done!" : "Uploading"}</span>
                                      <span className="font-mono">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                      />
                                    </div>
                                    <p className="text-[9px] text-zinc-400">Optimizing media...</p>
                                  </div>
                                </div>
                              )}

                              {imageUrl && imageUrl.trim() !== "" ? (
                                <>
                                  <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white transition duration-200">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                      }}
                                      className="flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-[11px] font-bold text-white border border-white/30 backdrop-blur-md transition cursor-pointer"
                                    >
                                      <ImageIcon className="h-3.5 w-3.5" />
                                      <span>Replace</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setImageUrl(null);
                                      }}
                                      className="flex items-center gap-1 rounded-xl bg-red-500/30 hover:bg-red-500/50 px-3 py-1.5 text-[11px] font-bold text-red-300 border border-red-400/40 backdrop-blur-md transition cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-300" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer transition group/btn hover:opacity-90"
                                  style={{ background: `linear-gradient(135deg, ${account?.brandColor || "#0066B2"}88 0%, #0d0012 100%)` }}
                                >
                                  <ImageIcon className="h-8 w-8 text-white/80 group-hover/btn:scale-110 transition-transform mb-1.5" />
                                  <span className="text-xs font-bold text-white">Add Cover Image</span>
                                  <span className="text-[10px] text-white/60 mt-0.5">Click to upload</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : templateId === "template5" ? (
                      /* TEMPLATE 5: Magazine Cover Overlay */
                      <div className="mx-auto max-w-6xl rounded-3xl overflow-hidden relative transition-all duration-300" style={{ border: `1px solid ${account?.brandColor || "#0066B2"}30`, boxShadow: `0 24px 70px -12px ${account?.brandColor || "#0066B2"}${Math.round((0.18 + ((account?.highlightIntensity ?? 100) / 100) * 0.28) * 255).toString(16).padStart(2, '0')}`, background: (account?.themeMode || "light") === "dark" ? "#0d0d11" : "#f0f2f7" }}>
                        {/* Full-bleed cover image */}
                        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "50%" }}>
                          {imageUrl && imageUrl.trim() !== "" ? (
                            <img src={imageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-[#121215]" />
                          )}
                          <div className="absolute inset-0 pointer-events-none z-10" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 100%)" }} />
                          <div className="absolute inset-0 pointer-events-none z-10" style={{ background: `linear-gradient(to right, ${account?.brandColor || "#0066B2"}33 0%, transparent 60%)` }} />

                          {/* Upload Progress Overlay */}
                          {uploadProgress !== null && (
                            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-white">
                              <div className="w-full max-w-xs space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                                    {uploadProgress === 100 ? (
                                      <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {uploadProgress === 100 ? "Image uploaded!" : "Uploading image..."}
                                  </span>
                                  <span className="font-mono text-[#0066B2] dark:text-[#38BDF8]">{uploadProgress}%</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                                <p className="text-[11px] text-zinc-400 text-center">Optimizing media assets...</p>
                              </div>
                            </div>
                          )}

                          {/* Image Action Overlay Controls */}
                          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-black px-3 py-1.5 text-xs font-bold text-white shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                            >
                              <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
                              <span>{imageUrl && imageUrl.trim() !== "" ? "Replace Image" : "Add Image"}</span>
                            </button>
                            {imageUrl && imageUrl.trim() !== "" && (
                              <button
                                type="button"
                                onClick={() => setImageUrl(null)}
                                className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-red-950/80 px-3 py-1.5 text-xs font-bold text-red-400 shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10 space-y-1">
                            <textarea
                              ref={headlineRef}
                              rows={1}
                              value={headline}
                              onChange={(e) => { setHeadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                              placeholder="Your headline here"
                              className="w-full text-2xl md:text-4xl font-black text-white bg-transparent outline-none resize-none leading-tight placeholder:text-white/50"
                            />
                            <textarea
                              ref={subheadlineRef}
                              rows={1}
                              value={subheadline}
                              onChange={(e) => { setSubheadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                              placeholder="Short subhead. say what they will get"
                              className="w-full text-sm text-white/80 bg-transparent outline-none resize-none placeholder:text-white/50"
                            />
                          </div>
                        </div>

                        {/* Floating glass form tray */}
                        <div className="relative z-20 mx-4 md:mx-8 -mt-5 mb-6 rounded-2xl p-5 space-y-4" style={{ background: (account?.themeMode || "light") === "dark" ? "rgba(12,12,18,0.92)" : "rgba(255,255,255,0.96)", border: `1px solid ${(account?.themeMode || "light") === "dark" ? `${account?.brandColor || "#0066B2"}30` : `${account?.brandColor || "#0066B2"}20`}`, backdropFilter: "blur(20px)", boxShadow: `0 8px 40px rgba(0,0,0,0.18)` }}>
                          {/* Pitch Area */}
                          <textarea
                            ref={pitchRef}
                            rows={2}
                            value={pitch}
                            onChange={(e) => {
                              setPitch(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            placeholder="Write a short pitch. Press Enter twice to start a new paragraph."
                            className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${(account?.themeMode || "light") === "dark" ? "text-zinc-300 placeholder:text-zinc-500" : "text-zinc-600 placeholder:text-zinc-400"}`}
                          />

                          {/* Bullets Section Header */}
                          <input
                            type="text"
                            value={bulletsTitle}
                            onChange={(e) => setBulletsTitle(e.target.value)}
                            placeholder="What they will learn"
                            className={`w-full text-xs font-bold uppercase tracking-wider bg-transparent outline-none ${(account?.themeMode || "light") === "dark" ? "text-zinc-400 placeholder:text-zinc-500" : "text-zinc-500 placeholder:text-zinc-400"}`}
                          />

                          {/* Bullets List & Empty State */}
                          {bullets && bullets.length > 0 ? (
                            <div className="space-y-2">
                              {bullets.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5">
                                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${account?.brandColor || "#0066B2"}18`, border: `1px solid ${account?.brandColor || "#0066B2"}44` }}>
                                    <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  </div>
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => { const u = [...bullets]; u[idx] = e.target.value; setBullets(u); }}
                                    className={`w-full bg-transparent outline-none text-xs ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-600"}`}
                                    placeholder="Bullet point item..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setBullets(bullets.filter((_, i) => i !== idx))}
                                    className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                                    title="Remove bullet point"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs italic text-zinc-500 dark:text-zinc-400/80 my-1">
                              No bullets yet. click + to add one.
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => setBullets([...bullets, ""])}
                            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-600/60 hover:border-zinc-400 bg-zinc-900/40 hover:bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add bullet</span>
                          </button>

                          {/* Form Section */}
                          <div className="space-y-2 pt-2 border-t border-zinc-200/20 dark:border-zinc-800/40">
                            {formTitle !== undefined && (
                              <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className={`w-full text-center text-xs font-bold uppercase tracking-wider bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
                                placeholder="Get your free copy now"
                              />
                            )}
                            <input type="text" placeholder="Name *" readOnly className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs" />
                            <input type="email" placeholder="Email *" readOnly className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs" />
                            {customFormFields.map((field) => (
                              <div key={field.id}>
                                <input type="text" placeholder={`${field.label}${field.required ? " *" : ""}`} readOnly className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs" />
                              </div>
                            ))}
                            <input
                              type="text"
                              value={formButtonText}
                              onChange={(e) => setFormButtonText(e.target.value)}
                              onFocus={(e) => {
                                if (e.target.value === "Send it to me" || e.target.value === "Get Instant Access →") {
                                  setFormButtonText("");
                                } else {
                                  e.target.select();
                                }
                              }}
                              onBlur={(e) => {
                                if (!e.target.value.trim()) {
                                  setFormButtonText("Send it to me");
                                }
                              }}
                              placeholder="Send it to me"
                              className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-text mt-1 outline-none border-2 border-transparent hover:border-white/40 focus:border-white transition duration-150"
                              style={{ background: `linear-gradient(135deg, ${account?.brandColor || "#0066B2"} 0%, ${account?.brandColor || "#0066B2"}cc 100%)`, boxShadow: `0 6px 24px -4px ${account?.brandColor || "#0066B2"}88` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : templateId === "template6" ? (
                      /* TEMPLATE 6: Full Bleed Image Card — matches brand page */
                      <div
                        className={`mx-auto max-w-6xl rounded-3xl overflow-hidden relative min-h-[500px] flex flex-col justify-between transition-all duration-300 group shadow-2xl ${(account?.themeMode || "light") === "dark" ? "bg-[#0e0e14] text-white" : "bg-white text-zinc-900"}`}
                        style={{
                          border: `1px solid ${(account?.themeMode || "light") === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                          boxShadow: (account?.themeMode || "light") === "dark" ? `0 0 0 1px ${account?.brandColor || "#0066B2"}22, 0 28px 70px -14px rgba(0,0,0,0.8)` : `0 0 0 1px ${account?.brandColor || "#0066B2"}18, 0 20px 60px -12px ${account?.brandColor || "#0066B2"}22`
                        }}
                      >
                        {/* FULL CARD BACKGROUND IMAGE / GRADIENT LAYER */}
                        {imageUrl && imageUrl.trim() !== "" ? (
                          <img src={imageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div
                            className="absolute inset-0 w-full h-full"
                            style={{ background: `linear-gradient(145deg, ${account?.brandColor || "#0066B2"}cc 0%, #080912 100%)` }}
                          />
                        )}

                        {/* DARK SCRIM OVERLAY */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/75 to-black/45" />

                        {/* TOP RIGHT ACTION BUTTONS */}
                        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-black px-3.5 py-2 text-xs font-bold text-white shadow-lg border border-white/20 backdrop-blur-md transition cursor-pointer"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
                            <span>{imageUrl ? "Replace Image" : "Add Image"}</span>
                          </button>
                          {imageUrl && (
                            <button
                              type="button"
                              onClick={() => setImageUrl(null)}
                              className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-red-950/80 px-3.5 py-2 text-xs font-bold text-red-400 shadow-lg border border-white/20 backdrop-blur-md transition cursor-pointer"
                              title="Remove cover image"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          )}
                        </div>

                        {/* UPLOAD PROGRESS OVERLAY */}
                        {uploadProgress !== null && (
                          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md text-white">
                            <div className="w-full max-w-xs space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                                  {uploadProgress === 100 ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  )}
                                  {uploadProgress === 100 ? "Image uploaded!" : "Uploading image..."}
                                </span>
                                <span className="font-mono text-[#0066B2] dark:text-[#38BDF8]">{uploadProgress}%</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-[11px] text-zinc-400 text-center">Optimizing media assets...</p>
                            </div>
                          </div>
                        )}

                        {/* CARD CONTENT FLOATING OVER IMAGE */}
                        <div className="relative z-10 p-6 md:p-8 space-y-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-4 max-w-3xl">
                            {/* HEADLINE */}
                            <textarea
                              ref={headlineRef}
                              rows={1}
                              value={headline}
                              onChange={(e) => { setHeadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                              className="w-full text-2xl md:text-4xl font-black bg-transparent outline-none resize-none leading-tight text-white drop-shadow-md placeholder:text-zinc-400"
                              placeholder="Your headline here"
                            />
                            {/* SUBHEADLINE */}
                            <textarea
                              ref={subheadlineRef}
                              rows={1}
                              value={subheadline}
                              onChange={(e) => { setSubheadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                              className="w-full text-sm md:text-base font-medium bg-transparent outline-none resize-none text-zinc-200 drop-shadow-sm placeholder:text-zinc-400"
                              placeholder="Short subhead. say what they will get"
                            />
                            {/* PITCH */}
                            <textarea
                              ref={pitchRef}
                              rows={2}
                              value={pitch}
                              onChange={(e) => {
                                setPitch(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              placeholder="Write a short pitch. Press Enter twice to start a new paragraph."
                              className="w-full text-xs md:text-sm leading-relaxed bg-transparent outline-none resize-none text-zinc-300 placeholder:text-zinc-400"
                            />

                            {/* BULLETS SECTION */}
                            <div className="space-y-2.5 pt-2">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: account?.brandColor || "#0066B2" }} />
                                <input
                                  type="text"
                                  value={bulletsTitle}
                                  onChange={(e) => setBulletsTitle(e.target.value)}
                                  placeholder="What they will learn"
                                  className="text-xs font-black uppercase tracking-[0.18em] bg-transparent outline-none text-zinc-300 placeholder:text-zinc-500"
                                />
                              </div>
                              {bullets && bullets.length > 0 ? (
                                <div className="space-y-2">
                                  {bullets.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5">
                                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-white/10 border border-white/20">
                                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={account?.brandColor || "#38BDF8"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                      </div>
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => { const u = [...bullets]; u[idx] = e.target.value; setBullets(u); }}
                                        className="w-full bg-transparent outline-none text-xs font-semibold text-zinc-100 placeholder:text-zinc-400"
                                        placeholder="Bullet point item..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setBullets(bullets.filter((_, i) => i !== idx))}
                                        className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                                        title="Remove bullet point"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs italic text-zinc-400 my-1">
                                  No bullets yet. click + to add one.
                                </p>
                              )}

                              <button
                                type="button"
                                onClick={() => setBullets([...bullets, ""])}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 hover:bg-black/70 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition cursor-pointer mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add bullet</span>
                              </button>
                            </div>
                          </div>

                          {/* SMART FORM GRID */}
                          <div className="pt-4 space-y-3">
                            {customFormFields.length === 0 ? (
                              /* Default single inline pill bar when Name & Email only */
                              <div className="flex items-center rounded-2xl p-1.5 gap-2 bg-black/50 border border-white/15 backdrop-blur-xl">
                                <div className="flex-1 flex items-center gap-2 px-3">
                                  <span className="text-xs text-zinc-400">👤</span>
                                  <input type="text" placeholder="Name *" readOnly className="w-full bg-transparent text-xs outline-none pointer-events-none select-none text-white placeholder:text-zinc-400" />
                                </div>
                                <div className="w-px h-5 shrink-0 bg-white/20" />
                                <div className="flex-1 flex items-center gap-2 px-3">
                                  <span className="text-xs text-zinc-400">✉️</span>
                                  <input type="email" placeholder="Email *" readOnly className="w-full bg-transparent text-xs outline-none pointer-events-none select-none text-white placeholder:text-zinc-400" />
                                </div>
                                <input
                                  type="text"
                                  value={formButtonText}
                                  onChange={(e) => setFormButtonText(e.target.value)}
                                  onFocus={(e) => {
                                    if (e.target.value === "Send it to me" || e.target.value === "Get Instant Access →") {
                                      setFormButtonText("");
                                    } else {
                                      e.target.select();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (!e.target.value.trim()) {
                                      setFormButtonText("Send it to me");
                                    }
                                  }}
                                  placeholder="Send it to me"
                                  className="shrink-0 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white outline-none cursor-text transition"
                                  style={{ background: `linear-gradient(135deg, ${account?.brandColor || "#0066B2"} 0%, ${account?.brandColor || "#0066B2"}cc 100%)`, boxShadow: `0 4px 16px -4px ${account?.brandColor || "#0066B2"}88` }}
                                />
                              </div>
                            ) : (
                              /* Compact 2-Column Form Grid Card when Custom Fields are added */
                              <div className="rounded-2xl p-4 bg-black/50 border border-white/15 backdrop-blur-xl space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                                    <span className="text-xs text-zinc-400">👤</span>
                                    <input type="text" placeholder="Name *" readOnly className="w-full bg-transparent text-xs outline-none pointer-events-none select-none text-white placeholder:text-zinc-400" />
                                  </div>
                                  <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                                    <span className="text-xs text-zinc-400">✉️</span>
                                    <input type="email" placeholder="Email *" readOnly className="w-full bg-transparent text-xs outline-none pointer-events-none select-none text-white placeholder:text-zinc-400" />
                                  </div>
                                  {customFormFields.map((field) => (
                                    <div
                                      key={field.id}
                                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10 ${field.type === "textarea" ? "col-span-1 md:col-span-2" : ""
                                        }`}
                                    >
                                      <input
                                        type="text"
                                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                                        readOnly
                                        className="w-full bg-transparent text-xs outline-none pointer-events-none text-white placeholder:text-zinc-400"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  value={formButtonText}
                                  onChange={(e) => setFormButtonText(e.target.value)}
                                  onFocus={(e) => {
                                    if (e.target.value === "Send it to me" || e.target.value === "Get Instant Access →") {
                                      setFormButtonText("");
                                    } else {
                                      e.target.select();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (!e.target.value.trim()) {
                                      setFormButtonText("Send it to me");
                                    }
                                  }}
                                  placeholder="Send it to me"
                                  className="w-full rounded-xl py-3 text-xs font-extrabold text-white outline-none cursor-text transition text-center cursor-pointer"
                                  style={{
                                    background: `linear-gradient(135deg, ${account?.brandColor || "#0066B2"} 0%, ${account?.brandColor || "#0066B2"}cc 100%)`,
                                    boxShadow: `0 4px 16px -4px ${account?.brandColor || "#0066B2"}88`
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : templateId === "template7" ? (
                      /* TEMPLATE 7: Diagonal Immersive Split — matches brand page */
                      <div
                        className="mx-auto max-w-6xl rounded-3xl relative overflow-hidden transition-all duration-300"
                        style={{
                          padding: "2px",
                          background: `conic-gradient(from 0deg, ${account?.brandColor || "#0066B2"}, #ffffff22, ${account?.brandColor || "#0066B2"}88, #00000000, ${account?.brandColor || "#0066B2"})`,
                          boxShadow: `0 30px 80px -16px ${account?.brandColor || "#0066B2"}${Math.round((0.3 + ((account?.highlightIntensity ?? 100) / 100) * 0.4) * 255).toString(16).padStart(2, '0')}`,
                        }}
                      >
                        <div
                          className="rounded-[22px] overflow-hidden relative"
                          style={{ background: (account?.themeMode || "light") === "dark" ? "#0b0b10" : "#ffffff", minHeight: "460px" }}
                        >
                          {/* 0-100% REAL UPLOAD PROGRESS OVERLAY */}
                          {uploadProgress !== null && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center text-white">
                              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                                {uploadProgress === 100 ? (
                                  <Check className="h-6 w-6 text-emerald-400" />
                                ) : (
                                  <Loader2 className="h-6 w-6 animate-spin text-[#0066B2] dark:text-[#38BDF8]" />
                                )}
                              </div>
                              <p className="text-sm font-bold">
                                {uploadProgress === 100 ? "Image uploaded!" : "Uploading cover image..."}
                              </p>
                              <div className="mt-3 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800 p-0.5 border border-zinc-700">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-[#0066B2] via-sky-400 to-emerald-400 transition-all duration-200"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="mt-1 font-mono text-xs text-zinc-300 font-bold">{uploadProgress}%</span>
                            </div>
                          )}

                          {/* DIAGONAL IMAGE PANEL (left ~58%) */}
                          <div className="absolute inset-0" style={{ clipPath: "polygon(0 0, 62% 0, 52% 100%, 0 100%)", zIndex: 1 }}>
                            {imageUrl && imageUrl.trim() !== "" ? (
                              <img src={imageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div
                                className="absolute inset-0 w-full h-full"
                                style={{ background: `linear-gradient(155deg, ${account?.brandColor || "#0066B2"}99 0%, #060610 55%, #12001a 100%)` }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                  {[160, 110, 66, 32].map((size, i) => <div key={i} className="absolute rounded-full border border-white" style={{ width: size, height: size, opacity: 1 - i * 0.2 }} />)}
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)" }} />
                            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />

                            {/* Overlaid content on image */}
                            <div className="absolute inset-0 flex flex-col justify-between p-5 z-10 pointer-events-auto">
                              {/* Top: Image Action Buttons (positioned left to avoid clip-path cutoff) */}
                              <div className="flex items-center justify-start gap-2 max-w-[260px]">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-black px-3.5 py-1.5 text-xs font-bold text-white shadow-xl border border-white/30 backdrop-blur-md transition cursor-pointer"
                                >
                                  <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
                                  <span>{imageUrl ? "Replace Image" : "Add Image"}</span>
                                </button>
                                {imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setImageUrl(null)}
                                    className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-red-950 px-3 py-1.5 text-xs font-bold text-red-400 shadow-xl border border-white/30 backdrop-blur-md transition cursor-pointer"
                                    title="Remove cover image"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                              {/* Bottom: headline + subheadline */}
                              <div className="space-y-2 max-w-[85%] sm:max-w-[340px]">
                                <textarea ref={headlineRef} rows={1} value={headline} onChange={(e) => { setHeadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} className="w-full text-2xl sm:text-3xl font-black text-white bg-transparent outline-none resize-none leading-tight drop-shadow-2xl" placeholder="Your headline here" />
                                <textarea ref={subheadlineRef} rows={1} value={subheadline} onChange={(e) => { setSubheadline(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} className="w-full text-xs sm:text-sm font-medium text-white/75 bg-transparent outline-none resize-none leading-relaxed drop-shadow-md" placeholder="Your subheadline" />
                              </div>
                            </div>
                          </div>

                          {/* RIGHT FORM PANEL */}
                          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center" style={{ left: "47%", padding: "24px 20px 24px 24px", zIndex: 2 }}>
                            <div className="space-y-3 w-full">
                              <div className="space-y-0.5">
                                <input
                                  type="text"
                                  value={bulletsTitle}
                                  onChange={(e) => setBulletsTitle(e.target.value)}
                                  className="w-full text-[10px] font-black uppercase tracking-[0.2em] bg-transparent outline-none"
                                  style={{ color: account?.brandColor || "#0066B2" }}
                                  placeholder="Category / Tag"
                                />
                                <input
                                  type="text"
                                  value={formTitle}
                                  onChange={(e) => setFormTitle(e.target.value)}
                                  className={`w-full text-base font-black bg-transparent outline-none ${(account?.themeMode || "light") === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-900 placeholder:text-zinc-400"}`}
                                  placeholder="Form Title"
                                />
                                <input
                                  type="text"
                                  value={formSubtitle}
                                  onChange={(e) => setFormSubtitle(e.target.value)}
                                  className={`w-full text-xs bg-transparent outline-none ${(account?.themeMode || "light") === "dark" ? "text-zinc-400 placeholder:text-zinc-600" : "text-zinc-500 placeholder:text-zinc-400"}`}
                                  placeholder="Form Subtitle"
                                />
                              </div>
                              {/* Bullets */}
                              <div className="space-y-1.5 pt-1">
                                {bullets && bullets.length > 0 ? (
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                    {bullets.map((item, idx) => (
                                      <div key={idx} className="group flex items-start gap-2">
                                        <div className="flex h-3.5 w-3.5 shrink-0 mt-0.5 items-center justify-center rounded-full" style={{ backgroundColor: `${account?.brandColor || "#0066B2"}22`, border: `1px solid ${account?.brandColor || "#0066B2"}55` }}>
                                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M1 3l1.5 1.5L5 1.5" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                        <input
                                          type="text"
                                          value={item}
                                          onChange={(e) => {
                                            const u = [...bullets];
                                            u[idx] = e.target.value;
                                            setBullets(u);
                                          }}
                                          placeholder={`Bullet point ${idx + 1}`}
                                          className={`w-full bg-transparent outline-none text-xs leading-relaxed ${(account?.themeMode || "light") === "dark" ? "text-zinc-300 placeholder:text-zinc-600" : "text-zinc-600 placeholder:text-zinc-400"}`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setBullets(bullets.filter((_, i) => i !== idx))}
                                          className="text-zinc-400 hover:text-red-400 transition cursor-pointer p-0.5 shrink-0"
                                          title="Remove bullet"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] italic text-zinc-400 my-0.5">
                                    No bullets yet. click + to add one.
                                  </p>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setBullets([...bullets, ""])}
                                  className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-black/40 hover:bg-black/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md transition cursor-pointer mt-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add bullet</span>
                                </button>
                              </div>
                              {/* Form fields */}
                              <div className="space-y-2">
                                {[{ icon: "name", placeholder: "Full name", type: "text" }, { icon: "email", placeholder: "Email address", type: "email" }].map(({ icon, placeholder, type }) => (
                                  <div key={icon} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: (account?.themeMode || "light") === "dark" ? "rgba(255,255,255,0.05)" : "#f4f5f8", border: `1px solid ${(account?.themeMode || "light") === "dark" ? `${account?.brandColor || "#0066B2"}22` : `${account?.brandColor || "#0066B2"}20`}` }}>
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                                      {icon === "name" ? <><circle cx="6" cy="4" r="2.5" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.4" /><path d="M1.5 10.5C1.5 8.567 3.567 7 6 7s4.5 1.567 4.5 3.5" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.4" strokeLinecap="round" /></> : <><rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.4" /><path d="M1 4l5 3.5L11 4" stroke={account?.brandColor || "#0066B2"} strokeWidth="1.4" strokeLinecap="round" /></>}
                                    </svg>
                                    <input type={type} placeholder={placeholder} readOnly className={`w-full bg-transparent text-[11px] outline-none pointer-events-none ${(account?.themeMode || "light") === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`} />
                                  </div>
                                ))}
                                {customFormFields.map((field) => (
                                  <div key={field.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: (account?.themeMode || "light") === "dark" ? "rgba(255,255,255,0.05)" : "#f4f5f8", border: `1px solid ${account?.brandColor || "#0066B2"}22` }}>
                                    <input type="text" placeholder={field.placeholder || field.label} readOnly className={`w-full bg-transparent text-[11px] outline-none pointer-events-none ${(account?.themeMode || "light") === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`} />
                                  </div>
                                ))}
                                {/* CTA */}
                                <input
                                  type="text"
                                  value={formButtonText}
                                  onChange={(e) => setFormButtonText(e.target.value)}
                                  onFocus={(e) => {
                                    if (e.target.value === "Send it to me" || e.target.value === "Unlock Free Access") {
                                      setFormButtonText("");
                                    } else {
                                      e.target.select();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (!e.target.value.trim()) {
                                      setFormButtonText("Send it to me");
                                    }
                                  }}
                                  placeholder="Send it to me"
                                  className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-text outline-none border-2 border-transparent hover:border-white/40 focus:border-white transition duration-150"
                                  style={{ background: `linear-gradient(135deg, ${account?.brandColor || "#0066B2"} 0%, ${account?.brandColor || "#0066B2"}bb 100%)`, boxShadow: `0 0 24px -4px ${account?.brandColor || "#0066B2"}88, 0 4px 12px rgba(0,0,0,0.2)` }}
                                />
                              </div>
                              {/* Social proof */}
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex -space-x-2">
                                  {["#e879f9", "#38bdf8", "#4ade80", "#fb923c"].map((color, i) => (
                                    <div key={i} className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-[7px] font-black text-white" style={{ backgroundColor: color, borderColor: (account?.themeMode || "light") === "dark" ? "#0b0b10" : "#ffffff" }}>
                                      {["A", "B", "C", "D"][i]}
                                    </div>
                                  ))}
                                </div>
                                <span className={`text-[9px] font-semibold ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Join 12,000+ creators already inside</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    ) : (
                      /* TEMPLATE 1 / Default: Modern Split Layout */
                      <div
                        className={`mx-auto max-w-6xl rounded-2xl border p-6 md:p-8 shadow-2xl transition-all duration-300 backdrop-blur-md ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}
                        style={{
                          borderColor: account?.brandColor
                            ? `${account.brandColor}${Math.round((0.15 + ((account?.highlightIntensity ?? 100) / 100) * 0.65) * 255).toString(16).padStart(2, '0')}`
                            : "#0066B230",
                          boxShadow: ((account?.highlightIntensity ?? 100) > 10 && account?.brandColor)
                            ? `0 16px 40px -10px ${account.brandColor}${Math.round(((account?.highlightIntensity ?? 100) / 100) * 0.45 * 255).toString(16).padStart(2, '0')}`
                            : "0 4px 12px rgba(0,0,0,0.05)",
                          background: (account?.themeMode || "light") === "light"
                            ? `linear-gradient(135deg, ${account?.brandColor || "#0066B2"}${Math.round((0.02 + ((account?.highlightIntensity ?? 100) / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0.95) 50%)`
                            : `linear-gradient(135deg, ${account?.brandColor || "#0066B2"}${Math.round((0.05 + ((account?.highlightIntensity ?? 100) / 100) * 0.3) * 255).toString(16).padStart(2, '0')} 0%, rgba(18, 18, 20, 0.95) 50%)`
                        }}
                      >
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
                                className={`w-full text-3xl sm:text-5xl font-black bg-transparent outline-none border-none ring-0 shadow-none rounded-xl px-3 py-3 cursor-text transition-all duration-150 resize-none overflow-hidden leading-snug ${(account?.themeMode || "light") === "dark" ? "text-white hover:bg-white/5 focus:border-white/20 focus:!bg-black/30" : "text-zinc-900 hover:bg-black/5 focus:border-black/20 focus:!bg-white"}`}
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
                                className={`w-full text-sm sm:text-base font-semibold bg-transparent outline-none border-none ring-0 shadow-none rounded-xl px-3 py-3 cursor-text transition-all duration-150 resize-none overflow-hidden leading-relaxed ${(account?.themeMode || "light") === "dark" ? "text-zinc-300 hover:bg-white/5 focus:border-white/20 focus:!bg-black/30" : "text-zinc-600 hover:bg-black/5 focus:border-black/20 focus:!bg-white"}`}
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
                                className={`w-full text-xs sm:text-sm bg-transparent outline-none border-none ring-0 shadow-none rounded-xl px-3 py-3 cursor-text transition-all duration-150 resize-none overflow-hidden leading-relaxed ${(account?.themeMode || "light") === "dark" ? "text-zinc-400 hover:bg-white/5 focus:border-white/20 focus:!bg-black/30" : "text-zinc-500 hover:bg-black/5 focus:border-black/20 focus:!bg-white"}`}
                              />
                            </div>

                            {/* Bullets List Section */}
                            <div className={`group relative rounded-2xl border border-transparent p-3.5 transition-all duration-200 space-y-3 ${(account?.themeMode || "light") === "dark" ? "hover:border-white/10 hover:bg-white/5" : "hover:border-black/10 hover:bg-black/5"}`}>
                              {/* Floating Pencil Edit Badge */}
                              <div className={`absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer ${(account?.themeMode || "light") === "dark" ? "bg-white text-black" : "bg-black text-white"}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </div>

                              {/* Card Title Input */}
                              <div>
                                <input
                                  type="text"
                                  value={bulletsTitle}
                                  onChange={(e) => setBulletsTitle(e.target.value)}
                                  placeholder="What they will learn"
                                  className={`w-full text-xs sm:text-sm font-bold bg-transparent outline-none border-b border-transparent rounded-lg px-2 py-1 transition-all duration-150 placeholder:font-normal ${(account?.themeMode || "light") === "dark" ? "text-zinc-200 hover:border-white/20 focus:border-white/40 placeholder:text-zinc-500" : "text-zinc-800 hover:border-black/20 focus:border-black/40 placeholder:text-zinc-400"}`}
                                />
                              </div>

                              {bullets.length === 0 ? (
                                <p className="text-xs italic text-zinc-400">
                                  No bullets yet. Click + to add one.
                                </p>
                              ) : (
                                <ul className="space-y-3">
                                  {bullets.map((b, idx) => (
                                    <li key={idx} className="group relative flex items-center gap-3">
                                      <span
                                        className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-white font-bold shadow-xs transition-colors"
                                        style={{ backgroundColor: account?.brandColor || "#0066B2" }}
                                      >
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
                                        placeholder={`Bullet point ${idx + 1}...`}
                                        className={`w-full text-xs sm:text-sm font-semibold bg-transparent outline-none border-none ring-0 rounded-xl px-3 py-1.5 transition-all duration-150 ${(account?.themeMode || "light") === "dark" ? "text-zinc-200 hover:bg-white/5 focus:bg-black/30 focus:border focus:border-white/20 placeholder:text-zinc-600" : "text-zinc-800 hover:bg-black/5 focus:bg-white focus:border focus:border-black/20 placeholder:text-zinc-400"}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setBullets(bullets.filter((_, i) => i !== idx))}
                                        className="text-zinc-400 hover:text-red-500 transition p-1 shrink-0 cursor-pointer"
                                        title="Remove bullet"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {/* Add Bullet Button */}
                              <button
                                type="button"
                                onClick={() => setBullets([...bullets, ""])}
                                className={`inline-flex items-center gap-1.5 rounded-xl border border-dashed px-3.5 py-1.5 text-xs font-semibold transition shadow-2xs cursor-pointer mt-2 ${(account?.themeMode || "light") === "dark" ? "border-white/20 text-zinc-300 hover:border-white/40 bg-white/5" : "border-black/20 text-zinc-700 hover:border-black/40 bg-black/5"}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add bullet</span>
                              </button>
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
                              <AnimatePresence mode="wait">
                                {uploadProgress !== null ? (
                                  <motion.div
                                    key="progress"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className={`rounded-2xl border-2 border-dashed p-6 text-center flex flex-col items-center justify-center min-h-[140px] ${(account?.themeMode || "light") === "dark" ? "border-[#0066B2]/50 bg-[#0066B2]/10 text-white" : "border-[#0066B2]/50 bg-[#EFF6FF] text-zinc-900"}`}
                                  >
                                    <div className="w-full max-w-xs space-y-3">
                                      <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                                          {uploadProgress === 100 ? (
                                            <Check className="h-4 w-4 text-emerald-500" />
                                          ) : (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          )}
                                          {uploadProgress === 100 ? "Image uploaded!" : "Uploading image..."}
                                        </span>
                                        <span className="font-mono text-[#0066B2] dark:text-[#38BDF8]">{uploadProgress}%</span>
                                      </div>
                                      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                      <p className="text-[11px] text-zinc-400">Optimizing media assets...</p>
                                    </div>
                                  </motion.div>
                                ) : imageUrl ? (
                                  <motion.div
                                    key="image"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className={`relative group rounded-2xl overflow-hidden border shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-white/10 bg-black/20" : "border-black/10 bg-white"}`}
                                  >
                                    <img src={imageUrl} alt="Uploaded magnet media" className="w-full object-cover max-h-72 rounded-2xl" />
                                    <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          fileInputRef.current?.click();
                                        }}
                                        className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-black px-3.5 py-2 text-xs font-bold text-white shadow-md border border-white/20 transition cursor-pointer pointer-events-auto"
                                      >
                                        <ImageIcon className="h-4 w-4 text-zinc-400" />
                                        <span>Replace</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setImageUrl(null);
                                        }}
                                        className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-red-950/80 px-3.5 py-2 text-xs font-bold text-red-400 shadow-md border border-white/20 transition cursor-pointer pointer-events-auto"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-400" />
                                        <span>Remove</span>
                                      </button>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="dropzone"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${(account?.themeMode || "light") === "dark" ? "border-white/15 bg-black/20 text-white hover:border-white/30" : "border-black/15 bg-white text-zinc-900 hover:border-black/30"}`}
                                  >
                                    <button
                                      onClick={() => fileInputRef.current?.click()}
                                      className="flex flex-col items-center justify-center w-full py-4 cursor-pointer"
                                    >
                                      <ImageIcon className="h-7 w-7 text-zinc-400 mb-2" />
                                      <span className="text-xs font-bold">Add an image</span>
                                      <span className="text-[11px] text-zinc-400 mt-0.5">PNG, JPG, WebP, or GIF. 10 MB max.</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Signup Form Card - Fully Editable Title, Subtitle & Button CTA (Except Name & Email Inputs) */}
                            <div
                              className="rounded-2xl border p-6 text-center shadow-lg transition-all duration-200 backdrop-blur-md"
                              style={{
                                borderColor: (account?.themeMode || "light") === "dark"
                                  ? (account?.brandColor ? `${account.brandColor}40` : "rgba(255, 255, 255, 0.15)")
                                  : (account?.brandColor ? `${account.brandColor}30` : "#FFD0BD"),
                                backgroundColor: (account?.themeMode || "light") === "dark"
                                  ? "rgba(10, 10, 12, 0.6)"
                                  : "rgba(255, 255, 255, 0.85)"
                              }}
                            >
                              {/* Editable Card Title */}
                              <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                onFocus={(e) => {
                                  if (e.target.value === "Download for free") {
                                    setFormTitle("");
                                  } else {
                                    e.target.select();
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value.trim()) {
                                    setFormTitle("Download for free");
                                  }
                                }}
                                placeholder="Download for free"
                                className={`w-full text-center text-xl sm:text-2xl font-extrabold outline-none border border-transparent hover:border-zinc-300 dark:hover:border-white/10 rounded-xl py-1.5 px-3 bg-transparent transition-all duration-200 ${(account?.themeMode || "light") === "dark" ? "text-white focus:bg-[#16161A] focus:border-white/30" : "text-zinc-900 focus:bg-zinc-100 focus:border-zinc-400"}`}
                              />

                              {/* Editable Card Subtitle */}
                              <textarea
                                rows={1}
                                value={formSubtitle}
                                onChange={(e) => {
                                  setFormSubtitle(e.target.value);
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onFocus={(e) => {
                                  if (e.target.value === "Pop your email in and we'll send it straight over.") {
                                    setFormSubtitle("");
                                  } else {
                                    e.target.select();
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value.trim()) {
                                    setFormSubtitle("Pop your email in and we'll send it straight over.");
                                  }
                                }}
                                placeholder="Pop your email in and we'll send it straight over."
                                className={`w-full text-center text-xs mt-1 outline-none border border-transparent hover:border-zinc-300 dark:hover:border-white/10 rounded-xl py-1 px-3 bg-transparent transition-all duration-200 resize-none overflow-hidden ${(account?.themeMode || "light") === "dark" ? "text-zinc-400 focus:bg-[#16161A] focus:text-white focus:border-white/30" : "text-zinc-500 focus:bg-zinc-100 focus:text-zinc-900 focus:border-zinc-400"}`}
                              />

                              <div className="mt-5 space-y-3">
                                {/* Non-editable Preview Input: Name */}
                                <input
                                  type="text"
                                  placeholder="Name"
                                  readOnly
                                  className={`w-full rounded-xl border px-4 py-3 text-xs outline-none shadow-xs select-none ${(account?.themeMode || "light") === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-zinc-500" : "border-black/10 bg-white text-zinc-900 placeholder:text-zinc-400"}`}
                                />

                                {/* Non-editable Preview Input: Email */}
                                <input
                                  type="email"
                                  placeholder="Email"
                                  readOnly
                                  className={`w-full rounded-xl border px-4 py-3 text-xs outline-none shadow-xs select-none ${(account?.themeMode || "light") === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-zinc-500" : "border-black/10 bg-white text-zinc-900 placeholder:text-zinc-400"}`}
                                />

                                {/* Live Editable Custom Form Fields in Card Preview */}
                                {customFormFields && customFormFields.length > 0 && (
                                  <div className="space-y-2.5 text-left">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Custom Form Fields ({customFormFields.length})</span>
                                    </div>
                                    {customFormFields.map((field) => (
                                      <div key={field.id} className="space-y-1 group/f relative">
                                        <div className="flex items-center justify-between">
                                          <input
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setCustomFormFields(prev => prev.map(f => f.id === field.id ? { ...f, label: val } : f));
                                            }}
                                            className={`text-xs font-extrabold bg-transparent outline-none border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 rounded px-1 -ml-1 transition ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}
                                          />
                                          <div className="flex items-center gap-1.5 opacity-80 group-hover/f:opacity-100">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCustomFormFields(prev => prev.map(f => f.id === field.id ? { ...f, required: !f.required } : f));
                                              }}
                                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition ${field.required ? "bg-rose-500/10 text-rose-500" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
                                            >
                                              {field.required ? "Required" : "Optional"}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setCustomFormFields(prev => prev.filter(f => f.id !== field.id))}
                                              className="text-zinc-400 hover:text-rose-500 p-0.5 transition cursor-pointer"
                                              title="Remove field"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>

                                        {field.type === "text" && (
                                          <input
                                            type="text"
                                            value={field.placeholder || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setCustomFormFields(prev => prev.map(f => f.id === field.id ? { ...f, placeholder: val } : f));
                                            }}
                                            placeholder="Field placeholder..."
                                            className={`w-full rounded-xl border px-3.5 py-2 text-xs font-semibold outline-none shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-zinc-400" : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-700"}`}
                                          />
                                        )}

                                        {field.type === "textarea" && (
                                          <textarea
                                            rows={2}
                                            value={field.placeholder || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setCustomFormFields(prev => prev.map(f => f.id === field.id ? { ...f, placeholder: val } : f));
                                            }}
                                            placeholder="Textarea placeholder..."
                                            className={`w-full rounded-xl border px-3.5 py-2 text-xs font-semibold outline-none shadow-xs resize-none ${(account?.themeMode || "light") === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-zinc-400" : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-700"}`}
                                          />
                                        )}

                                        {field.type === "select" && (
                                          <select
                                            disabled
                                            className={`w-full rounded-xl border px-3.5 py-2 text-xs font-semibold outline-none shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-white/10 bg-black/50 text-white" : "border-zinc-300 bg-white text-zinc-900"}`}
                                          >
                                            <option>{field.placeholder || `Select ${field.label}...`}</option>
                                            {(field.options || []).map((opt, i) => (
                                              <option key={i}>{opt}</option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Editable Button CTA Text */}
                                <div className="relative group/btn">
                                  <input
                                    type="text"
                                    value={formButtonText}
                                    onChange={(e) => setFormButtonText(e.target.value)}
                                    onFocus={(e) => {
                                      if (e.target.value === "Send it to me") {
                                        setFormButtonText("");
                                      } else {
                                        e.target.select();
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (!e.target.value.trim()) {
                                        setFormButtonText("Send it to me");
                                      }
                                    }}
                                    placeholder="Send it to me"
                                    style={{ backgroundColor: account?.brandColor || "#0066B2" }}
                                    className="w-full text-center rounded-xl px-4 py-3.5 text-xs font-extrabold text-white shadow-lg transition duration-150 outline-none border-2 border-transparent hover:border-white/40 focus:border-white cursor-text"
                                  />
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Custom Form Field Creator Panel - Shared across all templates */}
                    <div className={`mt-6 max-w-6xl mx-auto rounded-2xl border p-5 transition ${(account?.themeMode || "light") === "dark" ? "border-white/10 bg-black/30 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-900"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Custom Form Fields Builder</span>
                        </h4>
                      </div>

                      {/* Quick Field Preset Buttons */}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium">Quick Presets:</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {/* Company Name Preset */}
                        {(() => {
                          const isAdded = customFormFields.some(f => f.id === "field_company");
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAdded) {
                                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_company"));
                                } else {
                                  setCustomFormFields(prev => [...prev, { id: "field_company", type: "text", label: "Company Name", placeholder: "Acme Inc.", required: false }]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${isAdded
                                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400"
                                }`}
                            >
                              {isAdded ? "- Company Name" : "+ Company Name"}
                            </button>
                          );
                        })()}

                        {/* Phone Number Preset */}
                        {(() => {
                          const isAdded = customFormFields.some(f => f.id === "field_phone");
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAdded) {
                                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_phone"));
                                } else {
                                  setCustomFormFields(prev => [...prev, { id: "field_phone", type: "text", label: "Phone Number", placeholder: "+1 (555) 000-0000", required: false }]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${isAdded
                                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400"
                                }`}
                            >
                              {isAdded ? "- Phone Number" : "+ Phone Number"}
                            </button>
                          );
                        })()}

                        {/* Company Size Preset */}
                        {(() => {
                          const isAdded = customFormFields.some(f => f.id === "field_team_size");
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAdded) {
                                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_team_size"));
                                } else {
                                  setCustomFormFields(prev => [...prev, { id: "field_team_size", type: "select", label: "Company Size", placeholder: "Select company size", required: false, options: ["1-10 employees", "11-50 employees", "51-200 employees", "201+ employees"] }]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${isAdded
                                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400"
                                }`}
                            >
                              {isAdded ? "- Company Size Dropdown" : "+ Company Size Dropdown"}
                            </button>
                          );
                        })()}

                        {/* Notes / Message Preset */}
                        {(() => {
                          const isAdded = customFormFields.some(f => f.id === "field_notes");
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAdded) {
                                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_notes"));
                                } else {
                                  setCustomFormFields(prev => [...prev, { id: "field_notes", type: "textarea", label: "Additional Notes", placeholder: "Tell us about your project...", required: false }]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${isAdded
                                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400"
                                }`}
                            >
                              {isAdded ? "- Notes / Message" : "+ Notes / Message"}
                            </button>
                          );
                        })()}
                      </div>

                      {/* Add Custom Field Form */}
                      <button
                        type="button"
                        onClick={() => {
                          const newId = `field_${Date.now()}`;
                          setCustomFormFields(prev => [...prev, { id: newId, type: "text", label: "New Field", placeholder: "Enter answer...", required: false }]);
                        }}
                        className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Custom Input Field</span>
                      </button>
                    </div>

                    {/* Canvas Footer */}
                    <div className="mt-8 text-center text-xs text-zinc-400">
                      All rights reserved 2026
                    </div>
                  </div>

                  {/* A/B Split Test Section - Adapts dynamically to Brand Theme Mode */}
                  <div className={`space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
                    {/* Top Header Bar */}
                    <div className={`border-t border-b py-4 my-4 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-200"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${(account?.themeMode || "light") === "dark" ? "bg-[#25252B] text-zinc-400" : "bg-zinc-100 text-zinc-600"}`}>
                              <BarChart2 className="h-4 w-4" />
                            </div>
                            <h4 className={`text-sm sm:text-base font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                              Test title and image
                            </h4>
                          </div>
                          <p className={`text-xs mt-2 ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                            LeadMagnets splits new visitors evenly and keeps each person on the same version for an accurate result.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            const nextVal = !testStarted;
                            setTestStarted(nextVal);
                            update({ testStarted: nextVal });
                          }}
                          className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#222228] text-zinc-300 hover:bg-[#2A2A32]" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${testStarted ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          <span>{testStarted ? "Pause test" : "Start test"}</span>
                        </button>
                      </div>
                    </div>

                    {/* A/B Versions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Control Variant Card */}
                      <div className={`rounded-2xl border overflow-hidden shadow-xs transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#1D1D22]" : "border-zinc-200 bg-white"}`}>
                        {/* Top Media Area */}
                        <div className={`relative h-64 sm:h-72 w-full flex flex-col items-center justify-center border-b ${(account?.themeMode || "light") === "dark" ? "bg-[#141418] border-[#27272C]" : "bg-zinc-50 border-zinc-100"}`}>
                          <div className="absolute top-4 left-4 z-10">
                            <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${(account?.themeMode || "light") === "dark" ? "bg-white text-black" : "bg-black text-white"}`}>
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
                            <div className="flex flex-col items-center justify-center text-zinc-400">
                              <ImageIcon className="h-7 w-7 mb-1.5 stroke-[1.5px]" />
                              <span className="text-xs font-medium">No image</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Section */}
                        <div className={`p-5 space-y-3 ${(account?.themeMode || "light") === "dark" ? "bg-[#1D1D22]" : "bg-white"}`}>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                              CURRENT PAGE
                            </span>
                            <h5 className={`text-sm font-black ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                              {headline || page.name || "BDA"}
                            </h5>
                          </div>

                          <div className={`h-px w-full ${(account?.themeMode || "light") === "dark" ? "bg-[#27272C]" : "bg-zinc-100"}`} />

                          {testStarted ? (
                            <div className="flex items-center justify-between text-xs pt-0.5 font-medium">
                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
                              </span>
                              <span className={`font-semibold ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                                {page?.variantAViews || 0} views · {page?.variantASignups || 0} signups
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 pt-0.5">
                              Results appear after the test starts
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Variant B Card if created */}
                      {hasVariantB && (
                        <div className={`group animate-card-pop-in rounded-2xl border overflow-hidden shadow-xs transition-all duration-300 ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#1D1D22] hover:border-zinc-600" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                          {/* Top Media Area */}
                          <div className={`relative h-64 sm:h-72 w-full flex flex-col items-center justify-center border-b overflow-hidden ${(account?.themeMode || "light") === "dark" ? "bg-[#141418] border-[#27272C]" : "bg-zinc-50 border-zinc-100"}`}>
                            <div className="absolute top-4 left-4 z-10">
                              <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${(account?.themeMode || "light") === "dark" ? "bg-[#27272D] text-zinc-200" : "bg-zinc-200 text-zinc-800"}`}>
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

                            {/* Loading Overlay with 0% to 100% Progress Bar */}
                            {uploadingVariantB && (
                              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white p-4 space-y-2.5 animate-in fade-in duration-200">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                                  <span className="text-xs font-extrabold tracking-wide">
                                    Uploading... {uploadProgressVariantB}%
                                  </span>
                                </div>
                                <div className="w-full max-w-[180px] h-2 bg-white/20 rounded-full overflow-hidden shadow-inner">
                                  <div
                                    className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-200 ease-out"
                                    style={{ width: `${uploadProgressVariantB}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {(() => {
                              const activeVariantBImage = (variantBImage && variantBImage.trim() !== "") ? variantBImage : imageUrl;
                              return activeVariantBImage && activeVariantBImage.trim() !== "" ? (
                                <img
                                  src={activeVariantBImage}
                                  alt="Variant B media"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-zinc-400">
                                  <ImageIcon className="h-7 w-7 mb-1.5 stroke-[1.5px]" />
                                  <span className="text-xs font-medium">No image</span>
                                </div>
                              );
                            })()}

                            {/* Hover Actions Container */}
                            <div className={`absolute bottom-4 right-4 flex items-center gap-2 z-20 transition-opacity duration-200 ${uploadingVariantB ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                              <button
                                type="button"
                                disabled={uploadingVariantB}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  variantBFileInputRef.current?.click();
                                }}
                                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-md border transition cursor-pointer pointer-events-auto active:scale-95 disabled:opacity-75 ${(account?.themeMode || "light") === "dark" ? "bg-[#25252B] hover:bg-[#2E2E36] text-zinc-200 border-[#2E2E35]" : "bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200"}`}
                              >
                                {uploadingVariantB ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-zinc-400" />
                                )}
                                <span>{uploadingVariantB ? "Uploading..." : "Replace"}</span>
                              </button>
                              <button
                                type="button"
                                disabled={uploadingVariantB}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHasVariantB(false);
                                  setVariantBImage(null);
                                  setVariantBTitle("");
                                }}
                                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-red-500 shadow-md border transition cursor-pointer pointer-events-auto active:scale-95 disabled:opacity-50 ${(account?.themeMode || "light") === "dark" ? "bg-[#25252B] hover:bg-red-950/40 border-[#2E2E35]" : "bg-white hover:bg-red-50 border-zinc-200"}`}
                                title="Remove Version B split test"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Bottom Section */}
                          <div className={`p-5 space-y-3 ${(account?.themeMode || "light") === "dark" ? "bg-[#1D1D22]" : "bg-white"}`}>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                VERSION TITLE
                              </span>
                              <input
                                type="text"
                                value={variantBTitle}
                                onChange={(e) => setVariantBTitle(e.target.value)}
                                placeholder={headline || "Version B Title"}
                                onBlur={() => {
                                  if (page) {
                                    const next = { ...page, variantBTitle, hasVariantB: true, updatedAt: "Just now" };
                                    savePages(loadPages().map((p) => (p.id === next.id ? next : p)));
                                  }
                                }}
                                className={`w-full text-sm font-black outline-none border-b border-transparent focus:border-zinc-400 py-0.5 bg-transparent ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}
                              />
                            </div>

                            <div className={`h-px w-full ${(account?.themeMode || "light") === "dark" ? "bg-[#27272C]" : "bg-zinc-100"}`} />

                            {testStarted ? (
                              <div className="flex items-center justify-between text-xs pt-0.5 font-medium">
                                <span className="text-emerald-500 font-bold flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
                                </span>
                                <span className={`font-semibold ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                                  {page?.variantBViews || 0} views · {page?.variantBSignups || 0} signups
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-400 pt-0.5">
                                Results appear after the test starts
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Create Version B Button */}
                    {!hasVariantB && (
                      <button
                        onClick={() => {
                          setHasVariantB(true);
                          setVariantBTitle(`${headline || page.name} (B)`);
                          if (page) {
                            const next = { ...page, hasVariantB: true, variantBTitle: `${headline || page.name} (B)`, updatedAt: "Just now" };
                            savePages(loadPages().map((p) => (p.id === next.id ? next : p)));
                          }
                        }}
                        className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed p-3.5 text-xs font-bold transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-2xs ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#1D1D22] hover:bg-[#25252B] text-zinc-300" : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"}`}
                      >
                        <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        <span>Create version B</span>
                      </button>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: DELIVERY EMAIL */}
              {activeTab === "email" && (
                <div className="space-y-6">
                  {/* Canvas Outer Wrapper - Adapts dynamically to Brand Theme Mode */}
                  <div className={`rounded-2xl border p-4 sm:p-8 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E10] text-white" : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"}`}>

                    {/* Inner Card Container */}
                    <div className={`mx-auto max-w-4xl rounded-2xl border p-6 sm:p-8 shadow-xs space-y-6 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>

                      {/* Top Header Bar inside Card */}
                      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-200"}`}>
                        <div className={`flex items-center gap-2 text-sm font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-800"}`}>
                          <Mail className="h-4 w-4 text-zinc-400" />
                          <span>Delivery email</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 font-mono">
                            LeadMagnets &lt;hello@mail.leadmagnets.so&gt;
                          </span>
                          <button
                            onClick={() => setShowEmailPreviewModal(true)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white hover:bg-[#27272A]" : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 block">Subject</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="What people see in the inbox"
                          className={`w-full text-2xl sm:text-3xl font-extrabold bg-transparent outline-none border-b border-transparent focus:border-[#FE6F34] transition py-1 ${(account?.themeMode || "light") === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-300"}`}
                        />
                      </div>

                      {/* Preview text */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 block">Preview text</label>
                        <input
                          type="text"
                          value={emailPreviewText}
                          onChange={(e) => setEmailPreviewText(e.target.value)}
                          placeholder="A short teaser shown after the subject"
                          className={`w-full text-sm font-medium bg-transparent outline-none border-b border-transparent focus:border-[#FE6F34] transition py-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300 placeholder:text-zinc-600" : "text-zinc-600 placeholder:text-zinc-300"}`}
                        />
                      </div>

                      {/* Divider */}
                      <div className={`h-px w-full my-4 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-200/80"}`} />

                      {/* Body Section */}
                      <div className="space-y-2">
                        <label className={`text-xs font-bold block ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-700"}`}>Body</label>

                        {/* Rich Text Editor Container */}
                        <div className={`rounded-2xl border overflow-hidden shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B]" : "border-zinc-200/90 bg-white"}`}>
                          {/* Toolbar matching exact screenshot design */}
                          <div className={`flex flex-wrap items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-zinc-300" : "border-zinc-200 bg-[#F9F9FB] text-zinc-600"}`}>
                            {/* Headings Dropdown: T ⌄ */}
                            <div className="relative group">
                              <button
                                type="button"
                                title="Headings"
                                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer text-zinc-700 dark:text-zinc-200"
                              >
                                <Type className="h-3.5 w-3.5" />
                                <ChevronDown className="h-3 w-3 text-zinc-400" />
                              </button>
                              <div className="hidden group-hover:flex flex-col absolute left-0 top-full mt-1 w-32 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E24] shadow-lg z-50 p-1">
                                <button type="button" onClick={() => editor?.chain().focus().setParagraph().run()} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Paragraph</button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="text-left px-2.5 py-1.5 text-xs font-bold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Heading 1</button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="text-left px-2.5 py-1.5 text-xs font-semibold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Heading 2</button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className="text-left px-2.5 py-1.5 text-xs font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Heading 3</button>
                              </div>
                            </div>

                            <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                            {/* Bold: B */}
                            <button
                              type="button"
                              onClick={() => editor?.chain().focus().toggleBold().run()}
                              title="Bold (Ctrl+B)"
                              className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("bold") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                            >
                              <span className="font-extrabold text-sm">B</span>
                            </button>

                            {/* Italic: I */}
                            <button
                              type="button"
                              onClick={() => editor?.chain().focus().toggleItalic().run()}
                              title="Italic (Ctrl+I)"
                              className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("italic") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                            >
                              <span className="italic font-serif text-sm">I</span>
                            </button>

                            {/* Strikethrough: S */}
                            <button
                              type="button"
                              onClick={() => editor?.chain().focus().toggleStrike().run()}
                              title="Strikethrough"
                              className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("strike") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                            >
                              <Strikethrough className="h-3.5 w-3.5" />
                            </button>

                            {/* Text Color: A */}
                            <div className="relative group">
                              <button
                                type="button"
                                title="Text Color"
                                className="flex items-center gap-0.5 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                              >
                                <span className="font-extrabold text-xs underline decoration-2 decoration-[#0066B2]">A</span>
                              </button>
                              <div className="hidden group-hover:flex gap-1.5 absolute left-0 top-full mt-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E24] shadow-lg z-50">
                                {["#18181b", "#0066B2", "#2563eb", "#059669", "#dc2626", "#d97706", "#7c3aed"].map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => editor?.chain().focus().setColor(color).run()}
                                    className="h-4 w-4 rounded-full border border-black/10 cursor-pointer"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Clear Format: 🧹 */}
                            <button
                              type="button"
                              onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                              title="Clear Format"
                              className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <Eraser className="h-3.5 w-3.5" />
                            </button>

                            <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                            {/* Lists: ⋮= ⌄ */}
                            <div className="relative group">
                              <button
                                type="button"
                                title="Lists"
                                className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                              >
                                <span className="text-xs font-bold">⋮=</span>
                                <ChevronDown className="h-3 w-3 text-zinc-400" />
                              </button>
                              <div className="hidden group-hover:flex flex-col absolute left-0 top-full mt-1 w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E24] shadow-lg z-50 p-1">
                                <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Bullet List</button>
                                <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Numbered List</button>
                              </div>
                            </div>

                            {/* Alignment: ≡ ⌄ */}
                            <div className="relative group">
                              <button
                                type="button"
                                title="Text Align"
                                className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                              >
                                <AlignLeft className="h-3.5 w-3.5" />
                                <ChevronDown className="h-3 w-3 text-zinc-400" />
                              </button>
                              <div className="hidden group-hover:flex flex-col absolute left-0 top-full mt-1 w-32 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E24] shadow-lg z-50 p-1">
                                <button type="button" onClick={() => editor?.chain().focus().setTextAlign("left").run()} className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><AlignLeft className="h-3.5 w-3.5" /> Left</button>
                                <button type="button" onClick={() => editor?.chain().focus().setTextAlign("center").run()} className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><AlignCenter className="h-3.5 w-3.5" /> Center</button>
                                <button type="button" onClick={() => editor?.chain().focus().setTextAlign("right").run()} className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><AlignRight className="h-3.5 w-3.5" /> Right</button>
                              </div>
                            </div>

                            <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                            {/* Insert Image */}
                            <button
                              type="button"
                              onClick={() => {
                                const url = prompt("Enter Image URL:");
                                if (url && editor) {
                                  editor.chain().focus().setImage({ src: url }).run();
                                }
                              }}
                              title="Insert Image"
                              className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                            </button>

                            {/* Insert Video */}
                            <button
                              type="button"
                              onClick={() => {
                                const url = prompt("Enter YouTube / Video Embed URL:");
                                if (url && editor) {
                                  editor.chain().focus().insertContent(`<p><iframe src="${url}" width="100%" height="315" frameborder="0" allowfullscreen></iframe></p>`).run();
                                }
                              }}
                              title="Insert Video"
                              className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <Video className="h-3.5 w-3.5" />
                            </button>

                            {/* Insert Table */}
                            <button
                              type="button"
                              onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                              title="Insert Table"
                              className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <TableIcon className="h-3.5 w-3.5" />
                            </button>

                            {/* Insert Link */}
                            <button
                              type="button"
                              onClick={() => {
                                const url = prompt("Enter Hyperlink URL:");
                                if (url && editor) {
                                  editor.chain().focus().setLink({ href: url }).run();
                                }
                              }}
                              title="Insert Link"
                              className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("link") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Insert Line */}
                            <button
                              type="button"
                              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                              title="Insert Horizontal Divider"
                              className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                            {/* + Insert Resource Dropdown Button (100% Untouched connection to Hosted Resources) */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowInsertResourceMenu((v) => !v)}
                                className="hover:text-[#38BDF8] text-[#0066B2] dark:text-[#38BDF8] font-semibold transition px-2 py-1 rounded bg-[#EFF6FF] dark:bg-[#0066B2]/20 flex items-center gap-1 cursor-pointer"
                              >
                                <span>+ Insert Resource</span>
                                <ChevronDown className="h-3 w-3" />
                              </button>

                              {showInsertResourceMenu && (
                                <div className={`absolute left-0 top-full mt-1.5 w-64 rounded-xl border p-1.5 shadow-xl z-50 space-y-1 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    SELECT HOSTED RESOURCE
                                  </div>
                                  {hostedResources.length === 0 ? (
                                    <div className="px-2 py-2 text-xs text-zinc-400 italic">
                                      No hosted resources found. Upload one in Hosted resources first!
                                    </div>
                                  ) : (
                                    hostedResources.map((res) => (
                                      <button
                                        key={res.id}
                                        type="button"
                                        onClick={() => {
                                          if (editor) {
                                            editor.chain().focus().insertContent(`<p><a href="${res.url}" target="_blank" rel="noopener noreferrer">${res.name} (${res.url})</a></p>`).run();
                                          } else {
                                            setEmailBody((prev) => prev + `\n${res.url}\n`);
                                          }
                                          setShowInsertResourceMenu(false);
                                        }}
                                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#0066B2]/20 hover:text-[#38BDF8] text-xs transition flex flex-col gap-0.5 cursor-pointer"
                                      >
                                        <span className="font-semibold truncate">{res.name}</span>
                                        <span className="text-[10px] text-zinc-400 font-mono truncate">{res.url}</span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tiptap Rich Text Body Editor Container */}
                          <div className="p-4 min-h-[220px]">
                            {editor ? (
                              <EditorContent
                                editor={editor}
                                className={`prose dark:prose-invert max-w-none text-sm leading-relaxed outline-none min-h-[200px] ${(account?.themeMode || "light") === "dark" ? "text-zinc-100" : "text-zinc-800"}`}
                              />
                            ) : (
                              renderEmailBlockEditor(emailBody, setEmailBody, false)
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Feature 2: Smart Auto-Personalized Deliverable Config Card */}
                      <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#16161A] text-white" : "border-[#0066B2]/30 bg-gradient-to-br from-[#EFF6FF] to-white text-zinc-900"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0066B2] text-white shadow-xs">
                              <Sparkles className="h-4 w-4" />
                            </span>
                            <div>
                              <h4 className={`text-sm font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>AI Personalization Engine (Feature 2)</h4>
                              <p className="text-xs text-zinc-400">Ask leads a question during signup & generate custom AI action plans automatically.</p>
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
                    <div className={`mt-6 mx-auto max-w-4xl rounded-2xl p-6 flex items-center justify-center shadow-lg transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "bg-[#080B12]" : "bg-zinc-100/90 border border-zinc-200"}`}>
                      <button className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition cursor-pointer ${(account?.themeMode || "light") === "dark" ? "bg-[#181C26] text-white border border-[#272D3C] hover:bg-[#202534]" : "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50"}`}>
                        <img
                          key={(account?.themeMode || "light")}
                          src={(account?.themeMode || "light") === "dark" ? "/brand/gemini-logo-dark.png" : "/brand/gemini-logo.png"}
                          alt="LeadMagnets"
                          className="h-5 w-5 object-contain shrink-0"
                        />
                        <span>Build yours free with LeadMagnets</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: SEQUENCE */}
              {activeTab === "sequence" && (
                <div className="space-y-6">
                  {/* Canvas Outer Wrapper - Adapts dynamically to Brand Theme Mode */}
                  <div className={`rounded-2xl border p-4 sm:p-6 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E10] text-white" : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"}`}>
                    <div className="mx-auto max-w-5xl space-y-6">

                      {/* Top Control Card - Left Panel Background (#18181B) in Dark Mode */}
                      <div className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className={`text-base font-extrabold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>Follow-up sequence</h3>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                              Send extra emails after the lead magnet email. Delays are counted from the previous email or from signup for the first one.
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                              LeadMagnets creates the events, templates, and automation for this sequence after your sender domain is ready.
                            </p>
                          </div>

                          {/* Toggle Status Pill */}
                          <button
                            onClick={() => setSequenceEnabled(!sequenceEnabled)}
                            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${sequenceEnabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#25252B] dark:text-zinc-300 dark:border-[#27272A]"
                              }`}
                          >
                            <span className={`h-2.5 w-2.5 rounded-full ${sequenceEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                            <span>{sequenceEnabled ? "Enabled" : "Disabled"}</span>
                          </button>
                        </div>

                        {/* 2 Sub-cards in grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* Sub-card 1: Stop when a call is booked */}
                          <div
                            onClick={() => { if (sequenceEnabled) setStopOnCall(!stopOnCall); }}
                            className={`rounded-xl border p-3.5 transition shadow-2xs ${sequenceEnabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"} ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] hover:border-zinc-500 text-white" : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"}`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={stopOnCall}
                                disabled={!sequenceEnabled}
                                onChange={() => { }}
                                className="rounded border-zinc-300 text-[#FE6F34] focus:ring-[#FE6F34] cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span className={`text-xs font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-800"}`}>Stop when a call is booked</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1 pl-6 leading-relaxed">
                              Calendly and Cal.com booking-created webhooks stop this magnet&apos;s sequence for that email.
                            </p>
                          </div>

                          {/* Sub-card 2: Calendar connection */}
                          <div className={`rounded-xl border p-3.5 transition ${sequenceEnabled ? "" : "opacity-50"} ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white" : "border-zinc-200 bg-[#F9F9FB] text-zinc-900"}`}>
                            <span className={`text-xs font-bold block ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-700"}`}>Calendar connection</span>
                            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                              Connect Calendly or Cal.com in Configure to let booked calls stop this sequence.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Main Editor Body: Empty State OR 2-Column Sidebar + Detail View */}
                      {sequenceEmails.length === 0 ? (
                        <div className={`rounded-2xl border p-12 text-center shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-dashed border-[#27272A] bg-[#18181B] text-white" : "border-dashed border-zinc-300 bg-white text-zinc-900"}`}>
                          <h4 className={`text-base font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>No follow-up emails yet</h4>
                          <p className="text-xs text-zinc-400 mt-1 mb-5">
                            Add up to 10 emails to build this magnet&apos;s sequence.
                          </p>
                          <button
                            disabled={!sequenceEnabled}
                            onClick={addSequenceEmail}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-xs ${!sequenceEnabled
                              ? "opacity-50 cursor-not-allowed pointer-events-none"
                              : "cursor-pointer"
                              } ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#202025] text-white hover:bg-[#27272E]" : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"}`}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add first email</span>
                          </button>
                        </div>
                      ) : (
                        <div className={`rounded-2xl border overflow-hidden shadow-xs transition-colors duration-200 flex flex-col md:flex-row min-h-[580px] ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>

                          {/* LEFT COLUMN / SIDEBAR ITEM LIST */}
                          <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r flex flex-col p-4 shrink-0 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#141418]" : "border-zinc-200 bg-zinc-50/70"}`}>
                            {/* Header: "SEQUENCE" + "+" Button */}
                            <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-[#27272A]">
                              <span className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Sequence</span>
                              <button
                                disabled={!sequenceEnabled || sequenceEmails.length >= 10}
                                onClick={addSequenceEmail}
                                className={`p-1 rounded-lg border transition shadow-xs ${!sequenceEnabled || sequenceEmails.length >= 10
                                  ? "opacity-40 cursor-not-allowed pointer-events-none"
                                  : "cursor-pointer"
                                  } ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-zinc-200 hover:bg-[#272730] hover:text-white" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"}`}
                                title={sequenceEmails.length >= 10 ? "Maximum 10 emails" : "Add sequence email (+)"}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Email Items List */}
                            <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                              {sequenceEmails.map((item, idx) => {
                                const isSelected = idx === selectedSequenceIndex;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => setSelectedSequenceIndex(idx)}
                                    className={`rounded-xl p-3 flex items-center justify-between transition cursor-pointer ${isSelected
                                      ? "bg-[#0066B2] text-white shadow-md font-bold"
                                      : ((account?.themeMode || "light") === "dark"
                                        ? "bg-[#1B1B20] text-zinc-300 hover:bg-[#24242A] border border-[#27272A]"
                                        : "bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-200")
                                      }`}
                                  >
                                    <div className="min-w-0 flex-1 pr-2">
                                      <span className={`block text-xs font-extrabold truncate ${isSelected ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                                        Email {idx + 2}
                                      </span>
                                      <span className={`block text-[11px] truncate mt-0.5 ${isSelected ? "text-white/80" : "text-zinc-400"}`}>
                                        {item.subject || "Untitled email"}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : ((account?.themeMode || "light") === "dark" ? "bg-zinc-800/40 text-zinc-400" : "bg-zinc-100 text-zinc-500")}`}>
                                      {item.delayDays}{item.delayUnit === "minutes" ? "m" : "h"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* RIGHT COLUMN / MAIN EMAIL EDITOR PANEL */}
                          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 min-w-0">
                            {(() => {
                              const activeEmail = sequenceEmails[selectedSequenceIndex] || sequenceEmails[0];
                              if (!activeEmail) return null;

                              return (
                                <div className="space-y-5">
                                  {/* Editor Top Bar */}
                                  <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-[#27272A]">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-[#0066B2]" />
                                      <h4 className={`text-sm sm:text-base font-extrabold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                                        Email {selectedSequenceIndex + 2}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Preview Button */}
                                      <button
                                        disabled={!sequenceEnabled}
                                        onClick={() => {
                                          setPreviewSequenceIndex(selectedSequenceIndex + 1);
                                          setShowSequencePreviewModal(true);
                                        }}
                                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-2xs ${!sequenceEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                          } ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-zinc-200 hover:bg-[#272730]" : "border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"}`}
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>Preview</span>
                                      </button>

                                      {/* Remove Button */}
                                      <button
                                        disabled={!sequenceEnabled}
                                        onClick={() => removeSequenceEmail(activeEmail.id)}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/40 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Remove</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Field 1: Delay from previous email */}
                                  <div>
                                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                      <span>Delay from previous email</span>
                                    </label>
                                    <div className="flex items-center gap-2 max-w-xs">
                                      <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        disabled={!sequenceEnabled}
                                        value={activeEmail.delayDays || 1}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 1;
                                          setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, delayDays: val } : item));
                                        }}
                                        className={`w-24 rounded-xl border px-3 py-2 text-xs font-bold outline-none disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 focus:border-[#FE6F34]"}`}
                                      />
                                      <select
                                        disabled={!sequenceEnabled}
                                        value={activeEmail.delayUnit || "hours"}
                                        onChange={(e) => {
                                          const unit = e.target.value as "hours" | "minutes";
                                          setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, delayUnit: unit } : item));
                                        }}
                                        className={`rounded-xl border px-3 py-2 text-xs font-bold outline-none cursor-pointer disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 focus:border-[#FE6F34]"}`}
                                      >
                                        <option value="minutes">minutes</option>
                                        <option value="hours">hours</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Field 2: Subject */}
                                  <div>
                                    <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Subject</label>
                                    <input
                                      type="text"
                                      disabled={!sequenceEnabled}
                                      value={activeEmail.subject || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, subject: val } : item));
                                      }}
                                      placeholder="Quick follow-up"
                                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-600 focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#FE6F34]"}`}
                                    />
                                  </div>

                                  {/* Field 3: Preview Text */}
                                  <div>
                                    <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Preview text</label>
                                    <input
                                      type="text"
                                      disabled={!sequenceEnabled}
                                      value={activeEmail.previewText || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, previewText: val } : item));
                                      }}
                                      placeholder="Short inbox teaser"
                                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white placeholder:text-zinc-600 focus:border-[#FE6F34]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#FE6F34]"}`}
                                    />
                                  </div>

                                  {/* Field 4: Body + Rich Editor Toolbar */}
                                  <div>
                                    <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Body</label>
                                    <div className={`rounded-xl border overflow-hidden transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B]" : "border-zinc-200 bg-white"}`}>
                                      {/* Toolbar */}
                                      <div className={`flex flex-wrap items-center gap-1 px-3 py-2 border-b text-xs text-zinc-400 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B]" : "border-zinc-100 bg-zinc-50"}`}>
                                        <button title="Undo" onClick={() => { }} className="p-1 hover:text-white transition cursor-pointer"><Undo2 className="h-3.5 w-3.5" /></button>
                                        <button title="Redo" onClick={() => { }} className="p-1 hover:text-white transition cursor-pointer"><Redo2 className="h-3.5 w-3.5" /></button>
                                        <div className="h-3 w-px bg-zinc-700 mx-1" />
                                        <span className="px-1 font-extrabold text-[11px] cursor-pointer">Aa</span>
                                        <span className="px-1 font-bold italic cursor-pointer">B</span>
                                        <span className="px-1 italic cursor-pointer">I</span>
                                        <span className="px-1 font-serif cursor-pointer">&rdquo;</span>
                                        <span className="px-1 cursor-pointer">≡</span>
                                        <span className="px-1 cursor-pointer">-</span>
                                        <div className="h-3 w-px bg-zinc-700 mx-1" />
                                        <button
                                          onClick={() => {
                                            const updatedBody = (activeEmail.body || "") + " {name}";
                                            setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, body: updatedBody } : item));
                                          }}
                                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 transition cursor-pointer"
                                        >
                                          <Plus className="h-3 w-3" />
                                          <span>Insert &#123;name&#125;</span>
                                        </button>
                                      </div>

                                      {/* Block Email Body Editor */}
                                      <div className="p-3">
                                        {renderEmailBlockEditor(
                                          activeEmail.body || "",
                                          (nextVal) => {
                                            setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, body: nextVal } : item));
                                          },
                                          !sequenceEnabled
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bottom Banner Card */}
                                  <div className="mt-4 rounded-xl bg-[#080B12] p-5 flex items-center justify-center shadow-lg">
                                    <button className="flex items-center gap-2 rounded-xl bg-[#181C26] text-white border border-[#272D3C] px-4 py-2 text-xs font-bold shadow-md hover:bg-[#202534] transition cursor-pointer">
                                      {account?.logo || account?.avatar_url || account?.avatar ? (
                                        <img src={account?.logo || account?.avatar_url || account?.avatar || ""} alt="Logo" className="h-5 w-5 rounded object-cover" />
                                      ) : (
                                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FE6F34] text-black font-extrabold text-[10px]">🧲</span>
                                      )}
                                      <span>Build yours free with Magnets</span>
                                    </button>
                                  </div>

                                  {/* Footer Navigation Bar */}
                                  <div className="flex items-center justify-between border-t pt-4 border-zinc-200 dark:border-[#27272A] text-xs text-zinc-400">
                                    <button
                                      disabled={selectedSequenceIndex === 0}
                                      onClick={() => setSelectedSequenceIndex(selectedSequenceIndex - 1)}
                                      className="flex items-center gap-1 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      <ChevronLeft className="h-3.5 w-3.5" />
                                      <span>Previous</span>
                                    </button>

                                    <span className="text-[11px] text-zinc-500 font-medium">
                                      Swipe on mobile - Email {selectedSequenceIndex + 2} of {sequenceEmails.length + 1}
                                    </span>

                                    <button
                                      disabled={selectedSequenceIndex === sequenceEmails.length - 1}
                                      onClick={() => setSelectedSequenceIndex(selectedSequenceIndex + 1)}
                                      className="flex items-center gap-1 hover:text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      <span>Next</span>
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                </div>
                              );
                            })()}
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AFTER SIGNUP */}
              {activeTab === "after" && (
                <div className="space-y-4">
                  {/* Canvas Outer Wrapper - Adapts dynamically to Brand Theme Mode */}
                  <div className={`rounded-2xl border p-3 sm:p-5 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E10] text-white" : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"}`}>
                    <div className="mx-auto max-w-4xl space-y-4">

                      {/* Top Options Card - Left Panel Background (#18181B) in Dark Mode */}
                      <div className={`rounded-2xl border p-4 sm:p-6 shadow-xs space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white" : "border-zinc-200 bg-white text-zinc-700"}`}>
                            <Check className="h-4 w-4 stroke-[2.5px]" />
                          </div>
                          <div>
                            <h3 className={`text-base font-extrabold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>What happens after someone opts in?</h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
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
                              : ((account?.themeMode || "light") === "dark"
                                ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                                : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]")
                              }`}
                          >
                            <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "standard" ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                              Standard confirmation
                            </h4>
                            <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "standard" ? "text-white/90" : "text-zinc-400"}`}>
                              Show the email confirmation message.
                            </p>
                          </button>

                          {/* Option 2: Send them elsewhere */}
                          <button
                            onClick={() => setAfterSignupOption("elsewhere")}
                            className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "elsewhere"
                              ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                              : ((account?.themeMode || "light") === "dark"
                                ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                                : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]")
                              }`}
                          >
                            <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "elsewhere" ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                              Send them elsewhere
                            </h4>
                            <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "elsewhere" ? "text-white/90" : "text-zinc-400"}`}>
                              Open a URL as soon as the form is submitted.
                            </p>
                          </button>

                          {/* Option 3: Custom next step */}
                          <button
                            onClick={() => setAfterSignupOption("custom")}
                            className={`p-3.5 sm:p-4 rounded-xl text-left transition cursor-pointer ${afterSignupOption === "custom"
                              ? "bg-[#0066B2] text-white border border-transparent shadow-md"
                              : ((account?.themeMode || "light") === "dark"
                                ? "bg-[#121216] border border-[#27272A] text-white hover:border-[#0066B2]"
                                : "bg-white border border-zinc-200 text-zinc-900 hover:border-[#0066B2]")
                              }`}
                          >
                            <h4 className={`text-xs sm:text-sm font-extrabold ${afterSignupOption === "custom" ? "text-white" : ((account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900")}`}>
                              Custom next step
                            </h4>
                            <p className={`text-[11px] sm:text-xs mt-1 leading-snug ${afterSignupOption === "custom" ? "text-white/90" : "text-zinc-400"}`}>
                              Show your own message, video, or offer.
                            </p>
                          </button>
                        </div>

                        <p className="text-xs text-zinc-400 font-medium">
                          A quiz funnel is available with Custom next step.
                        </p>

                        {/* DYNAMIC FORM FIELDS DEPENDING ON SELECTED OPTION */}

                        {/* Dynamic Panel 2: Destination URL when "elsewhere" is selected */}
                        {afterSignupOption === "elsewhere" && (
                          <div className={`pt-3 space-y-1.5 border-t ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-100"}`}>
                            <label className={`text-xs font-bold flex items-center gap-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-200" : "text-zinc-700"}`}>
                              <ExternalLink className="h-3.5 w-3.5 text-[#0066B2]" />
                              <span>Destination URL</span>
                            </label>
                            <input
                              type="url"
                              value={destinationUrl}
                              onChange={(e) => setDestinationUrl(e.target.value)}
                              placeholder="https://your-site.com/next-step"
                              className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                            />
                            <p className="text-xs text-zinc-400">
                              They will be taken here straight after a successful signup.
                            </p>
                          </div>
                        )}

                        {/* Dynamic Panel 3: Custom Next Step fields when "custom" is selected */}
                        {afterSignupOption === "custom" && (
                          <div className={`pt-3 space-y-3 border-t ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-100"}`}>
                            <div>
                              <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Heading</label>
                              <input
                                type="text"
                                value={customHeading}
                                onChange={(e) => setCustomHeading(e.target.value)}
                                placeholder="You are in. Here is what to do next."
                                className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                              />
                            </div>

                            <div>
                              <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Message</label>
                              <textarea
                                rows={2}
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Set expectations, introduce an offer, or explain the next step."
                                className={`w-full rounded-xl border p-2.5 text-xs outline-none resize-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                              />
                            </div>

                            <div>
                              <label className={`text-xs font-semibold flex items-center gap-1.5 mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                                <span>🎥 Loom or YouTube URL</span>
                              </label>
                              <input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.loom.com/share/..."
                                className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Button label</label>
                                <input
                                  type="text"
                                  value={buttonLabel}
                                  onChange={(e) => setButtonLabel(e.target.value)}
                                  placeholder="Book a call"
                                  className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                                />
                              </div>
                              <div>
                                <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Button URL</label>
                                <input
                                  type="url"
                                  value={buttonUrl}
                                  onChange={(e) => setButtonUrl(e.target.value)}
                                  placeholder="https://cal.com/..."
                                  className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-500 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Bottom Card: Quiz Funnel Card - Left Panel Background (#18181B) in Dark Mode */}
                      <div className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${(account?.themeMode || "light") === "dark" ? "bg-[#121216] text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className={`text-xs sm:text-sm font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>Add a quiz funnel</h4>
                            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                              Ask a short series of questions after signup. Save every answer, then optionally route people based on their responses.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setQuizFunnelEnabled(!quizFunnelEnabled)}
                          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${quizFunnelEnabled
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#25252B] dark:text-zinc-300 dark:border-[#27272A]"
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
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
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

      {/* Functional Sequence Preview Modal */}
      {showSequencePreviewModal && (
        <SequencePreviewModal
          emailSubject={emailSubject}
          emailPreviewText={emailPreviewText}
          emailBody={emailBody}
          sequenceEmails={sequenceEmails}
          account={account}
          previewSequenceIndex={previewSequenceIndex}
          previewDeviceMode={previewDeviceMode}
          onSetPreviewSequenceIndex={setPreviewSequenceIndex}
          onSetPreviewDeviceMode={setPreviewDeviceMode}
          onClose={() => setShowSequencePreviewModal(false)}
        />
      )}

      {/* Interactive Subscriber Email Preview Modal */}
      {showEmailPreviewModal && page && (
        <EmailPreviewModal
          emailSubject={emailSubject}
          emailPreviewText={emailPreviewText}
          emailBody={emailBody}
          page={page}
          account={account}
          pageId={params.id}
          onClose={() => setShowEmailPreviewModal(false)}
        />
      )}
    </DashboardShell>
  );
}
