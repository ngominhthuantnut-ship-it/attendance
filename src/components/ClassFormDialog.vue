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
  props.initial?.rateHistory ?? [{ effectiveFrom: "", rate: 150_000 }],
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
      rateHistory.value = props.initial?.rateHistory ?? [{ effectiveFrom: "", rate: 150_000 }];
      excludedDates.value = props.initial?.excludedDates ?? [];
      addedDates.value = props.initial?.addedDates ?? [];
      status.value = props.initial?.status ?? "active";
    }
  },
);

const submit = handleSubmit((values) => {
  const rateHistoryOut = rateHistory.value.map((e) =>
    e.effectiveFrom ? e : { ...e, effectiveFrom: values.startDate },
  );
  emit("submit", {
    name: values.name,
    startDate: values.startDate,
    endDate: values.endDate,
    weeklySchedule: weekly.value,
    rateHistory: rateHistoryOut,
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
    max-width="720"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-item class="px-5 pt-4">
        <template #prepend>
          <v-avatar
            color="primary"
            variant="tonal"
            rounded="lg"
          >
            <v-icon icon="mdi-google-classroom" />
          </v-avatar>
        </template>
        <v-card-title>{{ title }}</v-card-title>
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="emit('update:modelValue', false)"
          />
        </template>
      </v-card-item>
      <v-divider />

      <v-card-text class="py-5">
        <v-form @submit.prevent="submit">
          <div class="d-flex align-center ga-2 mb-3">
            <v-icon
              icon="mdi-information-outline"
              size="small"
              color="primary"
            />
            <span class="text-title-small font-weight-bold">Thông tin cơ bản</span>
          </div>
          <v-text-field
            v-model="name"
            label="Tên lớp"
            prepend-inner-icon="mdi-rename-box-outline"
            v-bind="nameAttrs"
          />
          <v-row>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="startDate"
                label="Ngày bắt đầu"
                type="date"
                prepend-inner-icon="mdi-calendar-start"
                v-bind="startAttrs"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="endDate"
                label="Ngày kết thúc"
                type="date"
                prepend-inner-icon="mdi-calendar-end"
                v-bind="endAttrs"
              />
            </v-col>
          </v-row>

          <v-divider class="my-5" />
          <div class="d-flex align-center ga-2 mb-3">
            <v-icon
              icon="mdi-calendar-week"
              size="small"
              color="primary"
            />
            <span class="text-title-small font-weight-bold">Lịch tuần</span>
          </div>
          <ClassScheduleForm v-model="weekly" />

          <v-divider class="my-5" />
          <div class="d-flex align-center ga-2 mb-3">
            <v-icon
              icon="mdi-cash-multiple"
              size="small"
              color="primary"
            />
            <span class="text-title-small font-weight-bold">Đơn giá theo thời gian</span>
          </div>
          <RateHistoryEditor v-model="rateHistory" />
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="px-5 py-3">
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
          prepend-icon="mdi-content-save"
          @click="submit"
        >
          Lưu
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
