<script setup lang="ts">
import { computed } from "vue";
import type { AttendanceStatus } from "@/types";

const props = defineProps<{ status: "unmarked" | AttendanceStatus }>();

const map: Record<typeof props.status, { color: string; label: string; icon: string }> = {
  unmarked: { color: "grey", label: "Chưa điểm danh", icon: "mdi-help-circle-outline" },
  present: { color: "success", label: "Có đi học", icon: "mdi-check-circle" },
  excused: { color: "info", label: "Vắng có phép", icon: "mdi-account-clock" },
  absent: { color: "error", label: "Vắng không phép", icon: "mdi-close-circle" },
};
const cfg = computed(() => map[props.status]);
</script>

<template>
  <v-chip
    :color="cfg.color"
    :prepend-icon="cfg.icon"
    size="small"
    variant="tonal"
  >
    {{ cfg.label }}
  </v-chip>
</template>
