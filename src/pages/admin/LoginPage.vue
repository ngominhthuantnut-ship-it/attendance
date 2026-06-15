<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useConfigStore } from "@/stores/useConfigStore";

const auth = useAuthStore();
const config = useConfigStore();
const router = useRouter();
const route = useRoute();
const error = ref<string | null>(null);
const loading = ref(false);

const unauthorized = computed(() => route.query.unauthorized === "1");

onMounted(async () => {
  await config.load().catch(() => {
    /* ignore */
  });
  if (auth.isSignedIn && config.isCurrentUserTeacher) {
    await router.replace({ name: "admin-dashboard" });
  }
});

async function signIn(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    await auth.signIn();
    await config.load();
    if (!config.isBootstrapped) {
      await config.bootstrap();
    }
    if (config.isCurrentUserTeacher) {
      await router.replace({ name: "admin-dashboard" });
    } else {
      error.value = "Tài khoản này không có quyền truy cập.";
      await auth.signOut();
    }
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container
    class="fill-height"
    fluid
  >
    <v-row
      justify="center"
      align="center"
      no-gutters
      style="min-height: 100vh"
    >
      <v-col
        cols="12"
        sm="8"
        md="4"
      >
        <v-card class="pa-6">
          <v-card-title class="text-h5 text-center">
            Quản lý điểm danh
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="unauthorized"
              type="warning"
              class="mb-3"
            >
              Tài khoản hiện tại không có quyền truy cập.
            </v-alert>
            <v-alert
              v-if="error"
              type="error"
              class="mb-3"
            >
              {{ error }}
            </v-alert>
            <p class="text-body-2 mb-4">
              Đăng nhập bằng tài khoản Google của giáo viên để bắt đầu.
            </p>
            <v-btn
              block
              color="primary"
              size="large"
              prepend-icon="mdi-google"
              :loading="loading"
              @click="signIn"
            >
              Đăng nhập với Google
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
