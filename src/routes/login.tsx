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
  const { login, signup, user } = useSeatSync();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: user.role === "admin" ? "/admin" : "/dashboard" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = mode === "signin" ? await login(email.trim(), password) : await signup(email.trim(), password);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
    setSubmitting(false);
  };

  const quickLogin = async (nextEmail: string) => {
    setEmail(nextEmail);
    setPassword("demo");
    const result = await login(nextEmail, "demo");
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const quickSignup = async (nextEmail: string) => {
    setEmail(nextEmail);
    setPassword("demo");
    const result = await signup(nextEmail, "demo");
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };


  return (
    <main className="relative grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden flex-col justify-between bg-secondary/40 px-10 py-12 lg:flex">
        <div className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Armchair className="size-6 text-primary" />
          SeatSync
        </div>
        <div>
          <h1 className="font-display max-w-md text-4xl leading-tight font-semibold">
            Every empty seat, <span className="text-primary">actually available</span>.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Claim desks by scanning their QR/NFC tag, hold your spot for 30 minutes, and never guess if a seat is free.
          </p>
          <ul className="mt-8 grid gap-4">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <div className="rounded-lg border border-border/70 bg-card p-2">
                  <h.icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SeatSync</p>
      </section>

      <section className="flex flex-col justify-center bg-background px-6 py-12 sm:px-12 lg:px-16">
        <div className="lg:hidden">
          <div className="mb-8 inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            <Armchair className="size-6 text-primary" />
            SeatSync
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Enter your college credentials to continue."
              : "Register with your college email to get started."}
          </p>
          <form className="mt-8 space-y-4" onSubmit={submit}>
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
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/70 pt-4">
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "New here?" : "Already registered?"}
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </Button>
          </div>

          <div className="mt-6 border-t border-border/70 pt-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Quick-fill demo emails</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => quickLogin("kiran@college.edu")}>
                Student
              </Button>
              <Button variant="secondary" size="sm" onClick={() => quickLogin("admin@college.edu")}>
                Librarian
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              No backend needed — these demo accounts sign in instantly.
            </p>

          </div>
        </div>
      </section>
    </main>
  );
}
