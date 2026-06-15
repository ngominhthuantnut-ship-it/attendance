<script setup lang="ts">
import { computed } from "vue";
import type { DayKey, WeeklySchedule } from "@/types";

const props = defineProps<{ modelValue: WeeklySchedule }>();
const emit = defineEmits<{ "update:modelValue": [WeeklySchedule] }>();

const days: { key: DayKey; label: string }[] = [
  { key: "mon", label: "T2" },
  { key: "tue", label: "T3" },
  { key: "wed", label: "T4" },
  { key: "thu", label: "T5" },
  { key: "fri", label: "T6" },
  { key: "sat", label: "T7" },
  { key: "sun", label: "CN" },
];

const local = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function toggle(key: DayKey): void {
  const copy = { ...local.value };
  if (copy[key]) delete copy[key];
  else copy[key] = { start: "18:00", end: "19:30" };
  local.value = copy;
}

function update(key: DayKey, field: "start" | "end", value: string): void {
  const cur = local.value[key];
  if (!cur) return;
  local.value = { ...local.value, [key]: { ...cur, [field]: value } };
}
</script>

<template>
  <v-row dense>
    <v-col
      v-for="d in days"
      :key="d.key"
      cols="12"
      sm="6"
    >
      <v-card
        variant="outlined"
        class="pa-3"
      >
        <div class="d-flex align-center mb-2">
          <v-checkbox-btn
            :model-value="!!local[d.key]"
            @update:model-value="toggle(d.key)"
          />
          <span class="text-body-large font-weight-medium ml-1">{{ d.label }}</span>
        </div>
        <v-row
          v-if="local[d.key]"
          dense
        >
          <v-col cols="6">
            <v-text-field
              :model-value="local[d.key]!.start"
              label="Bắt đầu"
              type="time"
              density="compact"
              hide-details
              @update:model-value="update(d.key, 'start', $event)"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              :model-value="local[d.key]!.end"
              label="Kết thúc"
              type="time"
              density="compact"
              hide-details
              @update:model-value="update(d.key, 'end', $event)"
            />
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>
