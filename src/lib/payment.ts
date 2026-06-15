import { normalizeText } from "./search";
import type { PaymentConfig } from "@/types";

export type { PaymentConfig };

const SEPAY_BASE = "https://qr.sepay.vn/img";

/** true nếu đã đủ thông tin tối thiểu (số TK + ngân hàng) để tạo QR. */
export function isPaymentConfigured(p: PaymentConfig | undefined | null): p is PaymentConfig {
  return !!p && !!p.bankAccount.trim() && !!p.bankCode.trim();
}

/** Nội dung chuyển khoản: bỏ dấu, viết hoa chữ đầu — an toàn cho ngân hàng. */
export function buildTransferDescription(studentName: string, yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  const name = normalizeText(studentName).replace(/\s+/g, " ").trim();
  return `HP ${name} T${Number(m)}/${y}`;
}

export function buildSepayQrUrl(p: PaymentConfig, amount: number, description: string): string {
  const params = new URLSearchParams();
  params.set("acc", p.bankAccount.trim());
  params.set("bank", p.bankCode.trim());
  if (amount > 0) params.set("amount", String(Math.round(amount)));
  if (description) params.set("des", description);
  if (p.template) params.set("template", p.template);
  params.set("showinfo", p.showInfo ? "true" : "false");
  params.set("fullacc", p.fullAcc ? "true" : "false");
  if (p.accountHolder?.trim()) params.set("holder", p.accountHolder.trim());
  if (p.storeName?.trim()) params.set("store", p.storeName.trim());
  return `${SEPAY_BASE}?${params.toString()}`;
}
