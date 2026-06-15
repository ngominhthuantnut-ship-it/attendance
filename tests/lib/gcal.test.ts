// tests/lib/gcal.test.ts
import { describe, it, expect } from "vitest";
import { toGcalPayload, fromGcalEvent, buildRecurrence, buildReminders, type EventForm } from "@/lib/gcal";

const timed: EventForm = {
  summary: "Họp", allDay: false,
  start: "2026-06-15T18:00", end: "2026-06-15T19:30",
  description: "ghi chú", location: "Phòng A",
  recurrence: "weekly", reminder: "30m",
};

describe("buildRecurrence", () => {
  it("maps presets to RRULE", () => {
    expect(buildRecurrence("none")).toBeUndefined();
    expect(buildRecurrence("daily")).toEqual(["RRULE:FREQ=DAILY"]);
    expect(buildRecurrence("weekly")).toEqual(["RRULE:FREQ=WEEKLY"]);
    expect(buildRecurrence("monthly")).toEqual(["RRULE:FREQ=MONTHLY"]);
  });
});

describe("buildReminders", () => {
  it("none => empty overrides", () => {
    expect(buildReminders("none")).toEqual({ useDefault: false, overrides: [] });
  });
  it("preset => popup minutes", () => {
    expect(buildReminders("1h")).toEqual({ useDefault: false, overrides: [{ method: "popup", minutes: 60 }] });
  });
});

describe("toGcalPayload", () => {
  it("timed event uses dateTime + Asia/Ho_Chi_Minh", () => {
    const p = toGcalPayload(timed);
    expect(p.start).toEqual({ dateTime: "2026-06-15T18:00:00", timeZone: "Asia/Ho_Chi_Minh" });
    expect(p.end).toEqual({ dateTime: "2026-06-15T19:30:00", timeZone: "Asia/Ho_Chi_Minh" });
    expect(p.summary).toBe("Họp");
    expect(p.description).toBe("ghi chú");
    expect(p.location).toBe("Phòng A");
    expect(p.recurrence).toEqual(["RRULE:FREQ=WEEKLY"]);
  });
  it("all-day uses date", () => {
    const p = toGcalPayload({ ...timed, allDay: true, start: "2026-06-15", end: "2026-06-16", recurrence: "none" });
    expect(p.start).toEqual({ date: "2026-06-15" });
    expect(p.end).toEqual({ date: "2026-06-16" });
    expect(p.recurrence).toBeUndefined();
  });
  it("omits empty description/location", () => {
    const p = toGcalPayload({ ...timed, description: "", location: "" });
    expect(p.description).toBeUndefined();
    expect(p.location).toBeUndefined();
  });
});

describe("fromGcalEvent", () => {
  it("round-trips a timed weekly event", () => {
    const form = fromGcalEvent({
      id: "e1", summary: "Họp",
      start: { dateTime: "2026-06-15T18:00:00+07:00", timeZone: "Asia/Ho_Chi_Minh" },
      end: { dateTime: "2026-06-15T19:30:00+07:00", timeZone: "Asia/Ho_Chi_Minh" },
      recurrence: ["RRULE:FREQ=WEEKLY"],
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
    });
    expect(form).toMatchObject({ summary: "Họp", allDay: false, start: "2026-06-15T18:00", end: "2026-06-15T19:30", recurrence: "weekly", reminder: "30m" });
  });
  it("detects all-day", () => {
    const form = fromGcalEvent({ id: "e2", start: { date: "2026-06-15" }, end: { date: "2026-06-16" } });
    expect(form.allDay).toBe(true);
    expect(form.start).toBe("2026-06-15");
    expect(form.reminder).toBe("none");
    expect(form.recurrence).toBe("none");
  });
});
