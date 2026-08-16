import { Timer } from "lucide-react";
import { formatCountdown } from "@/lib/smartseat/store";
import { BREAK_MINUTES } from "@/lib/smartseat/types";
import { cn } from "@/lib/utils";

export function BreakTimer({
  releaseAt,
  now,
  size = "md",
}: {
  releaseAt: string;
  now: number;
  size?: "sm" | "md" | "lg";
}) {
  const remaining = new Date(releaseAt).getTime() - now;
  const pct = Math.max(0, Math.min(100, (remaining / (BREAK_MINUTES * 60_000)) * 100));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Timer className="size-3.5" /> Time remaining
        </span>
        <span>auto-release at {new Date(releaseAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <p
        className={cn(
          "font-mono font-semibold tabular-nums text-onbreak",
          size === "lg" ? "text-5xl" : size === "md" ? "text-3xl" : "text-xl",
        )}
      >
        {formatCountdown(remaining)}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-onbreak transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
