<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useParentStore } from "@/stores/useParentStore";
import InstallAppButton from "@/components/InstallAppButton.vue";

const props = defineProps<{ token: string }>();
const route = useRoute();
const router = useRouter();
const parent = useParentStore();

async function load(): Promise<void> {
  try {
    await parent.loadByToken(props.token);
  } catch {
    await router.replace("/404");
  }
}

onMounted(load);
watch(() => props.token, load);

const links = [
  { to: "", title: "Tổng quan", icon: "mdi-home" },
  { to: "attendance", title: "Điểm danh", icon: "mdi-clipboard-check" },
];

function navTo(suffix: string): string {
  return `/p/${props.token}${suffix ? "/" + suffix : ""}`;
}

void route;
</script>

<template>
  <v-app>
    <v-app-bar
      flat
      color="primary"
      density="comfortable"
    >
      <v-app-bar-title>
        <template v-if="parent.student">
          {{ parent.student.name }}
          <span
            v-if="parent.cls"
            class="text-body-small ml-2"
          >{{ parent.cls.name }}</span>
        </template>
        <template v-else>
          Đang tải...
        </template>
      </v-app-bar-title>
      <template #append>
        <InstallAppButton variant="text" />
      </template>
    </v-app-bar>

    <v-main>
      <v-container
        fluid
        class="pb-16"
      >
        <v-progress-linear
          v-if="parent.loading"
          indeterminate
        />
        <v-alert
          v-else-if="parent.error"
          type="error"
        >
          {{ parent.error }}
        </v-alert>
        <router-view v-else />
      </v-container>
    </v-main>

    <v-bottom-navigation grow>
      <v-btn
        v-for="l in links"
        :key="l.to"
        :to="navTo(l.to)"
        :prepend-icon="l.icon"
      >
        {{ l.title }}
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
