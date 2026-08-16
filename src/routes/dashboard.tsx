import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { formatTime, useSmartSeat } from "@/lib/smartseat/store";
import { BREAK_MINUTES, MAX_BREAKS, type Seat } from "@/lib/smartseat/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Seat Map — SmartSeat Library" },
      {
        name: "description",
        content:
          "Real-time SmartSeat dashboard: available, occupied and on-break library seats, with QR/NFC seat claiming and break timers.",
      },
      { property: "og:title", content: "Live Seat Map — SmartSeat Library" },
      {
        property: "og:description",
        content: "See which library seats are truly free and claim one by scanning its desk tag.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, seats, stats, mySeat, now, hold, release, tap } = useSmartSeat();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Seat | null>(null);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  const live = selected ? (seats.find((s) => s.id === selected.id) ?? null) : null;

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Central Library · Floor 1</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Updates live for every student in the library.
            </p>
          </div>
          <StatusLegend />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Available"
            value={stats.available}
            icon={CircleCheck}
            tone="available"
            hint="Ready to claim"
          />
          <StatsCard label="Occupied" value={stats.occupied} icon={CircleDot} tone="occupied" />
          <StatsCard
            label="On break"
            value={stats.onBreak}
            icon={PauseCircle}
            tone="onbreak"
            hint={`Auto-release after ${BREAK_MINUTES}m`}
          />
          <StatsCard label="Total seats" value={stats.total} icon={Armchair} />
        </div>

        {mySeat ? (
          <section className="mt-6 rounded-2xl border border-primary/40 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Your seat</p>
                <p className="font-display mt-1 text-3xl font-semibold">
                  {mySeat.id}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {mySeat.zone}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mySeat.status === "on-break" ? "On break" : "Occupied"} since{" "}
                  {formatTime(mySeat.occupiedAt)} · breaks used {mySeat.breakCount}/{MAX_BREAKS}
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
                    <PauseCircle className="size-4" /> Hold seat
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const r = release(mySeat.id);
                      r.ok ? toast.success(r.message) : toast.error(r.message);
                    }}
                  >
                    <Unlock className="size-4" /> Release seat
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
        ) : (
          <p className="mt-6 rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
            You don't hold a seat yet. Pick a green seat below, walk to it, and scan its QR/NFC tag
            to claim it.
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Seat map</h2>
          <div className="mt-4">
            <SeatGrid seats={seats} now={now} myUserId={user.id} onSelect={setSelected} />
          </div>
        </section>
      </main>

      <SeatDetails seat={live} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
