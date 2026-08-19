import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MoveRight, Nfc, QrCode, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookIntro } from "@/components/smartseat/BookIntro";
import { useSeatSync } from "@/lib/smartseat/store";
import { FLOORS } from "@/lib/smartseat/types";
import mark from "@/assets/seatsync-mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SeatSync — Every Library Seat, Accounted For" },
      {
        name: "description",
        content:
          "SeatSync turns the library seat ledger into a live map: QR/NFC seat claiming, 30-minute break holds, and automatic release of abandoned seats.",
      },
      { property: "og:title", content: "SeatSync — Every Library Seat, Accounted For" },
      {
        property: "og:description",
        content:
          "A live library seat map you can trust. Claim a seat by tapping its desk tag, hold it through a break, and free it automatically.",
      },
    ],
  }),
  component: LandingPage,
});

const steps = [
  { icon: QrCode, label: "Tap the desk tag" },
  { icon: Timer, label: "Hold through breaks" },
  { icon: ShieldCheck, label: "Auto-release" },
];

function LandingPage() {
  const [introDone, setIntroDone] = useState(false);
  const { seats, stats, user } = useSeatSync();

  return (
    <>
      {!introDone ? <BookIntro onDone={() => setIntroDone(true)} /> : null}

      <div className={introDone ? "site-reveal" : "opacity-0"}>
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={mark} alt="SeatSync" width={816} height={816} className="size-9" />
              <span className="font-display text-lg font-semibold tracking-tight">
                <span className="text-primary">Seat</span>Sync
              </span>
            </Link>
            <nav className="ml-auto flex items-center gap-2">
              <Button asChild size="sm">
                <Link to={user ? "/dashboard" : "/login"} search={{ floor: 1 }}>
                  {user ? "Live map" : "Sign in"} <MoveRight className="size-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="mx-auto max-w-4xl px-4 py-20 text-center lg:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3 py-1 font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
              <Nfc className="size-3.5 text-primary" /> Central Library
            </span>
            <h1
              className="mt-6 text-5xl leading-[1.02] font-semibold sm:text-7xl"
              style={{ fontFamily: '"Bricolage Grotesk", ui-sans-serif, system-ui, sans-serif' }}
            >
              The seat ledger,
              <br />
              <span className="text-primary">live.</span>
            </h1>

            <dl className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { label: "Available", value: stats.available, tone: "text-available" },
                { label: "Occupied", value: stats.occupied, tone: "text-occupied" },
                { label: "On break", value: stats.onBreak, tone: "text-onbreak" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/70 bg-card p-4">
                  <dt className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className={`font-display mt-1 text-2xl font-semibold ${s.tone}`}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Floor chooser */}
          <section className="border-y border-border/70 bg-card/40 py-14">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="font-display text-2xl font-semibold">Choose a floor</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {FLOORS.map((f) => {
                  const fs = seats.filter((s) => s.floor === f.id);
                  const free = fs.filter((s) => s.status === "available").length;
                  return (
                    <Link
                      key={f.id}
                      to={user ? "/dashboard" : "/login"}
                      search={{ floor: f.id }}
                      className="group rounded-2xl border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
                    >
                      <p className="font-mono text-[10px] tracking-widest uppercase text-primary">
                        Floor {f.id}
                      </p>
                      <h3 className="font-display mt-2 text-xl font-semibold">{f.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.tagline}</p>

                      <div className="mt-5 flex items-end justify-between">
                        <p className="font-display text-3xl font-semibold text-available">
                          {free}
                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            / {fs.length} free
                          </span>
                        </p>
                        <MoveRight className="size-5 text-primary transition-transform group-hover:translate-x-1" />
                      </div>

                      <div className="mt-4 flex gap-1">
                        {fs.slice(0, 24).map((s) => (
                          <span
                            key={s.id}
                            className={`h-1.5 flex-1 rounded-full ${
                              s.status === "available"
                                ? "bg-available/70"
                                : s.status === "on-break"
                                  ? "bg-onbreak/70"
                                  : "bg-occupied/70"
                            }`}
                          />
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Steps */}
          <section className="mx-auto max-w-4xl px-4 py-16">
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-5"
                >
                  <s.icon className="size-5 text-primary" />
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-border/70 py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 text-xs text-muted-foreground">
            <p>SeatSync</p>
            <p className="font-mono">Prototype</p>
          </div>
        </footer>
      </div>
    </>
  );
}
