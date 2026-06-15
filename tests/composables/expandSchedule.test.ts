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

describe("expandSchedule — excludedDates", () => {
  it("skips dates listed in excludedDates", () => {
    const cls = { ...baseClass, excludedDates: ["2026-06-03", "2026-06-15"] };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    expect(sessions.find((s) => s.date === "2026-06-03")).toBeUndefined();
    expect(sessions.find((s) => s.date === "2026-06-15")).toBeUndefined();
    expect(sessions.length).toBe(11);
  });
});

describe("expandSchedule — addedDates override", () => {
  it("adds dates not in weekly pattern", () => {
    const cls = {
      ...baseClass,
      addedDates: [{ date: "2026-06-04", start: "17:00", end: "18:30" }], // Thursday
    };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    const added = sessions.find((s) => s.date === "2026-06-04");
    expect(added).toMatchObject({ source: "added", start: "17:00", end: "18:30" });
  });

  it("overrides weekly time on conflict", () => {
    const cls = {
      ...baseClass,
      addedDates: [{ date: "2026-06-01", start: "20:00", end: "21:30" }], // Monday in weekly
    };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    const session = sessions.find((s) => s.date === "2026-06-01");
    expect(session).toMatchObject({ source: "added", start: "20:00", end: "21:30" });
  });

  it("addedDates overrides even when date is excluded", () => {
    const cls = {
      ...baseClass,
      excludedDates: ["2026-06-04"],
      addedDates: [{ date: "2026-06-04", start: "17:00", end: "18:30" }],
    };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    expect(sessions.find((s) => s.date === "2026-06-04")?.source).toBe("added");
  });
});

describe("expandSchedule — range cropping", () => {
  it("crops to from/to inclusive", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-10",
      to: "2026-06-20",
    });
    for (const s of sessions) {
      expect(s.date >= "2026-06-10" && s.date <= "2026-06-20").toBe(true);
    }
  });

  it("crops to studentStart / studentEnd", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-01",
      to: "2026-06-30",
      studentStart: "2026-06-15",
      studentEnd: "2026-06-22",
    });
    for (const s of sessions) {
      expect(s.date >= "2026-06-15" && s.date <= "2026-06-22").toBe(true);
    }
  });

  it("returns empty when effective range inverts", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-30",
      to: "2026-06-01",
    });
    expect(sessions).toEqual([]);
  });

  it("crops to class boundaries", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-05-01",
      to: "2026-07-31",
    });
    for (const s of sessions) {
      expect(s.date >= "2026-06-01" && s.date <= "2026-06-30").toBe(true);
    }
  });
});
