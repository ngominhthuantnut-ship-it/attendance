import { describe, it, expect } from "vitest";
import { rowsToStudents, dedupKey, type ExcelRow } from "@/lib/studentExcel";

describe("dedupKey", () => {
  it("normalizes name + parentName (diacritics/case/space) and strips phone spaces", () => {
    expect(dedupKey("Nguyễn Văn A", "0901 234 567", "Lê Thị B")).toBe(
      dedupKey("nguyen  van a", "0901234567", "le thi b"),
    );
  });
  it("differs when any field differs", () => {
    expect(dedupKey("An", "0901", "B")).not.toBe(dedupKey("An", "0902", "B"));
  });
});

describe("rowsToStudents", () => {
  const rows: ExcelRow[] = [
    {
      "Họ tên": "Nguyễn Văn A",
      "Ngày sinh (YYYY-MM-DD)": "2015-03-20",
      "Tên phụ huynh": "Nguyễn Văn B",
      "SĐT phụ huynh": "0901234567",
      "Ngày bắt đầu học (YYYY-MM-DD)": "",
      "Ngày nghỉ (YYYY-MM-DD)": "",
      "Ghi chú": "ok",
    },
    { "Họ tên": "", "Ghi chú": "dòng rác" }, // có dữ liệu nhưng thiếu tên -> skipped
    { "Họ tên": "", "Ghi chú": "" }, // trống hoàn toàn -> bỏ qua, không tính skipped
  ];

  it("maps valid rows, defaults startDate, nulls empty dates, counts skipped", () => {
    const { students, skipped } = rowsToStudents(rows, "2026-06-01");
    expect(students).toHaveLength(1);
    expect(skipped).toBe(1);
    expect(students[0]).toEqual({
      name: "Nguyễn Văn A",
      dob: "2015-03-20",
      parentName: "Nguyễn Văn B",
      parentPhone: "0901234567",
      startDate: "2026-06-01",
      endDate: null,
      notes: "ok",
    });
  });
});
