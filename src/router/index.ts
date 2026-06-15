import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useConfigStore } from "@/stores/useConfigStore";

const adminRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("@/pages/admin/LoginPage.vue"),
    meta: { layout: "admin-bare" },
  },
  {
    path: "/admin",
    component: () => import("@/layouts/AdminLayout.vue"),
    meta: { requiresTeacher: true },
    children: [
      { path: "", name: "admin-dashboard", component: () => import("@/pages/admin/DashboardPage.vue") },
      { path: "classes", name: "admin-class-list", component: () => import("@/pages/admin/ClassListPage.vue") },
      { path: "classes/:classId", name: "admin-class-detail", component: () => import("@/pages/admin/ClassDetailPage.vue"), props: true },
      {
        path: "classes/:classId/attendance/:date",
        name: "admin-attendance",
        component: () => import("@/pages/admin/AttendanceEntryPage.vue"),
        props: true,
      },
      { path: "students/:studentId", name: "admin-student-detail", component: () => import("@/pages/admin/StudentDetailPage.vue"), props: true },
      { path: "billing", name: "admin-billing", component: () => import("@/pages/admin/BillingOverviewPage.vue") },
    ],
  },
];

const parentRoutes: RouteRecordRaw[] = [
  {
    path: "/p/:token",
    component: () => import("@/layouts/ParentLayout.vue"),
    props: true,
    meta: { requiresParentToken: true },
    children: [
      { path: "", name: "parent-home", component: () => import("@/pages/parent/ParentHomePage.vue"), props: true },
      { path: "schedule", name: "parent-schedule", component: () => import("@/pages/parent/ParentSchedulePage.vue"), props: true },
      { path: "attendance", name: "parent-attendance", component: () => import("@/pages/parent/ParentAttendancePage.vue"), props: true },
      { path: "invoice/:yearMonth", name: "parent-invoice", component: () => import("@/pages/parent/ParentInvoicePage.vue"), props: true },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/admin" },
    ...adminRoutes,
    ...parentRoutes,
    { path: "/:catchAll(.*)*", component: () => import("@/pages/NotFoundPage.vue") },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const config = useConfigStore();

  if (!auth.initialized) {
    await new Promise<void>((resolve) => {
      const stop = setInterval(() => {
        if (auth.initialized) {
          clearInterval(stop);
          resolve();
        }
      }, 30);
    });
  }

  if (to.meta.requiresTeacher) {
    if (!auth.isSignedIn) return { name: "admin-login" };
    if (!config.isBootstrapped) await config.load();
    if (!config.isCurrentUserTeacher) return { name: "admin-login", query: { unauthorized: "1" } };
  }

  return true;
});
