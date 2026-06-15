<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useConfigStore } from "@/stores/useConfigStore";

const router = useRouter();
const auth = useAuthStore();
const config = useConfigStore();

async function logout(): Promise<void> {
  await auth.signOut();
  await router.push({ name: "admin-login" });
}
</script>

<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list
        density="compact"
        nav
      >
        <v-list-item
          title="Tổng quan"
          to="/admin"
          exact
          prepend-icon="mdi-view-dashboard"
        />
        <v-list-item
          title="Lớp học"
          to="/admin/classes"
          prepend-icon="mdi-google-classroom"
        />
        <v-list-item
          title="Học phí"
          to="/admin/billing"
          prepend-icon="mdi-cash-multiple"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      flat
      color="surface"
    >
      <v-app-bar-title>Quản lý điểm danh</v-app-bar-title>
      <v-spacer />
      <span
        v-if="config.config"
        class="mr-3 text-body-2"
      >{{ config.config.teacherName }}</span>
      <v-btn
        icon="mdi-logout"
        variant="text"
        @click="logout"
      />
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
