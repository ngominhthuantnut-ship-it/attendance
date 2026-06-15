<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import type { Class } from "@/types";
import ClassFormDialog from "@/components/ClassFormDialog.vue";
import EmptyState from "@/components/EmptyState.vue";
import { formatVnDate, formatVnd } from "@/lib/dates";

const store = useClassesStore();
const router = useRouter();
const items = ref<Class[]>([]);
const showForm = ref(false);

async function reload(): Promise<void> {
  items.value = await store.list("active");
}

onMounted(reload);

function dayLabels(c: Class): string {
  const keys = Object.keys(c.weeklySchedule);
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const labels: Record<string, string> = {
    mon: "T2",
    tue: "T3",
    wed: "T4",
    thu: "T5",
    fri: "T6",
    sat: "T7",
    sun: "CN",
  };
  return keys
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((k) => labels[k]!)
    .join(", ");
}

function currentRate(c: Class): number {
  return [...c.rateHistory].sort((a, b) => (a.effectiveFrom > b.effectiveFrom ? -1 : 1))[0]?.rate ?? 0;
}

async function onSubmit(data: Omit<Class, "id">): Promise<void> {
  const id = crypto.randomUUID();
  await store.create(id, data);
  await reload();
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">
        Lớp học
      </h2>
      <v-spacer />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showForm = true"
      >
        Thêm lớp
      </v-btn>
    </div>

    <EmptyState
      v-if="items.length === 0"
      title="Chưa có lớp nào"
      subtitle="Bấm 'Thêm lớp' để tạo lớp đầu tiên"
      icon="mdi-google-classroom"
    />

    <v-data-table
      v-else
      :headers="[
        { title: 'Tên', key: 'name' },
        { title: 'Bắt đầu', key: 'startDate' },
        { title: 'Kết thúc', key: 'endDate' },
        { title: 'Lịch tuần', key: 'days' },
        { title: 'Đơn giá', key: 'rate' },
        { title: '', key: 'actions', sortable: false },
      ]"
      :items="items"
      density="comfortable"
    >
      <template #[`item.startDate`]="{ item }">
        {{ formatVnDate(item.startDate) }}
      </template>
      <template #[`item.endDate`]="{ item }">
        {{ formatVnDate(item.endDate) }}
      </template>
      <template #[`item.days`]="{ item }">
        {{ dayLabels(item) }}
      </template>
      <template #[`item.rate`]="{ item }">
        {{ formatVnd(currentRate(item)) }}
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn
          variant="text"
          size="small"
          @click="router.push({ name: 'admin-class-detail', params: { classId: item.id } })"
        >
          Chi tiết
        </v-btn>
      </template>
    </v-data-table>

    <ClassFormDialog
      v-model="showForm"
      title="Thêm lớp mới"
      @submit="onSubmit"
    />
  </div>
</template>
