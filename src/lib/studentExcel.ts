import * as XLSX from "xlsx";
import { normalizeText } from "./search";

/** Cột file Excel ↔ trường học sinh. Header là tiếng Việt cho người dùng. */
export const STUDENT_COLUMNS = [
  { key: "name", header: "Họ tên" },
  { key: "dob", header: "Ngày sinh (YYYY-MM-DD)" },
  { key: "parentName", header: "Tên phụ huynh" },
  { key: "parentPhone", header: "SĐT phụ huynh" },
  { key: "startDate", header: "Ngày bắt đầu học (YYYY-MM-DD)" },
  { key: "endDate", header: "Ngày nghỉ (YYYY-MM-DD)" },
  { key: "notes", header: "Ghi chú" },
] as const;

export interface ImportedStudent {
  name: string;
  dob: string | null;
  parentName: string;
  parentPhone: string;
  startDate: string;
  endDate: string | null;
  notes: string;
}

export type ExcelRow = Record<string, unknown>;

/** Khoá so trùng: tên + SĐT + tên phụ huynh (bỏ dấu, thường, gọn khoảng trắng). */
export function dedupKey(name: string, parentPhone: string, parentName: string): string {
  const n = normalizeText(name).replace(/\s+/g, " ");
  const pn = normalizeText(parentName).replace(/\s+/g, " ");
  const phone = (parentPhone ?? "").replace(/\s+/g, "");
  return `${n}|${phone}|${pn}`;
}

function cell(row: ExcelRow, header: string): string {
  const v = row[header];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export interface MapResult {
  students: ImportedStudent[];
  skipped: number; // số dòng bỏ qua vì thiếu họ tên
}

/** Chuyển các dòng đọc từ Excel → danh sách học sinh hợp lệ (bỏ dòng thiếu tên). */
export function rowsToStudents(rows: ExcelRow[], classStartDate: string): MapResult {
  const students: ImportedStudent[] = [];
  let skipped = 0;
  for (const row of rows) {
    const name = cell(row, "Họ tên");
    if (!name) {
      // Bỏ qua dòng trống hoàn toàn, chỉ tính skipped nếu có dữ liệu khác.
      const hasAny = STUDENT_COLUMNS.some((c) => cell(row, c.header) !== "");
      if (hasAny) skipped += 1;
      continue;
    }
    const dob = cell(row, "Ngày sinh (YYYY-MM-DD)");
    const endDate = cell(row, "Ngày nghỉ (YYYY-MM-DD)");
    const startDate = cell(row, "Ngày bắt đầu học (YYYY-MM-DD)");
    students.push({
      name,
      dob: dob || null,
      parentName: cell(row, "Tên phụ huynh"),
      parentPhone: cell(row, "SĐT phụ huynh"),
      startDate: startDate || classStartDate,
      endDate: endDate || null,
      notes: cell(row, "Ghi chú"),
    });
  }
  return { students, skipped };
}

/** Tải file Excel mẫu (header + 1 dòng ví dụ) về máy. */
export function downloadStudentTemplate(): void {
  const headers = STUDENT_COLUMNS.map((c) => c.header);
  const example = [
    "Nguyễn Văn A",
    "2015-03-20",
    "Nguyễn Văn B",
    "0901234567",
    "",
    "",
    "Học sinh mới",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HocSinh");
  XLSX.writeFile(wb, "mau-danh-sach-hoc-sinh.xlsx");
}

/** Đọc file Excel người dùng tải lên → mảng dòng (key theo header). */
export async function readStudentRows(file: File): Promise<ExcelRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const ws = wb.Sheets[first];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<ExcelRow>(ws, { raw: false, defval: "" });
}
