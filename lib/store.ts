"use client";

import { pages as seedPages, sequences as seedSequences, type MagnetPage, type Sequence, type Account, type Lead, type Integration, account as seedAccount, leads as seedLeads, integrations as seedIntegrations } from "@/lib/data";

export function safeSetItem(key: string, value: string) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage quota exceeded for ${key}`, e);
      try {
        if (key === "currentUserAccount") {
          const parsed = JSON.parse(value);
          if (parsed.logo && parsed.logo.length > 20000) {
            delete parsed.logo;
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        }
      } catch (fallbackErr) {
        console.error("Could not write to localStorage fallback:", fallbackErr);
      }
    }
  }
}

export function loadPages(): MagnetPage[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserPages");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }
  return [];
}

export function savePages(pages: MagnetPage[]) {
  if (typeof window !== "undefined") {
    safeSetItem("currentUserPages", JSON.stringify(pages));
    const email = localStorage.getItem("currentUserEmail");
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "savePages", data: pages, email }),
    }).catch(console.error);
  }
}

export function deletePage(id: string) {
  if (typeof window !== "undefined") {
    const current = loadPages().filter((p) => p.id !== id);
    safeSetItem("currentUserPages", JSON.stringify(current));
    const email = localStorage.getItem("currentUserEmail");
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deletePage", data: { id }, email }),
    }).catch(console.error);
  }
}

export function resetPages() {
  savePages(seedPages);
}

export function loadSequences(): Sequence[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserSequences");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
    return seedSequences;
  }
  return [];
}

export function saveSequences(sequences: Sequence[]) {
  if (typeof window !== "undefined") {
    safeSetItem("currentUserSequences", JSON.stringify(sequences));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveSequences", data: sequences }),
  }).catch(console.error);
}

export function resetSequences() {
  saveSequences(seedSequences);
}

export function setSessionExpiry(days = 7) {
  if (typeof window !== "undefined") {
    const expiryTime = Date.now() + days * 24 * 60 * 60 * 1000;
    safeSetItem("sessionExpiry", String(expiryTime));
  }
}

export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false;
  const email = localStorage.getItem("currentUserEmail");
  if (!email) return false;

  const expiry = localStorage.getItem("sessionExpiry");
  if (expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      // 7-day session expired! Clear local browser session keys ONLY.
      // NOTE: Database user data remains 100% safe & untouched in MongoDB.
      localStorage.removeItem("currentUserEmail");
      localStorage.removeItem("currentUserAccount");
      localStorage.removeItem("sessionExpiry");
      return false;
    }
  }
  return true;
}

export function loadAccount(): Account | null {
  if (typeof window !== "undefined") {
    if (!isSessionValid()) return null;
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return null;
    const cached = localStorage.getItem("currentUserAccount");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          return { ...parsed, email: email.trim() };
        }
      } catch (e) { }
    }
    return null;
  }
  return null;
}

export async function saveAccount(account: Account): Promise<{ success: boolean; account?: Account; error?: string }> {
  if (typeof window !== "undefined") {
    safeSetItem("currentUserAccount", JSON.stringify(account));
    if (account.email) safeSetItem("currentUserEmail", account.email);
  }
  try {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveAccount", data: account }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to save account" };
    }
    return { success: true, account: data.account || account };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save account" };
  }
}

export function loadIntegrations(): Integration[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserIntegrations");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
    return seedIntegrations;
  }
  return [];
}

export function saveIntegrations(integrations: Integration[]) {
  if (typeof window !== "undefined") {
    safeSetItem("currentUserIntegrations", JSON.stringify(integrations));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveIntegrations", data: integrations }),
  }).catch(console.error);
}

export function loadLeads(): Lead[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserLeads");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
    return seedLeads;
  }
  return [];
}

export function saveLeads(leads: Lead[]) {
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  if (typeof window !== "undefined") {
    safeSetItem("currentUserLeads", JSON.stringify(leads));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveLeads", data: leads, email }),
  }).catch(console.error);
}

export function deleteLead(leadId: string) {
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  if (typeof window !== "undefined") {
    const current = loadLeads().filter((l) => l.id !== leadId);
    safeSetItem("currentUserLeads", JSON.stringify(current));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteLead", data: { id: leadId }, email }),
  }).catch(console.error);
}

export function loadResources(): any[] {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("currentUserResources");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }
  return [];
}

export function saveResources(resources: any[]) {
  if (typeof window !== "undefined") {
    safeSetItem("currentUserResources", JSON.stringify(resources));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveResources", data: resources }),
  }).catch(console.error);
}

export async function syncWithDatabase(): Promise<{
  account: Account;
  pages: MagnetPage[];
  sequences: Sequence[];
  leads: Lead[];
  integrations: Integration[];
  resources?: any[];
} | null> {
  try {
    const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
    if (!email) return null;
    const url = `/api/data?email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof window !== "undefined") {
      if (data.account && data.account.email) {
        if (data.account.email.toLowerCase() === email.toLowerCase()) {
          safeSetItem("currentUserAccount", JSON.stringify(data.account));
          safeSetItem("currentUserEmail", data.account.email);
        }
      }

      if (data.pages && Array.isArray(data.pages)) {
        safeSetItem("currentUserPages", JSON.stringify(data.pages));
      }

      if (data.sequences) safeSetItem("currentUserSequences", JSON.stringify(data.sequences));
      if (data.leads) safeSetItem("currentUserLeads", JSON.stringify(data.leads));
      if (data.integrations) safeSetItem("currentUserIntegrations", JSON.stringify(data.integrations));
      if (data.resources) safeSetItem("currentUserResources", JSON.stringify(data.resources));
    }
    return data;
  } catch (error) {
    console.error("Failed to sync database", error);
    return null;
  }
}