import type { Class, DateISO } from "@/types";
import { addDays, compareDate, dayKeyOf } from "@/lib/dates";

export interface Session {
  date: DateISO;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string;
  end: string;
  source: "weekly" | "added";
}

const dayKeyToIndex = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
} as const;

export interface ExpandScheduleArgs {
  cls: Class;
  from: DateISO;
  to: DateISO;
  studentStart?: DateISO | null;
  studentEnd?: DateISO | null;
}

function maxDate(...dates: DateISO[]): DateISO {
  return dates.reduce((a, b) => (compareDate(a, b) >= 0 ? a : b));
}

function minDate(...dates: DateISO[]): DateISO {
  return dates.reduce((a, b) => (compareDate(a, b) <= 0 ? a : b));
}

export function expandSchedule(args: ExpandScheduleArgs): Session[] {
  const { cls, from, to, studentStart, studentEnd } = args;
  const effFrom = maxDate(from, cls.startDate, studentStart ?? from);
  const effTo = minDate(to, cls.endDate, studentEnd ?? to);
  if (compareDate(effFrom, effTo) > 0) return [];

  const excluded = new Set(cls.excludedDates);
  const addedByDate = new Map(cls.addedDates.map((a) => [a.date, a]));

  const sessions: Session[] = [];
  let cur = effFrom;
  while (compareDate(cur, effTo) <= 0) {
    const dayKey = dayKeyOf(cur);
    const added = addedByDate.get(cur);
    if (added) {
      sessions.push({
        date: cur,
        dayOfWeek: dayKeyToIndex[dayKey],
        start: added.start,
        end: added.end,
        source: "added",
      });
    } else {
      const slot = cls.weeklySchedule[dayKey];
      if (slot && !excluded.has(cur)) {
        sessions.push({
          date: cur,
          dayOfWeek: dayKeyToIndex[dayKey],
          start: slot.start,
          end: slot.end,
          source: "weekly",
        });
      }
    }
    cur = addDays(cur, 1);
  }
  return sessions;
}
