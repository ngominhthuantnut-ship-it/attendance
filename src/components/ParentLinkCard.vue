<script setup lang="ts">
import { computed, ref } from "vue";
import { parentLinkUrl, parentLookupUrl } from "@/services/parentLinkUrl";

const props = defineProps<{ token: string; code?: string }>();

const directUrl = computed(() => parentLinkUrl(props.token));
const lookupUrl = computed(() => parentLookupUrl());
const copiedKey = ref<string | null>(null);

async function copy(text: string, key: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  copiedKey.value = key;
  setTimeout(() => (copiedKey.value = null), 1500);
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
          <v-icon icon="mdi-share-variant" />
        </v-avatar>
      </template>
      <v-card-title class="text-title-medium">
        Chia sẻ cho phụ huynh
      </v-card-title>
      <v-card-subtitle>Gửi link chung + mã, hoặc link riêng của học sinh</v-card-subtitle>
    </v-card-item>
    <v-divider />

    <v-card-text class="d-flex flex-column ga-5">
      <div v-if="code">
        <div class="text-body-small text-medium-emphasis mb-2">
          Mã tra cứu (cấp riêng cho phụ huynh)
        </div>
        <div class="d-flex align-center ga-2">
          <v-chip
            color="primary"
            variant="tonal"
            size="large"
            class="font-weight-bold text-title-large code-chip"
          >
            {{ code }}
          </v-chip>
          <v-btn
            :icon="copiedKey === 'code' ? 'mdi-check' : 'mdi-content-copy'"
            :color="copiedKey === 'code' ? 'success' : 'primary'"
            variant="text"
            size="small"
            title="Copy mã"
            @click="copy(code, 'code')"
          />
        </div>
      </div>

      <div>
        <div class="text-body-small text-medium-emphasis mb-1">
          Link tra cứu chung (gửi cả nhóm phụ huynh)
        </div>
        <v-text-field
          :model-value="lookupUrl"
          readonly
          variant="outlined"
          density="comfortable"
          hide-details
        >
          <template #append-inner>
            <v-btn
              :icon="copiedKey === 'lookup' ? 'mdi-check' : 'mdi-content-copy'"
              :color="copiedKey === 'lookup' ? 'success' : 'primary'"
              variant="text"
              size="small"
              @click="copy(lookupUrl, 'lookup')"
            />
          </template>
        </v-text-field>
      </div>

      <div>
        <div class="text-body-small text-medium-emphasis mb-1">
          Link riêng của học sinh (không cần nhập mã)
        </div>
        <v-text-field
          :model-value="directUrl"
          readonly
          variant="outlined"
          density="comfortable"
          hide-details
        >
          <template #append-inner>
            <v-btn
              :icon="copiedKey === 'direct' ? 'mdi-check' : 'mdi-content-copy'"
              :color="copiedKey === 'direct' ? 'success' : 'primary'"
              variant="text"
              size="small"
              @click="copy(directUrl, 'direct')"
            />
          </template>
        </v-text-field>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.code-chip {
  letter-spacing: 0.18em;
}
</style>
