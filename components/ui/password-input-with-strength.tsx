"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  id?: string;
  name?: string;
  className?: string;
  showStrengthMeter?: boolean;
}

export function calculatePasswordStrength(pass: string) {
  if (!pass) return { score: 0, label: "", color: "bg-zinc-200 dark:bg-zinc-800", textColor: "text-zinc-400" };

  let score = 0;
  const hasLength = pass.length >= 8;
  const hasUpperLower = /[a-z]/.test(pass) && /[A-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pass);

  if (hasLength) score += 1;
  if (hasUpperLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  if (score <= 1) {
    return { score: 1, label: "Weak", color: "bg-red-500", textColor: "text-red-500", hasLength, hasUpperLower, hasNumber, hasSpecial };
  } else if (score === 2) {
    return { score: 2, label: "Fair", color: "bg-amber-500", textColor: "text-amber-500", hasLength, hasUpperLower, hasNumber, hasSpecial };
  } else if (score === 3) {
    return { score: 3, label: "Good", color: "bg-yellow-500", textColor: "text-yellow-500 dark:text-yellow-400", hasLength, hasUpperLower, hasNumber, hasSpecial };
  } else {
    return { score: 4, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500", hasLength, hasUpperLower, hasNumber, hasSpecial };
  }
}

export default function PasswordInputWithStrength({
  value,
  onChange,
  placeholder = "Enter password",
  autoComplete = "new-password",
  required = false,
  minLength = 8,
  id,
  name,
  className = "",
  showStrengthMeter = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = calculatePasswordStrength(value);

  return (
    <div className="w-full space-y-2">
      {/* Input container with Eye toggle */}
      <div className="relative flex items-center w-full">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={`w-full rounded-md border border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#121214] pl-3.5 pr-11 py-2.5 text-[14.2px] text-zinc-900 dark:text-white outline-none placeholder:text-[#9B9085] focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] transition ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition cursor-pointer"
          title={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4.5 w-4.5" />
          ) : (
            <Eye className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrengthMeter && value.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Password strength:</span>
            <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
          </div>

          {/* 4 Segmented Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 h-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-full rounded-full transition-all duration-300 ${
                  level <= strength.score ? strength.color : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>

          {/* Requirement checklist badges */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
            <div className={`flex items-center gap-1 ${strength.hasLength ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
              {strength.hasLength ? <Check className="h-3 w-3 stroke-[3px]" /> : <X className="h-3 w-3" />}
              <span>8+ characters</span>
            </div>
            <div className={`flex items-center gap-1 ${strength.hasUpperLower ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
              {strength.hasUpperLower ? <Check className="h-3 w-3 stroke-[3px]" /> : <X className="h-3 w-3" />}
              <span>Upper & lower case</span>
            </div>
            <div className={`flex items-center gap-1 ${strength.hasNumber ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
              {strength.hasNumber ? <Check className="h-3 w-3 stroke-[3px]" /> : <X className="h-3 w-3" />}
              <span>Numbers (0-9)</span>
            </div>
            <div className={`flex items-center gap-1 ${strength.hasSpecial ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
              {strength.hasSpecial ? <Check className="h-3 w-3 stroke-[3px]" /> : <X className="h-3 w-3" />}
              <span>Special symbol</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
