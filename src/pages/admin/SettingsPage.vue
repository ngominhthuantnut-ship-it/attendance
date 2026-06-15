<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useConfigStore } from "@/stores/useConfigStore";
import PageHeader from "@/components/PageHeader.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const config = useConfigStore();

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
