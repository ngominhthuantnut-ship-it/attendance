import { describe, it, expect } from "vitest";
import {
  parseISO,
  formatISO,
  addDays,
  compareDate,
  dayKeyOf,
  vnDayLabel,
  formatVnDate,
  formatVnTime,
  formatVnd,
  monthsBetween,
  daysInMonth,
  monthStart,
  monthEnd,
  monthOf,
  isInRange,
  todayISO,
} from "@/lib/dates";

describe("parseISO / formatISO / addDays", () => {
  it("round-trips a date", () => {
    expect(formatISO(parseISO("2026-06-15"))).toBe("2026-06-15");
  });

  it("addDays adds positive and negative", () => {
    expect(addDays("2026-06-15", 1)).toBe("2026-06-16");
    expect(addDays("2026-06-15", -1)).toBe("2026-06-14");
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("addDays handles leap year", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
  });
});

describe("compareDate", () => {
  it("returns negative/zero/positive correctly", () => {
    expect(compareDate("2026-06-15", "2026-06-16")).toBeLessThan(0);
    expect(compareDate("2026-06-15", "2026-06-15")).toBe(0);
    expect(compareDate("2026-06-16", "2026-06-15")).toBeGreaterThan(0);
  });
});

describe("dayKeyOf / vnDayLabel", () => {
  it("returns correct day key & label", () => {
    expect(dayKeyOf("2026-06-15")).toBe("mon"); // 2026-06-15 is Monday
    expect(vnDayLabel("2026-06-15")).toBe("T2");
    expect(vnDayLabel("2026-06-21")).toBe("CN");
  });
});

describe("formatVnDate / formatVnTime / formatVnd", () => {
  it("formats Vietnamese conventions", () => {
    expect(formatVnDate("2026-06-15")).toBe("15/06/2026");
    expect(formatVnTime("18:00")).toBe("18:00");
    expect(formatVnd(150000)).toMatch(/150\.000/);
    expect(formatVnd(0)).toMatch(/0/);
  });
});

describe("monthOf / monthStart / monthEnd / daysInMonth", () => {
  it("derives month string", () => {
    expect(monthOf("2026-06-15")).toBe("2026-06");
  });

  it("returns first and last day", () => {
    expect(monthStart("2026-06")).toBe("2026-06-01");
    expect(monthEnd("2026-06")).toBe("2026-06-30");
    expect(monthEnd("2026-02")).toBe("2026-02-28");
    expect(monthEnd("2024-02")).toBe("2024-02-29");
    expect(monthEnd("2026-12")).toBe("2026-12-31");
  });

  it("daysInMonth lists every day", () => {
    expect(daysInMonth("2026-02")).toHaveLength(28);
    expect(daysInMonth("2024-02")).toHaveLength(29);
    expect(daysInMonth("2026-06")[0]).toBe("2026-06-01");
    expect(daysInMonth("2026-06").at(-1)).toBe("2026-06-30");
  });
});

describe("monthsBetween / isInRange", () => {
  it("monthsBetween inclusive both ends", () => {
    expect(monthsBetween("2026-03", "2026-06")).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(monthsBetween("2026-06", "2026-06")).toEqual(["2026-06"]);
    expect(monthsBetween("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("isInRange inclusive both ends", () => {
    expect(isInRange("2026-06-15", "2026-06-01", "2026-06-30")).toBe(true);
    expect(isInRange("2026-06-01", "2026-06-01", "2026-06-30")).toBe(true);
    expect(isInRange("2026-06-30", "2026-06-01", "2026-06-30")).toBe(true);
    expect(isInRange("2026-05-31", "2026-06-01", "2026-06-30")).toBe(false);
    expect(isInRange("2026-07-01", "2026-06-01", "2026-06-30")).toBe(false);
  });
});

describe("invalid input guards", () => {
  it("parseISO throws on malformed input", () => {
    expect(() => parseISO("not-a-date")).toThrow(/Invalid ISO date/);
    expect(() => parseISO("2026-6-1")).toThrow(/Invalid ISO date/);
  });

  it("dayKeyOf propagates parseISO errors on malformed input", () => {
    expect(() => dayKeyOf("not-a-date")).toThrow(/Invalid ISO date/);
  });

  it("formatVnDate throws on malformed input", () => {
    expect(() => formatVnDate("2026/06/15")).toThrow(/Invalid ISO date/);
  });

  it("monthEnd throws on malformed YearMonth", () => {
    expect(() => monthEnd("not-a-month")).toThrow(/Invalid YearMonth/);
  });
});

describe("todayISO", () => {
  it("converts a UTC instant to Asia/Ho_Chi_Minh calendar date", () => {
    // 2026-06-15 18:00 UTC = 2026-06-16 01:00 in VN → date is 2026-06-16
    expect(todayISO(new Date("2026-06-15T18:00:00Z"))).toBe("2026-06-16");
    // 2026-06-15 10:00 UTC = 2026-06-15 17:00 in VN → date is 2026-06-15
    expect(todayISO(new Date("2026-06-15T10:00:00Z"))).toBe("2026-06-15");
  });
});
