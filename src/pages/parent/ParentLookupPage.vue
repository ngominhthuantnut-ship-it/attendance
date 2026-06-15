<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useParentStore } from "@/stores/useParentStore";

const router = useRouter();
const parent = useParentStore();

const code = ref("");
const loading = ref(false);
const error = ref("");

async function lookup(): Promise<void> {
  error.value = "";
  const c = code.value.trim().toUpperCase();
  if (!c) {
    error.value = "Vui lòng nhập mã tra cứu";
    return;
  }
  loading.value = true;
  try {
    const token = await parent.resolveCode(c);
    if (!token) {
      error.value = "Mã không đúng. Vui lòng kiểm tra lại mã giáo viên đã cấp.";
      return;
    }
    await router.push(`/p/${token}`);
  } catch {
    error.value = "Có lỗi xảy ra, vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-main class="bg-background">
    <v-container
      class="d-flex align-center justify-center"
      style="min-height: 100dvh;"
    >
      <v-card
        rounded="xl"
        class="pa-2"
        max-width="420"
        width="100%"
      >
        <div class="text-center pt-6">
          <v-avatar
            color="primary"
            size="64"
            rounded="lg"
          >
            <v-icon
              icon="mdi-account-search"
              size="32"
            />
          </v-avatar>
          <h1 class="text-headline-small font-weight-bold mt-3">
            Tra cứu học sinh
          </h1>
          <p class="text-body-medium text-medium-emphasis mt-1 px-4">
            Nhập mã tra cứu giáo viên đã cấp để xem điểm danh & học phí của con.
          </p>
        </div>

        <v-card-text>
          <v-text-field
            v-model="code"
            label="Mã tra cứu"
            placeholder="VD: ABC234"
            prepend-inner-icon="mdi-key-variant"
            variant="outlined"
            autocapitalize="characters"
            autocomplete="off"
            :error-messages="error"
            class="code-input"
            @keyup.enter="lookup"
          />
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            block
            prepend-icon="mdi-magnify"
            :loading="loading"
            @click="lookup"
          >
            Tra cứu
          </v-btn>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<style scoped>
.code-input :deep(input) {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 600;
}
</style>
