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
  return seedAccount;
}

export function saveAccount(account: Account) {
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveAccount", data: account }),
  }).catch(console.error);
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
    const res = await fetch("/api/data");
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to sync database", error);
    return null;
  }
}