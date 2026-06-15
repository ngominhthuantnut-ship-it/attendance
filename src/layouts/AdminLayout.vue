<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useAuthStore } from "@/stores/useAuthStore";
import InstallAppButton from "@/components/InstallAppButton.vue";

const router = useRouter();
const auth = useAuthStore();
const { mobile } = useDisplay();

const drawer = ref(!mobile.value);

const nav = [
  { title: "Tổng quan", to: "/admin", icon: "mdi-view-dashboard-outline", exact: true },
  { title: "Lớp học", to: "/admin/classes", icon: "mdi-google-classroom", exact: false },
  { title: "Học phí", to: "/admin/billing", icon: "mdi-cash-multiple", exact: false },
  { title: "Lịch", to: "/admin/calendar", icon: "mdi-calendar", exact: false },
  { title: "Cài đặt", to: "/admin/settings", icon: "mdi-cog-outline", exact: false },
];

const displayName = computed(() => auth.displayName ?? auth.email ?? "Giáo viên");
const initials = computed(() =>
  displayName.value
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join(""),
);

function onNavigate(): void {
  if (mobile.value) drawer.value = false;
}

async function logout(): Promise<void> {
  await auth.signOut();
  await router.push({ name: "admin-login" });
}
</script>

<template>
  <v-app>
    <v-app-bar
      v-if="mobile"
      flat
      color="surface"
      border="b"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title class="d-flex align-center ga-2">
        <v-icon
          icon="mdi-notebook-check-outline"
          color="primary"
        />
        <span class="text-title-medium font-weight-bold">Điểm danh</span>
      </v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
      color="surface"
      width="264"
    >
      <div class="d-flex align-center ga-3 px-5 py-5">
        <v-avatar
          color="primary"
          rounded="lg"
          size="40"
        >
          <v-icon icon="mdi-notebook-check-outline" />
        </v-avatar>
        <div class="d-flex flex-column">
          <span class="text-title-medium font-weight-bold">Điểm danh</span>
          <span class="text-body-small text-medium-emphasis">Quản lý lớp học</span>
        </div>
      </div>

      <v-divider />

      <v-list
        nav
        class="px-3 py-3"
      >
        <v-list-item
          v-for="item in nav"
          :key="item.to"
          :title="item.title"
          :to="item.to"
          :exact="item.exact"
          :prepend-icon="item.icon"
          rounded="lg"
          color="primary"
          class="mb-1"
          @click="onNavigate"
        />
      </v-list>

      <template #append>
        <v-divider />
        <div class="px-3 pt-3">
          <InstallAppButton block />
        </div>
        <div class="pa-3">
          <v-list-item
            :title="displayName"
            subtitle="Đăng xuất"
            rounded="lg"
            link
            @click="logout"
          >
            <template #prepend>
              <v-avatar
                color="surface-variant"
                size="36"
              >
                <span class="text-label-medium font-weight-bold">{{ initials }}</span>
              </v-avatar>
            </template>
            <template #append>
              <v-icon
                icon="mdi-logout"
                size="small"
                class="text-medium-emphasis"
              />
            </template>
          </v-list-item>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main class="bg-background">
      <v-container
        class="py-6 px-md-8"
        style="max-width: 1200px;"
      >
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
