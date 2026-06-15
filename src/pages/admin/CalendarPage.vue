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
