"use client";

import { pages as seedPages, sequences as seedSequences, type MagnetPage, type Sequence, type Account, type Lead, type Integration, account as seedAccount, leads as seedLeads, integrations as seedIntegrations } from "@/lib/data";

export function loadPages(): MagnetPage[] {
  return seedPages;
}

export function savePages(pages: MagnetPage[]) {
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
  return seedSequences;
}

export function saveSequences(sequences: Sequence[]) {
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveSequences", data: sequences }),
  }).catch(console.error);
}

export function resetSequences() {
  saveSequences(seedSequences);
}

export function loadAccount(): Account {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("currentUserAccount");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
  }
  return seedAccount;
}

export async function saveAccount(account: Account): Promise<{ success: boolean; account?: Account; error?: string }> {
  try {
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
  return seedIntegrations;
}

export function saveIntegrations(integrations: Integration[]) {
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveIntegrations", data: integrations }),
  }).catch(console.error);
}

export function loadLeads(): Lead[] {
  return seedLeads;
}

export function saveLeads(leads: Lead[]) {
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveLeads", data: leads }),
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
    const url = email ? `/api/data?email=${encodeURIComponent(email)}` : "/api/data";
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.account && typeof window !== "undefined") {
      localStorage.setItem("currentUserAccount", JSON.stringify(data.account));
      localStorage.setItem("currentUserEmail", data.account.email);
    }
    return data;
  } catch (error) {
    console.error("Failed to sync database", error);
    return null;
  }
}