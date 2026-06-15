import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { AppConfig, PaymentConfig } from "@/types";
import { useAuthStore } from "./useAuthStore";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
  const adminEmails = computed(() => cached.value?.adminEmails ?? []);
  // Chủ tài khoản gốc.
  const isOwner = computed(
    () => !!auth.uid && !!cached.value && auth.uid === cached.value.teacherUid,
  );
  // Teacher = chủ HOẶC email nằm trong danh sách admin phụ.
  const isCurrentUserTeacher = computed(() => {
    if (!cached.value) return false;
    if (isOwner.value) return true;
    const email = auth.email ? normalizeEmail(auth.email) : null;
    return !!email && adminEmails.value.includes(email);
  });

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

  async function addAdmin(email: string): Promise<void> {
    const e = normalizeEmail(email);
    if (!e) throw new Error("Email trống");
    if (e === cached.value?.teacherEmail?.toLowerCase()) {
      throw new Error("Đây đã là tài khoản chủ");
    }
    await updateDoc(doc(db, "meta/config"), { adminEmails: arrayUnion(e) });
    await load();
  }

  async function removeAdmin(email: string): Promise<void> {
    const e = normalizeEmail(email);
    await updateDoc(doc(db, "meta/config"), { adminEmails: arrayRemove(e) });
    await load();
  }

  const payment = computed(() => cached.value?.payment ?? null);

  async function savePayment(p: PaymentConfig): Promise<void> {
    await updateDoc(doc(db, "meta/config"), { payment: p });
    await load();
  }

  return {
    config,
    loading,
    error,
    isBootstrapped,
    isOwner,
    adminEmails,
    payment,
    isCurrentUserTeacher,
    load,
    bootstrap,
    addAdmin,
    removeAdmin,
    savePayment,
  };
});
