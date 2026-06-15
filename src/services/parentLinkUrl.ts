export function parentLinkUrl(token: string, base: string = window.location.origin): string {
  return `${base}/p/${token}`;
}

/** Link tra cứu chung (gửi cho cả nhóm phụ huynh) — nhập mã để xem con mình. */
export function parentLookupUrl(base: string = window.location.origin): string {
  return `${base}/tra-cuu`;
}

export function parentInvoiceUrl(
  token: string,
  yearMonth: string,
  base: string = window.location.origin,
): string {
  return `${base}/p/${token}/invoice/${yearMonth}`;
}
