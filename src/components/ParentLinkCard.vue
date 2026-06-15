<script setup lang="ts">
import { computed, ref } from "vue";
import { parentLinkUrl } from "@/services/parentLinkUrl";

const props = defineProps<{ token: string }>();
const url = computed(() => parentLinkUrl(props.token));
const copied = ref(false);

async function copy(): Promise<void> {
  await navigator.clipboard.writeText(url.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="text-body-1">
      Link cho phụ huynh
    </v-card-title>
    <v-card-text>
      <v-text-field
        :model-value="url"
        readonly
        variant="outlined"
        density="compact"
        hide-details
      />
    </v-card-text>
    <v-card-actions>
      <v-btn
        prepend-icon="mdi-content-copy"
        :color="copied ? 'success' : 'primary'"
        @click="copy"
      >
        {{ copied ? "Đã copy" : "Copy link" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
