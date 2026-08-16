import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Armchair, MoveRight, Nfc, QrCode, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookIntro } from "@/components/smartseat/BookIntro";
import { useSmartSeat } from "@/lib/smartseat/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartSeat — Every Library Seat, Accounted For" },
      {
        name: "description",
        content:
          "SmartSeat turns the library seat ledger into a live map: QR/NFC seat claiming, 30-minute break holds, and automatic release of abandoned seats.",
      },
      { property: "og:title", content: "SmartSeat — Every Library Seat, Accounted For" },
      {
        property: "og:description",
        content:
          "A live library seat map you can trust. Claim a seat by tapping its desk tag, hold it through a break, and free it automatically.",
      },
    ],
  }),
  component: LandingPage,
});

const chapters = [
  {
    index: "Chapter I",
    icon: QrCode,
    title: "Tap the desk tag",
    text: "Every chair carries its own QR/NFC tag. A seat only turns occupied when a real person is standing at it.",
  },
  {
    index: "Chapter II",
    icon: Timer,
    title: "Hold your page",
    text: "Stepping out for chai? Hold the seat for 30 minutes. The map shows it as on-break, not free, not hoarded.",
  },
  {
    index: "Chapter III",
    icon: ShieldCheck,
    title: "The ledger closes itself",
    text: "Miss your return window and SmartSeat releases the seat automatically, so the next reader walks straight in.",
  },
];

function LandingPage() {
  const [introDone, setIntroDone] = useState(false);
  const { seats, stats, user } = useSmartSeat();
  const preview = seats.slice(0, 24);

  return (
    <>
      {!introDone ? <BookIntro onDone={() => setIntroDone(true)} /> : null}

      <div className={introDone ? "site-reveal" : "opacity-0"}>
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <span className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Armchair className="size-5" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                Smart<span className="text-primary">Seat</span>
              </span>
            </span>
            <nav className="ml-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to={user ? "/dashboard" : "/login"}>
                  {user ? "Open seat map" : "Sign in"}
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to={user ? "/dashboard" : "/login"}>
                  Live map <MoveRight className="size-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero — the open spread */}
          <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3 py-1 font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                <Nfc className="size-3.5 text-primary" /> Vol. one · Central Library
              </span>
              <h1 className="font-display mt-6 text-4xl leading-[1.05] font-semibold sm:text-6xl">
                The seat ledger,
                <br />
                <span className="text-primary">rewritten every second.</span>
              </h1>
              <p className="mt-5 max-w-xl text-muted-foreground">
                Paper registers lie. Bags on chairs lie. SmartSeat binds every desk to a physical
                tag, so the map in your pocket matches the room you walk into.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={user ? "/dashboard" : "/login"}>
                    Find me a seat <MoveRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/login">Librarian sign in</Link>
                </Button>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
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
            </div>

            {/* Seat map preview styled as a page pinned to the board */}
            <div className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-glow">
              <span className="absolute -top-2 right-10 h-10 w-4 rounded-b-sm bg-occupied" />
              <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                Live spread · reading hall
              </p>
              <div className="mt-4 grid grid-cols-6 gap-2">
                {preview.map((seat) => (
                  <div
                    key={seat.id}
                    className={`seat-tile flex aspect-square items-center justify-center rounded-md border text-[10px] ${
                      seat.status === "available"
                        ? "border-available/40 bg-available-soft/40 text-available"
                        : seat.status === "on-break"
                          ? "border-onbreak/40 bg-onbreak-soft/40 text-onbreak"
                          : "border-occupied/40 bg-occupied-soft/40 text-occupied"
                    }`}
                  >
                    {seat.id}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Green is genuinely empty. Amber is someone mid-break with minutes left on the clock.
              </p>
            </div>
          </section>

          {/* Chapters */}
          <section className="border-y border-border/70 bg-card/40 py-16">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="font-display text-3xl font-semibold">How a seat gets claimed</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {chapters.map((c) => (
                  <article
                    key={c.title}
                    className="rounded-xl border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
                  >
                    <p className="font-mono text-[10px] tracking-widest uppercase text-primary">
                      {c.index}
                    </p>
                    <c.icon className="mt-4 size-6 text-primary" />
                    <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Closing band */}
          <section className="mx-auto max-w-3xl px-4 py-20 text-center">
            <p className="font-display text-2xl text-primary">Close the book on seat hoarding.</p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
              One student, one seat, honestly tracked.
            </h2>
            <p className="mx-auto mt-4 max-w-prose text-muted-foreground">
              Sign in with your college email to see the live map, claim a desk by tapping its tag,
              and keep your spot during short breaks.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link to={user ? "/dashboard" : "/login"}>
                Enter the reading room <MoveRight className="size-4" />
              </Link>
            </Button>
          </section>
        </main>

        <footer className="border-t border-border/70 py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 text-xs text-muted-foreground">
            <p>SmartSeat · Smart Library Seat Management</p>
            <p className="font-mono">Prototype · demo data only</p>
          </div>
        </footer>
      </div>
    </>
  );
}
