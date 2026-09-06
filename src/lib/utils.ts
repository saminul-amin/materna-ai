import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * Gestational week derived from the expected delivery date (EDD).
 * Week 40 is the EDD; weeks are clamped to 1..42 for display.
 */
export function gestationalWeekFromEdd(edd: Date, today = new Date()) {
  const daysToEdd = daysBetween(startOfDay(today), startOfDay(edd));
  const daysPregnant = 280 - daysToEdd;
  const week = Math.floor(daysPregnant / 7) + 1;
  return Math.max(1, Math.min(42, week));
}

export function daysPregnantFromEdd(edd: Date, today = new Date()) {
  const daysToEdd = daysBetween(startOfDay(today), startOfDay(edd));
  return Math.max(0, 280 - daysToEdd);
}

export function eddFromGestationalWeek(week: number, today = new Date()) {
  // Week N means (N-1) completed weeks; remaining days = 280 - (N-1)*7
  const remaining = 280 - (week - 1) * 7;
  return addDays(startOfDay(today), remaining);
}

export function trimesterOf(week: number) {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

export function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", opts);
}

export function formatDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatShortDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function toDateInputValue(d: Date) {
  const c = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return c.toISOString().slice(0, 10);
}

export function toTimeInputValue(d: Date) {
  return d.toTimeString().slice(0, 5);
}

export function relativeDays(d: Date | string, today = new Date()) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = daysBetween(startOfDay(today), startOfDay(date));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
