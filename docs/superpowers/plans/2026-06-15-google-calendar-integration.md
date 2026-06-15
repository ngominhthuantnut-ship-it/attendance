# Google Calendar Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an embedded personal Google Calendar (view + CRUD events, Month/Week/Day, recurring + reminder presets) inside the admin area, backed entirely by the Google Calendar API — no Firestore.

**Architecture:** Pure logic (payload/RRULE/reminder mapping, grid building) in `lib/`+`composables/` (unit-tested), REST wrappers in `services/googleCalendar.ts` (fetch-mock tested), state in a Pinia store, OAuth Calendar token obtained by adding the `calendar.events` scope to the existing Firebase Google sign-in and kept in-memory in `useAuthStore`.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vuetify 4, Pinia, Firebase Auth (Google provider), Vitest, Google Calendar REST API v3.

---

## File Structure

- Create `src/lib/gcal.ts` — pure: types (`GCalEvent`, `EventForm`, presets), `toGcalPayload`, `fromGcalEvent`, `buildRecurrence`, `buildReminders`.
- Create `src/composables/useCalendarGrid.ts` — pure: `monthGridWeeks`, `weekDates`, `groupEventsByStartDate`.
- Create `src/services/googleCalendar.ts` — REST wrappers + `CalendarAuthError`/`CalendarApiError`.
- Create `src/stores/useGoogleCalendarStore.ts` — events/loading/error/needsReconnect + actions.
- Modify `src/services/firebase.ts` — add `calendar.events` scope to `googleProvider`.
- Modify `src/stores/useAuthStore.ts` — capture `calendarToken`, add `reconnectCalendar()`.
- Create `src/components/calendar/EventDialog.vue` — create/edit form.
- Create `src/pages/admin/CalendarPage.vue` — page with view toggle + Month/Week/Day + reconnect banner.
- Modify `src/router/index.ts` — add `admin-calendar` route.
- Modify `src/layouts/AdminLayout.vue` — add "Lịch" nav item.
- Tests: `tests/lib/gcal.test.ts`, `tests/composables/useCalendarGrid.test.ts`, `tests/services/googleCalendar.test.ts`.

---

## Task 1: Pure event mapping (`lib/gcal.ts`)

