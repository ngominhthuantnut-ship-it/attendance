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
import { formatVnDate } from "@/lib/dates";
import { sanitizeNoteHtml } from "@/lib/sanitizeHtml";

const props = defineProps<{ studentId: string }>();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const student = ref<Student | null>(null);
const cls = ref<Class | null>(null);
const month = ref(monthOf(todayISO()));
const monthDoc = ref<MonthDoc | null>(null);
const tab = ref<"schedule" | "billing">("schedule");
const expandedNotes = ref<Set<string>>(new Set());

function toggleNote(date: string): void {
  const next = new Set(expandedNotes.value);
  if (next.has(date)) next.delete(date);
  else next.add(date);
  expandedNotes.value = next;
}

async function reload(): Promise<void> {
  student.value = await students.get(props.studentId);
  if (student.value) {
    cls.value = await classes.get(student.value.classId);
    if (!student.value.lookupCode) {
      const code = await students.ensureLookupCode(student.value);
      student.value = { ...student.value, lookupCode: code };
    }
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

const invoiceCopied = ref(false);
async function copyInvoice(): Promise<void> {
  if (!invoiceUrl.value) return;
  await navigator.clipboard.writeText(invoiceUrl.value);
  invoiceCopied.value = true;
  setTimeout(() => (invoiceCopied.value = false), 1500);
}

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
    <v-btn
      variant="text"
      size="small"
      prepend-icon="mdi-arrow-left"
      class="mb-3 ms-n2"
      @click="$router.back()"
    >
      Quay lại
    </v-btn>
    <div class="d-flex align-center ga-4 mb-6">
      <v-avatar
        color="primary"
        variant="tonal"
        size="56"
      >
        <span class="text-title-large font-weight-bold">{{ student.name.trim().slice(0, 1).toUpperCase() }}</span>
      </v-avatar>
      <div>
        <h1 class="text-headline-medium font-weight-bold">
          {{ student.name }}
        </h1>
        <v-chip
          size="small"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-google-classroom"
          class="mt-1"
        >
          {{ cls.name }}
        </v-chip>
      </div>
    </div>

    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <ParentLinkCard
          :token="student.parentLinkToken"
          :code="student.lookupCode"
        />
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
            <v-list
              lines="one"
              class="pa-0"
            >
              <template
                v-for="(s, i) in result.sessions"
                :key="s.date"
              >
                <v-divider v-if="i > 0" />
                <v-list-item
                  :title="formatVnDate(s.date)"
                  :subtitle="`${s.start}–${s.end}${s.source === 'added' ? ' · Buổi bù' : ''}`"
                >
                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <v-btn
                        v-if="s.note"
                        :icon="expandedNotes.has(s.date) ? 'mdi-note-text' : 'mdi-note-text-outline'"
                        :title="expandedNotes.has(s.date) ? 'Ẩn ghi chú' : 'Xem ghi chú'"
                        variant="text"
                        size="small"
                        color="primary"
                        @click="toggleNote(s.date)"
                      />
                      <AttendanceStatusBadge :status="s.status" />
                    </div>
                  </template>
                </v-list-item>
                <v-expand-transition>
                  <div
                    v-if="s.note && expandedNotes.has(s.date)"
                    class="px-4 pb-3"
                  >
                    <v-alert
                      type="info"
                      variant="tonal"
                      density="compact"
                      icon="mdi-note-text-outline"
                    >
                      <div class="text-body-small text-medium-emphasis mb-1">
                        Ghi chú của giáo viên
                      </div>
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <div
                        class="note-html"
                        v-html="sanitizeNoteHtml(s.note ?? '')"
                      />
                    </v-alert>
                  </div>
                </v-expand-transition>
              </template>
            </v-list>
          </template>

          <template v-else-if="tab === 'billing' && result">
            <div class="d-flex justify-space-between align-center py-2">
              <span class="text-medium-emphasis">Buổi đã điểm danh</span>
              <span class="font-weight-medium">{{ result.totals.sessionCount - result.totals.unmarked }}/{{ result.totals.sessionCount }}</span>
            </div>
            <v-divider />
            <div class="d-flex justify-space-between align-center py-2">
              <span class="text-medium-emphasis">Đã chốt</span>
              <MoneyText
                :value="result.totals.confirmedAmount"
                class="text-title-medium font-weight-bold"
              />
            </div>
            <v-divider />
            <div class="d-flex justify-space-between align-center py-2">
              <span class="text-medium-emphasis">Dự kiến cả tháng</span>
              <MoneyText
                :value="result.totals.projectedAmount"
                class="font-weight-medium text-medium-emphasis"
              />
            </div>

            <v-alert
              v-for="(w, i) in result.warnings"
              :key="i"
              type="warning"
              class="my-2"
            >
              {{ w }}
            </v-alert>

            <div class="d-flex align-center ga-2 mt-4">
              <v-chip
                :color="result.paymentStatus === 'paid' ? 'success' : 'warning'"
                :prepend-icon="result.paymentStatus === 'paid' ? 'mdi-check-circle' : 'mdi-clock-outline'"
                variant="tonal"
              >
                {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
              </v-chip>
              <v-spacer />
              <v-btn
                v-if="result.paymentStatus === 'unpaid'"
                color="primary"
                variant="flat"
                prepend-icon="mdi-cash-check"
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

            <v-divider class="my-4" />
            <p class="text-title-small mb-2">
              Link hoá đơn (gửi phụ huynh)
            </p>
            <v-text-field
              :model-value="invoiceUrl"
              readonly
              density="comfortable"
              hide-details
              prepend-inner-icon="mdi-link-variant"
            >
              <template #append-inner>
                <v-btn
                  :icon="invoiceCopied ? 'mdi-check' : 'mdi-content-copy'"
                  :color="invoiceCopied ? 'success' : 'primary'"
                  variant="text"
                  size="small"
                  title="Copy link hoá đơn"
                  @click="copyInvoice"
                />
              </template>
            </v-text-field>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
