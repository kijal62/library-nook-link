import { AlertTriangle, Clock, MapPin, PauseCircle, ShieldCheck, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime, useSeatSync, type ActionResult } from "@/lib/smartseat/store";
import { BREAK_MINUTES, MAX_BREAKS, type Seat } from "@/lib/smartseat/types";
import { BreakTimer } from "./BreakTimer";
import { ScanSimulator } from "./ScanSimulator";

const statusLabel: Record<Seat["status"], string> = {
  available: "Available",
  occupied: "Occupied",
  "on-break": "On break",
};

const statusBadge: Record<Seat["status"], string> = {
  available: "border-available/50 bg-available-soft/40 text-available",
  occupied: "border-occupied/50 bg-occupied-soft/40 text-occupied",
  "on-break": "border-onbreak/50 bg-onbreak-soft/40 text-onbreak",
};

function notify(result: ActionResult) {
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
}

export function SeatDetails({
  seat,
  onOpenChange,
}: {
  seat: Seat | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, now, mySeat, tap, hold, release, report, forceRelease } = useSeatSync();
  if (!seat) return null;

  const isMine = !!user && seat.occupiedBy === user.id;
  const isAdmin = user?.role === "admin";
  const blockedByOtherSeat = !!mySeat && mySeat.id !== seat.id;

  return (
    <Dialog open={!!seat} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-2xl">Seat {seat.id}</span>
            <Badge variant="outline" className={statusBadge[seat.status]}>
              {statusLabel[seat.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="size-4" /> {seat.zone}
            </p>
            {seat.status !== "available" ? (
              <>
                <p className="flex items-center gap-2">
                  <Clock className="size-4" /> Occupied since {formatTime(seat.occupiedAt)}
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  {isMine ? "You" : (seat.occupiedByName ?? "Anonymous student")} · breaks used{" "}
                  {seat.breakCount}/{MAX_BREAKS}
                </p>
              </>
            ) : null}
            {seat.reported ? (
              <p className="flex items-center gap-2 text-primary">
                <AlertTriangle className="size-4" /> Reported as occupied-but-empty
              </p>
            ) : null}
          </div>

          {seat.status === "on-break" && seat.releaseAt ? (
            <div className="rounded-xl border border-onbreak/40 bg-onbreak-soft/20 p-4">
              <BreakTimer releaseAt={seat.releaseAt} now={now} />
            </div>
          ) : null}

          {seat.status === "available" ? (
            blockedByOtherSeat ? (
              <p className="rounded-lg border border-border/70 bg-secondary/40 p-3 text-sm text-muted-foreground">
                You already hold seat <span className="font-mono">{mySeat!.id}</span>. One active
                seat per student — release it before claiming another.
              </p>
            ) : (
              <ScanSimulator
                seatId={seat.id}
                label="Scan QR to claim"
                onScanned={() => notify(tap(seat.id))}
              />
            )
          ) : null}

          {seat.status === "on-break" && isMine ? (
            <ScanSimulator
              seatId={seat.id}
              label="Return & scan seat"
              onScanned={() => notify(tap(seat.id))}
            />
          ) : null}

          {isMine && seat.status === "occupied" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={seat.breakCount >= MAX_BREAKS}
                onClick={() => notify(hold(seat.id))}
              >
                <PauseCircle className="size-4" />
                Hold seat ({BREAK_MINUTES}m)
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  notify(release(seat.id));
                  onOpenChange(false);
                }}
              >
                <Unlock className="size-4" />
                Release seat
              </Button>
            </div>
          ) : null}

          {!isMine && seat.status !== "available" ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={seat.reported}
              onClick={() => notify(report(seat.id))}
            >
              <AlertTriangle className="size-4" />
              {seat.reported ? "Already reported" : "Report seat as empty"}
            </Button>
          ) : null}

          {isAdmin && seat.status !== "available" ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                notify(forceRelease(seat.id));
                onOpenChange(false);
              }}
            >
              <Unlock className="size-4" />
              Force release (librarian override)
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
