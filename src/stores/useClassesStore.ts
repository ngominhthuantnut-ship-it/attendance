import { defineStore } from "pinia";
import { ref } from "vue";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { Class, ClassStatus } from "@/types";
import { TTLCache } from "@/composables/useCachedFetch";

const TTL = 60_000;

export const useClassesStore = defineStore("classes", () => {
  const { db } = getFirebase();
  const cache = new TTLCache<string, Class>(TTL);
  const listCache = new TTLCache<ClassStatus, Class[]>(TTL);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function list(status: ClassStatus = "active"): Promise<Class[]> {
    const cached = listCache.get(status);
    if (cached) return cached;
    loading.value = true;
    try {
      const q = query(
        collection(db, "classes"),
        where("status", "==", status),
        orderBy("startDate", "desc"),
      );
      const snap = await getDocs(q);
      const out: Class[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Class, "id">) }));
      listCache.set(status, out);
      for (const c of out) cache.set(c.id, c);
      return out;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string): Promise<Class | null> {
    const cached = cache.get(id);
    if (cached) return cached;
    const snap = await getDoc(doc(db, "classes", id));
    if (!snap.exists()) return null;
    const c = { id: snap.id, ...(snap.data() as Omit<Class, "id">) };
    cache.set(id, c);
    return c;
  }

  async function create(id: string, data: Omit<Class, "id">): Promise<void> {
    await setDoc(doc(db, "classes", id), { ...data, createdAt: serverTimestamp() });
    invalidate(id);
  }

  async function update(id: string, patch: Partial<Class>): Promise<void> {
    const { id: _omit, ...rest } = patch;
    void _omit;
    await updateDoc(doc(db, "classes", id), { ...rest, updatedAt: serverTimestamp() });
    invalidate(id);
  }

  async function remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "classes", id));
    invalidate(id);
  }

  function invalidate(id?: string): void {
    if (id) cache.invalidate(id);
    listCache.clear();
  }

  return { loading, error, list, get, create, update, remove, invalidate };
});

export type { Timestamp };
