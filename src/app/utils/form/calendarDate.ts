export const MIN_CALENDAR_DATE = "1000-01-01";
export const MAX_CALENDAR_DATE = "9999-12-31";

export function calendarDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function isoCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < MIN_CALENDAR_DATE || value > MAX_CALENDAR_DATE) return false;
  const date = calendarDate(value);
  return Number.isFinite(date.getTime()) && isoCalendarDate(date) === value;
}

export function shiftCalendarDay(value: string, amount: number): string {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  if (date.getUTCFullYear() < 1000) return MIN_CALENDAR_DATE;
  if (date.getUTCFullYear() > 9999) return MAX_CALENDAR_DATE;
  return clampCalendarDate(isoCalendarDate(date));
}

export function clampCalendarDate(value: string): string {
  return value < MIN_CALENDAR_DATE ? MIN_CALENDAR_DATE : value > MAX_CALENDAR_DATE ? MAX_CALENDAR_DATE : value;
}

export function shiftCalendarMonth(value: string, amount: number): string {
  const date = calendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  const year = date.getUTCFullYear();
  if (year < 1000) return MIN_CALENDAR_DATE;
  if (year > 9999) return MAX_CALENDAR_DATE;
  return isoCalendarDate(date);
}
