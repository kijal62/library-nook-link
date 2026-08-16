export type SeatStatus = "available" | "occupied" | "on-break";

export type Seat = {
  id: string;
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
