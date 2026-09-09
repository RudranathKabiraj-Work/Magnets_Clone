import type { InputHTMLAttributes } from "react";

export const inputClass =
  "flex min-h-11 w-full rounded-lg border border-zinc-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.04] backdrop-blur-md px-3 text-base text-zinc-900 dark:text-white outline-none transition-all duration-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:h-9 sm:text-sm focus:border-blue-500/60 focus:bg-white/80 dark:focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20 shadow-inner";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: InputProps) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{children}</span>;
}