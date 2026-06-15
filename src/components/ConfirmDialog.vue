<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  confirm: [];
}>();

function close(): void {
  emit("update:modelValue", false);
}
function confirm(): void {
  emit("confirm");
  close();
}
void props;
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="420"
    @update:model-value="close"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          {{ cancelText ?? "Huỷ" }}
        </v-btn>
        <v-btn
          :color="destructive ? 'error' : 'primary'"
          variant="flat"
          @click="confirm"
        >
          {{ confirmText ?? "Xác nhận" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
