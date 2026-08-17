import { AlertTriangle } from "lucide-react";
import { formatCountdown } from "@/lib/smartseat/store";
import type { Seat } from "@/lib/smartseat/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<Seat["status"], string> = {
  available: "border-available/45 bg-available-soft/30 text-available hover:bg-available-soft/50",
  occupied: "border-occupied/45 bg-occupied-soft/30 text-occupied hover:bg-occupied-soft/50",
  "on-break": "border-onbreak/50 bg-onbreak-soft/30 text-onbreak hover:bg-onbreak-soft/50",
};

function ChairIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* backrest */}
      <path d="M9 4h14a2 2 0 0 1 2 2v10H7V6a2 2 0 0 1 2-2z" fill="currentColor" opacity="0.18" />
      <path d="M9 4h14a2 2 0 0 1 2 2v10H7V6a2 2 0 0 1 2-2z" />
      {/* seat */}
      <path d="M5 18h22a1 1 0 0 1 1 1v3H4v-3a1 1 0 0 1 1-1z" fill="currentColor" opacity="0.28" />
      <path d="M5 18h22a1 1 0 0 1 1 1v3H4v-3a1 1 0 0 1 1-1z" />
      {/* legs */}
      <path d="M7 22v6M25 22v6" />
    </svg>
  );
}

export function SeatCard({
  seat,
  now,
  isMine,
  onSelect,
}: {
  seat: Seat;
  now: number;
  isMine: boolean;
  onSelect: (seat: Seat) => void;
}) {
  const remaining = seat.releaseAt ? new Date(seat.releaseAt).getTime() - now : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(seat)}
      aria-label={`Seat ${seat.id}, ${seat.status}`}
      className={cn(
        "seat-tile seat-tile-hover relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        statusStyles[seat.status],
        isMine && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <ChairIcon className="size-7 sm:size-8" />
      <span className="text-[10px] font-semibold tabular-nums opacity-80">{seat.id}</span>
      {seat.status === "on-break" ? (
        <span className="text-[10px] tabular-nums opacity-90">{formatCountdown(remaining)}</span>
      ) : null}
      {seat.reported ? (
        <AlertTriangle className="absolute top-1 right-1 size-3 text-primary" />
      ) : null}
    </button>
  );
}
