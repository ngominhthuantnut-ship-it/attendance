import type { DateISO, RateEntry } from "@/types";
import { compareDate } from "@/lib/dates";

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
