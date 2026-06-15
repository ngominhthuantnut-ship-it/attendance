import { describe, it, expect } from "vitest";
import { expandSchedule } from "@/composables/useScheduleCompute";
import type { Class } from "@/types";

const baseClass: Class = {
  id: "c1",
  name: "Toán 8",
  startDate: "2026-06-01", // Monday
  endDate: "2026-06-30",
  weeklySchedule: {
    mon: { start: "18:00", end: "19:30" },
    wed: { start: "19:00", end: "20:00" },
    fri: { start: "18:00", end: "19:30" },
  },
  rateHistory: [{ effectiveFrom: "2026-06-01", rate: 150_000 }],
  excludedDates: [],
  addedDates: [],
  status: "active",
};

describe("expandSchedule — weekly pattern", () => {
  it("expands T2/T4/T6 sessions across the month", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-01",
      to: "2026-06-30",
    });
    expect(sessions.length).toBe(13);
    expect(sessions[0]).toMatchObject({
      date: "2026-06-01",
      dayOfWeek: 1,
      start: "18:00",
      end: "19:30",
      source: "weekly",
    });
    expect(sessions.at(-1)).toMatchObject({ date: "2026-06-29" });
  });

  it("sessions are sorted ascending by date", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-01",
      to: "2026-06-30",
    });
    for (let i = 1; i < sessions.length; i++) {
      expect(sessions[i]!.date >= sessions[i - 1]!.date).toBe(true);
    }
  });
});
