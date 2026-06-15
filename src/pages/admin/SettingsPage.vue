<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useConfigStore } from "@/stores/useConfigStore";
import type { PaymentConfig } from "@/types";
import PageHeader from "@/components/PageHeader.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const config = useConfigStore();

const pay = reactive<PaymentConfig>({
  bankAccount: "",
  bankCode: "",
  accountHolder: "",
  storeName: "",
  template: "compact",
  showInfo: true,
  fullAcc: false,
});
const savingPay = ref(false);
const templateOptions = ["", "compact", "qronly", "standee"];

watch(
  () => config.payment,
  (p) => {
    if (p) Object.assign(pay, p);
  },
  { immediate: true },
);

async function savePayment(): Promise<void> {
  savingPay.value = true;
  try {
    await config.savePayment({ ...pay });
    notify("Đã lưu thông tin thanh toán");
  } catch (e) {
    notify((e as Error).message);
  } finally {
    savingPay.value = false;
  }
}

const newEmail = ref("");
const formError = ref("");
const saving = ref(false);
const snackbar = ref(false);
const snackbarText = ref("");
const confirmRemove = ref<{ open: boolean; email: string | null }>({ open: false, email: null });

onMounted(() => {
  if (!config.isBootstrapped) void config.load();
});

const emails = computed(() => config.adminEmails);
const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.value.trim()));

function notify(text: string): void {
  snackbarText.value = text;
  snackbar.value = true;
}

async function add(): Promise<void> {
  formError.value = "";
  if (!isValidEmail.value) {
    formError.value = "Email không hợp lệ";
    return;
  }
  saving.value = true;
  try {
    await config.addAdmin(newEmail.value);
    newEmail.value = "";
    notify("Đã thêm admin");
  } catch (e) {
    formError.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}

async function doRemove(): Promise<void> {
  if (!confirmRemove.value.email) return;
  saving.value = true;
  try {
    await config.removeAdmin(confirmRemove.value.email);
    notify("Đã xoá admin");
  } catch (e) {
    notify((e as Error).message);
  } finally {
    confirmRemove.value = { open: false, email: null };
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Cài đặt"
      subtitle="Tài khoản và quản trị viên"
      icon="mdi-cog-outline"
    />

    <!-- Tài khoản chủ -->
    <v-card class="pa-5 mb-4">
      <div class="text-title-medium font-weight-bold mb-3">
        Tài khoản chủ
      </div>
      <div class="d-flex align-center ga-3">
        <v-avatar
          color="primary"
          variant="tonal"
          size="44"
        >
          <v-icon icon="mdi-shield-account" />
        </v-avatar>
        <div>
          <div class="font-weight-medium">
            {{ config.config?.teacherName || "—" }}
          </div>
          <div class="text-body-small text-medium-emphasis">
            {{ config.config?.teacherEmail }}
          </div>
        </div>
        <v-chip
          color="primary"
          variant="tonal"
          size="small"
          class="ml-2"
        >
          Chủ tài khoản
        </v-chip>
      </div>
    </v-card>

    <!-- Admin phụ -->
    <v-card class="pa-5">
      <div class="d-flex align-center ga-2 mb-1">
        <span class="text-title-medium font-weight-bold">Admin phụ (người hỗ trợ)</span>
      </div>
      <p class="text-body-medium text-medium-emphasis mb-4">
        Người có email trong danh sách này, khi đăng nhập bằng Google, sẽ có
        <strong>toàn quyền</strong> như chủ (lớp, điểm danh, học phí).
        {{ config.isOwner ? "" : "Chỉ chủ tài khoản mới thêm/xoá được." }}
      </p>

      <!-- Form thêm (chỉ chủ) -->
      <div
        v-if="config.isOwner"
        class="d-flex flex-wrap ga-2 mb-4"
      >
        <v-text-field
          v-model="newEmail"
          label="Email Google của người hỗ trợ"
          placeholder="vd: cogiao.b@gmail.com"
          prepend-inner-icon="mdi-email-outline"
          :error-messages="formError"
          hide-details="auto"
          style="min-width: 280px; flex: 1;"
          @keyup.enter="add"
        />
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          prepend-icon="mdi-account-plus"
          :loading="saving"
          :disabled="!isValidEmail"
          @click="add"
        >
          Thêm
        </v-btn>
      </div>

      <v-divider />

      <v-list
        v-if="emails.length"
        lines="one"
      >
        <template
          v-for="(email, i) in emails"
          :key="email"
        >
          <v-divider v-if="i > 0" />
          <v-list-item :title="email">
            <template #prepend>
              <v-avatar
                color="surface-variant"
                size="36"
              >
                <v-icon
                  icon="mdi-account"
                  size="small"
                />
              </v-avatar>
            </template>
            <template #append>
              <v-btn
                v-if="config.isOwner"
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="confirmRemove = { open: true, email }"
              />
            </template>
          </v-list-item>
        </template>
      </v-list>
      <p
        v-else
        class="text-body-medium text-medium-emphasis mt-4"
      >
        Chưa có admin phụ nào.
      </p>
    </v-card>

    <!-- Thanh toán / QR chuyển khoản -->
    <v-card class="pa-5 mt-4">
      <div class="text-title-medium font-weight-bold mb-1">
        Thanh toán (QR chuyển khoản)
      </div>
      <p class="text-body-medium text-medium-emphasis mb-4">
        Thông tin này dùng để tạo mã QR chuyển khoản hiển thị cho phụ huynh (số tiền tự lấy theo học phí tháng).
      </p>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="pay.bankAccount"
            label="Số tài khoản *"
            prepend-inner-icon="mdi-bank"
            inputmode="numeric"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="pay.bankCode"
            label="Mã ngân hàng * (vd: MB, VCB, TCB)"
            prepend-inner-icon="mdi-bank-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="pay.accountHolder"
            label="Tên chủ tài khoản"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="pay.storeName"
            label="Tên lớp / cửa hàng"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="pay.template"
            :items="templateOptions"
            label="Kiểu ảnh QR (template)"
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
          class="d-flex align-center ga-4"
        >
          <v-switch
            v-model="pay.showInfo"
            label="Hiện thông tin TK"
            color="primary"
            hide-details
          />
          <v-switch
            v-model="pay.fullAcc"
            label="Hiện đủ số TK"
            color="primary"
            hide-details
          />
        </v-col>
      </v-row>
      <div class="d-flex justify-end mt-2">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save"
          :loading="savingPay"
          :disabled="!pay.bankAccount.trim() || !pay.bankCode.trim()"
          @click="savePayment"
        >
          Lưu thông tin thanh toán
        </v-btn>
      </div>
    </v-card>

    <ConfirmDialog
      v-model="confirmRemove.open"
      title="Xoá admin phụ?"
      :message="`Xoá quyền truy cập của ${confirmRemove.email ?? ''}? Họ sẽ không vào được nữa.`"
      destructive
      @confirm="doRemove"
    />

    <v-snackbar
      v-model="snackbar"
      :timeout="3000"
      color="success"
      location="bottom"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
