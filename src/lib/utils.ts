import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calculateStreak(logs: { date: Date; completed: boolean }[]): { current: number; longest: number } {
  if (!logs.length) return { current: 0, longest: 0 };

  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let current = 0;
  let longest = 0;
  let temp = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  for (let i = 0; i < sorted.length; i++) {
    const logDate = new Date(sorted[i].date);
    logDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (logDate.getTime() === expectedDate.getTime() && sorted[i].completed) {
      current++;
    } else if (i === 0 && logDate.getTime() === expectedDate.getTime() - 86400000 && sorted[i].completed) {
      // Yesterday was completed, today not yet
      current++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  const completedLogs = sorted.filter(l => l.completed);
  for (let i = 0; i < completedLogs.length; i++) {
    temp++;
    if (i < completedLogs.length - 1) {
      const curr = new Date(completedLogs[i].date);
      const next = new Date(completedLogs[i + 1].date);
      curr.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);
      const diff = (curr.getTime() - next.getTime()) / 86400000;
      if (diff !== 1) {
        longest = Math.max(longest, temp);
        temp = 0;
      }
    }
  }
  longest = Math.max(longest, temp);

  return { current, longest };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
