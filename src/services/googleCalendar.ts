// src/services/googleCalendar.ts
import type { GCalEvent } from "@/lib/gcal";

const BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export class CalendarAuthError extends Error {}
export class CalendarApiError extends Error {}

async function request(token: string, url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) throw new CalendarAuthError("Token Google Calendar hết hạn");
  if (!res.ok) throw new CalendarApiError(`Google Calendar lỗi ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

export async function listEvents(
  token: string,
  timeMinISO: string,
  timeMaxISO: string,
): Promise<GCalEvent[]> {
  const u = new URL(BASE);
  u.searchParams.set("timeMin", timeMinISO);
  u.searchParams.set("timeMax", timeMaxISO);
  u.searchParams.set("singleEvents", "true");
  u.searchParams.set("orderBy", "startTime");
  u.searchParams.set("maxResults", "250");
  const data = (await request(token, u.toString())) as { items?: GCalEvent[] };
  return data.items ?? [];
}

export function createEvent(token: string, payload: Partial<GCalEvent>): Promise<GCalEvent> {
  return request(token, BASE, { method: "POST", body: JSON.stringify(payload) }) as Promise<GCalEvent>;
}

export function updateEvent(token: string, id: string, payload: Partial<GCalEvent>): Promise<GCalEvent> {
  return request(token, `${BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<GCalEvent>;
}

export async function deleteEvent(token: string, id: string): Promise<void> {
  await request(token, `${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
