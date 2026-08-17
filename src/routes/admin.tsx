import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Armchair, CircleCheck, CircleDot, PauseCircle, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/smartseat/Navbar";
import { SeatDetails } from "@/components/smartseat/SeatDetails";
import { SeatGrid } from "@/components/smartseat/SeatGrid";
import { StatsCard } from "@/components/smartseat/StatsCard";
import { StatusLegend } from "@/components/smartseat/StatusLegend";
import { formatTime, useSeatSync } from "@/lib/smartseat/store";
import type { Seat } from "@/lib/smartseat/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Librarian Dashboard — SeatSync" },
      {
        name: "description",
        content:
          "Librarian tools for SeatSync: monitor seat occupancy, override statuses, force-release seats and review session history.",
      },
      { property: "og:title", content: "Librarian Dashboard — SeatSync" },
      {
        property: "og:description",
        content: "Monitor occupancy, handle reported empty seats and force-release library seats.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, seats, stats, sessions, activity, now, forceRelease } = useSeatSync();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Seat | null>(null);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "admin") navigate({ to: "/dashboard" });
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  const live = selected ? (seats.find((s) => s.id === selected.id) ?? null) : null;
  const reported = seats.filter((s) => s.reported);
  const busySeats = seats.filter((s) => s.status !== "available");

  const doForce = (seatId: string) => {
    const r = forceRelease(seatId);
    r.ok ? toast.success(r.message) : toast.error(r.message);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Librarian dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Override seat statuses, resolve reports and review session history.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total seats" value={stats.total} icon={Armchair} />
          <StatsCard label="Available" value={stats.available} icon={CircleCheck} tone="available" />
          <StatsCard label="Occupied" value={stats.occupied} icon={CircleDot} tone="occupied" />
          <StatsCard label="On break" value={stats.onBreak} icon={PauseCircle} tone="onbreak" />
        </div>

        {reported.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-primary/45 bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="size-4 text-primary" /> Reported empty seats (
              {reported.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {reported.map((seat) => (
                <li
                  key={seat.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-secondary/40 p-3 text-sm"
                >
                  <span className="font-mono font-semibold">{seat.id}</span>
                  <span className="text-muted-foreground">
                    {seat.occupiedByName ?? "Unknown"} · since {formatTime(seat.occupiedAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="ml-auto"
                    onClick={() => doForce(seat.id)}
                  >
                    <Unlock className="size-4" /> Verify & release
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Tabs defaultValue="map" className="mt-8">
          <TabsList>
            <TabsTrigger value="map">Seat map</TabsTrigger>
            <TabsTrigger value="seats">Occupancy</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4 space-y-4">
            <StatusLegend />
            <SeatGrid seats={seats} now={now} myUserId={null} onSelect={setSelected} />
          </TabsContent>

          <TabsContent value="seats" className="mt-4">
            <div className="overflow-hidden rounded-xl border border-border/70">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-2">Seat</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2">Since</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {busySeats.map((seat) => (
                    <tr key={seat.id} className="border-t border-border/60">
                      <td className="px-4 py-2 font-mono font-semibold">{seat.id}</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={
                            seat.status === "occupied"
                              ? "border-occupied/50 bg-occupied-soft/40 text-occupied"
                              : "border-onbreak/50 bg-onbreak-soft/40 text-onbreak"
                          }
                        >
                          {seat.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{seat.occupiedByName ?? "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {formatTime(seat.occupiedAt)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => doForce(seat.id)}>
                          Force release
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {busySeats.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                        All seats are free.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-4">
            <ul className="space-y-2">
              {sessions.slice(0, 25).map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-card p-3 text-sm"
                >
                  <span className="font-mono font-semibold">{s.seatId}</span>
                  <span>{s.userName}</span>
                  <span className="text-muted-foreground">
                    {formatTime(s.startTime)} → {s.endTime ? formatTime(s.endTime) : "active"} ·{" "}
                    {s.breakHistory.length} break(s)
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ul className="space-y-2">
              {activity.slice(0, 30).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-3 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(a.at)}
                  </span>
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </main>

      <SeatDetails seat={live} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
