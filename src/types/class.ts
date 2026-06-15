export type DateISO = string; // "YYYY-MM-DD"
export type TimeHHmm = string; // "HH:mm"
export type YearMonth = string; // "YYYY-MM"

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface TimeRange {
  start: TimeHHmm;
  end: TimeHHmm;
}

export type WeeklySchedule = Partial<Record<DayKey, TimeRange>>;

export interface RateEntry {
  effectiveFrom: DateISO;
  rate: number;
}

export interface AddedSession {
  date: DateISO;
  start: TimeHHmm;
  end: TimeHHmm;
}

export type ClassStatus = "active" | "archived";

export interface Class {
  id: string;
  name: string;
  startDate: DateISO;
  endDate: DateISO;
  weeklySchedule: WeeklySchedule;
  rateHistory: RateEntry[];
  excludedDates: DateISO[];
  addedDates: AddedSession[];
  status: ClassStatus;
}
