// src/lib/gcal.ts
export type RecurrencePreset = "none" | "daily" | "weekly" | "monthly";
export type ReminderPreset = "none" | "10m" | "30m" | "1h" | "1d";

export interface GCalDateTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface GCalReminders {
  useDefault: boolean;
  overrides?: { method: string; minutes: number }[];
}

export interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: GCalDateTime;
  end: GCalDateTime;
  recurrence?: string[];
  reminders?: GCalReminders;
}

export interface EventForm {
  summary: string;
  allDay: boolean;
  start: string; // all-day: "YYYY-MM-DD"; timed: "YYYY-MM-DDTHH:mm"
  end: string;
  description?: string;
  location?: string;
  recurrence: RecurrencePreset;
  reminder: ReminderPreset;
}

const TZ = "Asia/Ho_Chi_Minh";
const REMINDER_MINUTES: Record<Exclude<ReminderPreset, "none">, number> = {
  "10m": 10,
  "30m": 30,
  "1h": 60,
  "1d": 1440,
};

export function buildRecurrence(preset: RecurrencePreset): string[] | undefined {
  if (preset === "none") return undefined;
  return [`RRULE:FREQ=${preset.toUpperCase()}`];
}

export function buildReminders(preset: ReminderPreset): GCalReminders {
  if (preset === "none") return { useDefault: false, overrides: [] };
  return { useDefault: false, overrides: [{ method: "popup", minutes: REMINDER_MINUTES[preset] }] };
}

export function toGcalPayload(form: EventForm): Partial<GCalEvent> {
  const start: GCalDateTime = form.allDay
    ? { date: form.start }
    : { dateTime: `${form.start}:00`, timeZone: TZ };
  const end: GCalDateTime = form.allDay
    ? { date: form.end }
    : { dateTime: `${form.end}:00`, timeZone: TZ };

  const payload: Partial<GCalEvent> = {
    summary: form.summary,
    start,
    end,
    reminders: buildReminders(form.reminder),
  };
  if (form.description) payload.description = form.description;
  if (form.location) payload.location = form.location;
  const rec = buildRecurrence(form.recurrence);
  if (rec) payload.recurrence = rec;
  return payload;
}

export function fromGcalEvent(e: GCalEvent): EventForm {
  const allDay = !!e.start.date;
  const recStr = (e.recurrence ?? []).join(" ");
  const recurrence: RecurrencePreset = recStr.includes("FREQ=DAILY")
    ? "daily"
    : recStr.includes("FREQ=WEEKLY")
      ? "weekly"
      : recStr.includes("FREQ=MONTHLY")
        ? "monthly"
        : "none";
  const minutes = e.reminders?.overrides?.[0]?.minutes;
  const reminder: ReminderPreset =
    minutes === 10 ? "10m" : minutes === 30 ? "30m" : minutes === 60 ? "1h" : minutes === 1440 ? "1d" : "none";

  return {
    summary: e.summary ?? "",
    allDay,
    start: allDay ? (e.start.date ?? "") : (e.start.dateTime ?? "").slice(0, 16),
    end: allDay ? (e.end.date ?? "") : (e.end.dateTime ?? "").slice(0, 16),
    description: e.description,
    location: e.location,
    recurrence,
    reminder,
  };
}
