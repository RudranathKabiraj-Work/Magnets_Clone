import type { ButtonHTMLAttributes } from "react";

export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium transition duration-150 ease-out touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&:not(:disabled)]:active:translate-y-px border-ink-950 bg-ink-950 text-white hover:border-brand-orange hover:bg-brand-orange hover:text-ink-950 px-3.5 sm:min-h-9 sm:h-9";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className = "", ...props }: ButtonProps) {
  return <button {...props} className={`${buttonClass} ${className}`} />;
}