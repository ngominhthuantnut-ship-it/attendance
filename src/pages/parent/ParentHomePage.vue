<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO, formatVnDate } from "@/lib/dates";
import type { MonthDoc } from "@/types";
import MoneyText from "@/components/MoneyText.vue";

const props = defineProps<{ token: string }>();
const parent = useParentStore();
const monthYM = monthOf(todayISO());
const monthDoc = ref<MonthDoc | null>(null);

onMounted(async () => {
  if (parent.student) {
    monthDoc.value = await parent.getMonth(parent.student.id, monthYM);
  }
});

const result = computed(() => {
  if (!parent.student || !parent.cls) return null;
  return computeMonth({
    cls: parent.cls,
    student: parent.student,
    monthDoc: monthDoc.value,
    yearMonth: monthYM,
  });
});

const dayLabel = computed(() => {
  if (!parent.cls) return "";
  const labels: Record<string, string> = { mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN" };
  return Object.keys(parent.cls.weeklySchedule).map((k) => labels[k]).join(", ");
});

void props;
</script>

<template>
  <div v-if="parent.student && parent.cls">
    <v-card
      class="pa-4 mb-3"
      variant="tonal"
      color="primary"
    >
      <p class="text-body-2">
        Học sinh
      </p>
      <p class="text-h5 mb-2">
        {{ parent.student.name }}
      </p>
      <p class="text-body-2">
        Lớp <strong>{{ parent.cls.name }}</strong>
      </p>
      <p class="text-body-2">
        Lịch học: {{ dayLabel }}
      </p>
      <p class="text-caption text-medium-emphasis">
        {{ formatVnDate(parent.cls.startDate) }} – {{ formatVnDate(parent.cls.endDate) }}
      </p>
    </v-card>

    <v-card
      v-if="result"
      class="pa-4 mb-3"
    >
      <p class="text-subtitle-2">
        Tháng này
      </p>
      <p>Số buổi đã học: {{ result.totals.present + result.totals.absent }}</p>
      <p>Tổng phí: <MoneyText :value="result.totals.confirmedAmount" /></p>
      <v-chip
        :color="result.paymentStatus === 'paid' ? 'success' : 'warning'"
        size="small"
      >
        {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
      </v-chip>
    </v-card>
  </div>
</template>
