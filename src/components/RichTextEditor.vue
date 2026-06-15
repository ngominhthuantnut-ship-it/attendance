<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{ modelValue?: string; placeholder?: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const editor = ref<HTMLDivElement | null>(null);
const fonts = ["Mặc định", "Arial", "Times New Roman", "Roboto", "Be Vietnam Pro"];
const font = ref("Mặc định");

function emitValue(): void {
  if (editor.value) emit("update:modelValue", editor.value.innerHTML);
}

function exec(command: string, value?: string): void {
  editor.value?.focus();
  document.execCommand(command, false, value);
  emitValue();
}

function applyFont(f: string): void {
  if (f && f !== "Mặc định") exec("fontName", f);
}

onMounted(() => {
  if (editor.value) editor.value.innerHTML = props.modelValue || "";
});

// Cập nhật khi giá trị thay đổi từ bên ngoài (không ghi đè khi đang gõ).
watch(
  () => props.modelValue,
  (v) => {
    if (editor.value && (v || "") !== editor.value.innerHTML) {
      editor.value.innerHTML = v || "";
    }
  },
);
</script>

<template>
  <div class="rte">
    <div class="rte-toolbar d-flex flex-wrap align-center ga-1 px-1 py-1">
      <v-btn
        icon="mdi-format-bold"
        size="small"
        variant="text"
        title="Đậm"
        @mousedown.prevent
        @click="exec('bold')"
      />
      <v-btn
        icon="mdi-format-italic"
        size="small"
        variant="text"
        title="Nghiêng"
        @mousedown.prevent
        @click="exec('italic')"
      />
      <v-btn
        icon="mdi-format-underline"
        size="small"
        variant="text"
        title="Gạch chân"
        @mousedown.prevent
        @click="exec('underline')"
      />
      <v-divider
        vertical
        class="mx-1"
      />
      <v-btn
        icon="mdi-format-list-bulleted"
        size="small"
        variant="text"
        title="Danh sách chấm"
        @mousedown.prevent
        @click="exec('insertUnorderedList')"
      />
      <v-btn
        icon="mdi-format-list-numbered"
        size="small"
        variant="text"
        title="Danh sách số"
        @mousedown.prevent
        @click="exec('insertOrderedList')"
      />
      <v-spacer />
      <v-select
        v-model="font"
        :items="fonts"
        density="compact"
        variant="plain"
        hide-details
        style="max-width: 150px;"
        @update:model-value="applyFont"
      />
    </div>
    <div
      ref="editor"
      class="rte-body"
      contenteditable="true"
      :data-placeholder="placeholder ?? 'Nhập ghi chú / nhận xét…'"
      @input="emitValue"
    />
  </div>
</template>

<style scoped>
.rte {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 12px;
  overflow: hidden;
}
.rte-toolbar {
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface-variant));
}
.rte-body {
  min-height: 88px;
  max-height: 280px;
  overflow-y: auto;
  padding: 10px 12px;
  outline: none;
  font-size: 0.95rem;
  line-height: 1.5;
}
.rte-body:empty::before {
  content: attr(data-placeholder);
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.7;
}
.rte-body :deep(ul),
.rte-body :deep(ol) {
  padding-left: 1.4em;
  margin: 0.25em 0;
}
</style>
