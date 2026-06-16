<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { Class, DayKey, Student } from "@/types";
import ClassFormDialog from "@/components/ClassFormDialog.vue";
import StudentFormDialog from "@/components/StudentFormDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import EmptyState from "@/components/EmptyState.vue";
import ParentLinkCard from "@/components/ParentLinkCard.vue";
import MoneyText from "@/components/MoneyText.vue";
import ZaloIcon from "@/components/ZaloIcon.vue";
import {
  downloadStudentTemplate,
  downloadStudentCodes,
  readStudentRows,
  rowsToStudents,
  dedupKey,
  type ImportedStudent,
} from "@/lib/studentExcel";
import { expandSchedule, type Session } from "@/composables/useScheduleCompute";
import {
  formatVnDate,
  monthOf,
  monthStart,
  monthEnd,
  todayISO,
  daysInMonth,
  dayKeyOf,
} from "@/lib/dates";

const props = defineProps<{ classId: string }>();
const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();
const cls = ref<Class | null>(null);
const studentList = ref<Student[]>([]);
const tab = ref<"schedule" | "students">("schedule");
const viewMode = ref<"calendar" | "list">("calendar");
const showClassForm = ref(false);
const showStudentForm = ref(false);
const editingStudent = ref<Student | null>(null);
const confirmDelete = ref<{ open: boolean; student: Student | null }>({
  open: false,
  student: null,
});
const showLinkFor = ref<{ token: string; code: string } | null>(null);

async function openLink(s: Student): Promise<void> {
  const code = await students.ensureLookupCode(s);
  showLinkFor.value = { token: s.parentLinkToken, code };
}
const month = ref(monthOf(todayISO()));
const today = todayISO();

const monthPaid = ref(false);
const confirmExclude = ref<{ open: boolean; date: string | null }>({ open: false, date: null });
const makeup = ref<{ open: boolean; date: string | null; start: string; end: string }>({
  open: false,
  date: null,
  start: "",
  end: "",
});
const snackbar = ref(false);
const snackbarText = ref("");

function notify(text: string): void {
  snackbarText.value = text;
  snackbar.value = true;
}

async function refreshMonthPaid(): Promise<void> {
  let paid = false;
  for (const s of studentList.value) {
    const md = await months.get(s.id, month.value);
    if (md?.payment) {
      paid = true;
      break;
    }
  }
  monthPaid.value = paid;
}

async function reload(): Promise<void> {
  cls.value = await classes.get(props.classId);
  if (cls.value) {
    const list = await students.listByClass(props.classId, "active");
    // Backfill mã tra cứu cho học sinh cũ (chỉ ghi khi thiếu).
    const withCodes: Student[] = [];
    for (const s of list) {
      withCodes.push(s.lookupCode ? s : { ...s, lookupCode: await students.ensureLookupCode(s) });
    }
    studentList.value = withCodes;
    await refreshMonthPaid();
  }
}

const downloadingCodes = ref(false);
function downloadCodes(): void {
  downloadingCodes.value = true;
  try {
    downloadStudentCodes(
      studentList.value.map((s) => ({
        name: s.name,
        parentPhone: s.parentPhone,
        lookupCode: s.lookupCode ?? "",
      })),
    );
  } finally {
    downloadingCodes.value = false;
  }
}

onMounted(reload);
watch(month, refreshMonthPaid);

const sessions = computed<Session[]>(() => {
  if (!cls.value) return [];
  return expandSchedule({
    cls: cls.value,
    from: monthStart(month.value),
    to: monthEnd(month.value),
  });
});

const sessionByDate = computed(() => {
  const m = new Map<string, Session>();
  for (const s of sessions.value) m.set(s.date, s);
  return m;
});

const currentRate = computed(() => {
  if (!cls.value) return 0;
  return (
    [...cls.value.rateHistory].sort((a, b) => (a.effectiveFrom > b.effectiveFrom ? -1 : 1))[0]
      ?.rate ?? 0
  );
});