**Files:**
- Create: `src/lib/gcal.ts`
- Test: `tests/lib/gcal.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/gcal.test.ts
import { describe, it, expect } from "vitest";
import { toGcalPayload, fromGcalEvent, buildRecurrence, buildReminders, type EventForm } from "@/lib/gcal";

const timed: EventForm = {
  summary: "Họp", allDay: false,
  start: "2026-06-15T18:00", end: "2026-06-15T19:30",
  description: "ghi chú", location: "Phòng A",
  recurrence: "weekly", reminder: "30m",
};

describe("buildRecurrence", () => {
  it("maps presets to RRULE", () => {
    expect(buildRecurrence("none")).toBeUndefined();
    expect(buildRecurrence("daily")).toEqual(["RRULE:FREQ=DAILY"]);
    expect(buildRecurrence("weekly")).toEqual(["RRULE:FREQ=WEEKLY"]);
    expect(buildRecurrence("monthly")).toEqual(["RRULE:FREQ=MONTHLY"]);
  });
});

describe("buildReminders", () => {
  it("none => empty overrides", () => {
    expect(buildReminders("none")).toEqual({ useDefault: false, overrides: [] });
  });
  it("preset => popup minutes", () => {
    expect(buildReminders("1h")).toEqual({ useDefault: false, overrides: [{ method: "popup", minutes: 60 }] });
  });
});

describe("toGcalPayload", () => {
  it("timed event uses dateTime + Asia/Ho_Chi_Minh", () => {
    const p = toGcalPayload(timed);
    expect(p.start).toEqual({ dateTime: "2026-06-15T18:00:00", timeZone: "Asia/Ho_Chi_Minh" });
    expect(p.end).toEqual({ dateTime: "2026-06-15T19:30:00", timeZone: "Asia/Ho_Chi_Minh" });
    expect(p.summary).toBe("Họp");
    expect(p.description).toBe("ghi chú");
    expect(p.location).toBe("Phòng A");
    expect(p.recurrence).toEqual(["RRULE:FREQ=WEEKLY"]);
  });
  it("all-day uses date", () => {
    const p = toGcalPayload({ ...timed, allDay: true, start: "2026-06-15", end: "2026-06-16", recurrence: "none" });
    expect(p.start).toEqual({ date: "2026-06-15" });
    expect(p.end).toEqual({ date: "2026-06-16" });
    expect(p.recurrence).toBeUndefined();
  });
  it("omits empty description/location", () => {
    const p = toGcalPayload({ ...timed, description: "", location: "" });
    expect(p.description).toBeUndefined();
    expect(p.location).toBeUndefined();
  });
});

describe("fromGcalEvent", () => {
  it("round-trips a timed weekly event", () => {
    const form = fromGcalEvent({
      id: "e1", summary: "Họp",
      start: { dateTime: "2026-06-15T18:00:00+07:00", timeZone: "Asia/Ho_Chi_Minh" },
      end: { dateTime: "2026-06-15T19:30:00+07:00", timeZone: "Asia/Ho_Chi_Minh" },
      recurrence: ["RRULE:FREQ=WEEKLY"],
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
    });
    expect(form).toMatchObject({ summary: "Họp", allDay: false, start: "2026-06-15T18:00", end: "2026-06-15T19:30", recurrence: "weekly", reminder: "30m" });
  });
  it("detects all-day", () => {
    const form = fromGcalEvent({ id: "e2", start: { date: "2026-06-15" }, end: { date: "2026-06-16" } });
    expect(form.allDay).toBe(true);
    expect(form.start).toBe("2026-06-15");
    expect(form.reminder).toBe("none");
    expect(form.recurrence).toBe("none");
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/lib/gcal.test.ts`
Expected: FAIL (module not found / functions undefined).

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/lib/gcal.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/gcal.ts tests/lib/gcal.test.ts
git commit -m "feat(calendar): pure event<->GCal payload mapping"
```

---

## Task 2: Calendar grid helpers (`composables/useCalendarGrid.ts`)

**Files:**
- Create: `src/composables/useCalendarGrid.ts`
- Test: `tests/composables/useCalendarGrid.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/composables/useCalendarGrid.test.ts
import { describe, it, expect } from "vitest";
import { monthGridWeeks, weekDates, groupEventsByStartDate } from "@/composables/useCalendarGrid";
import type { GCalEvent } from "@/lib/gcal";

describe("monthGridWeeks", () => {
  it("June 2026 starts Monday-first with leading blanks", () => {
    const weeks = monthGridWeeks("2026-06"); // 2026-06-01 is a Monday
    expect(weeks[0]![0]).toBe("2026-06-01");
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks.flat()).toHaveLength(weeks.length * 7);
  });
  it("pads leading blanks for a mid-week first day", () => {
    const weeks = monthGridWeeks("2026-07"); // 2026-07-01 is a Wednesday => index 2
    expect(weeks[0]!.slice(0, 2)).toEqual([null, null]);
    expect(weeks[0]![2]).toBe("2026-07-01");
  });
});

describe("weekDates", () => {
  it("returns Monday..Sunday for a date mid-week", () => {
    const days = weekDates("2026-06-17"); // Wednesday
    expect(days).toEqual([
      "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18",
      "2026-06-19", "2026-06-20", "2026-06-21",
    ]);
  });
});

