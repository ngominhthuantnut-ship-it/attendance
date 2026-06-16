<script setup lang="ts">
defineProps<{ size?: number | string }>();
</script>

<template>
  <svg
    :width="size ?? 22"
    :height="size ?? 22"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      width="48"
      height="48"
      rx="12"
      fill="#0068FF"
    />
    <path
      fill="#fff"
      d="M14 15h20v3.2L21 30.8h13V34H14v-3.2L27 18.2H14V15z"
    />
  </svg>
</template>
