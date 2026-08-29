"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { Palette, CheckCircle2 } from "lucide-react";
import { syncWithDatabase, saveAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function BrandPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#FE6F34");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setBusinessName(data.account.name || "");
        setBrandColor(data.account.brandColor || "#FE6F34");
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);

    const updatedAccount: Account = {
      ...account,
      name: businessName.trim(),
      brandColor: brandColor.trim(),
    };

    try {
      await saveAccount(updatedAccount);
      setAccount(updatedAccount);
      alert("Brand settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save brand settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !account) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading brand settings...</div>
      </div>
    );
  }

  return (
    <DashboardShell account={account} title="Brand">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-ink-950 dark:text-white">
            Brand
            <span className="cursor-help rounded-full border border-ink-300 px-1.5 py-0 text-xs font-normal text-ink-500 hover:bg-ink-100">?</span>
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Logo, page appearance, and colour settings for every magnet.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Brand Settings Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-lg border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-400 uppercase tracking-wider mb-5">
                <Palette className="h-4 w-4 text-brand-orange" /> Brand settings
              </span>
              
              <div className="space-y-4">
                <div>
                  <FieldLabel>Business name</FieldLabel>
                  <Input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <FieldLabel>Logo Image</FieldLabel>
                  <div className="flex items-center gap-3">
                    <button className="rounded-md border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-xs font-medium text-ink-700 hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-950 dark:text-ink-300">
                      Choose logo
                    </button>
                    <span className="text-xs text-ink-400">No logo uploaded</span>
                  </div>
                </div>

                <div>
                  <FieldLabel>Primary color</FieldLabel>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 shrink-0 rounded-md border border-ink-350 shadow-sm"
                      style={{ backgroundColor: brandColor }}
                    />
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <Input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Page appearance</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setThemeMode("light")}
                      className={`rounded-md border py-2.5 text-xs font-semibold ${
                        themeMode === "light"
                          ? "border-ink-950 bg-ink-950 text-white"
                          : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setThemeMode("dark")}
                      className={`rounded-md border py-2.5 text-xs font-semibold ${
                        themeMode === "dark"
                          ? "border-ink-950 bg-ink-950 text-white"
                          : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel>Highlight Intensity</FieldLabel>
                  <input type="range" className="w-full accent-ink-950 mt-1" defaultValue={100} />
                  <div className="flex justify-between text-[10px] text-ink-400 mt-1">
                    <span>Subtle</span>
                    <span>Balanced</span>
                    <span>Bold</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-ink-200 pt-5 dark:border-ink-800">
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save brand"}
                </Button>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-7">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3.5">Preview</p>
            <div className={`rounded-xl border border-ink-200 overflow-hidden shadow-lg ${themeMode === "dark" ? "bg-ink-950 text-white" : "bg-ink-50 text-ink-900"}`}>
              {/* Fake browser mockup header */}
              <div className="flex h-9 items-center justify-between border-b border-ink-200 bg-ink-100 px-4 dark:border-ink-800 dark:bg-ink-900">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
                </div>
                <div className="text-[10px] text-ink-400 font-medium select-none">Previewing Live Page</div>
                <div className="w-12"></div>
              </div>

              <div className="p-8">
                {/* Header brand name */}
                <div className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
                  <div className="h-7 w-7 rounded border-2 border-dashed border-ink-300 flex items-center justify-center text-[10px] text-ink-400">
                    Logo
                  </div>
                  <span className="text-sm font-bold tracking-tight uppercase">{businessName || "BRAND"}</span>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-center">
                  <div>
                    <h3 className="text-lg font-bold leading-tight">101 Winning Viral Templates That Get Results</h3>
                    <p className="text-[11px] text-ink-500 mt-2">
                      Stop staring at a blank page. Start creating content that actually connects.
                    </p>
                    <ul className="mt-4 space-y-2 text-[10px] text-ink-600 dark:text-ink-400">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        101 fill-in-the-blank templates
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        Proven structures for storytelling
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        Ready-to-use formats
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                    <p className="text-xs font-bold text-center">Download for free now</p>
                    <p className="text-[9px] text-ink-400 text-center mt-1">By opting in you consent to receive this resource by email.</p>
                    
                    <div className="mt-4 space-y-2.5">
                      <input type="text" placeholder="Name" className="w-full rounded border border-ink-200 bg-ink-50 p-2 text-[10px] text-ink-800 focus:outline-none dark:border-ink-850 dark:bg-ink-950 dark:text-white" disabled />
                      <input type="email" placeholder="Email" className="w-full rounded border border-ink-200 bg-ink-50 p-2 text-[10px] text-ink-800 focus:outline-none dark:border-ink-850 dark:bg-ink-950 dark:text-white" disabled />
                      <button
                        className="w-full rounded py-2 text-[10px] font-semibold text-white transition active:scale-95"
                        style={{ backgroundColor: brandColor }}
                      >
                        Get the templates
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center text-[9px] text-ink-400 border-t border-ink-150 pt-4 dark:border-ink-800">
                  All rights reserved 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
