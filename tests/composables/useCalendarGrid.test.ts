// tests/composables/useCalendarGrid.test.ts
import { describe, it, expect } from "vitest";
import { monthGridWeeks, weekDates, groupEventsByStartDate } from "@/composables/useCalendarGrid";
import type { GCalEvent } from "@/lib/gcal";

describe("monthGridWeeks", () => {
  it("June 2026 starts Monday-first with leading blanks", () => {
    const weeks = monthGridWeeks("2026-06"); // 2026-06-01 is a Monday
    expect(weeks[0]![0]).toBe("2026-06-01");
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks.flat()).toHaveLength(weeks.length * 7);
  });
  it("pads leading blanks for a mid-week first day", () => {
    const weeks = monthGridWeeks("2026-07"); // 2026-07-01 is a Wednesday => index 2
    expect(weeks[0]!.slice(0, 2)).toEqual([null, null]);
    expect(weeks[0]![2]).toBe("2026-07-01");
  });
});

describe("weekDates", () => {
  it("returns Monday..Sunday for a date mid-week", () => {
    const days = weekDates("2026-06-17"); // Wednesday
    expect(days).toEqual([
      "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18",
      "2026-06-19", "2026-06-20", "2026-06-21",
    ]);
  });
});

describe("groupEventsByStartDate", () => {
  it("buckets events by their start day", () => {
    const evs: GCalEvent[] = [
      { id: "a", start: { dateTime: "2026-06-15T09:00:00+07:00" }, end: { dateTime: "2026-06-15T10:00:00+07:00" } },
      { id: "b", start: { date: "2026-06-15" }, end: { date: "2026-06-16" } },
      { id: "c", start: { dateTime: "2026-06-16T09:00:00+07:00" }, end: { dateTime: "2026-06-16T10:00:00+07:00" } },
    ];
    const map = groupEventsByStartDate(evs);
    expect(map.get("2026-06-15")!.map((e) => e.id)).toEqual(["a", "b"]);
    expect(map.get("2026-06-16")!.map((e) => e.id)).toEqual(["c"]);
  });
});
