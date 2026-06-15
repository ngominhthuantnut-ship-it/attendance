<script setup lang="ts">
import { ref, computed } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { expandSchedule } from "@/composables/useScheduleCompute";
import { monthOf, todayISO, monthStart, monthEnd, formatVnDate, vnDayLabel } from "@/lib/dates";
import MonthPicker from "@/components/MonthPicker.vue";

const parent = useParentStore();
const month = ref(monthOf(todayISO()));

const sessions = computed(() => {
  if (!parent.cls || !parent.student) return [];
  return expandSchedule({
    cls: parent.cls,
    from: monthStart(month.value),
    to: monthEnd(month.value),
    studentStart: parent.student.startDate,
    studentEnd: parent.student.endDate,
  });
});
</script>

<template>
  <div>
    <MonthPicker v-model="month" />
    <v-list
      density="comfortable"
      class="mt-3"
    >
      <v-list-item
        v-for="s in sessions"
        :key="s.date"
        :title="`${vnDayLabel(s.date)}, ${formatVnDate(s.date)}`"
        :subtitle="`${s.start} – ${s.end}${s.source === 'added' ? ' (bù)' : ''}`"
      />
    </v-list>
    <v-alert
      v-if="sessions.length === 0"
      type="info"
      class="mt-3"
    >
      Không có buổi học nào trong tháng này.
    </v-alert>
  </div>
</template>
