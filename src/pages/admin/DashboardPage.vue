<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { expandSchedule } from "@/composables/useScheduleCompute";
import { todayISO, formatVnDate, compareDate } from "@/lib/dates";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";

interface TodaySession {
  classId: string;
  className: string;
  start: string;
  end: string;
  source: "weekly" | "added";
}

const classes = useClassesStore();
const students = useStudentsStore();
const today = todayISO();
const classCount = ref(0);
const studentCount = ref(0);
const todaySessions = ref<TodaySession[]>([]);

onMounted(async () => {
  const all = await classes.list("active");
  // "Đang dạy" = lớp chưa kết thúc (endDate >= hôm nay). Status active vẫn có thể là lớp đã hết hạn.
  const ongoing = all.filter((c) => compareDate(c.endDate, today) >= 0);
  classCount.value = ongoing.length;
  let total = 0;
  const sessions: TodaySession[] = [];
  for (const c of ongoing) {
    const list = await students.listByClass(c.id, "active");
    total += list.length;
    // expandSchedule xử lý đúng lịch tuần + buổi bù + buổi đã huỷ trong ngày hôm nay.
    for (const s of expandSchedule({ cls: c, from: today, to: today })) {
      sessions.push({ classId: c.id, className: c.name, start: s.start, end: s.end, source: s.source });
    }
  }
  sessions.sort((a, b) => a.start.localeCompare(b.start));
  todaySessions.value = sessions;
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

    <div class="d-flex align-center ga-2 mt-8 mb-3">
      <h2 class="text-title-large font-weight-bold">
        Lịch dạy hôm nay
      </h2>
      <v-chip
        v-if="todaySessions.length"
        size="small"
        color="primary"
        variant="tonal"
      >
        {{ todaySessions.length }} buổi
      </v-chip>
    </div>

    <v-card class="pa-2 pa-sm-4">
      <EmptyState
        v-if="todaySessions.length === 0"
        title="Hôm nay không có buổi dạy"
        subtitle="Các buổi học trong ngày hôm nay sẽ hiện ở đây theo khung giờ."
        icon="mdi-calendar-blank-outline"
      />
      <v-timeline
        v-else
        side="end"
        align="start"
        density="comfortable"
        truncate-line="both"
      >
        <v-timeline-item
          v-for="(s, i) in todaySessions"
          :key="i"
          dot-color="primary"
          icon="mdi-clock-outline"
          size="small"
        >
          <template #opposite>
            <span class="text-body-large font-weight-bold tnum">{{ s.start }}</span>
          </template>
          <v-card
            border
            rounded="lg"
            :to="{ name: 'admin-attendance', params: { classId: s.classId, date: today } }"
          >
            <div class="pa-3 d-flex align-center justify-space-between ga-3">
              <div>
                <div class="font-weight-medium">
                  {{ s.className }}
                  <v-chip
                    v-if="s.source === 'added'"
                    size="x-small"
                    color="secondary"
                    variant="tonal"
                    class="ml-1"
                  >
                    Bù
                  </v-chip>
                </div>
                <div class="text-body-small text-medium-emphasis tnum">
                  {{ s.start }} – {{ s.end }}
                </div>
              </div>
              <v-icon
                icon="mdi-chevron-right"
                class="text-medium-emphasis"
              />
            </div>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </v-card>
  </div>
</template>
