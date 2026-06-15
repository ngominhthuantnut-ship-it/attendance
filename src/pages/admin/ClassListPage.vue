<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import type { Class } from "@/types";
import ClassFormDialog from "@/components/ClassFormDialog.vue";
import EmptyState from "@/components/EmptyState.vue";
import PageHeader from "@/components/PageHeader.vue";
import MoneyText from "@/components/MoneyText.vue";
import { formatVnDate } from "@/lib/dates";
import { matchesText } from "@/lib/search";

const store = useClassesStore();
const router = useRouter();
const items = ref<Class[]>([]);
const search = ref("");
const showForm = ref(false);

const filteredItems = computed(() =>
  search.value.trim()
    ? items.value.filter((c) => matchesText(c.name, search.value))
    : items.value,
);

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

function openDetail(_e: unknown, row: { item: Class }): void {
  router.push({ name: "admin-class-detail", params: { classId: row.item.id } });
}
</script>

<template>
  <div>
    <PageHeader
      title="Lớp học"
      subtitle="Quản lý lớp, lịch tuần và đơn giá"
      icon="mdi-google-classroom"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="showForm = true"
        >
          Thêm lớp
        </v-btn>
      </template>
    </PageHeader>

    <v-card v-if="items.length === 0">
      <EmptyState
        title="Chưa có lớp nào"
        subtitle="Bấm 'Thêm lớp' để tạo lớp đầu tiên."
        icon="mdi-google-classroom"
      >
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="showForm = true"
        >
          Thêm lớp
        </v-btn>
      </EmptyState>
    </v-card>

    <template v-else>
      <v-text-field
        v-model="search"
        placeholder="Tìm theo tên lớp…"
        prepend-inner-icon="mdi-magnify"
        clearable
        density="comfortable"
        hide-details
        class="mb-3"
        style="max-width: 360px;"
      />
      <v-card>
        <v-data-table
          :headers="[
            { title: 'Tên lớp', key: 'name' },
            { title: 'Bắt đầu', key: 'startDate' },
            { title: 'Kết thúc', key: 'endDate' },
            { title: 'Lịch tuần', key: 'days' },
            { title: 'Đơn giá', key: 'rate', align: 'end' },
            { title: '', key: 'actions', sortable: false, align: 'end' },
          ]"
          :items="filteredItems"
          no-data-text="Không tìm thấy lớp phù hợp"
          density="comfortable"
          @click:row="openDetail"
        >
        <template #[`item.name`]="{ item }">
          <div class="d-flex align-center ga-3 py-1">
            <v-avatar
              color="primary"
              variant="tonal"
              rounded="lg"
              size="36"
            >
              <v-icon
                icon="mdi-book-open-variant"
                size="small"
              />
            </v-avatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template #[`item.startDate`]="{ item }">
          {{ formatVnDate(item.startDate) }}
        </template>
        <template #[`item.endDate`]="{ item }">
          {{ formatVnDate(item.endDate) }}
        </template>
        <template #[`item.days`]="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="d in dayLabels(item).split(', ').filter(Boolean)"
              :key="d"
              size="x-small"
              color="primary"
              variant="tonal"
            >
              {{ d }}
            </v-chip>
          </div>
        </template>
        <template #[`item.rate`]="{ item }">
          <MoneyText
            :value="currentRate(item)"
            class="font-weight-medium"
          />
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn
            variant="text"
            size="small"
            color="primary"
            append-icon="mdi-chevron-right"
            @click.stop="router.push({ name: 'admin-class-detail', params: { classId: item.id } })"
          >
            Chi tiết
          </v-btn>
        </template>
        </v-data-table>
      </v-card>
    </template>

    <ClassFormDialog
      v-model="showForm"
      title="Thêm lớp mới"
      @submit="onSubmit"
    />
  </div>
</template>
