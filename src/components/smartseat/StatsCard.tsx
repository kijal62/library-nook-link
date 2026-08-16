import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  available: "bg-available-soft/40 text-available",
  occupied: "bg-occupied-soft/40 text-occupied",
  onbreak: "bg-onbreak-soft/40 text-onbreak",
  neutral: "bg-secondary text-foreground",
} as const;

export function StatsCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-display mt-1 text-3xl font-semibold">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}
