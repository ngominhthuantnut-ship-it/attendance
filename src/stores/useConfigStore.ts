import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { AppConfig } from "@/types";
import { useAuthStore } from "./useAuthStore";

export const useConfigStore = defineStore("config", () => {
  const { db } = getFirebase();
  const cached = useStorage<AppConfig | null>("meta-config", null, undefined, {
    serializer: { read: (v) => (v ? JSON.parse(v) : null), write: (v) => JSON.stringify(v) },
  });
  const loading = ref(false);
  const error = ref<string | null>(null);
  const auth = useAuthStore();

  const config = computed(() => cached.value);
  const isBootstrapped = computed(() => cached.value !== null);
  const isCurrentUserTeacher = computed(
    () => !!auth.uid && !!cached.value && auth.uid === cached.value.teacherUid,
  );

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const snap = await getDoc(doc(db, "meta/config"));
      cached.value = snap.exists() ? (snap.data() as AppConfig) : null;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function bootstrap(): Promise<void> {
    if (!auth.user) throw new Error("Not signed in");
    const expectedEmail = import.meta.env.VITE_TEACHER_EMAIL;
    if (auth.user.email !== expectedEmail) {
      throw new Error(`Tài khoản hiện tại không phải teacher email (${expectedEmail})`);
    }
    const data: AppConfig = {
      teacherUid: auth.user.uid,
      teacherEmail: auth.user.email ?? "",
      teacherName: auth.user.displayName ?? "",
    };
    await setDoc(doc(db, "meta/config"), data);
    cached.value = data;
  }

  return { config, loading, error, isBootstrapped, isCurrentUserTeacher, load, bootstrap };
});
