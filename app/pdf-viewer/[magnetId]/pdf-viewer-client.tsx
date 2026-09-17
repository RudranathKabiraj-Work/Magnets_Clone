"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Cloudinary blur helper ───────────────────────────────────────────────────
// Inserts e_blur:900 into a Cloudinary URL to get the blurred version.
// No extra storage needed — Cloudinary transforms on-the-fly.
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
  const [gateVisible, setGateVisible] = useState(false);

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
    fetch(`/api/pdf-gate/status?magnetId=${encodeURIComponent(magnetId)}`, {
      cache: "no-store",
    })
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

    // Sidebar: close by default on small screens
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

    // Observer 1: page counter — updates current page number in top bar
    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = Number((e.target as HTMLElement).dataset.pageIndex);
          setCurrentPage(idx + 1);
          // Highlight active thumbnail
          thumbRefs.current.forEach((t, i) => {
            if (t) t.dataset.active = String(i === idx);
          });
          // Scroll active thumb into view
          const activeThumb = thumbRefs.current[idx];
          if (activeThumb && sideRef.current && sidebarOpen) {
            activeThumb.scrollIntoView({ block: "nearest" });
          }
        });
      },
      { root: docRef.current, rootMargin: "-45% 0px -45% 0px" }
    );

    // Observer 2: gate trigger — watches locked pages
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
        performUnlock();
      } catch {
        setHint({ msg: "Network error. Please try again.", isError: true });
      } finally {
        setVerifying(false);
      }
    },
    [code, token, email, magnetId, name, customAnswers, performUnlock]
  );

  // ── Scroll to page ────────────────────────────────────────────────────────
  const scrollToPage = useCallback(
    (idx: number) => {
      const el = pageRefs.current[idx];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.innerWidth <= 760) setSidebarOpen(false);
    },
    []
  );

  return (
    <>
      {/* ─── Global styles scoped to this viewer ──────────────────────────── */}
      <style>{`
        html, body { margin: 0; overflow: hidden; height: 100%; }
        .pdf-viewer-root { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #323639; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        .pdf-bar { position: relative; z-index: 20; height: 56px; background: #3c3f43; display: flex; align-items: center; gap: 16px; padding: 0 20px; box-shadow: 0 1px 0 rgba(0,0,0,.35); flex-shrink: 0; }
        .pdf-bar-title { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
        .pdf-page-count { font-size: 13px; display: flex; align-items: center; gap: 6px; color: #ddd; white-space: nowrap; }
        .pdf-page-count b { background: #1f2124; color: #fff; padding: 3px 9px; border-radius: 4px; font-weight: 500; }
        .pdf-menu-btn { background: none; border: 0; color: #fff; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; display: grid; place-items: center; padding: 0; flex-shrink: 0; }
        .pdf-menu-btn:hover { background: rgba(255,255,255,.1); }
        .pdf-menu-btn span { display: block; width: 18px; height: 2px; background: #fff; box-shadow: 0 -6px 0 #fff, 0 6px 0 #fff; }
        .pdf-layout { display: flex; flex: 1; overflow: hidden; }
        .pdf-side { width: 200px; flex: none; background: #262a2d; border-right: 1px solid rgba(0,0,0,.4); overflow-y: auto; padding: 18px 0 40px; scrollbar-width: thin; scrollbar-color: #555 transparent; transition: width 0.2s; }
        .pdf-side[aria-hidden="true"] { width: 0; padding: 0; overflow: hidden; border: none; }
        .pdf-thumb { display: block; width: 100%; background: none; border: 0; padding: 8px 20px 12px; cursor: pointer; color: #ddd; font-family: inherit; }
        .pdf-thumb .pdf-frame { position: relative; width: 100%; aspect-ratio: 612/792; background: #e9e4dc; border: 3px solid transparent; border-radius: 2px; box-shadow: 0 1px 4px rgba(0,0,0,.5); overflow: hidden; }
        .pdf-thumb[data-active="true"] .pdf-frame { border-color: #8ab4f8; }
        .pdf-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .pdf-thumb .pdf-thumb-num { display: block; text-align: center; font-size: 12px; margin-top: 7px; }
        .pdf-thumb.is-locked img { filter: blur(4px); transform: scale(1.08); }
        .pdf-doc { flex: 1; overflow-y: auto; padding: 24px 16px 80px; display: flex; flex-direction: column; align-items: center; gap: 18px; }
        .pdf-page { position: relative; flex: none; width: min(860px, 100%); aspect-ratio: 612/792; background: #e9e4dc; box-shadow: 0 2px 10px rgba(0,0,0,.45); overflow: hidden; }
        .pdf-page img { display: block; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; }
        .pdf-page.is-locked img { filter: blur(14px); transform: scale(1.06); }
        .pdf-page.is-locked::after { content: ""; position: absolute; inset: 0; background: rgba(255,255,255,.08); }
        .pdf-page-num { position: absolute; left: 8px; bottom: 6px; font-size: 11px; color: rgba(0,0,0,.35); pointer-events: none; }

        /* Gate overlay */
        .pdf-gate { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); transition: opacity .25s; }
        .pdf-gate.is-hidden { opacity: 0; pointer-events: none; }
        .pdf-gate.is-visible { opacity: 1; pointer-events: auto; }
        .pdf-gate-card { background: #fff; color: #1c1c1c; border-radius: 20px; padding: 26px 28px; width: min(520px, 100%); box-shadow: 0 20px 60px rgba(0,0,0,.45); }
        .pdf-gate-card h2 { margin: 0 0 6px; font-size: 21px; font-weight: 700; letter-spacing: -.01em; }
        .pdf-gate-card p.sub { margin: 0 0 20px; font-size: 14px; color: #52525b; }
        .pdf-gate-form { display: flex; gap: 10px; }
        .pdf-gate-input { flex: 1; min-width: 0; font: inherit; font-size: 16px; padding: 13px 15px; border: 1.5px solid #d9d4cc; border-radius: 10px; outline: none; background: #fff; color: #1c1c1c; }
        .pdf-gate-input:focus { border-color: #1c1c1c; }
        .pdf-gate-input.is-code { letter-spacing: .3em; text-align: center; font-size: 22px; }
        .pdf-gate-btn { font: inherit; font-size: 15px; font-weight: 600; background: #111; color: #fff; border: 0; border-radius: 10px; padding: 13px 22px; cursor: pointer; white-space: nowrap; transition: opacity 0.15s; }
        .pdf-gate-btn:disabled { opacity: .5; cursor: default; }
        .pdf-gate-btn:not(:disabled):hover { opacity: 0.88; }
        .pdf-gate-hint { margin: 12px 0 0; font-size: 13px; color: #666; }
        .pdf-gate-hint.is-error { color: #b3261e; }
        .pdf-gate-hint.is-hidden { display: none; }
        .pdf-gate-link { color: inherit; cursor: pointer; text-decoration: underline; background: none; border: none; font: inherit; font-size: 13px; padding: 0; }
        .pdf-brand-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
        .pdf-brand-dot { width: 10px; height: 10px; border-radius: 50%; }

        @media (max-width: 760px) {
          .pdf-side { position: absolute; top: 56px; bottom: 0; left: 0; z-index: 15; width: 150px !important; box-shadow: 4px 0 16px rgba(0,0,0,.4); }
          .pdf-side[aria-hidden="true"] { width: 0 !important; }
          .pdf-thumb { padding: 6px 14px 10px; }
        }
        @media (max-width: 520px) {
          .pdf-gate-form { flex-direction: column; }
          .pdf-gate-card { padding: 22px 20px; }
          .pdf-gate-card h2 { font-size: 18px; }
          .pdf-bar-title { font-size: 13px; }
        }
      `}</style>

      <div className="pdf-viewer-root">
        {/* ── Top Bar ────────────────────────────────────────────────────────── */}
        <header className="pdf-bar">
          <button
            className="pdf-menu-btn"
            aria-label="Toggle page thumbnails"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span />
          </button>
          <div className="pdf-bar-title">{pdfTitle}</div>
          {unlocked && (
            <button
              onClick={() => {
                document.cookie = `pdf_unlocked_${magnetId}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                setUnlocked(false);
                setGateVisible(pdfFreePages === 0);
              }}
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              title="Reset unlock cookie to test locked state"
            >
              🔒 Re-lock (Test Gate)
            </button>
          )}
          <div className="pdf-page-count">
            <b>{currentPage}</b>
            <span>/ {totalPages}</span>
          </div>
        </header>

        <div className="pdf-layout">
          {/* ── Sidebar thumbnails ──────────────────────────────────────────── */}
          <nav
            ref={sideRef}
            className="pdf-side"
            aria-label="Pages"
            aria-hidden={!sidebarOpen}
          >
            {pdfPages.map((pageUrl, i) => {
              const isLocked = i >= pdfFreePages && !unlocked;
              const thumbSrc = isLocked ? getBlurUrl(pageUrl) : pageUrl;
              return (
                <button
                  key={i}
                  ref={(el) => { thumbRefs.current[i] = el; }}
                  className={`pdf-thumb${isLocked ? " is-locked" : ""}`}
                  data-active={String(i === currentPage - 1)}
                  onClick={() => scrollToPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                >
                  <span className="pdf-frame">
                    <img
                      src={thumbSrc}
                      alt=""
                      loading="lazy"
                    />
                  </span>
                  <span className="pdf-thumb-num">{i + 1}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Main document area ──────────────────────────────────────────── */}
          <main className="pdf-doc" ref={docRef} id="pdf-doc">
            {pdfPages.map((pageUrl, i) => {
              const isLocked = i >= pdfFreePages && !unlocked;
              const src = isLocked ? getBlurUrl(pageUrl) : pageUrl;
              return (
                <div
                  key={i}
                  ref={(el) => { pageRefs.current[i] = el; }}
                  className={`pdf-page${isLocked ? " is-locked" : ""}`}
                  data-page-index={i}
                >
                  <img
                    src={src}
                    alt={`Page ${i + 1}`}
                    loading={i < 3 ? "eager" : "lazy"}
                  />
                  <span className="pdf-page-num">{i + 1}</span>
                </div>
              );
            })}
          </main>
        </div>

        {/* ── Email Gate Overlay ─────────────────────────────────────────────── */}
        <div
          className={`pdf-gate ${gateVisible ? "is-visible" : "is-hidden"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Unlock full access"
        >
          <div className="pdf-gate-card">
            {/* Brand pill */}
            <div className="pdf-brand-bar">
              <span
                className="pdf-brand-dot"
                style={{ background: brandColor }}
              />
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
                    <input
                      id="pdf-gate-name"
                      className="pdf-gate-input"
                      type="text"
                      placeholder="Your name"
                      autoComplete="name"
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
                    id="pdf-gate-code"
                    className="pdf-gate-input is-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    disabled={verifying}
                  />
                  <button
                    type="submit"
                    className="pdf-gate-btn"
                    disabled={verifying || code.length < 6}
                    style={{ background: brandColor }}
                  >
                    {verifying ? "Checking…" : "Unlock"}
                  </button>
                </form>
              </>
            )}

            {/* Hint / error text */}
            <p
              className={`pdf-gate-hint ${hint ? "" : "is-hidden"} ${
                hint?.isError ? "is-error" : ""
              }`}
            >
              {hint?.msg}
              {step === "code" && !hint?.isError && (
                <>
                  {" "}
                  <button
                    className="pdf-gate-link"
                    onClick={() => handleSendCode()}
                    type="button"
                  >
                    Resend
                  </button>{" "}
                  ·{" "}
                  <button
                    className="pdf-gate-link"
                    onClick={() => {
                      setStep("email");
                      setToken(null);
                      setCode("");
                      setHint(null);
                    }}
                    type="button"
                  >
                    Change email
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
