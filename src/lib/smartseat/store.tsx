import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clearSession, getStoredUser, login as apiLogin, setSession, signup as apiSignup } from "./api";
import {
  BREAK_MINUTES,
  FLOORS,
  MAX_BREAKS,
  type ActivityEntry,
  type Seat,
  type SeatStatus,
  type SessionRecord,
  type User,
} from "./types";



/**
 * Mock "backend" for the SeatSync prototype.
 * State lives in localStorage and syncs across tabs via the `storage` event,
 * which stands in for the Socket.io `seatUpdated` broadcast until the
 * Express + MongoDB backend is wired up.
 */

const STORAGE_KEY = "smartseat.state.v2";


type State = {
  seats: Seat[];
  sessions: SessionRecord[];
  activity: ActivityEntry[];
  currentUser: User | null;
};

export type ActionResult = { ok: boolean; message: string };

const uid = () => Math.random().toString(36).slice(2, 10);

function buildSeats(): Seat[] {
  const seats: Seat[] = [];
  for (const floor of FLOORS) {
    for (const row of floor.rows) {
      for (let c = 1; c <= floor.cols; c++) {
        seats.push({
          id: `${row}${c}`,
          floor: floor.id,
          zone: floor.zones[row] ?? floor.name,
          status: "available",
          occupiedBy: null,
          occupiedByName: null,
          occupiedAt: null,
          releaseAt: null,
          breakCount: 0,
          reported: false,
        });
      }
    }
  }
  return seats;
}

function seededState(): State {
  const seats = buildSeats();
  const demo: [string, SeatStatus, string, string][] = [
    ["A2", "occupied", "stu-anika", "Anika Rao"],
    ["A5", "occupied", "stu-vikram", "Vikram Shah"],
    ["B1", "on-break", "stu-neha", "Neha Gupta"],
    ["B7", "occupied", "stu-imran", "Imran Qureshi"],
    ["C3", "occupied", "stu-lena", "Lena Fischer"],
    ["C4", "on-break", "stu-arjun", "Arjun Mehta"],
    ["D6", "occupied", "stu-priya", "Priya Nair"],
    ["E2", "occupied", "stu-sam", "Sam Okoro"],
    ["E8", "on-break", "stu-ravi", "Ravi Kumar"],
    ["F1", "occupied", "stu-mei", "Mei Chen"],
    ["F5", "occupied", "stu-tom", "Tom Alvarez"],
    ["G2", "occupied", "stu-dia", "Dia Kapoor"],
    ["G7", "on-break", "stu-yuki", "Yuki Sato"],
    ["H4", "occupied", "stu-omar", "Omar Haddad"],
    ["I3", "occupied", "stu-zoe", "Zoe Bennett"],
  ];
  const now = Date.now();
  const sessions: SessionRecord[] = [];
  const activity: ActivityEntry[] = [];

  demo.forEach(([seatId, status, userId, name], i) => {
    const seat = seats.find((s) => s.id === seatId)!;
    const startedAt = new Date(now - (20 + i * 11) * 60_000);
    seat.status = status;
    seat.occupiedBy = userId;
    seat.occupiedByName = name;
    seat.occupiedAt = startedAt.toISOString();
    seat.breakCount = status === "on-break" ? 1 : 0;
    seat.releaseAt =
      status === "on-break" ? new Date(now + (6 + i * 3) * 60_000).toISOString() : null;
    sessions.push({
      id: uid(),
      userId,
      userName: name,
      seatId,
      startTime: startedAt.toISOString(),
      endTime: null,
      status: "active",
      breakHistory: status === "on-break" ? [{ start: new Date(now).toISOString(), end: null }] : [],
    });
    activity.push({
      id: uid(),
      at: startedAt.toISOString(),
      message: `${name} claimed seat ${seatId}`,
      seatId,
    });
  });

  seats.find((s) => s.id === "D6")!.reported = true;

  return {
    seats,
    sessions,
    activity: activity.sort((a, b) => b.at.localeCompare(a.at)),
    currentUser: null,
  };
}

function load(): State {
  if (typeof window === "undefined") return seededState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* ignore corrupt state */
  }
  const fresh = seededState();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    /* ignore */
  }
  return fresh;
}

