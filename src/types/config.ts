export interface PaymentConfig {
  bankAccount: string;
  bankCode: string;
  accountHolder?: string;
  storeName?: string;
  template?: string;
  showInfo?: boolean;
  fullAcc?: boolean;
}

export interface AppConfig {
  teacherUid: string;
  teacherEmail: string;
  teacherName: string;
  /** Email Google (đã chuẩn hoá thường) của các admin phụ. Chỉ chủ tài khoản sửa được. */
  adminEmails?: string[];
  /** Thông tin tạo QR chuyển khoản hiển thị cho phụ huynh. */
  payment?: PaymentConfig;
}
