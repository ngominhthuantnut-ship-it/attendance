<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO, formatVnDate } from "@/lib/dates";
import type { MonthDoc } from "@/types";
import MonthPicker from "@/components/MonthPicker.vue";
import AttendanceStatusBadge from "@/components/AttendanceStatusBadge.vue";

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
  <div>
    <MonthPicker v-model="month" />
    <v-list
      v-if="result"
      class="mt-3"
    >
      <template
        v-for="s in result.sessions"
        :key="s.date"
      >
        <v-list-item
          :title="formatVnDate(s.date)"
          :subtitle="`${s.start} – ${s.end}`"
        >
          <template #append>
            <div class="d-flex align-center ga-2">
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
  </div>
</template>