function expireBreaks(state: State): State {
  const now = Date.now();
  let changed = false;
  const activity: ActivityEntry[] = [];
  const seats = state.seats.map((seat) => {
    if (seat.status !== "on-break" || !seat.releaseAt) return seat;
    if (new Date(seat.releaseAt).getTime() > now) return seat;
    changed = true;
    activity.push({
      id: uid(),
      at: new Date().toISOString(),
      message: `Break expired — seat ${seat.id} auto-released`,
      seatId: seat.id,
    });
    return {
      ...seat,
      status: "available" as SeatStatus,
      occupiedBy: null,
      occupiedByName: null,
      occupiedAt: null,
      releaseAt: null,
      breakCount: 0,
      reported: false,
    };
  });
  if (!changed) return state;

  const expiredSeatIds = state.seats
    .filter((s) => s.status === "on-break" && s.releaseAt && new Date(s.releaseAt).getTime() <= now)
    .map((s) => s.id);

  const sessions = state.sessions.map((s) =>
    s.status === "active" && expiredSeatIds.includes(s.seatId)
      ? { ...s, status: "expired" as const, endTime: new Date().toISOString() }
      : s,
  );

  const currentUser =
    state.currentUser && state.currentUser.currentSeat
      ? expiredSeatIds.includes(state.currentUser.currentSeat)
        ? { ...state.currentUser, currentSeat: null }
        : state.currentUser
      : state.currentUser;

  return { ...state, seats, sessions, currentUser, activity: [...activity, ...state.activity] };
}

type Ctx = {
  seats: Seat[];
  sessions: SessionRecord[];
  activity: ActivityEntry[];
  user: User | null;
  now: number;
  stats: { available: number; occupied: number; onBreak: number; total: number };
  mySeat: Seat | null;
  login: (email: string, password: string) => Promise<ActionResult>;
  signup: (email: string, password: string) => Promise<ActionResult>;
  logout: () => void;
  tap: (seatId: string) => ActionResult;
  hold: (seatId: string) => ActionResult;
  release: (seatId: string) => ActionResult;
  report: (seatId: string) => ActionResult;
  forceRelease: (seatId: string) => ActionResult;
  resetDemo: () => void;
};

const SeatSyncContext = createContext<Ctx | null>(null);

