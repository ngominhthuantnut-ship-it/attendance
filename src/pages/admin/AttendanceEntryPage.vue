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
  } finally {
    saving.value = false;
  }
}

function shiftDate(delta: number): void {
  router.replace({ name: "admin-attendance", params: { classId: props.classId, date: addDays(props.date, delta) } });
}
</script>

<template>
  <div v-if="cls && session">
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">
        {{ cls.name }}
      </h2>
      <v-spacer />
      <v-btn
        variant="text"
        prepend-icon="mdi-chevron-left"
        @click="shiftDate(-1)"
      >
        Hôm trước
      </v-btn>
      <v-btn
        variant="text"
        append-icon="mdi-chevron-right"
        @click="shiftDate(1)"
      >
        Hôm sau
      </v-btn>
    </div>
    <p class="text-body-1">
      {{ formatVnDate(date) }} — {{ session.start }} đến {{ session.end }}
    </p>
    <p class="text-caption mb-4">
      Đã điểm danh: {{ markedCount }}/{{ list.length }}
    </p>

    <v-list>
      <v-list-item
        v-for="s in list"
        :key="s.id"
        :title="s.name"
      >
        <template #append>
          <v-btn-toggle
            v-model="status[s.id]"
            color="primary"
            mandatory="force"
            density="comfortable"
            class="mr-2"
          >
            <v-btn
              value="present"
              color="success"
            >
              Có
            </v-btn>
            <v-btn
              value="excused"
              color="info"
            >
              Có phép
            </v-btn>
            <v-btn
              value="absent"
              color="error"
            >
              Không phép
            </v-btn>
          </v-btn-toggle>
          <v-text-field
            v-model="notes[s.id]"
            placeholder="Ghi chú"
            density="compact"
            hide-details
            style="width: 180px;"
          />
        </template>
      </v-list-item>
    </v-list>

    <div class="d-flex justify-end mt-4">
      <v-btn
        color="primary"
        :loading="saving"
        prepend-icon="mdi-content-save"
        @click="saveAll"
      >
        Lưu tất cả
      </v-btn>
    </div>
  </div>
  <v-alert
    v-else
    type="info"
  >
    Đang tải buổi học, hoặc ngày này không có buổi.
  </v-alert>
</template>
