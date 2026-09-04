import type { InputHTMLAttributes } from "react";

export const inputClass =
  "flex min-h-11 w-full rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#191919] px-3 text-base text-zinc-900 dark:text-zinc-100 outline-none transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:h-9 sm:text-sm focus:border-[#0066B2] focus:ring-[#0066B2]";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: InputProps) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{children}</span>;
}