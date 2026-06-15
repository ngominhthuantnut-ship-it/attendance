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
  <v-card
    color="surface"
    rounded="xl"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar
          color="primary"
          variant="tonal"
          rounded="lg"
        >
          <v-icon icon="mdi-link-variant" />
        </v-avatar>
      </template>
      <v-card-title class="text-title-medium">
        Link cho phụ huynh
      </v-card-title>
      <v-card-subtitle>Gửi link này để phụ huynh xem điểm danh & học phí</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <v-text-field
        :model-value="url"
        readonly
        variant="outlined"
        density="comfortable"
        hide-details
      >
        <template #append-inner>
          <v-btn
            :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
            :color="copied ? 'success' : 'primary'"
            variant="text"
            size="small"
            title="Copy link"
            @click="copy"
          />
        </template>
      </v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        prepend-icon="mdi-content-copy"
        variant="flat"
        :color="copied ? 'success' : 'primary'"
        @click="copy"
      >
        {{ copied ? "Đã copy" : "Copy link" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
