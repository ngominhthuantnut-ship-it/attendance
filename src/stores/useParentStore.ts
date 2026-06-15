import { defineStore } from "pinia";
import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { Class, MonthDoc, ParentLink, Student, YearMonth } from "@/types";

interface CachedParentLink {
  token: string;
  studentId: string;
  classId: string;
}

export const useParentStore = defineStore("parent", () => {
  const { db } = getFirebase();
  const cachedLink = useStorage<CachedParentLink | null>("parent-link", null, undefined, {
    serializer: { read: (v) => (v ? JSON.parse(v) : null), write: (v) => JSON.stringify(v) },
  });
  const cachedClass = useStorage<Class | null>("parent-class", null, undefined, {
    serializer: { read: (v) => (v ? JSON.parse(v) : null), write: (v) => JSON.stringify(v) },
  });
  const student = ref<Student | null>(null);
  const cls = ref<Class | null>(cachedClass.value);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadByToken(token: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      let link: ParentLink | null = null;
      if (cachedLink.value?.token === token) {
        link = {
          studentId: cachedLink.value.studentId,
          classId: cachedLink.value.classId,
          createdAt: { seconds: 0, nanoseconds: 0 } as never,
        };
      } else {
        const snap = await getDoc(doc(db, "parentLinks", token));
        if (!snap.exists()) throw new Error("Link không hợp lệ hoặc đã hết hạn");
        link = snap.data() as ParentLink;
        cachedLink.value = { token, studentId: link.studentId, classId: link.classId };
      }

      const [stuSnap, clsSnap] = await Promise.all([
        getDoc(doc(db, "students", link.studentId)),
        cls.value && cls.value.id === link.classId
          ? Promise.resolve(null)
          : getDoc(doc(db, "classes", link.classId)),
      ]);

      if (!stuSnap.exists()) throw new Error("Không tìm thấy học sinh");
      student.value = { id: stuSnap.id, ...(stuSnap.data() as Omit<Student, "id">) };

      if (clsSnap) {
        if (!clsSnap.exists()) throw new Error("Không tìm thấy lớp");
        cls.value = { id: clsSnap.id, ...(clsSnap.data() as Omit<Class, "id">) };
        cachedClass.value = cls.value;
      }
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getMonth(studentId: string, ym: YearMonth): Promise<MonthDoc | null> {
    const snap = await getDoc(doc(db, "students", studentId, "months", ym));
    return snap.exists() ? (snap.data() as MonthDoc) : null;
  }

  /** Tra cứu mã học sinh → trả về parentLinkToken (hoặc null nếu mã sai). */
  async function resolveCode(code: string): Promise<string | null> {
    const id = code.trim().toUpperCase();
    if (!id) return null;
    const snap = await getDoc(doc(db, "studentCodes", id));
    if (!snap.exists()) return null;
    return (snap.data() as { token?: string }).token ?? null;
  }

  return { cachedLink, student, cls, loading, error, loadByToken, getMonth, resolveCode };
});
