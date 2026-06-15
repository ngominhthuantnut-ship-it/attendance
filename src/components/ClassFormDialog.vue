<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import type { Class } from "@/types";
import ClassScheduleForm from "./ClassScheduleForm.vue";
import RateHistoryEditor from "./RateHistoryEditor.vue";

const props = defineProps<{
  modelValue: boolean;
  initial?: Partial<Class>;
  title: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  submit: [Omit<Class, "id">];
}>();

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Bắt buộc"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
);

const { defineField, handleSubmit, resetForm, errors } = useForm({ validationSchema: schema });
const [name, nameAttrs] = defineField("name");
const [startDate, startAttrs] = defineField("startDate");
const [endDate, endAttrs] = defineField("endDate");

const weekly = ref(props.initial?.weeklySchedule ?? {});
const rateHistory = ref(
  props.initial?.rateHistory ?? [
    { effectiveFrom: new Date().toISOString().slice(0, 10), rate: 150_000 },
  ],
);
const excludedDates = ref<string[]>(props.initial?.excludedDates ?? []);
const addedDates = ref(props.initial?.addedDates ?? []);
const status = ref(props.initial?.status ?? "active");

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      resetForm({
        values: {
          name: props.initial?.name ?? "",
          startDate: props.initial?.startDate ?? "",
          endDate: props.initial?.endDate ?? "",
        },
      });
      weekly.value = props.initial?.weeklySchedule ?? {};
      rateHistory.value = props.initial?.rateHistory ?? [
        { effectiveFrom: new Date().toISOString().slice(0, 10), rate: 150_000 },
      ];
      excludedDates.value = props.initial?.excludedDates ?? [];
      addedDates.value = props.initial?.addedDates ?? [];
      status.value = props.initial?.status ?? "active";
    }
  },
);

const submit = handleSubmit((values) => {
  emit("submit", {
    name: values.name,
    startDate: values.startDate,
    endDate: values.endDate,
    weeklySchedule: weekly.value,
    rateHistory: rateHistory.value,
    excludedDates: excludedDates.value,
    addedDates: addedDates.value,
    status: status.value,
  });
  emit("update:modelValue", false);
});

void errors;
void nameAttrs;
void startAttrs;
void endAttrs;
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="800"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="name"
            label="Tên lớp"
            v-bind="nameAttrs"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="startDate"
                label="Ngày bắt đầu"
                type="date"
                v-bind="startAttrs"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="endDate"
                label="Ngày kết thúc"
                type="date"
                v-bind="endAttrs"
              />
            </v-col>
          </v-row>
          <p class="text-subtitle-2 mt-4">
            Lịch tuần
          </p>
          <ClassScheduleForm v-model="weekly" />
          <p class="text-subtitle-2 mt-4">
            Đơn giá theo thời gian
          </p>
          <RateHistoryEditor v-model="rateHistory" />
        </v-form>
      </v-card-text>
      <v-card-actions>
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
          @click="submit"
        >
          Lưu
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
