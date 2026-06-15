import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { computeMonth } from "@/composables/useBillingCompute";
import type { Class, Student, MonthDoc } from "@/types";

const cls: Class = {
  id: "c1",
  name: "Toán 8",
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  weeklySchedule: {
    mon: { start: "18:00", end: "19:30" },
    wed: { start: "18:00", end: "19:30" },
    fri: { start: "18:00", end: "19:30" },
  },
  rateHistory: [
    { effectiveFrom: "2026-06-01", rate: 150_000 },
    { effectiveFrom: "2026-06-15", rate: 180_000 },
  ],
  excludedDates: [],
  addedDates: [],
  status: "active",
};

const student: Student = {
  id: "s1",
  classId: "c1",
  name: "An",
  dob: null,
  parentName: "",
  parentPhone: "",
  startDate: "2026-06-01",
  endDate: null,
  notes: "",
  parentLinkToken: "tok",
  status: "active",
};

function ts(): Timestamp {
  return Timestamp.fromDate(new Date("2026-06-15T10:00:00Z"));
}

describe("computeMonth — empty monthDoc", () => {
  it("all sessions unmarked, confirmed=0, projected>0", () => {
    const r = computeMonth({ cls, student, monthDoc: null, yearMonth: "2026-06" });
    expect(r.sessions.length).toBe(13);
    expect(r.sessions.every((s) => s.status === "unmarked")).toBe(true);
    expect(r.totals.unmarked).toBe(13);
    expect(r.totals.confirmedAmount).toBe(0);
    expect(r.totals.projectedAmount).toBeGreaterThan(0);
    expect(r.paymentStatus).toBe("unpaid");
    expect(r.paidInfo).toBeNull();
  });
});

describe("computeMonth — billable rules", () => {
  it("present and absent are billable; excused is not", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },     // rate 150k
        "2026-06-03": { status: "excused", markedAt: ts() },     // rate 150k → 0
        "2026-06-05": { status: "absent",  markedAt: ts() },     // rate 150k
        "2026-06-15": { status: "present", markedAt: ts() },     // rate 180k (new)
      },
      payment: null,
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.totals.present).toBe(2);
    expect(r.totals.excused).toBe(1);
    expect(r.totals.absent).toBe(1);
    expect(r.totals.confirmedAmount).toBe(150_000 + 150_000 + 180_000);
  });
});

describe("computeMonth — rate applies by session date", () => {
  it("uses 150k before 2026-06-15 and 180k from 2026-06-15", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-12": { status: "present", markedAt: ts() }, // Friday — 150k
        "2026-06-15": { status: "present", markedAt: ts() }, // Monday — 180k
        "2026-06-17": { status: "present", markedAt: ts() }, // Wed     — 180k
      },
      payment: null,
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.totals.confirmedAmount).toBe(150_000 + 180_000 + 180_000);
  });
});

describe("computeMonth — payment & warning", () => {
  it("paymentStatus reflects payment field", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {},
      payment: { amount: 1_000_000, paidAt: ts(), note: "Đã thu mặt" },
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.paymentStatus).toBe("paid");
    expect(r.paidInfo?.amount).toBe(1_000_000);
  });

  it("warns when paid amount differs from confirmed amount", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },
      },
      payment: { amount: 999_999, paidAt: ts() },
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("no warning when paid amount matches confirmed", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },
      },
      payment: { amount: 150_000, paidAt: ts() },
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.warnings).toEqual([]);
  });
});

describe("computeMonth — student range crop", () => {
  it("only sessions within student.startDate..endDate count", () => {
    const s = { ...student, startDate: "2026-06-15" };
    const r = computeMonth({ cls, student: s, monthDoc: null, yearMonth: "2026-06" });
    expect(r.sessions.every((sess) => sess.date >= "2026-06-15")).toBe(true);
  });
});

describe("computeMonth — projectedAmount treats unmarked as present", () => {
  it("projected >= confirmed always", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },
      },
      payment: null,
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.totals.projectedAmount).toBeGreaterThan(r.totals.confirmedAmount);
  });
});
