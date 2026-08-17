import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Armchair, Nfc, ShieldCheck, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSeatSync } from "@/lib/smartseat/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SeatSync" },
      {
        name: "description",
        content:
          "Sign in to SeatSync to see live library seat availability, claim seats by scanning their QR/NFC tag, and hold your seat during short breaks.",
      },
      { property: "og:title", content: "Sign in — SeatSync" },
      {
        property: "og:description",
        content:
          "Real-time library seat management: physical QR/NFC seat claiming, 30-minute break holds, and automatic release of unused seats.",
      },
    ],
  }),
  component: LoginPage,
});

const highlights = [
  { icon: Nfc, title: "Physical verification", text: "Seats are claimed by scanning the desk tag." },
  { icon: Timer, title: "30-minute holds", text: "Step out briefly without losing your spot." },
  { icon: ShieldCheck, title: "No seat hoarding", text: "One active seat per student, always." },
];

function LoginPage() {
  const { login, user } = useSeatSync();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: user.role === "admin" ? "/admin" : "/dashboard" });
  }, [user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = login(email.trim(), password);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
    setSubmitting(false);
  };

  const quickFill = (nextEmail: string) => {
    setEmail(nextEmail);
    setPassword("library");
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-12 lg:grid-cols-2">
      <section>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          <Armchair className="size-3.5 text-primary" /> Live seat map · Central Library
        </span>
        <h1 className="font-display mt-6 text-4xl leading-tight font-semibold sm:text-5xl">
          Every empty seat, <span className="text-primary">actually available</span>.
        </h1>
        <p className="mt-4 max-w-lg text-muted-foreground">
          SeatSync links each physical desk to a QR/NFC tag, so a seat is only occupied when someone
          is really sitting there. Take a break, keep your seat for 30 minutes, and the system frees
          it automatically if you don't come back.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {highlights.map((h) => (
            <li key={h.title} className="rounded-xl border border-border/70 bg-card p-4">
              <h.icon className="size-5 text-primary" />
              <p className="mt-2 text-sm font-medium">{h.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{h.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-glow sm:p-8">
        <h2 className="text-xl font-semibold">Sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your college email. Any password of 4+ characters works in this prototype.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="email">College email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="anika.rao@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 border-t border-border/70 pt-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Demo accounts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => quickFill("kiran@college.edu")}>
              Student
            </Button>
            <Button variant="secondary" size="sm" onClick={() => quickFill("admin@college.edu")}>
              Librarian
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Any email starting with “admin” gets the librarian dashboard.
          </p>
        </div>
      </section>
    </main>
  );
}
