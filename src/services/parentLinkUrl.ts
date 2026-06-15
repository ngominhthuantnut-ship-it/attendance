export function parentLinkUrl(token: string, base: string = window.location.origin): string {
  return `${base}/p/${token}`;
}

export function parentInvoiceUrl(
  token: string,
  yearMonth: string,
  base: string = window.location.origin,
): string {
  return `${base}/p/${token}/invoice/${yearMonth}`;
}
