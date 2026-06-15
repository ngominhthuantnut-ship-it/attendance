// src/composables/useCalendarGrid.ts
import type { DayKey } from "@/types";
import { daysInMonth, dayKeyOf, addDays } from "@/lib/dates";
import type { GCalEvent } from "@/lib/gcal";

const DOW_INDEX: Record<DayKey, number> = {
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
};

export function monthGridWeeks(ym: string): (string | null)[][] {
  const days = daysInMonth(ym);
  if (days.length === 0) return [];
  const lead = DOW_INDEX[dayKeyOf(days[0]!)];
  const cells: (string | null)[] = [...Array(lead).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function weekDates(dateISO: string): string[] {
  const offset = DOW_INDEX[dayKeyOf(dateISO)];
  const monday = addDays(dateISO, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function startDateKey(e: GCalEvent): string {
  return e.start.date ?? (e.start.dateTime ?? "").slice(0, 10);
}

export function groupEventsByStartDate(events: GCalEvent[]): Map<string, GCalEvent[]> {
  const map = new Map<string, GCalEvent[]>();
  for (const e of events) {
    const key = startDateKey(e);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(e);
    else map.set(key, [e]);
  }
  return map;
}
