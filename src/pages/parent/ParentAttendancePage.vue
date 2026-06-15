<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO, formatVnDate, vnDayLabel } from "@/lib/dates";
import type { MonthDoc } from "@/types";
import MonthPicker from "@/components/MonthPicker.vue";
import AttendanceStatusBadge from "@/components/AttendanceStatusBadge.vue";
import EmptyState from "@/components/EmptyState.vue";

const parent = useParentStore();
const month = ref(monthOf(todayISO()));
const monthDoc = ref<MonthDoc | null>(null);
const expandedNotes = ref<Set<string>>(new Set());

function toggleNote(date: string): void {
  const next = new Set(expandedNotes.value);
  if (next.has(date)) next.delete(date);
  else next.add(date);
  expandedNotes.value = next;
}

async function load(): Promise<void> {
  if (parent.student) monthDoc.value = await parent.getMonth(parent.student.id, month.value);
}
onMounted(load);
watch(month, load);

const result = computed(() => {
  if (!parent.cls || !parent.student) return null;
  return computeMonth({ cls: parent.cls, student: parent.student, monthDoc: monthDoc.value, yearMonth: month.value });
});
</script>

<template>
  <div
    class="mx-auto"
    style="max-width: 560px;"
  >
    <div class="d-flex align-center justify-space-between mb-3">
      <h1 class="text-headline-small font-weight-bold">
        Điểm danh
      </h1>
      <MonthPicker v-model="month" />
    </div>

    <v-card
      v-if="result"
      rounded="xl"
      class="pa-4 mb-3"
    >
      <div class="d-flex flex-wrap ga-2">
        <v-chip
          color="success"
          variant="tonal"
          size="small"
          prepend-icon="mdi-check-circle"
        >
          Có mặt {{ result.totals.present }}
        </v-chip>
        <v-chip
          color="info"
          variant="tonal"
          size="small"
          prepend-icon="mdi-account-clock"
        >
          Có phép {{ result.totals.excused }}
        </v-chip>
        <v-chip
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-close-circle"
        >
          Vắng {{ result.totals.absent }}
        </v-chip>
      </div>
    </v-card>

    <v-card
      v-if="result"
      rounded="xl"
    >
      <EmptyState
        v-if="result.sessions.length === 0"
        title="Chưa có buổi học trong tháng"
        subtitle="Chọn tháng khác để xem."
        icon="mdi-calendar-blank-outline"
      />
      <v-list
        v-else
        lines="two"
        class="py-0"
      >
        <template
          v-for="(s, i) in result.sessions"
          :key="s.date"
        >
          <v-divider v-if="i > 0" />
          <v-list-item class="py-2">
            <template #prepend>
              <v-avatar
                color="surface-variant"
                rounded="lg"
                size="44"
              >
                <div class="text-center">
                  <div
                    class="text-title-small font-weight-bold"
                    style="line-height: 1;"
                  >
                    {{ Number(s.date.slice(8, 10)) }}
                  </div>
                  <div
                    class="text-body-small text-medium-emphasis"
                    style="line-height: 1.1;"
                  >
                    {{ vnDayLabel(s.date) }}
                  </div>
                </div>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium">
              {{ formatVnDate(s.date) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ s.start }} – {{ s.end }}<template v-if="s.source === 'added'"> · Buổi bù</template>
            </v-list-item-subtitle>
            <template #append>
              <div class="d-flex align-center ga-1">
                <v-btn
                  v-if="s.note"
                  :icon="expandedNotes.has(s.date) ? 'mdi-note-text' : 'mdi-note-text-outline'"
                  :title="expandedNotes.has(s.date) ? 'Ẩn nhận xét' : 'Xem nhận xét'"
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
                  Nhận xét của giáo viên
                </div>
                <div style="white-space: pre-wrap;">
                  {{ s.note }}
                </div>
              </v-alert>
            </div>
          </v-expand-transition>
        </template>
      </v-list>
    </v-card>
  </div>
</template>
