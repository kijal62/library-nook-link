import { AlertTriangle } from "lucide-react";
import { formatCountdown } from "@/lib/smartseat/store";
import type { Seat } from "@/lib/smartseat/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<Seat["status"], string> = {
  available: "border-available/40 bg-available-soft/25 text-available hover:bg-available-soft/45",
  occupied: "border-occupied/40 bg-occupied-soft/25 text-occupied hover:bg-occupied-soft/45",
  "on-break": "border-onbreak/45 bg-onbreak-soft/25 text-onbreak hover:bg-onbreak-soft/45",
};

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
        "seat-tile seat-tile-hover relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        statusStyles[seat.status],
        isMine && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <span>{seat.id}</span>
      {seat.status === "on-break" ? (
        <span className="mt-0.5 text-[10px] tabular-nums opacity-90">
          {formatCountdown(remaining)}
        </span>
      ) : null}
      {seat.reported ? (
        <AlertTriangle className="absolute top-1 right-1 size-3 text-primary" />
      ) : null}
    </button>
  );
}
