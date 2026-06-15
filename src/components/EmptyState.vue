<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; icon?: string }>();
</script>

<template>
  <div class="d-flex flex-column align-center justify-center text-center pa-12">
    <v-avatar
      color="surface-variant"
      size="72"
      class="mb-4"
    >
      <v-icon
        :icon="icon ?? 'mdi-information-outline'"
        size="36"
        color="primary"
      />
    </v-avatar>
    <div class="text-title-large font-weight-medium">
      {{ title }}
    </div>
    <div
      v-if="subtitle"
      class="text-body-medium text-medium-emphasis mt-1"
      style="max-width: 360px;"
    >
      {{ subtitle }}
    </div>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
