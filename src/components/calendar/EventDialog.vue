<!-- src/components/calendar/EventDialog.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import type { EventForm, RecurrencePreset, ReminderPreset } from "@/lib/gcal";

const props = defineProps<{
  modelValue: boolean;
  initial: EventForm | null; // null = tạo mới
  editingId: string | null;
  defaultStart: string; // "YYYY-MM-DDTHH:mm" khi tạo mới
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  save: [form: EventForm, id: string | null];
  remove: [id: string];
}>();

function blank(): EventForm {
  return {
    summary: "",
    allDay: false,
    start: props.defaultStart,
    end: props.defaultStart,
    description: "",
    location: "",
    recurrence: "none",
    reminder: "none",
  };
}

const form = ref<EventForm>(blank());

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = props.initial ? { ...props.initial } : blank();
  },
);

const recurrenceOptions: { title: string; value: RecurrencePreset }[] = [
  { title: "Không lặp", value: "none" },
  { title: "Hằng ngày", value: "daily" },
  { title: "Hằng tuần", value: "weekly" },
  { title: "Hằng tháng", value: "monthly" },
];
const reminderOptions: { title: string; value: ReminderPreset }[] = [
  { title: "Không nhắc", value: "none" },
  { title: "10 phút trước", value: "10m" },
  { title: "30 phút trước", value: "30m" },
  { title: "1 giờ trước", value: "1h" },
  { title: "1 ngày trước", value: "1d" },
];

function submit(): void {
  if (!form.value.summary.trim()) return;
  emit("save", { ...form.value }, props.editingId);
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ editingId ? "Sửa sự kiện" : "Sự kiện mới" }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="form.summary"
          label="Tiêu đề"
          autofocus
        />
        <v-switch
          v-model="form.allDay"
          label="Cả ngày"
          color="primary"
          hide-details
          class="mb-2"
        />
        <div class="d-flex ga-3">
          <v-text-field
            v-model="form.start"
            label="Bắt đầu"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
          <v-text-field
            v-model="form.end"
            label="Kết thúc"
            :type="form.allDay ? 'date' : 'datetime-local'"
          />
        </div>
        <v-text-field
          v-model="form.location"
          label="Địa điểm"
        />
        <v-textarea
          v-model="form.description"
          label="Mô tả"
          rows="2"
        />
        <div class="d-flex ga-3">
          <v-select
            v-model="form.recurrence"
            :items="recurrenceOptions"
            label="Lặp lại"
          />
          <v-select
            v-model="form.reminder"
            :items="reminderOptions"
            label="Nhắc nhở"
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="editingId"
          color="error"
          variant="text"
          @click="emit('remove', editingId)"
        >
          Xoá
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          Huỷ
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!form.summary.trim()"
          @click="submit"
        >
          Lưu
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
