<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { Class, MonthDoc, Student } from "@/types";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO } from "@/lib/dates";
import ParentLinkCard from "@/components/ParentLinkCard.vue";
import MonthPicker from "@/components/MonthPicker.vue";
import MoneyText from "@/components/MoneyText.vue";
import AttendanceStatusBadge from "@/components/AttendanceStatusBadge.vue";
import { parentInvoiceUrl } from "@/services/parentLinkUrl";

const props = defineProps<{ studentId: string }>();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const student = ref<Student | null>(null);
const cls = ref<Class | null>(null);
const month = ref(monthOf(todayISO()));
const monthDoc = ref<MonthDoc | null>(null);
const tab = ref<"schedule" | "billing">("schedule");

async function reload(): Promise<void> {
  student.value = await students.get(props.studentId);
  if (student.value) {
    cls.value = await classes.get(student.value.classId);
  }
}
onMounted(reload);

watch(month, async () => {
  if (!student.value) return;
  monthDoc.value = await months.get(student.value.id, month.value, false);
});

watch(student, async () => {
  if (student.value) monthDoc.value = await months.get(student.value.id, month.value, false);
});

const result = computed(() => {
  if (!student.value || !cls.value) return null;
  return computeMonth({ cls: cls.value, student: student.value, monthDoc: monthDoc.value, yearMonth: month.value });
});

const invoiceUrl = computed(() =>
  student.value ? parentInvoiceUrl(student.value.parentLinkToken, month.value) : "",
);

async function markPaid(): Promise<void> {
  if (!student.value || !result.value) return;
  await months.markPaid(student.value.id, month.value, result.value.totals.confirmedAmount);
  monthDoc.value = await months.get(student.value.id, month.value, false);
}

async function unmarkPaid(): Promise<void> {
  if (!student.value) return;
  await months.unmarkPaid(student.value.id, month.value);
  monthDoc.value = await months.get(student.value.id, month.value, false);
}
</script>

<template>
  <div v-if="student && cls">
    <h2 class="text-h5 mb-2">
      {{ student.name }}
    </h2>
    <p class="text-body-2 mb-4 text-medium-emphasis">
      Lớp: {{ cls.name }}
    </p>

    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <ParentLinkCard :token="student.parentLinkToken" />
      </v-col>
      <v-col
        cols="12"
        md="8"
      >
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <MonthPicker v-model="month" />
            <v-spacer />
            <v-btn-toggle
              v-model="tab"
              mandatory="force"
              density="comfortable"
            >
              <v-btn value="schedule">
                Lịch & điểm danh
              </v-btn>
              <v-btn value="billing">
                Học phí
              </v-btn>
            </v-btn-toggle>
          </div>

          <v-divider class="my-3" />

          <template v-if="tab === 'schedule' && result">
            <v-list density="compact">
              <v-list-item
                v-for="s in result.sessions"
                :key="s.date"
              >
                <v-list-item-title>{{ s.date }} ({{ s.start }}–{{ s.end }})</v-list-item-title>
                <template #append>
                  <AttendanceStatusBadge :status="s.status" />
                </template>
              </v-list-item>
            </v-list>
          </template>

          <template v-else-if="tab === 'billing' && result">
            <p>Buổi đã marked: {{ result.totals.sessionCount - result.totals.unmarked }}/{{ result.totals.sessionCount }}</p>
            <p>Confirmed: <MoneyText :value="result.totals.confirmedAmount" /></p>
            <p>Projected: <MoneyText :value="result.totals.projectedAmount" /></p>
            <v-alert
              v-for="(w, i) in result.warnings"
              :key="i"
              type="warning"
              class="my-2"
            >
              {{ w }}
            </v-alert>

            <div class="d-flex align-center mt-4">
              <v-chip :color="result.paymentStatus === 'paid' ? 'success' : 'warning'">
                {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
              </v-chip>
              <v-spacer />
              <v-btn
                v-if="result.paymentStatus === 'unpaid'"
                color="primary"
                @click="markPaid"
              >
                Đánh dấu đã thu
              </v-btn>
              <v-btn
                v-else
                variant="text"
                color="error"
                @click="unmarkPaid"
              >
                Bỏ đánh dấu
              </v-btn>
            </div>

            <v-divider class="my-3" />
            <p class="text-body-2">
              Link hoá đơn (gửi phụ huynh):
            </p>
            <v-text-field
              :model-value="invoiceUrl"
              readonly
              density="compact"
              hide-details
            />
          </template>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
