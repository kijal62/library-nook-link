import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Armchair, CircleCheck, CircleDot, PauseCircle, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BreakTimer } from "@/components/smartseat/BreakTimer";
import { Navbar } from "@/components/smartseat/Navbar";
import { ScanSimulator } from "@/components/smartseat/ScanSimulator";
import { SeatDetails } from "@/components/smartseat/SeatDetails";
import { SeatGrid } from "@/components/smartseat/SeatGrid";
import { StatsCard } from "@/components/smartseat/StatsCard";
import { StatusLegend } from "@/components/smartseat/StatusLegend";
import { formatTime, useSeatSync } from "@/lib/smartseat/store";
import { BREAK_MINUTES, FLOORS, MAX_BREAKS, floorOf, type Seat } from "@/lib/smartseat/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    floor: Math.min(3, Math.max(1, Number(search.floor) || 1)),
  }),
  head: () => ({
    meta: [
      { title: "Live Seat Map — SeatSync Library" },
      {
        name: "description",
        content:
          "Real-time SeatSync dashboard: available, occupied and on-break library seats, with QR/NFC seat claiming and break timers.",
      },
      { property: "og:title", content: "Live Seat Map — SeatSync Library" },
      {
        property: "og:description",
        content: "See which library seats are truly free and claim one by scanning its desk tag.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, seats, mySeat, now, hold, release, tap } = useSeatSync();
  const { floor } = Route.useSearch();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Seat | null>(null);
  const config = floorOf(floor);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  const floorSeats = useMemo(() => seats.filter((s) => s.floor === floor), [seats, floor]);
  const stats = useMemo(
    () => ({
      total: floorSeats.length,
      available: floorSeats.filter((s) => s.status === "available").length,
      occupied: floorSeats.filter((s) => s.status === "occupied").length,
      onBreak: floorSeats.filter((s) => s.status === "on-break").length,
    }),
    [floorSeats],
  );

  const live = selected ? (seats.find((s) => s.id === selected.id) ?? null) : null;

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {FLOORS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => navigate({ to: "/dashboard", search: { floor: f.id } })}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  f.id === floor
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 text-muted-foreground hover:bg-secondary/60",
                )}
              >
                <span className="font-mono text-xs">F{f.id}</span> · {f.name}
              </button>
            ))}
          </div>
          <StatusLegend />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Available" value={stats.available} icon={CircleCheck} tone="available" />
          <StatsCard label="Occupied" value={stats.occupied} icon={CircleDot} tone="occupied" />
          <StatsCard label="On break" value={stats.onBreak} icon={PauseCircle} tone="onbreak" />
          <StatsCard label="Seats" value={stats.total} icon={Armchair} />
        </div>

        {mySeat ? (
          <section className="mt-6 rounded-2xl border border-primary/40 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Your seat</p>
                <p className="font-display mt-1 text-3xl font-semibold">
                  {mySeat.id}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    F{mySeat.floor} · {mySeat.zone}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mySeat.status === "on-break" ? "On break" : "Since"} {formatTime(mySeat.occupiedAt)}{" "}
                  · breaks {mySeat.breakCount}/{MAX_BREAKS}
                </p>
              </div>

              {mySeat.status === "occupied" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={mySeat.breakCount >= MAX_BREAKS}
                    onClick={() => {
                      const r = hold(mySeat.id);
                      r.ok ? toast.success(r.message) : toast.error(r.message);
                    }}
                  >
                    <PauseCircle className="size-4" /> Hold {BREAK_MINUTES}m
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const r = release(mySeat.id);
                      r.ok ? toast.success(r.message) : toast.error(r.message);
                    }}
                  >
                    <Unlock className="size-4" /> Release
                  </Button>
                </div>
              ) : null}
            </div>

            {mySeat.status === "on-break" && mySeat.releaseAt ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-onbreak/40 bg-onbreak-soft/20 p-4">
                  <BreakTimer releaseAt={mySeat.releaseAt} now={now} size="lg" />
                </div>
                <ScanSimulator
                  seatId={mySeat.id}
                  label="Return & scan seat"
                  onScanned={() => {
                    const r = tap(mySeat.id);
                    r.ok ? toast.success(r.message) : toast.error(r.message);
                  }}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="mt-8">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-xl font-semibold">{config.name}</h1>
            <span className="text-xs text-muted-foreground">{config.tagline}</span>
          </div>
          <div className="mt-4">
            <SeatGrid
              seats={floorSeats}
              now={now}
              myUserId={user.id}
              onSelect={setSelected}
              layout={config.layout}
            />
          </div>
        </section>
      </main>

      <SeatDetails seat={live} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
