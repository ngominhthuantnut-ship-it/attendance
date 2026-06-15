<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import type { Class } from "@/types";
import { todayISO, dayKeyOf } from "@/lib/dates";

const classes = useClassesStore();
const students = useStudentsStore();
const today = todayISO();
const todayKey = dayKeyOf(today);
const classCount = ref(0);
const studentCount = ref(0);
const todaysClasses = ref<Class[]>([]);

onMounted(async () => {
  const all = await classes.list("active");
  classCount.value = all.length;
  let total = 0;
  for (const c of all) {
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
    <h2 class="text-h5 mb-4">
      Tổng quan
    </h2>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="3"
      >
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">
            Số lớp đang dạy
          </div>
          <div class="text-h4">
            {{ classCount }}
          </div>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
      >
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">
            Tổng học sinh
          </div>
          <div class="text-h4">
            {{ studentCount }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <h3 class="text-h6 mt-6 mb-2">
      Buổi học hôm nay
    </h3>
    <v-list>
      <v-list-item
        v-for="c in todaysClasses"
        :key="c.id"
        :title="c.name"
        :to="{ name: 'admin-attendance', params: { classId: c.id, date: today } }"
      />
    </v-list>
  </div>
</template>
