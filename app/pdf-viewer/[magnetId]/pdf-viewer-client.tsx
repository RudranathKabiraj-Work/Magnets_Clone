"use client";

// Adobe Acrobat PDF Viewer Client — Updated 2026

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Printer,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronUp,
  ChevronDown,
  FileText,
  Bookmark,
  Layers,
  Lock,
  Menu,
  X,
} from "lucide-react";
import "./pdf-viewer.css";

// ─── Cloudinary blur helper ───────────────────────────────────────────────────
function getBlurUrl(url: string): string {
  if (!url) return url;
  if (url.includes("/image/upload/f_auto,q_auto/")) {
    return url.replace("/image/upload/f_auto,q_auto/", "/image/upload/e_blur:900,q_30/");
  }
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/e_blur:900,q_30/");
  }
  if (url.includes("/video/upload/")) {
    return url.replace("/video/upload/", "/video/upload/e_blur:900,q_30/");
  }
  return url;
}

interface Props {
  magnetId: string;
  pdfTitle: string;
  pdfPages: string[];
  pdfFreePages: number;
  businessName: string;
  brandColor: string;
  customFormFields?: import("@/lib/data").CustomFormField[];
}

export default function PdfViewerClient({
  magnetId,
  pdfTitle,
  pdfPages,
  pdfFreePages,
  businessName,
  brandColor,
  customFormFields = [],
}: Props) {
  const totalPages = pdfPages.length;

  // ── State ──────────────────────────────────────────────────────────────────
  const [unlocked, setUnlocked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"thumbnails" | "bookmarks" | "layers">("thumbnails");
  const [zoomScale, setZoomScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [gateVisible, setGateVisible] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Gate form state
  const [step, setStep] = useState<"email" | "code">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [hint, setHint] = useState<{ msg: string; isError: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Refs for IntersectionObserver
  const docRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const visibleLocked = useRef<Set<number>>(new Set());

  // ── Check unlock status on mount ──────────────────────────────────────────
  useEffect(() => {
    let localToken = "";
    if (typeof window !== "undefined") {
      try {
        localToken = localStorage.getItem(`pdf_unlock_token_${magnetId}`) || "";
      } catch (e) {}
    }

    const statusUrl = `/api/pdf-gate/status?magnetId=${encodeURIComponent(magnetId)}${
      localToken ? `&token=${encodeURIComponent(localToken)}` : ""
    }`;

    fetch(statusUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.unlocked) {
          performUnlock();
        } else if (pdfFreePages === 0) {
          setGateVisible(true);
        }
      })
      .catch(() => {
        if (pdfFreePages === 0) setGateVisible(true);
      });

    if (typeof window !== "undefined" && window.innerWidth <= 760) {
      setSidebarOpen(false);
    }
  }, [magnetId, pdfFreePages]);

  // ── Update gate visibility ─────────────────────────────────────────────────
  const updateGate = useCallback(() => {
    if (unlocked) {
      setGateVisible(false);
      return;
    }
    const shouldShow = visibleLocked.current.size > 0 || pdfFreePages === 0;
    setGateVisible(shouldShow);
  }, [unlocked, pdfFreePages]);

  // ── IntersectionObserver: page counter + gate trigger ────────────────────
  useEffect(() => {
    if (!docRef.current) return;

    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = Number((e.target as HTMLElement).dataset.pageIndex);
          setCurrentPage(idx + 1);
          thumbRefs.current.forEach((t, i) => {
            if (t) t.dataset.active = String(i === idx);
          });
          const activeThumb = thumbRefs.current[idx];
          if (activeThumb && sideRef.current && sidebarOpen) {
            activeThumb.scrollIntoView({ block: "nearest" });
          }
        });
      },
      { root: docRef.current, rootMargin: "-45% 0px -45% 0px" }
    );

    const gateObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).dataset.pageIndex);
          const isLocked = idx >= pdfFreePages;
          if (!isLocked) return;
          if (e.isIntersecting) {
            visibleLocked.current.add(idx);
          } else {
            visibleLocked.current.delete(idx);
          }
        });
        updateGate();
      },
      { root: docRef.current, threshold: 0.15 }
    );

    pageRefs.current.forEach((el) => {
      if (el) {
        counterObs.observe(el);
        gateObs.observe(el);
      }
    });

    return () => {
      counterObs.disconnect();
      gateObs.disconnect();
    };
  }, [pdfFreePages, sidebarOpen, updateGate]);

  // ── Unlock all pages ──────────────────────────────────────────────────────
  const performUnlock = useCallback(() => {
    setUnlocked(true);
    setGateVisible(false);
    visibleLocked.current.clear();
  }, []);

  // ── Gate: send code ───────────────────────────────────────────────────────
  const handleSendCode = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!name.trim()) {
        setHint({ msg: "Please enter your name.", isError: true });
        return;
      }
      if (!email.trim()) {
        setHint({ msg: "Please enter your email address.", isError: true });
        return;
      }
      setSending(true);
      setHint(null);
      try {
        const res = await fetch("/api/pdf-gate/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            magnetId,
            name: name.trim(),
            customFields: customAnswers,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setHint({ msg: data.error || "Failed to send code.", isError: true });
          return;
        }
        setToken(data.token);
        setStep("code");
        setHint({
          msg: `Code sent to ${email.trim()}. Check spam if it doesn't arrive in a minute.`,
          isError: false,
        });
      } catch {
        setHint({ msg: "Network error. Please try again.", isError: true });
      } finally {
        setSending(false);
      }
    },
    [email, magnetId, name, customAnswers]
  );

  // ── Gate: verify code ─────────────────────────────────────────────────────
  const handleVerifyCode = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!code.trim() || !token) {
        setHint({ msg: "Please enter the 6-digit code.", isError: true });
        return;
      }
      setVerifying(true);
      setHint(null);
      try {
        const res = await fetch("/api/pdf-gate/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            code: code.trim(),
            token,
            magnetId,
            name: name.trim(),
            customFields: customAnswers,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setHint({ msg: data.error || "Incorrect code.", isError: true });
          if (/expired/i.test(data.error || "")) {
            setStep("email");
            setToken(null);
            setCode("");
          }
          return;
        }
        if (data.unlockToken && typeof window !== "undefined") {
          try {
            localStorage.setItem(`pdf_unlock_token_${magnetId}`, data.unlockToken);
          } catch (e) {}
        }
        performUnlock();
      } catch {
        setHint({ msg: "Network error. Please try again.", isError: true });
      } finally {
        setVerifying(false);
      }
    },
    [code, email, magnetId, name, token, customAnswers, performUnlock]
  );

  const scrollToPage = (idx: number) => {
    const el = pageRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (pdfPages.length > 0) {
      const a = document.createElement("a");
      a.href = pdfPages[0];
      a.download = `${pdfTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="adobe-viewer-root">
      {/* ── Top Header Toolbar ────────────────────────────────────────────── */}
      <header className="adobe-bar">
        <div className="adobe-bar-left">
          <div className="adobe-logo-badge">
            <div className="adobe-pdf-icon">PDF</div>
            <span className="adobe-bar-title" title={pdfTitle}>
              {pdfTitle}
            </span>
          </div>

          <button
            className="adobe-icon-btn"
            title="Toggle Navigation Sidebar"
            aria-pressed={sidebarOpen}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <Menu size={18} />
          </button>

          <div className="adobe-divider" />

          <button
            className="adobe-icon-btn"
            title="Previous Page"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(Math.max(0, currentPage - 2))}
          >
            <ChevronUp size={18} />
          </button>

          <div className="adobe-page-counter">
            <input
              type="number"
              min={1}
              max={totalPages}
              className="adobe-page-input"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= totalPages) {
                  scrollToPage(val - 1);
                }
              }}
            />
            <span>/ {totalPages}</span>
          </div>

          <button
            className="adobe-icon-btn"
            title="Next Page"
            disabled={currentPage >= totalPages}
            onClick={() => scrollToPage(Math.min(totalPages - 1, currentPage))}
          >
            <ChevronDown size={18} />
          </button>
        </div>

        <div className="adobe-bar-center">
          <button
            className="adobe-icon-btn"
            title="Zoom Out"
            disabled={zoomScale <= 50}
            onClick={() => setZoomScale((z) => Math.max(50, z - 25))}
          >
            <ZoomOut size={16} />
          </button>

          <select
            className="adobe-zoom-select"
            value={zoomScale}
            onChange={(e) => setZoomScale(Number(e.target.value))}
          >
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select>

          <button
            className="adobe-icon-btn"
            title="Zoom In"
            disabled={zoomScale >= 200}
            onClick={() => setZoomScale((z) => Math.min(200, z + 25))}
          >
            <ZoomIn size={16} />
          </button>

          <div className="adobe-divider" />

          <button
            className="adobe-icon-btn"
            title="Rotate Clockwise"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            <RotateCw size={16} />
          </button>
        </div>

        <div className="adobe-bar-right">
          {showSearch ? (
            <div className="adobe-search-box">
              <Search size={14} color="#aaa" />
              <input
                type="text"
                className="adobe-search-input"
                placeholder="Find text..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="adobe-icon-btn"
                style={{ width: 20, height: 20 }}
                onClick={() => setShowSearch(false)}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              className="adobe-icon-btn"
              title="Search document"
              onClick={() => setShowSearch(true)}
            >
              <Search size={16} />
            </button>
          )}

          <button className="adobe-icon-btn" title="Print document" onClick={handlePrint}>
            <Printer size={16} />
          </button>

          <button className="adobe-icon-btn" title="Download PDF" onClick={handleDownload}>
            <Download size={16} />
          </button>

          {unlocked && (
            <button
              onClick={() => {
                document.cookie = `pdf_unlocked_${magnetId}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                try {
                  localStorage.removeItem(`pdf_unlock_token_${magnetId}`);
                } catch (e) {}
                setUnlocked(false);
                setGateVisible(pdfFreePages === 0);
              }}
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Test mode: re-locks the lead magnet"
            >
              <Lock size={12} />
              Re-lock
            </button>
          )}
        </div>
      </header>

      {/* ── Main Workspace ──────────────────────────────────────────────────── */}
      <div className="adobe-main-layout">
        {/* Left Navigation Sidebar */}
        {sidebarOpen && (
          <div className="adobe-sidebar-wrapper" ref={sideRef as any}>
            <div className="adobe-rail">
              <button
                className={`adobe-rail-item ${activeTab === "thumbnails" ? "active" : ""}`}
                title="Page Thumbnails"
                onClick={() => setActiveTab("thumbnails")}
              >
                <FileText size={16} />
              </button>
              <button
                className={`adobe-rail-item ${activeTab === "bookmarks" ? "active" : ""}`}
                title="Bookmarks"
                onClick={() => setActiveTab("bookmarks")}
              >
                <Bookmark size={16} />
              </button>
              <button
                className={`adobe-rail-item ${activeTab === "layers" ? "active" : ""}`}
                title="Attachments & Layers"
                onClick={() => setActiveTab("layers")}
              >
                <Layers size={16} />
              </button>
            </div>

            <div className="adobe-thumb-panel">
              <div className="adobe-thumb-header">
                {activeTab === "thumbnails" ? "Page Thumbnails" : activeTab === "bookmarks" ? "Bookmarks" : "Attachments"}
              </div>
              <div className="adobe-thumb-list">
                {activeTab === "thumbnails" ? (
                  pdfPages.map((url, idx) => {
                    const isLocked = !unlocked && idx >= pdfFreePages;
                    const displayUrl = isLocked ? getBlurUrl(url) : url;
                    return (
                      <button
                        key={idx}
                        ref={(el) => { thumbRefs.current[idx] = el; }}
                        className={`adobe-thumb-card ${isLocked ? "is-locked" : ""}`}
                        data-active={currentPage === idx + 1}
                        onClick={() => scrollToPage(idx)}
                      >
                        <div className="adobe-thumb-frame">
                          <img src={displayUrl} alt={`Thumbnail page ${idx + 1}`} className="adobe-thumb-img" />
                        </div>
                        <span className="adobe-thumb-num">{idx + 1}</span>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: "12px", fontSize: "12px", color: "#888", textAlign: "center" }}>
                    No {activeTab} available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document View Canvas */}
        <main className="adobe-doc-viewport" ref={docRef}>
          {pdfPages.map((url, idx) => {
            const isLocked = !unlocked && idx >= pdfFreePages;
            const displayUrl = isLocked ? getBlurUrl(url) : url;

            return (
              <div
                key={idx}
                ref={(el) => { pageRefs.current[idx] = el; }}
                data-page-index={idx}
                className={`adobe-page-wrapper ${isLocked ? "is-locked" : ""}`}
                style={{
                  transform: `scale(${zoomScale / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "top center",
                  maxWidth: `${zoomScale * 8.6}px`,
                }}
              >
                <img
                  src={displayUrl}
                  alt={`Document Page ${idx + 1}`}
                  className="adobe-page-img"
                  loading={idx < 3 ? "eager" : "lazy"}
                />
              </div>
            );
          })}
        </main>
      </div>

      {/* ── Gate Modal Overlay ──────────────────────────────────────────────── */}
      <div className={`pdf-gate ${gateVisible ? "is-visible" : "is-hidden"}`}>
        <div className="pdf-gate-card">
          <div className="pdf-brand-bar">
            <span className="pdf-brand-dot" style={{ background: brandColor }} />
            <span style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>
              {businessName}
            </span>
          </div>

          {step === "email" ? (
            <>
              <h2>
                {pdfFreePages === 0
                  ? "Enter your details to read this guide."
                  : `You've read the preview. Enter your details to unlock all ${totalPages} pages.`}
              </h2>
              <p className="sub">Free — no credit card required.</p>
              <form className="pdf-gate-form" onSubmit={handleSendCode}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <div className="pdf-gate-row">
                    <input
                      id="pdf-gate-name"
                      className="pdf-gate-input"
                      type="text"
                      placeholder="Your name *"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={sending}
                    />
                    <input
                      id="pdf-gate-email"
                      className="pdf-gate-input"
                      type="email"
                      placeholder="Your email address *"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sending}
                    />
                  </div>

                  {customFormFields && customFormFields.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
                      {customFormFields.map((field) => (
                        <div key={field.id} style={{ textAlign: "left" }}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#666", marginBottom: "3px" }}>
                            {field.label} {field.required ? "*" : ""}
                          </label>
                          {field.type === "select" ? (
                            <select
                              className="pdf-gate-input"
                              style={{ fontSize: "14px", padding: "10px 12px" }}
                              required={field.required}
                              value={customAnswers[field.label] || customAnswers[field.id] || ""}
                              onChange={(e) =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.label || field.id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">{field.placeholder || "Select option..."}</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "textarea" ? (
                            <textarea
                              className="pdf-gate-input"
                              style={{ fontSize: "14px", padding: "10px 12px" }}
                              rows={2}
                              placeholder={field.placeholder || field.label}
                              required={field.required}
                              value={customAnswers[field.label] || customAnswers[field.id] || ""}
                              onChange={(e) =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.label || field.id]: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              className="pdf-gate-input"
                              style={{ fontSize: "14px", padding: "10px 12px" }}
                              placeholder={field.placeholder || field.label}
                              required={field.required}
                              value={customAnswers[field.label] || customAnswers[field.id] || ""}
                              onChange={(e) =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.label || field.id]: e.target.value,
                                }))
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="pdf-gate-btn"
                    disabled={sending}
                    style={{ background: brandColor, marginTop: "4px" }}
                  >
                    {sending ? "Sending code…" : "Send code →"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2>Enter the 6-digit code we just sent you.</h2>
              <p className="sub">Check your spam folder if it isn't there in a minute.</p>
              <form className="pdf-gate-form" onSubmit={handleVerifyCode}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  className="pdf-gate-input is-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={verifying}
                />
                <button
                  type="submit"
                  className="pdf-gate-btn"
                  disabled={verifying}
                  style={{ background: brandColor, marginTop: "10px" }}
                >
                  {verifying ? "Verifying…" : "Unlock guide →"}
                </button>
              </form>
              <p className="pdf-gate-hint" style={{ marginTop: "14px", textAlign: "center" }}>
                Didn't receive it?{" "}
                <button
                  type="button"
                  className="pdf-gate-link"
                  disabled={sending}
                  onClick={() => handleSendCode()}
                >
                  Resend code
                </button>
              </p>
            </>
          )}

          {hint && (
            <p className={`pdf-gate-hint ${hint.isError ? "is-error" : ""}`}>
              {hint.msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