const DOW_INDEX: Record<DayKey, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};
const DOW_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const weeklyDays = computed(() => {
  if (!cls.value) return [];
  const order: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order
    .filter((k) => cls.value!.weeklySchedule[k])
    .map((k) => ({ key: k, label: DOW_LABELS[order.indexOf(k)]! }));
});

// Ngày là buổi tuần nhưng đã bị loại (excludedDates) → hiển thị "đã huỷ" để GV biết.
const cancelledSet = computed(() => {
  const set = new Set<string>();
  if (!cls.value) return set;
  const excluded = new Set(cls.value.excludedDates);
  for (const d of daysInMonth(month.value)) {
    if (excluded.has(d) && cls.value.weeklySchedule[dayKeyOf(d)]) set.add(d);
  }
  return set;
});

const calendarWeeks = computed<(string | null)[][]>(() => {
  const days = daysInMonth(month.value);
  if (days.length === 0) return [];
  const lead = DOW_INDEX[dayKeyOf(days[0]!)];
  const cells: (string | null)[] = [...Array(lead).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
});

const monthLabel = computed(() => {
  const [y, m] = month.value.split("-");
  return `Tháng ${Number(m)}/${y}`;
});

function shiftMonth(delta: number): void {
  const [y, m] = month.value.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  month.value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function onClassSubmit(data: Omit<Class, "id">): Promise<void> {
  await classes.update(props.classId, data);
  await reload();
}

async function onStudentSubmit(
  data: Omit<Student, "id" | "parentLinkToken">,
): Promise<void> {
  if (editingStudent.value) {
    await students.update(editingStudent.value.id, {
      ...data,
      classId: props.classId,
    });
  } else {
    const id = crypto.randomUUID();
    await students.create(id, { ...data, classId: props.classId });
  }
  editingStudent.value = null;
  await reload();
}

async function doDelete(): Promise<void> {
  if (!confirmDelete.value.student) return;
  await students.remove(confirmDelete.value.student.id);
  confirmDelete.value = { open: false, student: null };
  await reload();
}

function openEdit(s: Student): void {
  editingStudent.value = s;
  showStudentForm.value = true;
}

interface PreviewRow {
  student: ImportedStudent;
  key: string;
  action: "insert" | "update";
}

const importing = ref(false);
const importInput = ref<HTMLInputElement | null>(null);
const importMsg = ref<{ open: boolean; text: string; color: "success" | "error" }>({
  open: false,
  text: "",
  color: "success",
});
const preview = ref<{ open: boolean; rows: PreviewRow[]; skipped: number }>({
  open: false,
  rows: [],
  skipped: 0,
});

function triggerImport(): void {
  importInput.value?.click();
}

// Bước 1: đọc file & dựng preview, CHƯA ghi DB.
async function onImportFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // cho phép chọn lại cùng file
  if (!file || !cls.value) return;
  importing.value = true;
  try {
    const rows = await readStudentRows(file);
    const { students: imported, skipped } = rowsToStudents(rows, cls.value.startDate);
    const existing = new Set(
      studentList.value.map((s) => dedupKey(s.name, s.parentPhone, s.parentName)),
    );
    const seen = new Set<string>();
    const rowsOut: PreviewRow[] = imported.map((student) => {
      const key = dedupKey(student.name, student.parentPhone, student.parentName);
      const action: "insert" | "update" = existing.has(key) || seen.has(key) ? "update" : "insert";
      seen.add(key);
      return { student, key, action };
    });
    preview.value = { open: true, rows: rowsOut, skipped };
  } catch (err) {
    console.error(err);
    importMsg.value = { open: true, color: "error", text: "Đọc file thất bại. Kiểm tra đúng định dạng file mẫu." };
  } finally {
    importing.value = false;
  }
}

// Bước 2: người dùng bấm "Lưu" → mới ghi DB.
async function confirmImport(): Promise<void> {
  if (!cls.value) return;
  importing.value = true;
  try {
    const existing = new Map<string, string>(
      studentList.value.map((s) => [dedupKey(s.name, s.parentPhone, s.parentName), s.id]),
    );
    let inserted = 0;
    let updated = 0;
    for (const row of preview.value.rows) {
      const data = { ...row.student, classId: props.classId, status: "active" as const };
      const id = existing.get(row.key);
      if (id) {
        await students.update(id, data);
        updated += 1;
      } else {
        const newId = crypto.randomUUID();
        await students.create(newId, data);
        existing.set(row.key, newId);
        inserted += 1;
      }
    }
    preview.value = { open: false, rows: [], skipped: 0 };
    await reload();
    importMsg.value = {
      open: true,
      color: "success",
      text: `Đã lưu: thêm ${inserted}, cập nhật ${updated}.`,
    };
  } catch (err) {
    console.error(err);
    importMsg.value = { open: true, color: "error", text: "Lưu thất bại, vui lòng thử lại." };
  } finally {
    importing.value = false;
  }
}

function openCreate(): void {
  editingStudent.value = null;
  showStudentForm.value = true;
}

function gotoAttendance(date: string): void {
  router.push({ name: "admin-attendance", params: { classId: props.classId, date } });
}

function requestExclude(date: string): void {
  if (monthPaid.value) {
    notify("Tháng này đã thu tiền — không thể sửa lịch. Hãy bỏ đánh dấu đã thu trước.");
    return;
  }
  confirmExclude.value = { open: true, date };
}

async function doExclude(): Promise<void> {
  const date = confirmExclude.value.date;
  if (!cls.value || !date) return;
  const session = sessionByDate.value.get(date);
  if (session?.source === "added") {
    await classes.update(props.classId, {
      addedDates: cls.value.addedDates.filter((a) => a.date !== date),
    });
  } else {
    await classes.update(props.classId, {
      excludedDates: [...new Set([...cls.value.excludedDates, date])],
    });
  }
  confirmExclude.value = { open: false, date: null };
  await reload();
}

async function restoreSession(date: string): Promise<void> {
  if (!cls.value) return;
  if (monthPaid.value) {
    notify("Tháng này đã thu tiền — không thể sửa lịch.");
    return;
  }
  await classes.update(props.classId, {
    excludedDates: cls.value.excludedDates.filter((d) => d !== date),
  });
  await reload();
}

function openMakeup(date: string): void {
  if (monthPaid.value) {
    notify("Tháng này đã thu tiền — không thể thêm buổi.");
    return;
  }
  const firstSlot = Object.values(cls.value?.weeklySchedule ?? {})[0];
  makeup.value = {
    open: true,
    date,
    start: firstSlot?.start ?? "18:00",
    end: firstSlot?.end ?? "19:30",
  };
}

async function saveMakeup(): Promise<void> {
  if (!cls.value || !makeup.value.date) return;
  const entry = { date: makeup.value.date, start: makeup.value.start, end: makeup.value.end };
  await classes.update(props.classId, {
    addedDates: [...cls.value.addedDates.filter((a) => a.date !== entry.date), entry],
  });
  makeup.value = { open: false, date: null, start: "", end: "" };
  await reload();
}
</script>

<template>
  <div v-if="cls">
    <v-btn
      variant="text"
      size="small"
      prepend-icon="mdi-arrow-left"
      class="mb-3 ms-n2"
      @click="router.push({ name: 'admin-class-list' })"
    >
      Lớp học
    </v-btn>
    <div class="d-flex flex-wrap align-center ga-3 mb-4">
      <v-avatar
        color="primary"
        variant="tonal"
        rounded="lg"
        size="44"
      >
        <v-icon icon="mdi-book-open-variant" />
      </v-avatar>
      <h1 class="text-headline-medium font-weight-bold flex-grow-1">
        {{ cls.name }}
      </h1>
      <v-btn
        variant="tonal"
        prepend-icon="mdi-pencil"
        @click="showClassForm = true"
      >
        Sửa lớp
      </v-btn>
    </div>

    <v-tabs
      v-model="tab"
      color="primary"
    >
      <v-tab value="schedule">
        Thông tin &amp; Lịch học
      </v-tab>
      <v-tab value="students">
        Học sinh ({{ studentList.length }})
      </v-tab>
    </v-tabs>

    <v-window
      v-model="tab"
      class="mt-4"
    >
      <v-window-item value="schedule">
        <!-- Thông tin lớp -->
        <v-card class="pa-5 mb-4">
          <div class="d-flex flex-wrap ga-6">
            <div>
              <div class="text-body-small text-medium-emphasis mb-1">
                Thời gian học
              </div>
              <div class="d-flex align-center ga-2">
                <v-icon
                  icon="mdi-calendar-range"
                  size="small"
                  color="primary"
                />
                <span class="font-weight-medium">
                  {{ formatVnDate(cls.startDate) }} – {{ formatVnDate(cls.endDate) }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-body-small text-medium-emphasis mb-1">
                Đơn giá hiện tại
              </div>
              <div class="d-flex align-center ga-2">
                <v-icon
                  icon="mdi-cash"
                  size="small"
                  color="primary"
                />
                <MoneyText
                  :value="currentRate"
                  class="font-weight-bold"
                />
                <span class="text-body-small text-medium-emphasis">/ buổi</span>
              </div>
            </div>
            <div>
              <div class="text-body-small text-medium-emphasis mb-1">
                Lịch tuần
              </div>
              <div class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="d in weeklyDays"
                  :key="d.key"
                  size="small"
                  color="primary"
                  variant="tonal"
                >
                  {{ d.label }}
                </v-chip>
                <span
                  v-if="weeklyDays.length === 0"
                  class="text-body-small text-medium-emphasis"
                >—</span>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Thanh điều khiển lịch -->
        <div class="d-flex flex-wrap align-center ga-2 mb-3">
          <v-btn
            icon="mdi-chevron-left"
            variant="tonal"
            size="small"
            @click="shiftMonth(-1)"
          />
          <span class="text-title-medium font-weight-bold mx-1">{{ monthLabel }}</span>
          <v-btn
            icon="mdi-chevron-right"
            variant="tonal"
            size="small"
            @click="shiftMonth(1)"
          />
          <v-spacer />
          <v-btn-toggle
            v-model="viewMode"
            mandatory="force"
            density="comfortable"
            variant="outlined"
            divided
          >
            <v-btn
              value="calendar"
              prepend-icon="mdi-calendar-month"
              size="small"
            >
              Lịch
            </v-btn>
            <v-btn
              value="list"
              prepend-icon="mdi-format-list-bulleted"
              size="small"
            >
              Danh sách
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-alert
          v-if="monthPaid"
          type="info"
          variant="tonal"
          density="comfortable"
          class="mb-3"
          icon="mdi-lock-outline"
        >
          Tháng này đã thu tiền — lịch đã khoá. Bỏ đánh dấu "đã thu" ở trang học sinh nếu cần sửa.
        </v-alert>

        <!-- Chế độ lịch (calendar) -->
        <v-card
          v-if="viewMode === 'calendar'"
          class="pa-3 pa-sm-4"
        >
          <div class="cal-grid mb-1">
            <div
              v-for="d in DOW_LABELS"
              :key="d"
              class="cal-dow"
            >
              {{ d }}
            </div>
          </div>
          <div
            v-for="(week, wi) in calendarWeeks"
            :key="wi"
            class="cal-grid"
          >
            <div
              v-for="(date, di) in week"
              :key="di"
              class="cal-cell"
              :class="{
                'is-empty': !date,
                'is-session': date && sessionByDate.has(date),
                'is-cancelled': date && cancelledSet.has(date),
                'is-today': date === today,
              }"
              @click="date && gotoAttendance(date)"
            >
              <template v-if="date">
                <div class="cal-cell-head">
                  <span class="cal-daynum">{{ Number(date.slice(8, 10)) }}</span>
                  <template v-if="!monthPaid">
                    <v-btn
                      v-if="sessionByDate.has(date)"
                      class="cal-action"
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      density="comfortable"
                      title="Xoá buổi này"
                      @click.stop="requestExclude(date)"
                    />
                    <v-btn
                      v-else-if="cancelledSet.has(date)"
                      class="cal-action"
                      icon="mdi-restore"
                      size="x-small"
                      variant="text"
                      density="comfortable"
                      title="Khôi phục buổi"
                      @click.stop="restoreSession(date)"
                    />
                    <v-btn
                      v-else
                      class="cal-action"
                      icon="mdi-plus"
                      size="x-small"
                      variant="text"
                      density="comfortable"
                      title="Thêm buổi bù"
                      @click.stop="openMakeup(date)"
                    />
                  </template>
                </div>
                <span
                  v-if="sessionByDate.get(date)"
                  class="cal-session-time"
                >
                  {{ sessionByDate.get(date)!.start }}<template v-if="sessionByDate.get(date)!.source === 'added'"> · bù</template>
                </span>
                <span
                  v-else-if="cancelledSet.has(date)"
                  class="cal-cancelled-label"
                >
                  Đã huỷ
                </span>
              </template>
            </div>
          </div>
          <div class="d-flex flex-wrap align-center ga-4 mt-3 text-body-small text-medium-emphasis">
            <span class="d-flex align-center ga-1">
              <span class="cal-legend cal-legend--session" /> Có buổi học
            </span>
            <span class="d-flex align-center ga-1">
              <span class="cal-legend cal-legend--today" /> Hôm nay
            </span>
            <span class="d-flex align-center ga-1">
              <v-icon
                icon="mdi-close"
                size="x-small"
              /> Xoá ·
              <v-icon
                icon="mdi-plus"
                size="x-small"
              /> Thêm buổi bù
            </span>
          </div>
        </v-card>

        <!-- Chế độ danh sách (list) -->
        <v-card v-else>
          <EmptyState
            v-if="sessions.length === 0"
            title="Không có buổi học trong tháng này"
            icon="mdi-calendar-blank-outline"
          />
          <v-list
            v-else
            lines="one"
          >
            <template
              v-for="(s, i) in sessions"
              :key="s.date"
            >
              <v-divider v-if="i > 0" />
              <v-list-item
                :title="formatVnDate(s.date)"
                :subtitle="`${s.start}–${s.end}${s.source === 'added' ? ' · Buổi bù' : ''}`"
                :prepend-icon="s.date === today ? 'mdi-calendar-today' : 'mdi-calendar-check-outline'"
                @click="gotoAttendance(s.date)"
              >
                <template #append>
                  <v-btn
                    size="small"
                    variant="text"
                    color="primary"
                    append-icon="mdi-chevron-right"
                    @click.stop="gotoAttendance(s.date)"
                  >
                    Điểm danh
                  </v-btn>
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-window-item>

      <v-window-item value="students">
        <input
          ref="importInput"
          type="file"
          accept=".xlsx,.xls"
          class="d-none"
          @change="onImportFile"
        >
        <div class="d-flex flex-wrap align-center ga-2 mb-3">
          <v-btn
            variant="tonal"
            prepend-icon="mdi-file-download-outline"
            @click="downloadStudentTemplate"
          >
            Tải file mẫu
          </v-btn>
          <v-btn
            variant="tonal"
            color="primary"
            prepend-icon="mdi-file-upload-outline"
            :loading="importing"
            @click="triggerImport"
          >
            Nhập từ Excel
          </v-btn>
          <v-btn
            v-if="studentList.length"
            variant="tonal"
            prepend-icon="mdi-key-outline"
            :loading="downloadingCodes"
            @click="downloadCodes"
          >
            Tải mã tra cứu
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="openCreate"
          >
            Thêm học sinh
          </v-btn>
        </div>
        <v-card>
          <EmptyState
            v-if="studentList.length === 0"
            title="Chưa có học sinh"
            subtitle="Bấm 'Thêm học sinh' để thêm vào lớp này."
            icon="mdi-account-multiple"
          >
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-plus"
              @click="openCreate"
            >
              Thêm học sinh
            </v-btn>
          </EmptyState>
          <div v-else>
            <template
              v-for="(s, i) in studentList"
              :key="s.id"
            >
              <v-divider v-if="i > 0" />
              <div
                class="pa-3 student-row"
                @click="router.push({ name: 'admin-student-detail', params: { studentId: s.id } })"
              >
                <!-- Dòng 1: tên + mã + nút quản lý -->
                <div class="d-flex align-center ga-2">
                  <div
                    class="flex-grow-1 d-flex align-center ga-2 flex-wrap"
                    style="min-width: 0"
                  >
                    <span class="text-body-large font-weight-medium">{{ s.name }}</span>
                    <v-chip
                      v-if="s.lookupCode"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                      prepend-icon="mdi-key-variant"
                      class="code-chip"
                    >
                      {{ s.lookupCode }}
                    </v-chip>
                  </div>
                  <div class="d-flex align-center flex-shrink-0">
                    <v-btn
                      icon="mdi-link-variant"
                      variant="text"
                      size="small"
                      title="Sao chép link phụ huynh"
                      @click.stop="openLink(s)"
                    />
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      title="Sửa học sinh"
                      @click.stop="openEdit(s)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      title="Xoá học sinh"
                      @click.stop="confirmDelete = { open: true, student: s }"
                    />
                  </div>
                </div>
                <!-- Dòng 2: SĐT + nút gọi / Zalo -->
                <div class="d-flex align-center ga-2 mt-1">
                  <span class="text-body-small text-medium-emphasis tnum">
                    {{ s.parentPhone || "Chưa có SĐT" }}
                  </span>
                  <template v-if="s.parentPhone">
                    <v-btn
                      :href="`tel:${s.parentPhone}`"
                      icon
                      size="x-small"
                      variant="flat"
                      color="success"
                      :title="`Gọi ${s.parentPhone}`"
                      aria-label="Gọi điện cho phụ huynh"
                      @click.stop
                    >
                      <v-icon
                        icon="mdi-phone"
                        size="16"
                      />
                    </v-btn>
                    <v-btn
                      :href="`https://zalo.me/${s.parentPhone}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      icon
                      size="x-small"
                      variant="text"
                      title="Nhắn tin Zalo"
                      aria-label="Nhắn tin Zalo cho phụ huynh"
                      @click.stop
                    >
                      <ZaloIcon :size="22" />
                    </v-btn>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </v-card>
      </v-window-item>
    </v-window>

    <ClassFormDialog
      v-model="showClassForm"
      :initial="cls"
      title="Sửa lớp"
      @submit="onClassSubmit"
    />
    <StudentFormDialog
      v-model="showStudentForm"
      :initial="editingStudent ?? undefined"
      :class-start-date="cls.startDate"
      :title="editingStudent ? 'Sửa học sinh' : 'Thêm học sinh'"
      @submit="onStudentSubmit"
    />
    <ConfirmDialog
      v-model="confirmDelete.open"
      title="Xoá học sinh?"
      :message="`Xoá ${confirmDelete.student?.name ?? ''}? Toàn bộ điểm danh & thanh toán sẽ bị xoá.`"
      destructive
      @confirm="doDelete"
    />
    <v-dialog
      :model-value="!!showLinkFor"
      max-width="480"
      @update:model-value="showLinkFor = null"
    >
      <ParentLinkCard
        v-if="showLinkFor"
        :token="showLinkFor.token"
        :code="showLinkFor.code"
      />
    </v-dialog>

    <ConfirmDialog
      v-model="confirmExclude.open"
      title="Xoá buổi học?"
      :message="`Xoá buổi ngày ${confirmExclude.date ? formatVnDate(confirmExclude.date) : ''}? Buổi này sẽ không còn trong lịch và không tính học phí.`"
      destructive
      @confirm="doExclude"
    />

    <v-dialog
      v-model="makeup.open"
      max-width="420"
    >
      <v-card>
        <v-card-title>Thêm buổi bù</v-card-title>
        <v-card-text>
          <p class="text-body-medium text-medium-emphasis mb-4">
            Ngày {{ makeup.date ? formatVnDate(makeup.date) : "" }}
          </p>
          <div class="d-flex ga-3">
            <v-text-field
              v-model="makeup.start"
              label="Bắt đầu"
              type="time"
            />
            <v-text-field
              v-model="makeup.end"
              label="Kết thúc"
              type="time"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="makeup.open = false"
          >
            Huỷ
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!makeup.start || !makeup.end"
            @click="saveMakeup"
          >
            Thêm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      :timeout="4000"
      color="warning"
      location="bottom"
    >
      {{ snackbarText }}
    </v-snackbar>

    <v-snackbar
      v-model="importMsg.open"
      :timeout="6000"
      :color="importMsg.color"
      location="bottom"
    >
      {{ importMsg.text }}
    </v-snackbar>

    <v-dialog
      v-model="preview.open"
      max-width="720"
      scrollable
    >
      <v-card>
        <v-card-title>Xem trước danh sách nhập</v-card-title>
        <v-card-subtitle>
          {{ preview.rows.length }} học sinh hợp lệ
          ({{ preview.rows.filter((r) => r.action === 'insert').length }} thêm mới,
          {{ preview.rows.filter((r) => r.action === 'update').length }} cập nhật)
          <template v-if="preview.skipped">· bỏ qua {{ preview.skipped }} dòng thiếu họ tên</template>
        </v-card-subtitle>
        <v-divider />
        <v-card-text style="max-height: 60vh;">
          <v-table
            v-if="preview.rows.length"
            density="comfortable"
          >
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>SĐT</th>
                <th>Phụ huynh</th>
                <th>Bắt đầu</th>
                <th class="text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in preview.rows"
                :key="i"
              >
                <td class="font-weight-medium">
                  {{ r.student.name }}
                </td>
                <td class="tnum">
                  {{ r.student.parentPhone || "—" }}
                </td>
                <td>{{ r.student.parentName || "—" }}</td>
                <td>{{ r.student.startDate }}</td>
                <td class="text-center">
                  <v-chip
                    :color="r.action === 'insert' ? 'success' : 'warning'"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ r.action === 'insert' ? 'Thêm mới' : 'Cập nhật' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
          <p
            v-else
            class="text-medium-emphasis py-4"
          >
            Không có học sinh hợp lệ trong file.
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="importing"
            @click="preview = { open: false, rows: [], skipped: 0 }"
          >
            Huỷ
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="importing"
            :disabled="preview.rows.length === 0"
            @click="confirmImport"
          >
            Lưu {{ preview.rows.length }} học sinh
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.student-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.student-row:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

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
  aspect-ratio: 1 / 1;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 12px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  background: rgb(var(--v-theme-surface));
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.cal-cell:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgb(var(--v-theme-primary));
}

