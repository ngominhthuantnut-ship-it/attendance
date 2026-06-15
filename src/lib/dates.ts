import type { DateISO, DayKey, TimeHHmm, YearMonth } from "@/types";

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISO(iso: DateISO): Date {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(Date.UTC(year, month, day));
}

export function formatISO(d: Date): DateISO {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: DateISO, n: number): DateISO {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return formatISO(d);
}

export function compareDate(a: DateISO, b: DateISO): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function dayKeyOf(iso: DateISO): DayKey {
  const keys: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = keys[parseISO(iso).getUTCDay()];
  if (!key) throw new Error("unreachable");
  return key;
}

export function vnDayLabel(iso: DateISO): string {
  const labels: Record<DayKey, string> = {
    mon: "T2",
    tue: "T3",
    wed: "T4",
    thu: "T5",
    fri: "T6",
    sat: "T7",
    sun: "CN",
  };
  return labels[dayKeyOf(iso)];
}

export function formatVnDate(iso: DateISO): string {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function formatVnTime(hhmm: TimeHHmm): string {
  return hhmm;
}

export function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")} đ`;
}

export function monthOf(iso: DateISO): YearMonth {
  return iso.slice(0, 7);
}

export function monthStart(ym: YearMonth): DateISO {
  return `${ym}-01`;
}

export function monthEnd(ym: YearMonth): DateISO {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) throw new Error(`Invalid YearMonth: ${ym}`);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(last).padStart(2, "0")}`;
}

export function daysInMonth(ym: YearMonth): DateISO[] {
  const start = monthStart(ym);
  const end = monthEnd(ym);
  const out: DateISO[] = [];
  let cur = start;
  while (compareDate(cur, end) <= 0) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function monthsBetween(fromYM: YearMonth, toYM: YearMonth): YearMonth[] {
  const out: YearMonth[] = [];
  let [y, m] = fromYM.split("-").map(Number) as [number, number];
  const [ty, tm] = toYM.split("-").map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function isInRange(iso: DateISO, from: DateISO, to: DateISO): boolean {
  return compareDate(iso, from) >= 0 && compareDate(iso, to) <= 0;
}

export function todayISO(now: Date = new Date()): DateISO {
  // Convert to Asia/Ho_Chi_Minh (UTC+7) calendar date
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  return formatISO(local);
}
