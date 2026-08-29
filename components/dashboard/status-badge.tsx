import type { MagnetStatus } from "@/lib/data";

const statusStyles: Record<MagnetStatus, string> = {
  live: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-700/50",
  draft: "bg-ink-50 text-ink-600 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-700",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function StatusBadge({ status }: { status: MagnetStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "live" ? "bg-emerald-500" : status === "draft" ? "bg-ink-400" : "bg-amber-500"
        }`}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}