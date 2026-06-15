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
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { Student, StudentStatus } from "@/types";
import { generateParentToken, generateLookupCode } from "@/lib/tokens";
import { TTLCache } from "@/composables/useCachedFetch";

const TTL = 60_000;

export const useStudentsStore = defineStore("students", () => {
  const { db } = getFirebase();
  const cache = new TTLCache<string, Student>(TTL);
  const byClass = new TTLCache<string, Student[]>(TTL);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function listByClass(
    classId: string,
    status: StudentStatus = "active",
  ): Promise<Student[]> {
    const key = `${classId}:${status}`;
    const cached = byClass.get(key);
    if (cached) return cached;
    loading.value = true;
    try {
      const q = query(
        collection(db, "students"),
        where("classId", "==", classId),
        where("status", "==", status),
        orderBy("name", "asc"),
      );
      const snap = await getDocs(q);
      const out = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }));
      byClass.set(key, out);
      for (const s of out) cache.set(s.id, s);
      return out;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string): Promise<Student | null> {
    const cached = cache.get(id);
    if (cached) return cached;
    const snap = await getDoc(doc(db, "students", id));
    if (!snap.exists()) return null;
    const s = { id: snap.id, ...(snap.data() as Omit<Student, "id">) };
    cache.set(id, s);
    return s;
  }

  async function uniqueLookupCode(): Promise<string> {
    for (let i = 0; i < 6; i++) {
      const code = generateLookupCode();
      const snap = await getDoc(doc(db, "studentCodes", code));
      if (!snap.exists()) return code;
    }
    return `${generateLookupCode()}${generateLookupCode().slice(0, 2)}`;
  }

  async function create(
    id: string,
    data: Omit<Student, "id" | "parentLinkToken">,
  ): Promise<string> {
    const token = generateParentToken();
    const code = await uniqueLookupCode();
    const batch = writeBatch(db);
    batch.set(doc(db, "students", id), {
      ...data,
      parentLinkToken: token,
      lookupCode: code,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "parentLinks", token), {
      studentId: id,
      classId: data.classId,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "studentCodes", code), {
      studentId: id,
      token,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    invalidate(id, data.classId);
    return token;
  }

  /** Đảm bảo học sinh có mã tra cứu (backfill cho học sinh tạo trước đây). */
  async function ensureLookupCode(student: Student): Promise<string> {
    if (student.lookupCode) return student.lookupCode;
    const code = await uniqueLookupCode();
    const batch = writeBatch(db);
    batch.update(doc(db, "students", student.id), { lookupCode: code });
    batch.set(doc(db, "studentCodes", code), {
      studentId: student.id,
      token: student.parentLinkToken,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    invalidate(student.id, student.classId);
    return code;
  }

  async function update(id: string, patch: Partial<Student>): Promise<void> {
    const { id: _omit, ...rest } = patch;
    void _omit;
    await updateDoc(doc(db, "students", id), { ...rest, updatedAt: serverTimestamp() });
    invalidate(id);
  }

  async function remove(id: string): Promise<void> {
    const student = await get(id);
    if (!student) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, "students", id));
    batch.delete(doc(db, "parentLinks", student.parentLinkToken));
    if (student.lookupCode) batch.delete(doc(db, "studentCodes", student.lookupCode));
    const monthsSnap = await getDocs(collection(db, "students", id, "months"));
    for (const m of monthsSnap.docs) batch.delete(m.ref);
    await batch.commit();
    invalidate(id, student.classId);
  }

  function invalidate(id?: string, classId?: string): void {
    if (id) cache.invalidate(id);
    if (classId) {
      byClass.invalidate(`${classId}:active`);
      byClass.invalidate(`${classId}:inactive`);
    }
  }

  return { loading, error, listByClass, get, create, update, remove, ensureLookupCode, invalidate };
});