export function SeatSyncProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => seededState());
  const [now, setNow] = useState(() => Date.now());
  const busy = useRef(false);

  // Hydrate from storage on the client only (avoids SSR mismatch).
  useEffect(() => {
    const stored = getStoredUser();
    setState({ ...load(), currentUser: stored });
  }, []);

  const commit = useCallback((updater: (prev: State) => State) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Break-timer ticker + auto release (stands in for a backend cron job).
  useEffect(() => {
    const t = window.setInterval(() => {
      setNow(Date.now());
      commit((prev) => expireBreaks(prev));
    }, 1000);
    return () => window.clearInterval(t);
  }, [commit]);

  // "Socket.io" substitute: other tabs push updates through localStorage.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue) as State;
        setState((prev) => ({ ...incoming, currentUser: prev.currentUser }));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const guard = useCallback((run: () => ActionResult): ActionResult => {
    // Double-tap protection: ignore a second action while one is in flight.
    if (busy.current) return { ok: false, message: "Please wait — previous action is processing." };
    busy.current = true;
    try {
      return run();
    } finally {
      window.setTimeout(() => {
        busy.current = false;
      }, 400);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      if (!email.includes("@") || password.length < 4) {
        return { ok: false, message: "Enter a valid email and a password of 4+ characters." };
      }
      try {
        const { token, user } = await apiLogin(email, password);
        commit((prev) => {
          const held = prev.seats.find((s) => s.occupiedBy === user.id && s.status !== "available");
          return { ...prev, currentUser: { ...user, currentSeat: held?.id ?? null } };
        });
        return { ok: true, message: `Welcome back, ${user.name}` };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Sign in failed." };
      }
    },
    [commit],
  );

  const signup = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      if (!email.includes("@") || password.length < 4) {
        return { ok: false, message: "Enter a valid email and a password of 4+ characters." };
      }
      try {
        const { token, user } = await apiSignup(email, password);
        setSession(token, user);
        commit((prev) => ({ ...prev, currentUser: { ...user, currentSeat: null } }));
        return { ok: true, message: `Account created — welcome, ${user.name}` };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Sign up failed." };
      }
    },
    [commit],
  );

  const logout = useCallback(() => {
    clearSession();
    commit((prev) => ({ ...prev, currentUser: null }));
  }, [commit]);

  const tap = useCallback(
    (seatId: string): ActionResult =>
      guard(() => {
        const user = state.currentUser;
        if (!user) return { ok: false, message: "Sign in first." };
        const seat = state.seats.find((s) => s.id === seatId);
        if (!seat) return { ok: false, message: "Unknown seat tag." };

        if (seat.status === "on-break" && seat.occupiedBy === user.id) {
          commit((prev) => {
            const seats = prev.seats.map((s) =>
              s.id === seatId ? { ...s, status: "occupied" as SeatStatus, releaseAt: null } : s,
            );
            const sessions = prev.sessions.map((s) =>
              s.seatId === seatId && s.status === "active"
                ? {
                    ...s,
                    breakHistory: s.breakHistory.map((b, i) =>
                      i === s.breakHistory.length - 1 && !b.end
                        ? { ...b, end: new Date().toISOString() }
                        : b,
                    ),
                  }
                : s,
            );
            return {
              ...prev,
              seats,
              sessions,
              activity: [
                {
                  id: uid(),
                  at: new Date().toISOString(),
                  message: `${user.name} verified return at ${seatId}`,
                  seatId,
                },
                ...prev.activity,
              ],
            };
          });
          return { ok: true, message: `Return verified — ${seatId} is yours again.` };
        }

        if (seat.status !== "available") {
          return seat.occupiedBy === user.id
            ? { ok: false, message: `You already hold ${seatId}.` }
            : { ok: false, message: `Seat ${seatId} is currently ${seat.status}.` };
        }

        const existing = state.seats.find((s) => s.occupiedBy === user.id);
        if (existing) {
          return {
            ok: false,
            message: `One active seat per student — release ${existing.id} first.`,
          };
        }

        const startedAt = new Date().toISOString();
        commit((prev) => ({
          ...prev,
          seats: prev.seats.map((s) =>
            s.id === seatId
              ? {
                  ...s,
                  status: "occupied" as SeatStatus,
                  occupiedBy: user.id,
                  occupiedByName: user.name,
                  occupiedAt: startedAt,
                  releaseAt: null,
                  breakCount: 0,
                  reported: false,
                }
              : s,
          ),
          sessions: [
            {
              id: uid(),
              userId: user.id,
              userName: user.name,
              seatId,
              startTime: startedAt,
              endTime: null,
              status: "active" as const,
              breakHistory: [],
            },
            ...prev.sessions,
          ],
          currentUser: prev.currentUser ? { ...prev.currentUser, currentSeat: seatId } : null,
          activity: [
            { id: uid(), at: startedAt, message: `${user.name} claimed seat ${seatId}`, seatId },
            ...prev.activity,
          ],
        }));
        return { ok: true, message: `Seat ${seatId} claimed.` };
      }),
    [commit, guard, state],
  );

  const hold = useCallback(
    (seatId: string): ActionResult =>
      guard(() => {
        const user = state.currentUser;
        const seat = state.seats.find((s) => s.id === seatId);
        if (!user || !seat) return { ok: false, message: "Seat unavailable." };
        if (seat.occupiedBy !== user.id || seat.status !== "occupied") {
          return { ok: false, message: "You can only hold a seat you are occupying." };
        }
        if (seat.breakCount >= MAX_BREAKS) {
          return { ok: false, message: `Break limit reached (${MAX_BREAKS} per session).` };
        }
        const releaseAt = new Date(Date.now() + BREAK_MINUTES * 60_000).toISOString();
        commit((prev) => ({
          ...prev,
          seats: prev.seats.map((s) =>
            s.id === seatId
              ? {
                  ...s,
                  status: "on-break" as SeatStatus,
                  releaseAt,
                  breakCount: s.breakCount + 1,
                }
              : s,
          ),
          sessions: prev.sessions.map((s) =>
            s.seatId === seatId && s.status === "active"
              ? {
                  ...s,
                  breakHistory: [...s.breakHistory, { start: new Date().toISOString(), end: null }],
                }
              : s,
          ),
          activity: [
            {
              id: uid(),
              at: new Date().toISOString(),
              message: `${user.name} put ${seatId} on break (${BREAK_MINUTES}m)`,
              seatId,
            },
            ...prev.activity,
          ],
        }));
        return { ok: true, message: `${seatId} held for ${BREAK_MINUTES} minutes.` };
      }),
    [commit, guard, state],
  );

  const freeSeat = useCallback(
    (seatId: string, message: string, status: SessionRecord["status"]) => {
      commit((prev) => ({
        ...prev,
        seats: prev.seats.map((s) =>
          s.id === seatId
            ? {
                ...s,
                status: "available" as SeatStatus,
                occupiedBy: null,
                occupiedByName: null,
                occupiedAt: null,
                releaseAt: null,
                breakCount: 0,
                reported: false,
              }
            : s,
        ),
        sessions: prev.sessions.map((s) =>
          s.seatId === seatId && s.status === "active"
            ? { ...s, status, endTime: new Date().toISOString() }
            : s,
        ),
        currentUser:
          prev.currentUser && prev.currentUser.currentSeat === seatId
            ? { ...prev.currentUser, currentSeat: null }
            : prev.currentUser,
        activity: [
          { id: uid(), at: new Date().toISOString(), message, seatId },
          ...prev.activity,
        ],
      }));
    },
    [commit],
  );

  const release = useCallback(
    (seatId: string): ActionResult =>
      guard(() => {
        const user = state.currentUser;
        const seat = state.seats.find((s) => s.id === seatId);
        if (!user || !seat) return { ok: false, message: "Seat unavailable." };
        if (seat.occupiedBy !== user.id) {
          return { ok: false, message: "This is not your seat." };
        }
        freeSeat(seatId, `${user.name} released seat ${seatId}`, "ended");
        return { ok: true, message: `Seat ${seatId} released.` };
      }),
    [freeSeat, guard, state],
  );

  const forceRelease = useCallback(
    (seatId: string): ActionResult =>
      guard(() => {
        const user = state.currentUser;
        if (user?.role !== "admin") return { ok: false, message: "Librarian access required." };
        freeSeat(seatId, `Librarian force-released seat ${seatId}`, "force-released");
        return { ok: true, message: `Seat ${seatId} force-released.` };
      }),
    [freeSeat, guard, state],
  );

  const report = useCallback(
    (seatId: string): ActionResult =>
      guard(() => {
        const seat = state.seats.find((s) => s.id === seatId);
        if (!seat || seat.status === "available") {
          return { ok: false, message: "Only occupied seats can be reported." };
        }
        if (seat.reported) return { ok: false, message: "Seat already reported." };
        commit((prev) => ({
          ...prev,
          seats: prev.seats.map((s) => (s.id === seatId ? { ...s, reported: true } : s)),
          activity: [
            {
              id: uid(),
              at: new Date().toISOString(),
              message: `Seat ${seatId} reported as occupied-but-empty`,
              seatId,
            },
            ...prev.activity,
          ],
        }));
        return { ok: true, message: "Reported — a librarian will verify shortly." };
      }),
    [commit, guard, state],
  );

  const resetDemo = useCallback(() => {
    const fresh = seededState();
    commit((prev) => ({ ...fresh, currentUser: prev.currentUser }));
  }, [commit]);

  const value = useMemo<Ctx>(() => {
    const stats = {
      available: state.seats.filter((s) => s.status === "available").length,
      occupied: state.seats.filter((s) => s.status === "occupied").length,
      onBreak: state.seats.filter((s) => s.status === "on-break").length,
      total: state.seats.length,
    };
    const mySeat = state.currentUser
      ? (state.seats.find((s) => s.occupiedBy === state.currentUser!.id) ?? null)
      : null;
    return {
      seats: state.seats,
      sessions: state.sessions,
      activity: state.activity,
      user: state.currentUser,
      now,
      stats,
      mySeat,
      login,
      signup,
      logout,
      tap,
      hold,
      release,
      report,
      forceRelease,
      resetDemo,
    };
  }, [state, now, login, signup, logout, tap, hold, release, report, forceRelease, resetDemo]);

  return <SeatSyncContext.Provider value={value}>{children}</SeatSyncContext.Provider>;
}

export function useSeatSync() {
  const ctx = useContext(SeatSyncContext);
  if (!ctx) throw new Error("useSeatSync must be used inside SeatSyncProvider");
  return ctx;
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
