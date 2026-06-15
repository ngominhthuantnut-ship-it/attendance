import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  onAuthStateChanged,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { getFirebase, googleProvider } from "@/services/firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const initialized = ref(false);
  const calendarToken = ref<string | null>(null);
  const { auth } = getFirebase();

  onAuthStateChanged(auth, (u) => {
    user.value = u;
    initialized.value = true;
  });

  const isSignedIn = computed(() => user.value !== null);
  const uid = computed(() => user.value?.uid ?? null);
  const email = computed(() => user.value?.email ?? null);
  const displayName = computed(() => user.value?.displayName ?? null);
  const hasCalendarToken = computed(() => calendarToken.value !== null);

  async function signIn(): Promise<void> {
    const result = await signInWithPopup(auth, googleProvider);
    calendarToken.value = GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null;
  }

  // Token Calendar không được Firebase lưu/refresh; gọi hàm này khi 401 hoặc sau reload.
  async function reconnectCalendar(): Promise<void> {
    if (!auth.currentUser) {
      await signIn();
      return;
    }
    const result = await reauthenticateWithPopup(auth.currentUser, googleProvider);
    calendarToken.value = GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null;
  }

  async function signOutNow(): Promise<void> {
    calendarToken.value = null;
    await signOut(auth);
  }

  return {
    user, initialized, isSignedIn, uid, email, displayName,
    calendarToken, hasCalendarToken,
    signIn, reconnectCalendar, signOut: signOutNow,
  };
});
