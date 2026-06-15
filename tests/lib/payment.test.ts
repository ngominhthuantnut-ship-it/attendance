import { describe, it, expect } from "vitest";
import {
  buildSepayQrUrl,
  buildTransferDescription,
  isPaymentConfigured,
  type PaymentConfig,
} from "@/lib/payment";

const cfg: PaymentConfig = {
  bankAccount: "0123456789",
  bankCode: "MB",
  accountHolder: "Ngo Minh Thuan",
  storeName: "Lop Co Thuan",
  template: "compact",
  showInfo: true,
  fullAcc: false,
};

describe("isPaymentConfigured", () => {
  it("requires account + bank", () => {
    expect(isPaymentConfigured(cfg)).toBe(true);
    expect(isPaymentConfigured(undefined)).toBe(false);
    expect(isPaymentConfigured({ ...cfg, bankAccount: "  " })).toBe(false);
    expect(isPaymentConfigured({ ...cfg, bankCode: "" })).toBe(false);
  });
});

describe("buildTransferDescription", () => {
  it("strips diacritics (keeps case) and formats <name> T<M><YYYY>", () => {
    expect(buildTransferDescription("Nguyễn Văn A", "2026-06")).toBe("Nguyen Van A T62026");
    expect(buildTransferDescription("Đỗ Thị B", "2026-12")).toBe("Do Thi B T122026");
  });
});

describe("buildSepayQrUrl", () => {
  it("includes required + optional params", () => {
    const url = buildSepayQrUrl(cfg, 1500000, "HP an T6/2026");
    expect(url.startsWith("https://qr.sepay.vn/img?")).toBe(true);
    const q = new URL(url).searchParams;
    expect(q.get("acc")).toBe("0123456789");
    expect(q.get("bank")).toBe("MB");
    expect(q.get("amount")).toBe("1500000");
    expect(q.get("des")).toBe("HP an T6/2026");
    expect(q.get("template")).toBe("compact");
    expect(q.get("showinfo")).toBe("true");
    expect(q.get("fullacc")).toBe("false");
    expect(q.get("holder")).toBe("Ngo Minh Thuan");
    expect(q.get("store")).toBe("Lop Co Thuan");
  });

  it("omits amount when <= 0 and rounds", () => {
    expect(new URL(buildSepayQrUrl(cfg, 0, "x")).searchParams.has("amount")).toBe(false);
    expect(new URL(buildSepayQrUrl(cfg, 1500.6, "x")).searchParams.get("amount")).toBe("1501");
  });
});
