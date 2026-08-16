import type { Seat } from "@/lib/smartseat/types";
import { SeatCard } from "./SeatCard";

export function SeatGrid({
  seats,
  now,
  myUserId,
  onSelect,
}: {
  seats: Seat[];
  now: number;
  myUserId: string | null;
  onSelect: (seat: Seat) => void;
}) {
  const rows = Array.from(new Set(seats.map((s) => s.id.charAt(0))));

  return (
    <div className="space-y-5">
      {rows.map((row) => {
        const rowSeats = seats.filter((s) => s.id.startsWith(row));
        return (
          <div key={row}>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-primary">Row {row}</span>
              <span className="text-xs text-muted-foreground">{rowSeats[0]?.zone}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {rowSeats.map((seat) => (
                <SeatCard
                  key={seat.id}
                  seat={seat}
                  now={now}
                  isMine={!!myUserId && seat.occupiedBy === myUserId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
