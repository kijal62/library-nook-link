export type SeatStatus = "available" | "occupied" | "on-break";

export type FloorLayout = "rows" | "pods" | "arc";

export type FloorConfig = {
  id: number;
  name: string;
  tagline: string;
  layout: FloorLayout;
  rows: string[];
  zones: Record<string, string>;
  cols: number;
};

export const FLOORS: FloorConfig[] = [
  {
    id: 1,
    name: "Reading Hall",
    tagline: "Open desks, long rows",
    layout: "rows",
    rows: ["A", "B", "C"],
    zones: { A: "Window Row", B: "Reading Area", C: "Reading Area" },
    cols: 8,
  },
  {
    id: 2,
    name: "Silent Wing",
    tagline: "Four-seat pods",
    layout: "pods",
    rows: ["D", "E", "F"],
    zones: { D: "Silent Zone", E: "Silent Zone", F: "Carrels" },
    cols: 8,
  },
  {
    id: 3,
    name: "Group Studio",
    tagline: "Curved collaboration arcs",
    layout: "arc",
    rows: ["G", "H", "I"],
    zones: { G: "Group Study", H: "Group Study", I: "Reference Wing" },
    cols: 8,
  },
];

export const floorOf = (id: number) => FLOORS.find((f) => f.id === id) ?? FLOORS[0];

export type Seat = {
  id: string;
  floor: number;
  zone: string;
  status: SeatStatus;
  occupiedBy: string | null;
  occupiedByName: string | null;
  occupiedAt: string | null;
  releaseAt: string | null;
  breakCount: number;
  reported: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  currentSeat: string | null;
};

export type ActivityEntry = {
  id: string;
  at: string;
  message: string;
  seatId: string | null;
};

export type SessionRecord = {
  id: string;
  userId: string;
  userName: string;
  seatId: string;
  startTime: string;
  endTime: string | null;
  status: "active" | "ended" | "expired" | "force-released";
  breakHistory: { start: string; end: string | null }[];
};

export const BREAK_MINUTES = 30;
export const MAX_BREAKS = 2;
