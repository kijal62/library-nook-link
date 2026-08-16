import { Link, useNavigate } from "@tanstack/react-router";
import { Armchair, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmartSeat } from "@/lib/smartseat/store";

export function Navbar() {
  const { user, logout, resetDemo } = useSmartSeat();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Armchair className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Smart<span className="text-primary">Seat</span>
          </span>
        </Link>

        {user ? (
          <nav className="ml-2 hidden items-center gap-1 text-sm sm:flex">
            <Link
              to="/dashboard"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              Seat map
            </Link>
            {user.role === "admin" ? (
              <Link
                to="/admin"
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground" }}
              >
                Librarian
              </Link>
            ) : null}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right text-xs leading-tight sm:block">
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground capitalize">{user.role}</p>
              </div>
              <Button variant="ghost" size="icon" title="Reset demo data" onClick={resetDemo}>
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
