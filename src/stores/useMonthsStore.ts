import { defineStore } from "pinia";
import { ref } from "vue";
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { AttendanceStatus, MonthDoc, YearMonth } from "@/types";
import { monthOf } from "@/lib/dates";

export const useMonthsStore = defineStore("months", () => {
  const { db } = getFirebase();
  const cache = new Map<string, MonthDoc>();
  const loading = ref(false);
  const error = ref<string | null>(null);

  function key(studentId: string, ym: YearMonth): string {
    return `${studentId}:${ym}`;
  }

  async function get(studentId: string, ym: YearMonth, useCache = true): Promise<MonthDoc | null> {
    const k = key(studentId, ym);
    if (useCache && cache.has(k)) return cache.get(k)!;
    const snap = await getDoc(doc(db, "students", studentId, "months", ym));
    if (!snap.exists()) return null;
    const data = snap.data() as MonthDoc;
    cache.set(k, data);
    return data;
  }

  function subscribe(
    studentId: string,
    ym: YearMonth,
    cb: (doc: MonthDoc | null) => void,
  ): Unsubscribe {
    return onSnapshot(doc(db, "students", studentId, "months", ym), (snap) => {
      const data = snap.exists() ? (snap.data() as MonthDoc) : null;
      if (data) cache.set(key(studentId, ym), data);
      cb(data);
    });
  }

  async function markAttendanceBatch(
    classId: string,
    date: string,
    marks: { studentId: string; status: AttendanceStatus; note?: string }[],
  ): Promise<void> {
    const ym = monthOf(date);
    const batch = writeBatch(db);
    const now = serverTimestamp();
    for (const m of marks) {
      const ref = doc(db, "students", m.studentId, "months", ym);
      const data: Partial<MonthDoc> & Record<string, unknown> = {
        month: ym,
        classId,
        [`attendance.${date}.status`]: m.status,
        [`attendance.${date}.markedAt`]: now,
      };
      if (m.note !== undefined) {
        data[`attendance.${date}.note`] = m.note;
      }
      batch.set(ref, data, { merge: true });
      cache.delete(key(m.studentId, ym));
    }
    await batch.commit();
  }

  async function clearAttendance(studentId: string, date: string): Promise<void> {
    const ym = monthOf(date);
    const ref = doc(db, "students", studentId, "months", ym);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as MonthDoc;
    const next = { ...data.attendance };
    delete next[date];
    await setDoc(ref, { ...data, attendance: next });
    cache.delete(key(studentId, ym));
  }

  async function markPaid(
    studentId: string,
    ym: YearMonth,
    amount: number,
    note: string = "",
  ): Promise<void> {
    const ref = doc(db, "students", studentId, "months", ym);
    const payment = { amount, paidAt: Timestamp.now(), note };
    await setDoc(ref, { month: ym, payment }, { merge: true });
    cache.delete(key(studentId, ym));
  }

  async function unmarkPaid(studentId: string, ym: YearMonth): Promise<void> {
    const ref = doc(db, "students", studentId, "months", ym);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as MonthDoc;
    await setDoc(ref, { ...data, payment: null });
    cache.delete(key(studentId, ym));
  }

  function invalidate(): void {
    cache.clear();
  }

  return {
    loading,
    error,
    get,
    subscribe,
    markAttendanceBatch,
    clearAttendance,
    markPaid,
    unmarkPaid,
    invalidate,
  };
});
