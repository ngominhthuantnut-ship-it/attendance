<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { useConfigStore } from "@/stores/useConfigStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO, formatVnDate } from "@/lib/dates";
import { buildSepayQrUrl, buildTransferDescription, isPaymentConfigured } from "@/lib/payment";
import type { MonthDoc } from "@/types";
import MoneyText from "@/components/MoneyText.vue";

const props = defineProps<{ token: string }>();
const parent = useParentStore();
const config = useConfigStore();
const monthYM = monthOf(todayISO());
const monthDoc = ref<MonthDoc | null>(null);

onMounted(async () => {
  void config.load().catch(() => undefined);
  if (parent.student) {
    monthDoc.value = await parent.getMonth(parent.student.id, monthYM);
  }
});

const qrUrl = computed(() => {
  const p = config.payment;
  const r = result.value;
  if (!r || !parent.student) return null;
  if (r.paymentStatus === "paid" || r.totals.confirmedAmount <= 0) return null;
  if (!isPaymentConfigured(p)) return null;
  const des = buildTransferDescription(parent.student.name, monthYM);
  return buildSepayQrUrl(p, r.totals.confirmedAmount, des);
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
      <p class="text-body-medium">
        Học sinh
      </p>
      <p class="text-headline-medium mb-2">
        {{ parent.student.name }}
      </p>
      <p class="text-body-medium">
        Lớp <strong>{{ parent.cls.name }}</strong>
      </p>
      <p class="text-body-medium">
        Lịch học: {{ dayLabel }}
      </p>
      <p class="text-body-small text-medium-emphasis">
        {{ formatVnDate(parent.cls.startDate) }} – {{ formatVnDate(parent.cls.endDate) }}
      </p>
    </v-card>

    <v-card
      v-if="result"
      class="pa-4 mb-3"
    >
      <p class="text-title-small">
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

      <div
        v-if="qrUrl"
        class="text-center mt-4"
      >
        <v-divider class="mb-3" />
        <p class="text-title-small mb-2">
          Quét mã để chuyển học phí
        </p>
        <img
          :src="qrUrl"
          alt="QR chuyển khoản học phí"
          style="max-width: 260px; width: 100%; height: auto;"
        >
        <p class="text-body-small text-medium-emphasis mt-2">
          Số tiền: <MoneyText :value="result.totals.confirmedAmount" />
        </p>
      </div>
    </v-card>
  </div>
</template>
