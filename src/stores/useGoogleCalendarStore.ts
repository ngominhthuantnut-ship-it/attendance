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
