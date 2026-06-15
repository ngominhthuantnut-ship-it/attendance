import type { Timestamp } from "firebase/firestore";
import type { DateISO, YearMonth } from "./class";

export type AttendanceStatus = "present" | "excused" | "absent";

export interface AttendanceMark {
  status: AttendanceStatus;
  note?: string;
  markedAt: Timestamp;
}

export interface PaymentRecord {
  amount: number;
  paidAt: Timestamp;
  note?: string;
}

export interface MonthDoc {
  month: YearMonth;
  classId: string;
  attendance: Record<DateISO, AttendanceMark>;
  payment: PaymentRecord | null;
}
