<script setup lang="ts">
import { computed } from "vue";
import { formatVnd } from "@/lib/dates";
const props = defineProps<{ value: number }>();
const text = computed(() => formatVnd(props.value));
</script>

<template>
  <span class="tnum">{{ text }}</span>
</template>
