import type { Timestamp } from "firebase/firestore";

export interface ParentLink {
  studentId: string;
  classId: string;
  createdAt: Timestamp;
}
