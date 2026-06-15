/**
 * Chuẩn hoá chuỗi để tìm kiếm tiếng Việt: bỏ dấu + chữ thường.
 * Ví dụ: "Lớp Cô Thuần" -> "lop co thuan".
 */
/** Bỏ dấu tiếng Việt nhưng GIỮ NGUYÊN hoa/thường. "Nguyễn Đ" -> "Nguyen D". */
export function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalizeText(s: string): string {
  return stripDiacritics(s).toLowerCase().trim();
}

/** Trả về true nếu `haystack` chứa `query` (không phân biệt dấu/hoa-thường). */
export function matchesText(haystack: string, query: string): boolean {
  return normalizeText(haystack).includes(normalizeText(query));
}
