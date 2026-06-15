<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

function shift(delta: number): void {
  const [y, m] = props.modelValue.split("-").map(Number) as [number, number];
  let ny = y;
  let nm = m + delta;
  while (nm < 1) {
    nm += 12;
    ny -= 1;
  }
  while (nm > 12) {
    nm -= 12;
    ny += 1;
  }
  emit("update:modelValue", `${ny}-${String(nm).padStart(2, "0")}`);
}

const label = computed(() => {
  const [y, m] = props.modelValue.split("-");
  return `Tháng ${m}/${y}`;
});
</script>

<template>
  <div class="d-flex align-center ga-2">
    <v-btn
      icon="mdi-chevron-left"
      variant="text"
      size="small"
      @click="shift(-1)"
    />
    <span class="text-body-1 font-weight-medium">{{ label }}</span>
    <v-btn
      icon="mdi-chevron-right"
      variant="text"
      size="small"
      @click="shift(1)"
    />
  </div>
</template>
