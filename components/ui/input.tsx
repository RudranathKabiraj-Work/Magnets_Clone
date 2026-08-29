import type { InputHTMLAttributes } from "react";

export const inputClass =
  "flex min-h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-base text-ink-900 outline-none transition placeholder:text-ink-400 focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:h-9 sm:text-sm focus:border-brand-orange focus:ring-brand-orange";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: InputProps) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-ink-700">{children}</span>;
}