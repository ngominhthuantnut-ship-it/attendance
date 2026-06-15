<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import type { Student } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  initial?: Partial<Student>;
  classStartDate: string;
  title: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  submit: [Omit<Student, "id" | "parentLinkToken">];
}>();

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Bắt buộc"),
    parentPhone: z.string().min(0),
  }),
);
const { defineField, handleSubmit, resetForm } = useForm({ validationSchema: schema });
const [name, nameAttrs] = defineField("name");
const [parentPhone, parentPhoneAttrs] = defineField("parentPhone");

const dob = ref<string>("");
const parentName = ref<string>("");
const startDate = ref<string>(props.classStartDate);
const endDate = ref<string>("");
const notes = ref<string>("");

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      resetForm({
        values: {
          name: props.initial?.name ?? "",
          parentPhone: props.initial?.parentPhone ?? "",
        },
      });
      dob.value = props.initial?.dob ?? "";
      parentName.value = props.initial?.parentName ?? "";
      startDate.value = props.initial?.startDate ?? props.classStartDate;
      endDate.value = props.initial?.endDate ?? "";
      notes.value = props.initial?.notes ?? "";
    }
  },
);

const submit = handleSubmit((values) => {
  emit("submit", {
    classId: props.initial?.classId ?? "",
    name: values.name,
    dob: dob.value || null,
    parentName: parentName.value,
    parentPhone: values.parentPhone,
    startDate: startDate.value,
    endDate: endDate.value || null,
    notes: notes.value,
    status: props.initial?.status ?? "active",
  });
  emit("update:modelValue", false);
});

void nameAttrs;
void parentPhoneAttrs;
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="name"
            label="Họ tên"
            v-bind="nameAttrs"
          />
          <v-text-field
            v-model="dob"
            label="Ngày sinh"
            type="date"
          />
          <v-text-field
            v-model="parentName"
            label="Tên phụ huynh"
          />
          <v-text-field
            v-model="parentPhone"
            label="SĐT phụ huynh"
            v-bind="parentPhoneAttrs"
          />
          <v-text-field
            v-model="startDate"
            label="Ngày bắt đầu học"
            type="date"
          />
          <v-text-field
            v-model="endDate"
            label="Ngày nghỉ (nếu có)"
            type="date"
          />
          <v-textarea
            v-model="notes"
            label="Ghi chú"
            rows="2"
          />
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
