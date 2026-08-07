import { getZonedDateString, getZonedDate, DEFAULT_OFFSET_MINUTES } from "./timezone";

export interface HabitStreakResult {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

/**
 * Parses targetDays JSON string (e.g. "[0,1,2,3,4,5,6]" or "[1,3,5]")
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export function parseTargetDays(targetDaysInput?: string | null): number[] {
  if (!targetDaysInput) return [0, 1, 2, 3, 4, 5, 6];
  try {
    const parsed = JSON.parse(targetDaysInput);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(Number);
    }
  } catch {
    // Fallback to daily
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

/**
 * Calculates current streak, longest streak, and total completions
 * based on complete historical HabitLogs and schedule (targetDays).
 */
export function calculateHabitStreaks(
  logs: { date: Date | string; completed: boolean }[],
  targetDaysInput?: string | null,
  offsetMinutes: number = DEFAULT_OFFSET_MINUTES,
  nowInput: Date = new Date()
): HabitStreakResult {
  const targetDays = parseTargetDays(targetDaysInput);

  // Filter completed logs and map to unique local YYYY-MM-DD strings
  const completedDateSet = new Set<string>();
  logs.forEach((l) => {
    if (l.completed) {
      const dateStr = getZonedDateString(l.date, offsetMinutes);
      completedDateSet.add(dateStr);
    }
  });

  const totalCompletions = completedDateSet.size;
  if (totalCompletions === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCompletions: 0 };
  }

  const todayStr = getZonedDateString(nowInput, offsetMinutes);

  // Parse today's local date components
  let currentMs = new Date(nowInput).getTime();
  let checkStr = getZonedDateString(currentMs, offsetMinutes);
  let checkZonedDate = getZonedDate(currentMs, offsetMinutes);
  let dayOfWeek = checkZonedDate.getUTCDay();

  const isTodayScheduled = targetDays.includes(dayOfWeek);
  const isTodayCompleted = completedDateSet.has(todayStr);

  // If today is a scheduled day but not completed yet, start checking from yesterday so streak doesn't break prematurely.
  if (isTodayScheduled && !isTodayCompleted) {
    currentMs -= 86400000;
  }

  // CALCULATE CURRENT STREAK
  let currentStreak = 0;
  let maxDaysToLookBack = 365 * 2; // Guard loop

  while (maxDaysToLookBack > 0) {
    maxDaysToLookBack--;
    const dateStr = getZonedDateString(currentMs, offsetMinutes);
    const zonedDate = getZonedDate(currentMs, offsetMinutes);
    const dow = zonedDate.getUTCDay();
    const isScheduled = targetDays.includes(dow);
    const isCompleted = completedDateSet.has(dateStr);

    if (isCompleted) {
      currentStreak++;
    } else if (isScheduled) {
      // Missed scheduled opportunity -> streak ends
      break;
    }
    // Off-schedule day not completed -> skip without breaking streak

    // Move 1 day backward
    currentMs -= 86400000;
  }

  // CALCULATE LONGEST STREAK ACROSS FULL HISTORY
  const sortedDates = Array.from(completedDateSet).sort();
  let longestStreak = currentStreak;
  let tempStreak = 0;

  if (sortedDates.length > 0) {
    const firstMs = new Date(sortedDates[0] + "T12:00:00Z").getTime();
    const lastMs = Math.max(
      new Date(sortedDates[sortedDates.length - 1] + "T12:00:00Z").getTime(),
      nowInput.getTime()
    );

    let iterMs = firstMs;
    while (iterMs <= lastMs) {
      const dateStr = getZonedDateString(iterMs, offsetMinutes);
      const zonedDate = getZonedDate(iterMs, offsetMinutes);
      const dow = zonedDate.getUTCDay();
      const isScheduled = targetDays.includes(dow);
      const isCompleted = completedDateSet.has(dateStr);

      if (isCompleted) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else if (isScheduled) {
        tempStreak = 0;
      }

      iterMs += 86400000;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
  };
}
