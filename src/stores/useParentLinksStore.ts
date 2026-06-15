import { defineStore } from "pinia";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { ParentLink } from "@/types";

export const useParentLinksStore = defineStore("parentLinks", () => {
  const { db } = getFirebase();

  async function getByToken(token: string): Promise<ParentLink | null> {
    const snap = await getDoc(doc(db, "parentLinks", token));
    return snap.exists() ? (snap.data() as ParentLink) : null;
  }

  return { getByToken };
});
