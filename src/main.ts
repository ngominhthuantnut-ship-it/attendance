import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify, type ThemeDefinition } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import "./styles/app.css";
import App from "./App.vue";
import { router } from "./router";
import { registerInstallPrompt } from "./composables/usePwaInstall";

registerInstallPrompt();

const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#F5F6FB",
    surface: "#FFFFFF",
    "surface-bright": "#FFFFFF",
    "surface-variant": "#EEF0F7",
    "on-surface-variant": "#475569",
    primary: "#4F46E5",
    "on-primary": "#FFFFFF",
    secondary: "#0EA5E9",
    accent: "#7C3AED",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    info: "#0284C7",
    "on-background": "#1E293B",
    "on-surface": "#1E293B",
    outline: "#CBD5E1",
    "outline-variant": "#E2E8F0",
  },
  variables: {
    "border-color": "#1E293B",
    "border-opacity": 0.1,
    "high-emphasis-opacity": 0.92,
    "medium-emphasis-opacity": 0.66,
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: { light },
  },
  defaults: {
    global: {
      rounded: "lg",
    },
    VCard: {
      rounded: "xl",
      elevation: 0,
      border: true,
    },
    VBtn: {
      rounded: "lg",
      class: "text-none",
      style: "letter-spacing: normal;",
    },
    VTextField: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
    VSelect: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
    VTextarea: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
    VChip: {
      rounded: "lg",
    },
    VList: {
      rounded: "lg",
    },
    VDataTable: {
      hover: true,
      itemsPerPage: 10,
      itemsPerPageOptions: [{ value: 10, title: "10" }],
    },
    VAlert: {
      rounded: "lg",
      variant: "tonal",
    },
    VDialog: {
      rounded: "xl",
    },
  },
});

createApp(App).use(createPinia()).use(vuetify).use(router).mount("#app");
