<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { formatVnDate, formatVnd } from "@/lib/dates";
import type { MonthDoc } from "@/types";

const props = defineProps<{ token: string; yearMonth: string }>();
const parent = useParentStore();
const monthDoc = ref<MonthDoc | null>(null);

async function load(): Promise<void> {
  if (parent.student) monthDoc.value = await parent.getMonth(parent.student.id, props.yearMonth);
}
onMounted(load);
watch(() => props.yearMonth, load);

const result = computed(() => {
  if (!parent.cls || !parent.student) return null;
  return computeMonth({ cls: parent.cls, student: parent.student, monthDoc: monthDoc.value, yearMonth: props.yearMonth });
});

const monthLabel = computed(() => {
  const [y, m] = props.yearMonth.split("-");
  return `Tháng ${m}/${y}`;
});
void props.token;
</script>

<template>
  <div v-if="parent.student && parent.cls && result">
    <v-card class="pa-4">
      <h2 class="text-headline-small text-center">
        HOÁ ĐƠN HỌC PHÍ
      </h2>
      <p class="text-center text-body-medium">
        {{ monthLabel }}
      </p>
      <v-divider class="my-3" />
      <p><strong>Học sinh:</strong> {{ parent.student.name }}</p>
      <p><strong>Lớp:</strong> {{ parent.cls.name }}</p>
      <v-divider class="my-3" />
      <table class="w-100">
        <thead>
          <tr>
            <th class="text-left">
              STT
            </th>
            <th class="text-left">
              Ngày
            </th>
            <th class="text-left">
              Giờ
            </th>
            <th class="text-left">
              Trạng thái
            </th>
            <th class="text-right">
              Đơn giá
            </th>
            <th class="text-right">
              Thành tiền
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(s, i) in result.sessions"
            :key="s.date"
          >
            <td>{{ i + 1 }}</td>
            <td>{{ formatVnDate(s.date) }}</td>
            <td>{{ s.start }}–{{ s.end }}</td>
            <td>
              <span v-if="s.status === 'present'">Có đi học</span>
              <span v-else-if="s.status === 'excused'">Vắng có phép</span>
              <span v-else-if="s.status === 'absent'">Vắng không phép</span>
              <span
                v-else
                class="text-medium-emphasis"
              >Chưa điểm danh</span>
            </td>
            <td class="text-right">
              {{ formatVnd(s.rate) }}
            </td>
            <td class="text-right">
              {{ s.billable ? formatVnd(s.amount) : "—" }}
            </td>
          </tr>
        </tbody>
      </table>
      <v-divider class="my-3" />
      <div class="d-flex">
        <strong>Tổng cộng:</strong>
        <v-spacer />
        <strong>{{ formatVnd(result.totals.confirmedAmount) }}</strong>
      </div>
      <div class="d-flex mt-2">
        <span>Trạng thái:</span>
        <v-spacer />
        <v-chip
          :color="result.paymentStatus === 'paid' ? 'success' : 'warning'"
          size="small"
        >
          {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
        </v-chip>
      </div>
      <p
        v-if="result.paidInfo?.note"
        class="mt-2 text-body-medium"
      >
        Ghi chú: {{ result.paidInfo.note }}
      </p>
    </v-card>
  </div>
</template>

<style scoped>
table { border-collapse: collapse; }
th, td { padding: 6px 4px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.w-100 { width: 100%; }
</style>
