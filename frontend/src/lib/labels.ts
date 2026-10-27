export const STATUS_LABELS: Record<string, string> = {
  open: "باز",
  in_progress: "در حال بررسی",
  closed: "بسته‌شده",
};

export const CATEGORY_LABELS: Record<string, string> = {
  hardware: "سخت‌افزار",
  network: "شبکه",
  software: "نرم‌افزار",
  access: "دسترسی",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
};

export const ROLE_LABELS: Record<string, string> = {
  employee: "کارمند",
  it: "پشتیبانی IT",
};

export const SOURCE_LABELS: Record<string, string> = {
  ai: "هوش مصنوعی",
  fallback: "پاسخ جایگزین",
};

export function label(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "نامشخص";
  return map[key] ?? key;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
