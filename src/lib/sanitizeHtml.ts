import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "div", "span", "b", "strong", "i", "em", "u", "ul", "ol", "li", "font"];
const ALLOWED_ATTR = ["style", "face"];

/** Làm sạch HTML ghi chú (chỉ giữ định dạng cơ bản, chặn script/sự kiện) trước khi lưu/hiển thị. */
export function sanitizeNoteHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

/** True nếu HTML không có nội dung văn bản (chỉ thẻ rỗng / khoảng trắng). */
export function isEmptyHtml(html: string): boolean {
  if (!html) return true;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text.length === 0;
}
