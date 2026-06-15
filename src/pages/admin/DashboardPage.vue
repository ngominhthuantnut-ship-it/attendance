<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import type { Class } from "@/types";
import { todayISO, dayKeyOf, formatVnDate, compareDate } from "@/lib/dates";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";

const classes = useClassesStore();
const students = useStudentsStore();
const today = todayISO();
const todayKey = dayKeyOf(today);
const classCount = ref(0);
const studentCount = ref(0);
const todaysClasses = ref<Class[]>([]);

onMounted(async () => {
  const all = await classes.list("active");
  // "Đang dạy" = lớp chưa kết thúc (endDate >= hôm nay). Status active vẫn có thể là lớp đã hết hạn.
  const ongoing = all.filter((c) => compareDate(c.endDate, today) >= 0);
  classCount.value = ongoing.length;
  let total = 0;
  for (const c of ongoing) {
    const list = await students.listByClass(c.id, "active");
    total += list.length;
    if (c.weeklySchedule[todayKey] && !c.excludedDates.includes(today)) {
      todaysClasses.value.push(c);
    }
  }
  studentCount.value = total;
});
</script>

<template>
  <div>
    <PageHeader
      title="Tổng quan"
      :subtitle="`Hôm nay, ${formatVnDate(today)}`"
    />

    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-card class="pa-5">
          <div class="d-flex align-center ga-4">
            <v-avatar
              color="primary"
              rounded="lg"
              size="48"
              variant="tonal"
            >
              <v-icon icon="mdi-google-classroom" />
            </v-avatar>
            <div>
              <div class="text-body-medium text-medium-emphasis">
                Số lớp đang dạy
              </div>
              <div class="text-headline-large font-weight-bold">
                {{ classCount }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-card class="pa-5">
          <div class="d-flex align-center ga-4">
            <v-avatar
              color="secondary"
              rounded="lg"
              size="48"
              variant="tonal"
            >
              <v-icon icon="mdi-account-group-outline" />
            </v-avatar>
            <div>
              <div class="text-body-medium text-medium-emphasis">
                Tổng học sinh
              </div>
              <div class="text-headline-large font-weight-bold">
                {{ studentCount }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <h2 class="text-title-large font-weight-bold mt-8 mb-3">
      Buổi học hôm nay
    </h2>
    <v-card>
      <EmptyState
        v-if="todaysClasses.length === 0"
        title="Hôm nay không có buổi học"
        subtitle="Các lớp có lịch học hôm nay sẽ hiện ở đây."
        icon="mdi-calendar-blank-outline"
      />
      <v-list
        v-else
        lines="one"
      >
        <template
          v-for="(c, i) in todaysClasses"
          :key="c.id"
        >
          <v-divider v-if="i > 0" />
          <v-list-item
            :title="c.name"
            :to="{ name: 'admin-attendance', params: { classId: c.id, date: today } }"
            prepend-icon="mdi-calendar-check-outline"
            append-icon="mdi-chevron-right"
          />
        </template>
      </v-list>
    </v-card>
  </div>
</template>
