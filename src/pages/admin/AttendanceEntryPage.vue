<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { AttendanceStatus, Class, Student } from "@/types";
import { expandSchedule } from "@/composables/useScheduleCompute";
import { formatVnDate, monthOf, monthStart, monthEnd, addDays } from "@/lib/dates";

const props = defineProps<{ classId: string; date: string }>();
const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const cls = ref<Class | null>(null);
const list = ref<Student[]>([]);
const status = ref<Record<string, "unmarked" | AttendanceStatus>>({});
const notes = ref<Record<string, string>>({});
const saving = ref(false);
const unsubs: (() => void)[] = [];

async function reload(): Promise<void> {
  cls.value = await classes.get(props.classId);
  if (!cls.value) return;
  list.value = await students.listByClass(props.classId, "active");

  unsubs.forEach((u) => u());
  unsubs.length = 0;

  const ym = monthOf(props.date);
  for (const s of list.value) {
    const unsub = months.subscribe(s.id, ym, (doc) => {
      status.value = { ...status.value, [s.id]: doc?.attendance?.[props.date]?.status ?? "unmarked" };
      notes.value = { ...notes.value, [s.id]: doc?.attendance?.[props.date]?.note ?? "" };
    });
    unsubs.push(unsub);
  }
}

onMounted(reload);
onBeforeUnmount(() => unsubs.forEach((u) => u()));

const session = computed(() => {
  if (!cls.value) return null;
  const all = expandSchedule({ cls: cls.value, from: monthStart(monthOf(props.date)), to: monthEnd(monthOf(props.date)) });
  return all.find((s) => s.date === props.date) ?? null;
});

const markedCount = computed(() => Object.values(status.value).filter((v) => v !== "unmarked").length);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref<"success" | "error">("success");

async function saveAll(): Promise<void> {
  saving.value = true;
  try {
    const marks = list.value
      .filter((s) => status.value[s.id] && status.value[s.id] !== "unmarked")
      .map((s) => ({
        studentId: s.id,
        status: status.value[s.id] as AttendanceStatus,
        note: notes.value[s.id] || undefined,
      }));
    await months.markAttendanceBatch(props.classId, props.date, marks);
    snackbarColor.value = "success";
    snackbarText.value = `Đã lưu điểm danh ${marks.length} học sinh`;
    snackbar.value = true;
  } catch (e) {
    snackbarColor.value = "error";
    snackbarText.value = "Lưu thất bại, vui lòng thử lại";
    snackbar.value = true;
    console.error(e);
  } finally {
    saving.value = false;
  }
}

function markAll(value: AttendanceStatus): void {
  const next = { ...status.value };
  for (const s of list.value) next[s.id] = value;
  status.value = next;
}

function shiftDate(delta: number): void {
  router.replace({ name: "admin-attendance", params: { classId: props.classId, date: addDays(props.date, delta) } });
}
</script>

<template>
  <div v-if="cls">
    <v-btn
      variant="text"
      size="small"
      prepend-icon="mdi-arrow-left"
      class="mb-3 ms-n2"
      @click="router.push({ name: 'admin-class-detail', params: { classId: cls.id } })"
    >
      {{ cls.name }}
    </v-btn>

    <v-card class="pa-4 pa-sm-5 mb-4">
      <div class="d-flex align-center ga-3">
        <v-btn
          icon="mdi-chevron-left"
          variant="tonal"
          size="small"
          @click="shiftDate(-1)"
        />
        <div class="flex-grow-1 text-center">
          <div class="text-title-large font-weight-bold">
            {{ formatVnDate(date) }}
          </div>
          <div class="text-body-medium text-medium-emphasis">
            <template v-if="session">{{ session.start }} – {{ session.end }}</template>
            <template v-else>Không có buổi học</template>
          </div>
        </div>
        <v-btn
          icon="mdi-chevron-right"
          variant="tonal"
          size="small"
          @click="shiftDate(1)"
        />
      </div>
      <template v-if="session">
        <v-divider class="my-4" />
        <div class="d-flex align-center ga-3">
          <v-progress-linear
            :model-value="list.length ? (markedCount / list.length) * 100 : 0"
            color="primary"
            height="8"
            rounded
            class="flex-grow-1"
          />
          <span class="text-body-medium font-weight-medium text-no-wrap">
            {{ markedCount }}/{{ list.length }}
          </span>
        </div>
      </template>
    </v-card>

    <!-- Ngày không có buổi: chỉ hiện thông báo, vẫn giữ điều hướng ngày ở trên -->
    <v-alert
      v-if="!session"
      type="info"
      variant="tonal"
      icon="mdi-calendar-blank-outline"
    >
      Ngày này không có buổi học. Dùng nút ‹ › để chuyển sang ngày khác.
    </v-alert>

    <template v-if="session">
    <div class="d-flex flex-wrap align-center ga-2 mb-3">
      <span class="text-body-medium text-medium-emphasis mr-1">Đánh dấu tất cả:</span>
      <v-btn
        size="small"
        variant="tonal"
        color="success"
        prepend-icon="mdi-check-all"
        @click="markAll('present')"
      >
        Có mặt
      </v-btn>
      <v-btn
        size="small"
        variant="tonal"
        color="info"
        @click="markAll('excused')"
      >
        Có phép
      </v-btn>
      <v-btn
        size="small"
        variant="tonal"
        color="error"
        @click="markAll('absent')"
      >
        Vắng
      </v-btn>
    </div>

    <v-card class="mb-4">
      <v-list lines="two">
        <template
          v-for="(s, i) in list"
          :key="s.id"
        >
          <v-divider v-if="i > 0" />
          <v-list-item :title="s.name">
            <template #subtitle>
              <v-text-field
                v-model="notes[s.id]"
                placeholder="Ghi chú (tuỳ chọn)"
                variant="plain"
                density="compact"
                hide-details
                class="mt-n1"
              />
            </template>
            <template #append>
              <v-btn-toggle
                v-model="status[s.id]"
                mandatory="force"
                density="comfortable"
                variant="outlined"
                divided
              >
                <v-btn
                  value="present"
                  color="success"
                  size="small"
                >
                  Có
                </v-btn>
                <v-btn
                  value="excused"
                  color="info"
                  size="small"
                >
                  Phép
                </v-btn>
                <v-btn
                  value="absent"
                  color="error"
                  size="small"
                >
                  Vắng
                </v-btn>
              </v-btn-toggle>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <div class="d-flex justify-end">
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        :loading="saving"
        prepend-icon="mdi-content-save"
        @click="saveAll"
      >
        Lưu tất cả
      </v-btn>
    </div>
    </template>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="bottom"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
  <v-progress-linear
    v-else
    indeterminate
    color="primary"
  />
</template>
