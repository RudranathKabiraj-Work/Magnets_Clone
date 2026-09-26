import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template6(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets,
    bulletsTitle,
    formButtonText,
    imageUrl,
    customFormFields = [],
    setCustomFormFields,
    fileInputRef,
    uploadProgress,
    headlineRef,
    subheadlineRef,
    pitchRef,
    setHeadline,
    setSubheadline,
    setPitch,
    setBulletsTitle,
    setBullets,
    setImageUrl,
    setFormButtonText,
    isEditor = true,
    isSubmitting = false,
    publicFormValues = {},
    setPublicFormValues,
    onSubmitPublicForm,
  } = props as any;

  const brandColor = account?.brandColor || "#0066B2";
  const themeMode = account?.themeMode || "light";
  const isDark = themeMode === "dark";

  return (
    <div
      className={`w-full mx-auto max-w-5xl rounded-3xl overflow-hidden relative min-h-[520px] flex flex-col justify-between transition-all duration-300 group shadow-2xl border border-black/10 dark:border-white/10 ${isDark ? "bg-[#0e0e14] text-white" : "bg-white text-zinc-900"}`}
    >
      {/* FULL CARD BACKGROUND IMAGE / GRADIENT LAYER */}
      {imageUrl && imageUrl.trim() !== "" ? (
        <img src={imageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: `linear-gradient(145deg, ${brandColor}cc 0%, #080912 100%)` }}
        />
      )}

      {/* DARK SCRIM OVERLAY */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/75 to-black/45" />

      {/* TOP RIGHT ACTION BUTTONS */}
      {isEditor && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef?.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-black px-3.5 py-2 text-xs font-bold text-white shadow-lg border border-white/20 backdrop-blur-md transition cursor-pointer"
          >
            <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
            <span>{imageUrl ? "Replace Image" : "Add Image"}</span>
          </button>
          {imageUrl && setImageUrl && (
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
      )}

      {/* UPLOAD PROGRESS OVERLAY */}
      {uploadProgress !== null && uploadProgress !== undefined && (
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
          {isEditor ? (
            <>
              <textarea
                ref={headlineRef}
                rows={1}
                value={headline || ""}
                onChange={(e) => { setHeadline?.(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                className="w-full text-2xl md:text-4xl font-black bg-transparent outline-none resize-none leading-tight text-white drop-shadow-md placeholder:text-zinc-400"
                placeholder="Your headline here"
              />
              <textarea
                ref={subheadlineRef}
                rows={1}
                value={subheadline || ""}
                onChange={(e) => { setSubheadline?.(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                className="w-full text-sm md:text-base font-medium bg-transparent outline-none resize-none text-zinc-200 drop-shadow-sm placeholder:text-zinc-400"
                placeholder="Short subhead. say what they will get"
              />
              <textarea
                ref={pitchRef}
                rows={2}
                value={pitch || ""}
                onChange={(e) => {
                  setPitch?.(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Write a short pitch..."
                className="w-full text-xs md:text-sm leading-relaxed bg-transparent outline-none resize-none text-zinc-300 placeholder:text-zinc-400"
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-4xl font-black leading-tight text-white drop-shadow-md">
                {headline || "Free Resource"}
              </h1>
              {subheadline && (
                <p className="text-sm md:text-base font-medium text-zinc-200 drop-shadow-sm">
                  {subheadline}
                </p>
              )}
              {pitch && (
                <p className="text-xs md:text-sm leading-relaxed text-zinc-300">
                  {pitch}
                </p>
              )}
            </>
          )}

          {/* BULLETS SECTION */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
              {isEditor ? (
                <input
                  type="text"
                  value={bulletsTitle || ""}
                  onChange={(e) => setBulletsTitle?.(e.target.value)}
                  placeholder="What they will learn"
                  className="text-xs font-black uppercase tracking-[0.18em] bg-transparent outline-none text-zinc-300 placeholder:text-zinc-500"
                />
              ) : (
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-300">
                  {bulletsTitle || "What they will learn"}
                </span>
              )}
            </div>
            {bullets && bullets.length > 0 ? (
              <div className="space-y-2">
                {bullets.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-white/10 border border-white/20">
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    {isEditor ? (
                      <>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => { if (!bullets || !setBullets) return; const u = [...bullets]; u[idx] = e.target.value; setBullets(u); }}
                          className="w-full bg-transparent outline-none text-xs font-semibold text-zinc-100 placeholder:text-zinc-400"
                          placeholder="Bullet point item..."
                        />
                        <button
                          type="button"
                          onClick={() => setBullets?.(bullets.filter((_: any, i: number) => i !== idx))}
                          className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                          title="Remove bullet point"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-zinc-100">
                        {item}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : isEditor ? (
              <p className="text-xs italic text-zinc-400 my-1">
                No bullets yet. click + to add one.
              </p>
            ) : null}

            {isEditor && setBullets && (
              <button
                type="button"
                onClick={() => setBullets([...(bullets || []), ""])}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 hover:bg-black/70 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add bullet</span>
              </button>
            )}
          </div>
        </div>

        {/* SMART FORM GRID */}
        <div className="pt-4 space-y-3">
          {isEditor ? (
            customFormFields.length === 0 ? (
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
                  value={formButtonText || ""}
                  onChange={(e) => setFormButtonText?.(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === "Send it to me" || e.target.value === "Get Instant Access →") {
                      setFormButtonText?.("");
                    } else {
                      e.target.select();
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setFormButtonText?.("Send it to me");
                    }
                  }}
                  placeholder="Send it to me"
                  className="shrink-0 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white outline-none cursor-text transition"
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`, boxShadow: `0 4px 16px -4px ${brandColor}88` }}
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
                  {customFormFields.map((field: any) => (
                    <div
                      key={field.id}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10 ${field.type === "textarea" ? "col-span-1 md:col-span-2" : ""}`}
                    >
                      <input
                        type="text"
                        placeholder={`${field.label || "New Field"}${field.required ? " *" : ""}`}
                        readOnly
                        className="w-full bg-transparent text-xs outline-none pointer-events-none text-white placeholder:text-zinc-400"
                      />
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={formButtonText || ""}
                  onChange={(e) => setFormButtonText?.(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === "Send it to me" || e.target.value === "Get Instant Access →") {
                      setFormButtonText?.("");
                    } else {
                      e.target.select();
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setFormButtonText?.("Send it to me");
                    }
                  }}
                  placeholder="Send it to me"
                  className="w-full rounded-xl py-3 text-xs font-extrabold text-white outline-none cursor-text transition text-center cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                    boxShadow: `0 4px 16px -4px ${brandColor}88`
                  }}
                />
              </div>
            )
          ) : (
            <form onSubmit={onSubmitPublicForm}>
              {customFormFields.length === 0 ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl p-1.5 gap-2 bg-black/50 border border-white/15 backdrop-blur-xl">
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
                    <span className="text-xs text-zinc-400">👤</span>
                    <input
                      type="text"
                      required
                      placeholder="Name *"
                      value={publicFormValues.name || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                      className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="hidden sm:block w-px h-5 shrink-0 bg-white/20" />
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
                    <span className="text-xs text-zinc-400">✉️</span>
                    <input
                      type="email"
                      required
                      placeholder="Email *"
                      value={publicFormValues.email || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                      className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="shrink-0 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white outline-none cursor-pointer transition disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`, boxShadow: `0 4px 16px -4px ${brandColor}88` }}
                  >
                    {isSubmitting ? "Submitting..." : (formButtonText || "Send it to me")}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl p-4 bg-black/50 border border-white/15 backdrop-blur-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                      <span className="text-xs text-zinc-400">👤</span>
                      <input
                        type="text"
                        required
                        placeholder="Name *"
                        value={publicFormValues.name || ""}
                        onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                        className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                      <span className="text-xs text-zinc-400">✉️</span>
                      <input
                        type="email"
                        required
                        placeholder="Email *"
                        value={publicFormValues.email || ""}
                        onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                        className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                      />
                    </div>
                    {customFormFields.map((field: any) => (
                      <div
                        key={field.id}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10 ${field.type === "textarea" ? "col-span-1 md:col-span-2" : ""}`}
                      >
                        <input
                          type="text"
                          required={field.required}
                          placeholder={`${field.label}${field.required ? " *" : ""}`}
                          value={publicFormValues[field.id] || ""}
                          onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                          className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl py-3 text-xs font-extrabold text-white outline-none cursor-pointer transition text-center disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                      boxShadow: `0 4px 16px -4px ${brandColor}88`
                    }}
                  >
                    {isSubmitting ? "Submitting..." : (formButtonText || "Send it to me")}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
