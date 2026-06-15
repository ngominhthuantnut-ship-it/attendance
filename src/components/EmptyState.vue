<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; icon?: string }>();
</script>

<template>
  <div class="d-flex flex-column align-center justify-center pa-10 text-center text-medium-emphasis">
    <v-icon
      :icon="icon ?? 'mdi-information-outline'"
      size="48"
      class="mb-3"
    />
    <div class="text-h6">
      {{ title }}
    </div>
    <div
      v-if="subtitle"
      class="text-body-2 mt-1"
    >
      {{ subtitle }}
    </div>
    <slot />
  </div>
</template>
