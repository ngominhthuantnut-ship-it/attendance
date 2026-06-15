<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  icon?: string;
}>();
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-3 mb-6">
    <v-avatar
      v-if="icon"
      color="surface-variant"
      rounded="lg"
      size="44"
    >
      <v-icon
        :icon="icon"
        color="primary"
      />
    </v-avatar>
    <div class="flex-grow-1">
      <h1 class="text-headline-medium font-weight-bold">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="text-body-medium text-medium-emphasis mt-1"
      >
        {{ subtitle }}
      </p>
    </div>
    <div class="d-flex align-center ga-2">
      <slot name="actions" />
    </div>
  </div>
</template>
