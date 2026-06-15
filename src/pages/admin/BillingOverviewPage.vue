<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { Class, Student } from "@/types";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO } from "@/lib/dates";
import MonthPicker from "@/components/MonthPicker.vue";
import MoneyText from "@/components/MoneyText.vue";

const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const month = ref(monthOf(todayISO()));
const rows = ref<{ student: Student; cls: Class; confirmed: number; status: "paid" | "unpaid" }[]>([]);
const loading = ref(false);

async function load(): Promise<void> {
  loading.value = true;
  rows.value = [];
  try {
    const clsList = await classes.list("active");
    for (const cls of clsList) {
      const stuList = await students.listByClass(cls.id, "active");
      for (const stu of stuList) {
        const md = await months.get(stu.id, month.value, false);
        const r = computeMonth({ cls, student: stu, monthDoc: md, yearMonth: month.value });
        rows.value.push({ student: stu, cls, confirmed: r.totals.confirmedAmount, status: r.paymentStatus });
      }
    }
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(month, load);
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">
        Học phí
      </h2>
      <v-spacer />
      <MonthPicker v-model="month" />
    </div>

    <v-progress-linear
      v-if="loading"
      indeterminate
    />
    <v-data-table
      v-else
      :headers="[
        { title: 'Học sinh', key: 'name' },
        { title: 'Lớp', key: 'className' },
        { title: 'Confirmed', key: 'confirmed' },
        { title: 'Trạng thái', key: 'status' },
        { title: '', key: 'actions', sortable: false },
      ]"
      :items="rows.map((r) => ({ id: r.student.id, name: r.student.name, className: r.cls.name, confirmed: r.confirmed, status: r.status }))"
    >
      <template #[`item.confirmed`]="{ item }">
        <MoneyText :value="item.confirmed" />
      </template>
      <template #[`item.status`]="{ item }">
        <v-chip
          :color="item.status === 'paid' ? 'success' : 'warning'"
          size="small"
        >
          {{ item.status === 'paid' ? 'Đã thu' : 'Chưa thu' }}
        </v-chip>
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn
          size="small"
          variant="text"
          @click="router.push({ name: 'admin-student-detail', params: { studentId: item.id } })"
        >
          Chi tiết
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>
