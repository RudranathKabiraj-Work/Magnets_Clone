"use client";

import { pages as seedPages, sequences as seedSequences, type MagnetPage, type Sequence, type Account, type Lead, type Integration, account as seedAccount, leads as seedLeads, integrations as seedIntegrations } from "@/lib/data";

export function loadPages(): MagnetPage[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserPages");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return seedPages;
  }
  return [];
}

export function savePages(pages: MagnetPage[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUserPages", JSON.stringify(pages));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "savePages", data: pages }),
  }).catch(console.error);
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
      } catch (e) {}
    }
    return seedSequences;
  }
  return [];
}

export function saveSequences(sequences: Sequence[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUserSequences", JSON.stringify(sequences));
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

export function loadAccount(): Account | null {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return null;
    const cached = localStorage.getItem("currentUserAccount");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return seedAccount;
  }
  return null;
}

export async function saveAccount(account: Account): Promise<{ success: boolean; account?: Account; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUserAccount", JSON.stringify(account));
    }
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveAccount", data: account }),
    });
    if (res.ok) {
      const resData = await res.json();
      if (resData.success && resData.account) {
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserAccount", JSON.stringify(resData.account));
          localStorage.setItem("currentUserEmail", resData.account.email);
        }
        return { success: true, account: resData.account };
      }
      return { success: false, error: resData.error || "Failed to save account" };
    }
    const errData = await res.json();
    return { success: false, error: errData.error || "Failed to save account" };
  } catch (error: any) {
    console.error("Error saving account:", error);
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
      } catch (e) {}
    }
    return seedIntegrations;
  }
  return [];
}

export function saveIntegrations(integrations: Integration[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUserIntegrations", JSON.stringify(integrations));
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
      } catch (e) {}
    }
    return seedLeads;
  }
  return [];
}

export function saveLeads(leads: Lead[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUserLeads", JSON.stringify(leads));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveLeads", data: leads }),
  }).catch(console.error);
}

export function loadResources(): any[] {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("currentUserResources");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
  }
  return [];
}

export function saveResources(resources: any[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUserResources", JSON.stringify(resources));
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
      if (data.account) localStorage.setItem("currentUserAccount", JSON.stringify(data.account));
      if (data.pages) localStorage.setItem("currentUserPages", JSON.stringify(data.pages));
      if (data.sequences) localStorage.setItem("currentUserSequences", JSON.stringify(data.sequences));
      if (data.leads) localStorage.setItem("currentUserLeads", JSON.stringify(data.leads));
      if (data.integrations) localStorage.setItem("currentUserIntegrations", JSON.stringify(data.integrations));
      if (data.resources) localStorage.setItem("currentUserResources", JSON.stringify(data.resources));
      if (data.account?.email) localStorage.setItem("currentUserEmail", data.account.email);
    }
    return data;
  } catch (error) {
    console.error("Failed to sync database", error);
    return null;
  }
}