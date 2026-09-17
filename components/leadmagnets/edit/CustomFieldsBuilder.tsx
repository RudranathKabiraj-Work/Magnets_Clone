"use client";

import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { type Account, type CustomFormField } from "@/lib/data";

export interface CustomFieldsBuilderProps {
  account: Account | null;
  customFormFields: CustomFormField[];
  setCustomFormFields: React.Dispatch<React.SetStateAction<CustomFormField[]>>;
}

export default function CustomFieldsBuilder({
  account,
  customFormFields,
  setCustomFormFields,
}: CustomFieldsBuilderProps) {
  return (
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
  );
}
