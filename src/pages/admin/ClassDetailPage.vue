<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import type { Class, Student } from "@/types";
import ClassFormDialog from "@/components/ClassFormDialog.vue";
import StudentFormDialog from "@/components/StudentFormDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import EmptyState from "@/components/EmptyState.vue";
import ParentLinkCard from "@/components/ParentLinkCard.vue";
import { expandSchedule } from "@/composables/useScheduleCompute";
import { formatVnDate, monthOf, monthStart, monthEnd, todayISO } from "@/lib/dates";

const props = defineProps<{ classId: string }>();
const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const cls = ref<Class | null>(null);
const studentList = ref<Student[]>([]);
const tab = ref<"info" | "schedule" | "students">("info");
const showClassForm = ref(false);
const showStudentForm = ref(false);
const editingStudent = ref<Student | null>(null);
const confirmDelete = ref<{ open: boolean; student: Student | null }>({
  open: false,
  student: null,
});
const showLinkFor = ref<string | null>(null);
const month = ref(monthOf(todayISO()));

async function reload(): Promise<void> {
  cls.value = await classes.get(props.classId);
  if (cls.value) {
    studentList.value = await students.listByClass(props.classId, "active");
  }
}

onMounted(reload);

const sessions = computed(() => {
  if (!cls.value) return [];
  return expandSchedule({
    cls: cls.value,
    from: monthStart(month.value),
    to: monthEnd(month.value),
  });
});

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

function openCreate(): void {
  editingStudent.value = null;
  showStudentForm.value = true;
}

function gotoAttendance(date: string): void {
  router.push({ name: "admin-attendance", params: { classId: props.classId, date } });
}
</script>

<template>
  <div v-if="cls">
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">
        {{ cls.name }}
      </h2>
      <v-spacer />
      <v-btn
        variant="text"
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
      <v-tab value="info">
        Thông tin
      </v-tab>
      <v-tab value="schedule">
        Lịch học
      </v-tab>
      <v-tab value="students">
        Học sinh ({{ studentList.length }})
      </v-tab>
    </v-tabs>

    <v-window
      v-model="tab"
      class="mt-4"
    >
      <v-window-item value="info">
        <v-card class="pa-4">
          <p>
            <strong>Thời gian:</strong>
            {{ formatVnDate(cls.startDate) }} – {{ formatVnDate(cls.endDate) }}
          </p>
          <p>
            <strong>Đơn giá hiện tại:</strong>
            {{
              [...cls.rateHistory]
                .sort((a, b) => (a.effectiveFrom > b.effectiveFrom ? -1 : 1))[0]
                ?.rate.toLocaleString("vi-VN")
            }}
            đ/buổi
          </p>
        </v-card>
      </v-window-item>

      <v-window-item value="schedule">
        <div class="d-flex align-center mb-3">
          <strong>Tháng:</strong>
          <v-text-field
            v-model="month"
            type="month"
            density="compact"
            hide-details
            class="ml-2"
            style="max-width: 180px"
          />
        </div>
        <v-list>
          <v-list-item
            v-for="s in sessions"
            :key="s.date"
            :title="`${formatVnDate(s.date)} (${s.start}–${s.end})`"
            :subtitle="s.source === 'added' ? 'Buổi thêm bù' : ''"
          >
            <template #append>
              <v-btn
                size="small"
                variant="text"
                @click="gotoAttendance(s.date)"
              >
                Điểm danh
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-window-item>

      <v-window-item value="students">
        <div class="d-flex align-center mb-3">
          <v-spacer />
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreate"
          >
            Thêm học sinh
          </v-btn>
        </div>
        <EmptyState
          v-if="studentList.length === 0"
          title="Chưa có học sinh"
          icon="mdi-account-multiple"
        />
        <v-list v-else>
          <v-list-item
            v-for="s in studentList"
            :key="s.id"
            :title="s.name"
            :subtitle="`SĐT phụ huynh: ${s.parentPhone || '—'}`"
            @click="
              router.push({ name: 'admin-student-detail', params: { studentId: s.id } })
            "
          >
            <template #append>
              <v-btn
                icon="mdi-link"
                variant="text"
                size="small"
                @click.stop="showLinkFor = s.parentLinkToken"
              />
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                @click.stop="openEdit(s)"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click.stop="confirmDelete = { open: true, student: s }"
              />
            </template>
          </v-list-item>
        </v-list>
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
      @update:model-value="showLinkFor = null"
    >
      <ParentLinkCard
        v-if="showLinkFor"
        :token="showLinkFor"
      />
    </v-dialog>
  </div>
</template>
