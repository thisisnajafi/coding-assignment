import type { Status, Ticket, User } from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function detailToMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : String(d)))
      .join("، ");
  }
  return null;
}

export async function request<T>(path: string, user: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (user) headers.set("X-User", user);
  if (init.body) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "ارتباط با سرور برقرار نشد");
  }
  if (!res.ok) {
    let msg = `خطای سرور (${res.status})`;
    try {
      const data = await res.json();
      msg = detailToMessage(data?.detail) ?? msg;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Accepts either a bare array or a wrapped list like {items: [...]} / {tickets: [...]}. */
function unwrapList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const k of keys) {
      const v = (data as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

export const api = {
  users: async () => unwrapList<User>(await request("/api/users", null), ["users", "items"]),
  me: (user: string) => request<User>("/api/me", user),
  listTickets: async (user: string) =>
    unwrapList<Ticket>(await request("/api/tickets", user), ["tickets", "items"]),
  getTicket: (user: string, id: number) => request<Ticket>(`/api/tickets/${id}`, user),
  createTicket: (user: string, data: { title: string; body: string }) =>
    request<Ticket>("/api/tickets", user, { method: "POST", body: JSON.stringify(data) }),
  setStatus: (user: string, id: number, status: Status) =>
    request<Ticket>(`/api/tickets/${id}/status`, user, { method: "PATCH", body: JSON.stringify({ status }) }),
  reply: (user: string, id: number, text: string) =>
    request<Ticket>(`/api/tickets/${id}/reply`, user, { method: "POST", body: JSON.stringify({ reply: text }) }),
  regenerate: (user: string, id: number, model: string) =>
    request<Ticket>(`/api/tickets/${id}/regenerate`, user, { method: "POST", body: JSON.stringify({ model }) }),
  models: async (user: string) => {
    const data = await request<unknown>("/api/ai/models", user);
    const list = unwrapList<string | { id?: string; name?: string }>(data, ["models", "items"]);
    const ids = list.map((m) => (typeof m === "string" ? m : m.id || m.name || "")).filter(Boolean);
    const def =
      data && typeof data === "object" && !Array.isArray(data) && typeof (data as { default?: unknown }).default === "string"
        ? ((data as { default: string }).default)
        : undefined;
    return { models: ids, default: def };
  },
};
