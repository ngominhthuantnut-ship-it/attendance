<script setup lang="ts">
import { computed } from "vue";
import type { RateEntry } from "@/types";
import { formatVnDate } from "@/lib/dates";

const props = defineProps<{ modelValue: RateEntry[] }>();
const emit = defineEmits<{ "update:modelValue": [RateEntry[]] }>();

const sorted = computed(() =>
  [...props.modelValue].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1)),
);

function add(): void {
  const today = new Date().toISOString().slice(0, 10);
  emit("update:modelValue", [...props.modelValue, { effectiveFrom: today, rate: 150_000 }]);
}

function remove(idx: number): void {
  const out = props.modelValue.filter((_, i) => i !== idx);
  if (out.length === 0) return;
  emit("update:modelValue", out);
}

function update(idx: number, patch: Partial<RateEntry>): void {
  const out = props.modelValue.map((e, i) => (i === idx ? { ...e, ...patch } : e));
  emit("update:modelValue", out);
}
</script>

<template>
  <div>
    <div
      v-for="(entry, idx) in sorted"
      :key="idx"
      class="d-flex align-center ga-2 mb-2"
    >
      <v-text-field
        :model-value="entry.effectiveFrom"
        label="Áp dụng từ"
        type="date"
        density="compact"
        hide-details
        @update:model-value="update(props.modelValue.indexOf(entry), { effectiveFrom: $event })"
      />
      <v-text-field
        :model-value="entry.rate"
        label="Đơn giá (đ)"
        type="number"
        min="0"
        density="compact"
        hide-details
        @update:model-value="update(props.modelValue.indexOf(entry), { rate: Number($event) })"
      />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        :disabled="props.modelValue.length === 1"
        @click="remove(props.modelValue.indexOf(entry))"
      />
    </div>
    <v-btn
      prepend-icon="mdi-plus"
      variant="tonal"
      size="small"
      @click="add"
    >
      Thêm thay đổi giá
    </v-btn>
    <p class="text-body-small mt-2 text-medium-emphasis">
      Buổi học ngày D dùng đơn giá có "Áp dụng từ" ≤ D mới nhất.
    </p>
    <p
      v-if="sorted[0] && sorted[0].effectiveFrom"
      class="text-body-small"
    >
      Hiện tại (từ {{ formatVnDate(sorted[0]!.effectiveFrom) }}):
      <strong>{{ sorted[0]!.rate.toLocaleString("vi-VN") }} đ/buổi</strong>
    </p>
  </div>
</template>
