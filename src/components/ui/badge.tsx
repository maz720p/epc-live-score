import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const statusColor: Record<string, string> = {
  live: "bg-live/10 text-live",
  paused: "bg-paused/10 text-paused",
  finished: "bg-finished/10 text-finished",
  pending: "bg-slate-100 text-slate-500",
  not_started: "bg-slate-100 text-slate-500",
};

export function StatusBadge({ status, className, ...props }: { status: string } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
        statusColor[status] ?? "bg-slate-100 text-slate-500",
        className
      )}
      {...props}
    >
      {status.replace("_", " ")}
    </span>
  );
}
