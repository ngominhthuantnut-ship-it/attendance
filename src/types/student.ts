import type { DateISO } from "./class";

export type StudentStatus = "active" | "inactive";

export interface Student {
  id: string;
  classId: string;
  name: string;
  dob: DateISO | null;
  parentName: string;
  parentPhone: string;
  startDate: DateISO;
  endDate: DateISO | null;
  notes: string;
  parentLinkToken: string;
  status: StudentStatus;
}
