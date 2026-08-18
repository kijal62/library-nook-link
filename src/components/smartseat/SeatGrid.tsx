import type { FloorLayout, Seat } from "@/lib/smartseat/types";
import { SeatCard } from "./SeatCard";

type Props = {
  seats: Seat[];
  now: number;
  myUserId: string | null;
  onSelect: (seat: Seat) => void;
  layout?: FloorLayout;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function SeatGrid({ seats, now, myUserId, onSelect, layout = "rows" }: Props) {
  const rows = Array.from(new Set(seats.map((s) => s.id.charAt(0))));

  const tile = (seat: Seat) => (
    <SeatCard
      key={seat.id}
      seat={seat}
      now={now}
      isMine={!!myUserId && seat.occupiedBy === myUserId}
      onSelect={onSelect}
    />
  );

  if (layout === "pods") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.flatMap((row) =>
          chunk(
            seats.filter((s) => s.id.startsWith(row)),
            4,
          ).map((pod, i) => (
            <div
              key={`${row}-${i}`}
              className="rounded-2xl border border-border/70 bg-card/60 p-3"
            >
              <p className="mb-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Pod {row}
                {i + 1}
              </p>
              <div className="grid grid-cols-2 gap-2">{pod.map(tile)}</div>
            </div>
          )),
        )}
      </div>
    );
  }

  if (layout === "arc") {
    return (
      <div className="space-y-6">
        {rows.map((row) => {
          const rowSeats = seats.filter((s) => s.id.startsWith(row));
          const mid = (rowSeats.length - 1) / 2;
          return (
            <div key={row} className="flex flex-wrap justify-center gap-2 sm:flex-nowrap">
              {rowSeats.map((seat, i) => (
                <div
                  key={seat.id}
                  className="w-[calc(25%-0.5rem)] sm:w-16"
                  style={{ transform: `translateY(${Math.abs(i - mid) * 6}px)` }}
                >
                  {tile(seat)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

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
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{rowSeats.map(tile)}</div>
          </div>
        );
      })}
    </div>
  );
}
