import { useEffect, useMemo, useState } from "react";
import { Nfc, QrCode, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Deterministic pseudo-QR pattern derived from the seat id (prototype visual). */
function pattern(seatId: string) {
  let h = 0;
  for (let i = 0; i < seatId.length; i++) h = (h * 31 + seatId.charCodeAt(i)) >>> 0;
  return Array.from({ length: 49 }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return ((h >> (i % 13)) & 1) === 1;
  });
}

export function ScanSimulator({
  seatId,
  label,
  onScanned,
}: {
  seatId: string;
  label: string;
  onScanned: () => void;
}) {
  const [scanning, setScanning] = useState<null | "qr" | "nfc">(null);
  const cells = useMemo(() => pattern(seatId), [seatId]);

  useEffect(() => {
    if (!scanning) return;
    const t = window.setTimeout(() => {
      setScanning(null);
      onScanned();
    }, 900);
    return () => window.clearTimeout(t);
  }, [scanning, onScanned]);

  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0 overflow-hidden rounded-lg bg-foreground p-2">
          <div className="grid grid-cols-7 gap-[2px]">
            {cells.map((on, i) => (
              <span
                key={i}
                className={`size-2 rounded-[1px] ${on ? "bg-background" : "bg-transparent"}`}
              />
            ))}
          </div>
          {scanning ? (
            <span className="absolute inset-x-0 top-0 h-0.5 animate-bounce bg-primary" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <QrCode className="size-4 text-primary" /> Tag {seatId}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Physical verification required — the tag lives on the desk, so this action can't be
            performed remotely.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="flex-1"
          disabled={scanning !== null}
          onClick={() => setScanning("qr")}
        >
          <ScanLine className="size-4" />
          {scanning === "qr" ? "Scanning…" : label}
        </Button>
        <Button
          variant="outline"
          disabled={scanning !== null}
          onClick={() => setScanning("nfc")}
        >
          <Nfc className="size-4" />
          {scanning === "nfc" ? "Reading tag…" : "Simulate NFC"}
        </Button>
      </div>
    </div>
  );
}
