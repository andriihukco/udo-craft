import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function fmtCurrency(cents: number): string {
  const val = cents / 100;
  if (val >= 1000) return `${(val / 1000).toFixed(1)} тис. ₴`;
  return `${val.toFixed(0)} ₴`;
}

export function fmtMoney(cents: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO timestamp as time (today) or date+time (other days) */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) +
      " " +
      d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}