.cal-cell:active {
  transform: scale(0.96);
}

.cal-cell.is-empty {
  border: none;
  background: transparent;
  cursor: default;
}

.cal-cell.is-empty:hover {
  background: transparent;
}

.cal-cell.is-session {
  background: rgba(var(--v-theme-primary), 0.14);
  border-color: rgba(var(--v-theme-primary), 0.45);
}

.cal-cell.is-cancelled {
  background: rgb(var(--v-theme-surface-variant));
  border-style: dashed;
}

.cal-cell.is-today {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.cal-cell-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}

.cal-action {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.cal-cell:hover .cal-action {
  opacity: 1;
}

@media (hover: none) {
  .cal-action {
    opacity: 0.55;
  }
}

.cal-daynum {
  font-size: 0.9rem;
  font-weight: 600;
}

.is-cancelled .cal-daynum {
  text-decoration: line-through;
  color: rgb(var(--v-theme-on-surface-variant));
}

.cal-cancelled-label {
  margin-top: auto;
  font-size: 0.68rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
}

.cal-session-time {
  margin-top: auto;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.cal-legend {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  display: inline-block;
}

.cal-legend--session {
  background: rgba(var(--v-theme-primary), 0.14);
  border: 1px solid rgba(var(--v-theme-primary), 0.45);
}

.cal-legend--today {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
