import { describe, it, expect } from "vitest";
import { getRateAtDate } from "@/composables/useBillingCompute";

describe("getRateAtDate", () => {
  const history = [
    { effectiveFrom: "2026-01-01", rate: 100_000 },
    { effectiveFrom: "2026-04-01", rate: 150_000 },
    { effectiveFrom: "2026-07-01", rate: 180_000 },
  ];

  it("returns rate of the latest entry on or before the date", () => {
    expect(getRateAtDate(history, "2026-01-01")).toBe(100_000);
    expect(getRateAtDate(history, "2026-03-31")).toBe(100_000);
    expect(getRateAtDate(history, "2026-04-01")).toBe(150_000);
    expect(getRateAtDate(history, "2026-06-30")).toBe(150_000);
    expect(getRateAtDate(history, "2026-07-01")).toBe(180_000);
    expect(getRateAtDate(history, "2027-01-01")).toBe(180_000);
  });

  it("works regardless of entry ordering", () => {
    const unsorted = [
      { effectiveFrom: "2026-07-01", rate: 180_000 },
      { effectiveFrom: "2026-01-01", rate: 100_000 },
      { effectiveFrom: "2026-04-01", rate: 150_000 },
    ];
    expect(getRateAtDate(unsorted, "2026-05-15")).toBe(150_000);
  });

  it("throws when no entry has effectiveFrom <= date", () => {
    expect(() => getRateAtDate(history, "2025-12-31")).toThrow();
  });

  it("throws on empty history", () => {
    expect(() => getRateAtDate([], "2026-06-15")).toThrow();
  });
});
