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
      <v-list-item
        v-for="s in result.sessions"
        :key="s.date"
        :title="formatVnDate(s.date)"
        :subtitle="`${s.start} – ${s.end}`"
      >
        <template #append>
          <AttendanceStatusBadge :status="s.status" />
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>
