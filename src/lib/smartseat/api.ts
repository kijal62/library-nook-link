import type { User } from "./types";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

const API_BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:5000";

function tokenKey() {
  return "seatsync_token";
}

function userKey() {
  return "seatsync_user";
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore parse error */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function setSession(token: string, user: ApiUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tokenKey(), token);
  window.localStorage.setItem(userKey(), JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(tokenKey());
  window.localStorage.removeItem(userKey());
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(tokenKey());
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(userKey());
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