describe("groupEventsByStartDate", () => {
  it("buckets events by their start day", () => {
    const evs: GCalEvent[] = [
      { id: "a", start: { dateTime: "2026-06-15T09:00:00+07:00" }, end: { dateTime: "2026-06-15T10:00:00+07:00" } },
      { id: "b", start: { date: "2026-06-15" }, end: { date: "2026-06-16" } },
      { id: "c", start: { dateTime: "2026-06-16T09:00:00+07:00" }, end: { dateTime: "2026-06-16T10:00:00+07:00" } },
    ];
    const map = groupEventsByStartDate(evs);
    expect(map.get("2026-06-15")!.map((e) => e.id)).toEqual(["a", "b"]);
    expect(map.get("2026-06-16")!.map((e) => e.id)).toEqual(["c"]);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/composables/useCalendarGrid.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/composables/useCalendarGrid.ts
import type { DayKey } from "@/types";
import { daysInMonth, dayKeyOf, addDays } from "@/lib/dates";
import type { GCalEvent } from "@/lib/gcal";

const DOW_INDEX: Record<DayKey, number> = {
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
};

export function monthGridWeeks(ym: string): (string | null)[][] {
  const days = daysInMonth(ym);
  if (days.length === 0) return [];
  const lead = DOW_INDEX[dayKeyOf(days[0]!)];
  const cells: (string | null)[] = [...Array(lead).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function weekDates(dateISO: string): string[] {
  const offset = DOW_INDEX[dayKeyOf(dateISO)];
  const monday = addDays(dateISO, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function startDateKey(e: GCalEvent): string {
  return e.start.date ?? (e.start.dateTime ?? "").slice(0, 10);
}

export function groupEventsByStartDate(events: GCalEvent[]): Map<string, GCalEvent[]> {
  const map = new Map<string, GCalEvent[]>();
  for (const e of events) {
    const key = startDateKey(e);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(e);
    else map.set(key, [e]);
  }
  return map;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/composables/useCalendarGrid.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useCalendarGrid.ts tests/composables/useCalendarGrid.test.ts
git commit -m "feat(calendar): month/week grid + event grouping helpers"
```

---

## Task 3: REST service (`services/googleCalendar.ts`)

**Files:**
- Create: `src/services/googleCalendar.ts`
- Test: `tests/services/googleCalendar.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/services/googleCalendar.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listEvents, createEvent, deleteEvent,
  CalendarAuthError, CalendarApiError,
} from "@/services/googleCalendar";

const TOKEN = "tok-123";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("listEvents", () => {
  it("sends bearer token + query params and returns items", async () => {
    const items = [{ id: "e1", start: {}, end: {} }];
    const f = mockFetch(200, { items });
    vi.stubGlobal("fetch", f);
    const result = await listEvents(TOKEN, "2026-06-01T00:00:00Z", "2026-06-30T23:59:59Z");
    expect(result).toEqual(items);
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toContain("singleEvents=true");
    expect(String(url)).toContain("orderBy=startTime");
    expect((init as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe("Bearer tok-123");
  });

  it("throws CalendarAuthError on 401", async () => {
    vi.stubGlobal("fetch", mockFetch(401, { error: "unauth" }));
    await expect(listEvents(TOKEN, "a", "b")).rejects.toBeInstanceOf(CalendarAuthError);
  });

  it("throws CalendarApiError on 500", async () => {
    vi.stubGlobal("fetch", mockFetch(500, { error: "boom" }));
    await expect(listEvents(TOKEN, "a", "b")).rejects.toBeInstanceOf(CalendarApiError);
  });
});

describe("createEvent", () => {
  it("POSTs JSON payload", async () => {
    const f = mockFetch(200, { id: "new" });
    vi.stubGlobal("fetch", f);
    const out = await createEvent(TOKEN, { summary: "x", start: {}, end: {} });
    expect(out).toEqual({ id: "new" });
    const init = f.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).summary).toBe("x");
  });
});

describe("deleteEvent", () => {
  it("resolves on 204 with no body", async () => {
    vi.stubGlobal("fetch", mockFetch(204, null));
    await expect(deleteEvent(TOKEN, "e1")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/services/googleCalendar.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/services/googleCalendar.ts
import type { GCalEvent } from "@/lib/gcal";

const BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export class CalendarAuthError extends Error {}
export class CalendarApiError extends Error {}

async function request(token: string, url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) throw new CalendarAuthError("Token Google Calendar hết hạn");
  if (!res.ok) throw new CalendarApiError(`Google Calendar lỗi ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

export async function listEvents(
  token: string,
  timeMinISO: string,
  timeMaxISO: string,
): Promise<GCalEvent[]> {
  const u = new URL(BASE);
  u.searchParams.set("timeMin", timeMinISO);
  u.searchParams.set("timeMax", timeMaxISO);
  u.searchParams.set("singleEvents", "true");
  u.searchParams.set("orderBy", "startTime");
  u.searchParams.set("maxResults", "250");
  const data = (await request(token, u.toString())) as { items?: GCalEvent[] };
  return data.items ?? [];
}

export function createEvent(token: string, payload: Partial<GCalEvent>): Promise<GCalEvent> {
  return request(token, BASE, { method: "POST", body: JSON.stringify(payload) }) as Promise<GCalEvent>;
}

export function updateEvent(token: string, id: string, payload: Partial<GCalEvent>): Promise<GCalEvent> {
  return request(token, `${BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<GCalEvent>;
}

export async function deleteEvent(token: string, id: string): Promise<void> {
  await request(token, `${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/services/googleCalendar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/googleCalendar.ts tests/services/googleCalendar.test.ts
git commit -m "feat(calendar): Google Calendar REST service with typed errors"
```

---

## Task 4: Auth — Calendar scope + token + reconnect

**Files:**
- Modify: `src/services/firebase.ts` (add scope to `googleProvider`)
- Modify: `src/stores/useAuthStore.ts`

- [ ] **Step 1: Add the scope in `services/firebase.ts`**

Find where `googleProvider` is created (a `new GoogleAuthProvider()`), and add immediately after its creation:

```ts
googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");
```

- [ ] **Step 2: Capture token in `useAuthStore.ts`**

Replace the imports and `signIn`/return in `src/stores/useAuthStore.ts`:

```ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  onAuthStateChanged,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { getFirebase, googleProvider } from "@/services/firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const initialized = ref(false);
  const calendarToken = ref<string | null>(null);
  const { auth } = getFirebase();

  onAuthStateChanged(auth, (u) => {
    user.value = u;
    initialized.value = true;
  });

  const isSignedIn = computed(() => user.value !== null);
  const uid = computed(() => user.value?.uid ?? null);
  const email = computed(() => user.value?.email ?? null);
  const displayName = computed(() => user.value?.displayName ?? null);
  const hasCalendarToken = computed(() => calendarToken.value !== null);

  async function signIn(): Promise<void> {
    const result = await signInWithPopup(auth, googleProvider);
    calendarToken.value = GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null;
  }

  // Token Calendar không được Firebase lưu/refresh; gọi hàm này khi 401 hoặc sau reload.
  async function reconnectCalendar(): Promise<void> {
    if (!auth.currentUser) {
      await signIn();
      return;
    }
    const result = await reauthenticateWithPopup(auth.currentUser, googleProvider);
    calendarToken.value = GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null;
  }

  async function signOutNow(): Promise<void> {
    calendarToken.value = null;
    await signOut(auth);
  }

  return {
    user, initialized, isSignedIn, uid, email, displayName,
    calendarToken, hasCalendarToken,
    signIn, reconnectCalendar, signOut: signOutNow,
  };
});
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: exit 0 (no errors).

- [ ] **Step 4: Commit**

```bash
git add src/services/firebase.ts src/stores/useAuthStore.ts
git commit -m "feat(calendar): request calendar.events scope + hold OAuth token in authStore"
```

---

## Task 5: Pinia store (`useGoogleCalendarStore.ts`)

**Files:**
- Create: `src/stores/useGoogleCalendarStore.ts`

- [ ] **Step 1: Implement the store**

```ts
// src/stores/useGoogleCalendarStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./useAuthStore";
import {
  listEvents, createEvent, updateEvent, deleteEvent,
  CalendarAuthError,
} from "@/services/googleCalendar";
import { toGcalPayload, type EventForm, type GCalEvent } from "@/lib/gcal";

export const useGoogleCalendarStore = defineStore("googleCalendar", () => {
  const auth = useAuthStore();
  const events = ref<GCalEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const needsReconnect = ref(false);

  function token(): string | null {
    if (!auth.calendarToken) {
      needsReconnect.value = true;
      return null;
    }
    return auth.calendarToken;
  }

  function handle(e: unknown): void {
    if (e instanceof CalendarAuthError) needsReconnect.value = true;
    else error.value = (e as Error).message;
  }

  async function loadRange(timeMinISO: string, timeMaxISO: string): Promise<void> {
    const t = token();
    if (!t) return;
    loading.value = true;
    error.value = null;
    try {
      events.value = await listEvents(t, timeMinISO, timeMaxISO);
      needsReconnect.value = false;
    } catch (e) {
      handle(e);
    } finally {
      loading.value = false;
    }
  }

  async function save(form: EventForm, id?: string): Promise<boolean> {
    const t = token();
    if (!t) return false;
    try {
      const payload = toGcalPayload(form);
      if (id) await updateEvent(t, id, payload);
      else await createEvent(t, payload);
      return true;
    } catch (e) {
      handle(e);
      return false;
    }
  }

  async function remove(id: string): Promise<boolean> {
    const t = token();
    if (!t) return false;
    try {
      await deleteEvent(t, id);
      return true;
    } catch (e) {
      handle(e);
      return false;
    }
  }

  return { events, loading, error, needsReconnect, loadRange, save, remove };
});
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/stores/useGoogleCalendarStore.ts
git commit -m "feat(calendar): Pinia store wiring service + auth token + reconnect flag"
```

---

## Task 6: Event dialog component

**Files:**
- Create: `src/components/calendar/EventDialog.vue`

- [ ] **Step 1: Implement the dialog**

```vue
<!-- src/components/calendar/EventDialog.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import type { EventForm, RecurrencePreset, ReminderPreset } from "@/lib/gcal";

const props = defineProps<{
  modelValue: boolean;
  initial: EventForm | null; // null = tạo mới
  editingId: string | null;
  defaultStart: string; // "YYYY-MM-DDTHH:mm" khi tạo mới
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  save: [form: EventForm, id: string | null];
  remove: [id: string];
}>();

function blank(): EventForm {
  return {
    summary: "",
    allDay: false,
    start: props.defaultStart,
    end: props.defaultStart,
    description: "",
    location: "",
    recurrence: "none",
    reminder: "none",
  };
}

const form = ref<EventForm>(blank());

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = props.initial ? { ...props.initial } : blank();
  },
);

const recurrenceOptions: { title: string; value: RecurrencePreset }[] = [
  { title: "Không lặp", value: "none" },
  { title: "Hằng ngày", value: "daily" },
  { title: "Hằng tuần", value: "weekly" },
  { title: "Hằng tháng", value: "monthly" },
];
const reminderOptions: { title: string; value: ReminderPreset }[] = [
  { title: "Không nhắc", value: "none" },
  { title: "10 phút trước", value: "10m" },
  { title: "30 phút trước", value: "30m" },
  { title: "1 giờ trước", value: "1h" },
  { title: "1 ngày trước", value: "1d" },
];

function submit(): void {
  if (!form.value.summary.trim()) return;
  emit("save", { ...form.value }, props.editingId);
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ editingId ? "Sửa sự kiện" : "Sự kiện mới" }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="form.summary"
          label="Tiêu đề"
          autofocus
        />
        <v-switch
          v-model="form.allDay"
          label="Cả ngày"
          color="primary"
          hide-details
          class="mb-2"
        />
        <div class="d-flex ga-3">
          <v-text-field
            v-model="form.start"
            label="Bắt đầu"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
          <v-text-field
            v-model="form.end"
            label="Kết thúc"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
        </div>
        <v-text-field
          v-model="form.location"
          label="Địa điểm"
        />
        <v-textarea
          v-model="form.description"
          label="Mô tả"
          rows="2"
        />
        <div class="d-flex ga-3">
          <v-select
            v-model="form.recurrence"
            :items="recurrenceOptions"
            label="Lặp lại"
          />
          <v-select
            v-model="form.reminder"
            :items="reminderOptions"
            label="Nhắc nhở"
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="editingId"
          color="error"
          variant="text"
          @click="emit('remove', editingId)"
        >
          Xoá
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          Huỷ
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!form.summary.trim()"
          @click="submit"
        >
          Lưu
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/EventDialog.vue
git commit -m "feat(calendar): event create/edit dialog"
```

---

## Task 7: Calendar page (Month/Week/Day + reconnect banner)

**Files:**
- Create: `src/pages/admin/CalendarPage.vue`

- [ ] **Step 1: Implement the page**

```vue
<!-- src/pages/admin/CalendarPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useGoogleCalendarStore } from "@/stores/useGoogleCalendarStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { monthGridWeeks, weekDates, groupEventsByStartDate } from "@/composables/useCalendarGrid";
import { fromGcalEvent, type EventForm, type GCalEvent } from "@/lib/gcal";
import { monthOf, todayISO, monthStart, monthEnd, formatVnDate, addDays } from "@/lib/dates";
import PageHeader from "@/components/PageHeader.vue";
import EventDialog from "@/components/calendar/EventDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const cal = useGoogleCalendarStore();
const auth = useAuthStore();

type ViewMode = "month" | "week" | "day";
const view = ref<ViewMode>("month");
const anchor = ref(todayISO());
const today = todayISO();
const DOW_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const dialogOpen = ref(false);
const editingId = ref<string | null>(null);
const dialogInitial = ref<EventForm | null>(null);
const dialogDefaultStart = ref("");
const confirmDelete = ref<{ open: boolean; id: string | null }>({ open: false, id: null });
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref<"success" | "error">("success");

function notify(text: string, color: "success" | "error" = "success"): void {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
}

// Lỗi API (không phải 401) → snackbar đỏ (CLAUDE.md §error handling).
watch(
  () => cal.error,
  (msg) => {
    if (msg) notify(msg, "error");
  },
);

const rangeISO = computed(() => {
  if (view.value === "month") {
    const ym = monthOf(anchor.value);
    return { min: `${monthStart(ym)}T00:00:00Z`, max: `${monthEnd(ym)}T23:59:59Z` };
  }
  if (view.value === "week") {
    const days = weekDates(anchor.value);
    return { min: `${days[0]}T00:00:00Z`, max: `${days[6]}T23:59:59Z` };
  }
  return { min: `${anchor.value}T00:00:00Z`, max: `${anchor.value}T23:59:59Z` };
});

const eventsByDate = computed(() => groupEventsByStartDate(cal.events));
const weeks = computed(() => monthGridWeeks(monthOf(anchor.value)));
const currentWeek = computed(() => weekDates(anchor.value));

const periodLabel = computed(() => {
  if (view.value === "month") {
    const [y, m] = monthOf(anchor.value).split("-");
    return `Tháng ${Number(m)}/${y}`;
  }
  if (view.value === "week") {
    const d = weekDates(anchor.value);
    return `${formatVnDate(d[0]!)} – ${formatVnDate(d[6]!)}`;
  }
  return formatVnDate(anchor.value);
});

async function reload(): Promise<void> {
  await cal.loadRange(rangeISO.value.min, rangeISO.value.max);
}
onMounted(reload);
watch([view, anchor], reload);

function shift(delta: number): void {
  if (view.value === "month") {
    const [y, m] = monthOf(anchor.value).split("-").map(Number) as [number, number];
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    anchor.value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
  } else {
    anchor.value = addDays(anchor.value, view.value === "week" ? 7 * delta : delta);
  }
}

function timeLabel(e: GCalEvent): string {
  if (e.start.date) return "Cả ngày";
  return (e.start.dateTime ?? "").slice(11, 16);
}

function openCreate(dateISO: string): void {
  editingId.value = null;
  dialogInitial.value = null;
  dialogDefaultStart.value = `${dateISO}T08:00`;
  dialogOpen.value = true;
}

function openEdit(e: GCalEvent): void {
  editingId.value = e.id;
  dialogInitial.value = fromGcalEvent(e);
  dialogOpen.value = true;
}

async function onSave(form: EventForm, id: string | null): Promise<void> {
  const ok = await cal.save(form, id ?? undefined);
  if (ok) {
    dialogOpen.value = false;
    notify(id ? "Đã cập nhật sự kiện" : "Đã tạo sự kiện");
    await reload();
  }
}

function onRemoveRequest(id: string): void {
  dialogOpen.value = false;
  confirmDelete.value = { open: true, id };
}

async function onConfirmDelete(): Promise<void> {
  if (!confirmDelete.value.id) return;
  const ok = await cal.remove(confirmDelete.value.id);
  confirmDelete.value = { open: false, id: null };
  if (ok) {
    notify("Đã xoá sự kiện");
    await reload();
  }
}

async function connect(): Promise<void> {
  await auth.reconnectCalendar();
  await reload();
}
</script>

<template>
  <div>
    <PageHeader
      title="Lịch"
      subtitle="Google Calendar cá nhân"
      icon="mdi-calendar"
    />

    <v-alert
      v-if="cal.needsReconnect"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Cần kết nối Google Calendar để xem và quản lý sự kiện.
      <template #append>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          @click="connect"
        >
          Kết nối Google Calendar
        </v-btn>
      </template>
    </v-alert>

    <div class="d-flex flex-wrap align-center ga-2 mb-3">
      <v-btn icon="mdi-chevron-left" variant="tonal" size="small" @click="shift(-1)" />
      <span class="text-title-medium font-weight-bold mx-1">{{ periodLabel }}</span>
      <v-btn icon="mdi-chevron-right" variant="tonal" size="small" @click="shift(1)" />
      <v-btn variant="text" size="small" @click="anchor = today">Hôm nay</v-btn>
      <v-spacer />
      <v-btn-toggle v-model="view" mandatory="force" density="comfortable" variant="outlined" divided>
        <v-btn value="month" size="small">Tháng</v-btn>
        <v-btn value="week" size="small">Tuần</v-btn>
        <v-btn value="day" size="small">Ngày</v-btn>
      </v-btn-toggle>
    </div>

    <v-progress-linear v-if="cal.loading" indeterminate color="primary" class="mb-2" />

    <!-- MONTH -->
    <v-card v-if="view === 'month'" class="pa-3">
      <div class="cal-grid mb-1">
        <div v-for="d in DOW_LABELS" :key="d" class="cal-dow">{{ d }}</div>
      </div>
      <div v-for="(week, wi) in weeks" :key="wi" class="cal-grid">
        <div
          v-for="(date, di) in week"
          :key="di"
          class="cal-cell"
          :class="{ 'is-empty': !date, 'is-today': date === today }"
          @click="date && openCreate(date)"
        >
          <template v-if="date">
            <span class="cal-daynum">{{ Number(date.slice(8, 10)) }}</span>
            <div class="cal-events">
              <button
                v-for="e in (eventsByDate.get(date) ?? [])"
                :key="e.id"
                class="cal-event"
                @click.stop="openEdit(e)"
              >
                <span class="cal-event-time">{{ timeLabel(e) }}</span> {{ e.summary || "(không tiêu đề)" }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </v-card>

    <!-- WEEK / DAY (danh sách theo ngày) -->
    <v-card v-else>
      <template v-for="(date, i) in (view === 'week' ? currentWeek : [anchor])" :key="date">
        <v-divider v-if="i > 0" />
        <div class="d-flex align-center justify-space-between px-4 pt-3">
          <span class="font-weight-medium" :class="{ 'text-primary': date === today }">
            {{ formatVnDate(date) }}
          </span>
          <v-btn icon="mdi-plus" variant="text" size="small" @click="openCreate(date)" />
        </div>
        <v-list lines="two" class="pt-0">
          <v-list-item
            v-for="e in (eventsByDate.get(date) ?? [])"
            :key="e.id"
            :title="e.summary || '(không tiêu đề)'"
            :subtitle="`${timeLabel(e)}${e.location ? ' · ' + e.location : ''}`"
            @click="openEdit(e)"
          />
          <v-list-item v-if="(eventsByDate.get(date) ?? []).length === 0" class="text-medium-emphasis">
            Không có sự kiện
          </v-list-item>
        </v-list>
      </template>
    </v-card>

    <EventDialog
      v-model="dialogOpen"
      :initial="dialogInitial"
      :editing-id="editingId"
      :default-start="dialogDefaultStart"
      @save="onSave"
      @remove="onRemoveRequest"
    />
    <ConfirmDialog
      v-model="confirmDelete.open"
      title="Xoá sự kiện?"
      message="Sự kiện sẽ bị xoá khỏi Google Calendar."
      destructive
      @confirm="onConfirmDelete"
    />
    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="bottom">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.cal-dow {
  text-align: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  padding-bottom: 4px;
}
.cal-cell {
  min-height: 96px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 12px;
  padding: 6px;
  cursor: pointer;
  background: rgb(var(--v-theme-surface));
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.cal-cell:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgb(var(--v-theme-primary));
}
.cal-cell.is-empty {
  border: none;
  background: transparent;
  cursor: default;
}
.cal-cell.is-empty:hover {
  background: transparent;
}
.cal-cell.is-today {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.cal-daynum {
  font-size: 0.85rem;
  font-weight: 600;
}
.cal-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}
.cal-event {
  text-align: left;
  font-size: 0.72rem;
  line-height: 1.2;
  padding: 2px 4px;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.cal-event-time {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}
</style>
```

- [ ] **Step 2: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/CalendarPage.vue
git commit -m "feat(calendar): calendar page with month/week/day + reconnect banner"
```

---

## Task 8: Route + nav

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/layouts/AdminLayout.vue`

- [ ] **Step 1: Add the route**

In `src/router/index.ts`, inside the `/admin` children array, add after the `settings` route:

```ts
      { path: "calendar", name: "admin-calendar", component: () => import("@/pages/admin/CalendarPage.vue") },
```

- [ ] **Step 2: Add the nav item**

In `src/layouts/AdminLayout.vue`, add to the `nav` array (after "Học phí"):

```ts
  { title: "Lịch", to: "/admin/calendar", icon: "mdi-calendar", exact: false },
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/router/index.ts src/layouts/AdminLayout.vue
git commit -m "feat(calendar): route + nav entry for calendar page"
```

---

## Task 9: Full verification

- [ ] **Step 1: Run the whole test suite**

Run: `npm test -- --run`
Expected: all non-emulator suites pass (rules tests skip without emulator, as today). New suites `gcal`, `useCalendarGrid`, `googleCalendar` PASS.

- [ ] **Step 2: Typecheck + build + lint**

Run: `npm run typecheck && npm run build && npm run lint`
Expected: all exit 0.

- [ ] **Step 3: Manual smoke (requires Google setup from spec §9)**

1. Ensure OAuth consent screen lists `calendar.events` and your account is a Test user.
2. `npm run dev`, sign in with Google (grant Calendar permission).
3. Go to "Lịch": events for the current month load. Create / edit / delete an event; verify it appears in real Google Calendar.
4. Reload the page → expect the reconnect banner; click "Kết nối Google Calendar" → events load again.

---

## Notes for the implementer

- **Token lifecycle is the main gotcha:** `auth.calendarToken` is in-memory only. After reload or ~1h it's gone → the store sets `needsReconnect` and the page shows the connect banner. This is expected per the spec (the "merge into Google login" choice). Do not try to persist the token to localStorage.
- **Timezone:** always `Asia/Ho_Chi_Minh`; never construct `Date` objects for storage — the payload uses ISO strings from form inputs directly.
- **No Firestore involvement.** Do not add rules or collections.
- **Multi-day events:** MVP renders an event on its start day only. Acceptable for v1 (documented limitation).
