import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebase, googleProvider } from "@/services/firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const initialized = ref(false);
  const { auth } = getFirebase();

  onAuthStateChanged(auth, (u) => {
    user.value = u;
    initialized.value = true;
  });

  const isSignedIn = computed(() => user.value !== null);
  const uid = computed(() => user.value?.uid ?? null);
  const email = computed(() => user.value?.email ?? null);
  const displayName = computed(() => user.value?.displayName ?? null);

  async function signIn(): Promise<void> {
    await signInWithPopup(auth, googleProvider);
  }

  async function signOutNow(): Promise<void> {
    await signOut(auth);
  }

  return { user, initialized, isSignedIn, uid, email, displayName, signIn, signOut: signOutNow };
});
