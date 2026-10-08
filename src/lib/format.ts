/** تنسيق التاريخ الرسمي للنظام: DD-MM-YYYY */
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "غير متوفر";
  const dd = new Date(d);
  if (isNaN(dd.getTime())) return "غير متوفر";
  // لا تعرض التاريخ الافتراضي غير المقبول
  if (dd.getFullYear() <= 1) return "غير متوفر";
  return `${String(dd.getDate()).padStart(2, "0")}-${String(dd.getMonth() + 1).padStart(2, "0")}-${dd.getFullYear()}`;
}

/** تاريخ + وقت الجلسة */
export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "غير متوفر";
  const dd = new Date(d);
  if (isNaN(dd.getTime()) || dd.getFullYear() <= 1) return "غير متوفر";
  const date = fmtDate(dd);
  const h = dd.getHours();
  const m = dd.getMinutes();
  if (h === 0 && m === 0) return date;
  return `${date} — ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** تنسيق المبالغ بالدينار العراقي */
export function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "غير متوفر";
  return n.toLocaleString("en-US");
}

/** تحويل Date إلى قيمة input[type=date] */
export function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dd = new Date(d);
  if (isNaN(dd.getTime())) return "";
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
}

/** تحويل Date إلى قيمة input[type=datetime-local] */
export function toInputDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dd = new Date(d);
  if (isNaN(dd.getTime())) return "";
  return `${toInputDate(dd)}T${String(dd.getHours()).padStart(2, "0")}:${String(dd.getMinutes()).padStart(2, "0")}`;
}

export function todayInputDate(): string {
  return toInputDate(new Date());
}
