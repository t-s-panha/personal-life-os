/**
 * Timezone Utility for Personal Life OS
 * Hardened for Asia/Phnom_Penh (UTC+07:00) and user-configurable timezones on UTC Vercel servers.
 */

export const DEFAULT_TIMEZONE = "Asia/Phnom_Penh";
export const DEFAULT_OFFSET_MINUTES = 420; // +7 hours = +420 mins

/**
 * Shifts UTC timestamp by timezone offsetMinutes so getUTCFullYear(), getUTCMonth(), getUTCDate()
 * reflect exact local clock values for the target timezone.
 */
export function getZonedDate(dateInput: Date | string | number, offsetMinutes: number = DEFAULT_OFFSET_MINUTES): Date {
  const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return new Date();
  
  return new Date(d.getTime() + offsetMinutes * 60000);
}

/**
 * Returns formatted "YYYY-MM-DD" date string representing the user's calendar date in their timezone.
 */
export function getZonedDateString(dateInput: Date | string | number, offsetMinutes: number = DEFAULT_OFFSET_MINUTES): string {
  const zoned = getZonedDate(dateInput, offsetMinutes);
  const year = zoned.getUTCFullYear();
  const month = String(zoned.getUTCMonth() + 1).padStart(2, "0");
  const day = String(zoned.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns UTC Date object corresponding to 00:00:00.000 (Start of Day) in user's timezone.
 */
export function getZonedStartOfDay(dateInput: Date | string | number, offsetMinutes: number = DEFAULT_OFFSET_MINUTES): Date {
  const dateStr = getZonedDateString(dateInput, offsetMinutes);
  const [year, month, day] = dateStr.split("-").map(Number);
  const utcMillis = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60000;
  return new Date(utcMillis);
}

/**
 * Returns UTC Date object corresponding to 23:59:59.999 (End of Day) in user's timezone.
 */
export function getZonedEndOfDay(dateInput: Date | string | number, offsetMinutes: number = DEFAULT_OFFSET_MINUTES): Date {
  const start = getZonedStartOfDay(dateInput, offsetMinutes);
  return new Date(start.getTime() + 86399999);
}

/**
 * Checks if two dates fall on the exact same calendar day in the user's timezone.
 */
export function isSameZonedDay(
  dateA: Date | string | number,
  dateB: Date | string | number,
  offsetMinutes: number = DEFAULT_OFFSET_MINUTES
): boolean {
  return getZonedDateString(dateA, offsetMinutes) === getZonedDateString(dateB, offsetMinutes);
}
