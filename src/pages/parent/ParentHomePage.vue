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

const initial = computed(() => parent.student?.name.trim().slice(0, 1).toUpperCase() ?? "?");
const monthLabel = computed(() => {
  const [y, m] = monthYM.split("-");
  return `tháng ${Number(m)}/${y}`;
});

void props;
</script>

<template>
  <div
    v-if="parent.student && parent.cls"
    class="mx-auto"
    style="max-width: 560px;"
  >
    <!-- Hero: học sinh -->
    <v-card
      color="primary"
      variant="flat"
      rounded="xl"
      class="text-white pa-5 mb-4"
    >
      <div class="d-flex align-center ga-4">
        <v-avatar
          size="56"
          color="white"
        >
          <span class="text-title-large font-weight-bold text-primary">{{ initial }}</span>
        </v-avatar>
        <div class="flex-grow-1">
          <div class="text-title-medium font-weight-bold">
            {{ parent.student.name }}
          </div>
          <v-chip
            size="small"
            color="white"
            variant="flat"
            class="text-primary font-weight-medium mt-1"
          >
            {{ parent.cls.name }}
          </v-chip>
        </div>
      </div>
      <div
        class="mt-4 d-flex flex-column ga-2 text-body-medium"
        style="opacity: 0.95;"
      >
        <div class="d-flex align-center ga-2">
          <v-icon
            icon="mdi-calendar-week"
            size="small"
          />
          Lịch học: {{ dayLabel || "—" }}
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon
            icon="mdi-calendar-range"
            size="small"
          />
          {{ formatVnDate(parent.cls.startDate) }} – {{ formatVnDate(parent.cls.endDate) }}
        </div>
      </div>
    </v-card>

    <!-- Học phí -->
    <v-card
      v-if="result"
      rounded="xl"
      class="mb-4"
    >
      <div class="pa-5">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-title-small text-medium-emphasis text-capitalize">Học phí {{ monthLabel }}</span>
          <v-chip
            :color="result.paymentStatus === 'paid' ? 'success' : 'warning'"
            :prepend-icon="result.paymentStatus === 'paid' ? 'mdi-check-circle' : 'mdi-clock-outline'"
            size="small"
            variant="tonal"
          >
            {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
          </v-chip>
        </div>
        <MoneyText
          :value="result.totals.confirmedAmount"
          class="text-headline-medium font-weight-bold"
        />
        <div class="text-body-small text-medium-emphasis mt-1">
          {{ result.totals.present + result.totals.absent }} buổi đã học
        </div>
      </div>

      <template v-if="qrUrl">
        <v-divider />
        <div class="pa-5 text-center">
          <p class="text-title-small font-weight-medium mb-1">
            Quét mã để chuyển học phí
          </p>
          <p class="text-body-small text-medium-emphasis mb-4">
            Số tiền và nội dung đã được điền sẵn trong mã
          </p>
          <v-sheet
            border
            rounded="lg"
            class="d-inline-block pa-3"
          >
            <img
              :src="qrUrl"
              alt="QR chuyển khoản học phí"
              width="220"
              height="220"
              style="display: block; width: 220px; height: auto;"
            >
          </v-sheet>
          <div class="mt-3">
            <MoneyText
              :value="result.totals.confirmedAmount"
              class="text-title-medium font-weight-bold text-primary"
            />
          </div>
        </div>
      </template>
    </v-card>
  </div>
</template>
