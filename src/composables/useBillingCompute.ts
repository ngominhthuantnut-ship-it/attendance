import type {
  AttendanceStatus,
  Class,
  DateISO,
  MonthDoc,
  PaymentRecord,
  RateEntry,
  Student,
  YearMonth,
} from "@/types";
import { compareDate, monthEnd, monthStart } from "@/lib/dates";
import { expandSchedule, type Session } from "./useScheduleCompute";

export function getRateAtDate(history: RateEntry[], date: DateISO): number {
  let best: RateEntry | null = null;
  for (const entry of history) {
    if (compareDate(entry.effectiveFrom, date) <= 0) {
      if (!best || compareDate(entry.effectiveFrom, best.effectiveFrom) > 0) {
        best = entry;
      }
    }
  }
  if (!best) {
    throw new Error(
      `No rate entry effective on or before ${date} (history length=${history.length})`,
    );
  }
  return best.rate;
}

export interface BilledSession extends Session {
  status: "unmarked" | AttendanceStatus;
  rate: number;
  billable: boolean;
  amount: number;
}

export interface ComputeMonthArgs {
  cls: Class;
  student: Student;
  monthDoc: MonthDoc | null;
  yearMonth: YearMonth;
}

export interface ComputeMonthResult {
  sessions: BilledSession[];
  totals: {
    sessionCount: number;
    present: number;
    excused: number;
    absent: number;
    unmarked: number;
    confirmedAmount: number;
    projectedAmount: number;
  };
  paymentStatus: "paid" | "unpaid";
  paidInfo: PaymentRecord | null;
  warnings: string[];
}

export function computeMonth(args: ComputeMonthArgs): ComputeMonthResult {
  const { cls, student, monthDoc, yearMonth } = args;
  const from = monthStart(yearMonth);
  const to = monthEnd(yearMonth);

  const sessions = expandSchedule({
    cls,
    from,
    to,
    studentStart: student.startDate,
    studentEnd: student.endDate,
  });

  const totals = {
    sessionCount: sessions.length,
    present: 0,
    excused: 0,
    absent: 0,
    unmarked: 0,
    confirmedAmount: 0,
    projectedAmount: 0,
  };

  const billed: BilledSession[] = sessions.map((s) => {
    const mark = monthDoc?.attendance?.[s.date];
    const status: "unmarked" | AttendanceStatus = mark?.status ?? "unmarked";
    const rate = getRateAtDate(cls.rateHistory, s.date);
    const billable = status === "present" || status === "absent";
    const amount = billable ? rate : 0;

    if (status === "present") totals.present += 1;
    else if (status === "excused") totals.excused += 1;
    else if (status === "absent") totals.absent += 1;
    else totals.unmarked += 1;

    if (status !== "unmarked") totals.confirmedAmount += amount;
    if (status === "unmarked") totals.projectedAmount += rate;
    else totals.projectedAmount += amount;

    return { ...s, status, rate, billable, amount };
  });

  const paymentStatus: "paid" | "unpaid" = monthDoc?.payment ? "paid" : "unpaid";
  const paidInfo = monthDoc?.payment ?? null;

  const warnings: string[] = [];
  if (paidInfo && paidInfo.amount !== totals.confirmedAmount) {
    warnings.push(
      `Số tính lại (${totals.confirmedAmount.toLocaleString("vi-VN")}đ) khác số đã thu (${paidInfo.amount.toLocaleString("vi-VN")}đ)`,
    );
  }

  return { sessions: billed, totals, paymentStatus, paidInfo, warnings };
}
