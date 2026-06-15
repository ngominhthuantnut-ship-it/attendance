export interface AppConfig {
  teacherUid: string;
  teacherEmail: string;
  teacherName: string;
  /** Email Google (đã chuẩn hoá thường) của các admin phụ. Chỉ chủ tài khoản sửa được. */
  adminEmails?: string[];
}
