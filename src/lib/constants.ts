export const TASK_STATUSES = [
  { value: "BACKLOG", label: "Backlog", color: "#6b7280" },
  { value: "PLANNED", label: "Planned", color: "#3b82f6" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#f59e0b" },
  { value: "COMPLETED", label: "Completed", color: "#10b981" },
  { value: "CANCELLED", label: "Cancelled", color: "#ef4444" },
  { value: "ARCHIVED", label: "Archived", color: "#8b5cf6" },
] as const;

export const TASK_PRIORITIES = [
  { value: 1, label: "Low", color: "#6b7280" },
  { value: 2, label: "Medium", color: "#3b82f6" },
  { value: 3, label: "High", color: "#f59e0b" },
  { value: 4, label: "Urgent", color: "#ef4444" },
] as const;

export const TIME_CATEGORIES = [
  { value: "work", label: "Work", color: "#3b82f6" },
  { value: "study", label: "Study", color: "#8b5cf6" },
  { value: "coding", label: "Coding", color: "#06b6d4" },
  { value: "reading", label: "Reading", color: "#10b981" },
  { value: "exercise", label: "Exercise", color: "#f59e0b" },
  { value: "personal", label: "Personal Projects", color: "#ec4899" },
  { value: "entertainment", label: "Entertainment", color: "#6366f1" },
  { value: "social", label: "Social", color: "#14b8a6" },
  { value: "travel", label: "Travel", color: "#84cc16" },
  { value: "sleep", label: "Sleep", color: "#64748b" },
  { value: "other", label: "Other", color: "#9ca3af" },
] as const;

export const HABIT_CATEGORIES = [
  { value: "fitness", label: "Fitness", color: "#f59e0b" },
  { value: "study", label: "Study", color: "#8b5cf6" },
  { value: "health", label: "Health", color: "#10b981" },
  { value: "productivity", label: "Productivity", color: "#3b82f6" },
  { value: "mindfulness", label: "Mindfulness", color: "#ec4899" },
  { value: "discipline", label: "Discipline", color: "#06b6d4" },
  { value: "social", label: "Social", color: "#14b8a6" },
  { value: "creative", label: "Creative", color: "#f97316" },
  { value: "general", label: "General", color: "#6b7280" },
] as const;

export const GOAL_TIMEFRAMES = [
  { value: "VISION", label: "Vision (10+ years)" },
  { value: "YEAR_3_5", label: "3-5 Year" },
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "DAILY", label: "Daily" },
] as const;

export const GOAL_HEALTH_COLORS = {
  NOT_STARTED: "#9ca3af",
  ON_TRACK: "#10b981",
  AT_RISK: "#f59e0b",
  BEHIND: "#ef4444",
  COMPLETED: "#3b82f6",
};

export const FOCUS_PRESETS = [
  { name: "Pomodoro", work: 25 * 60, break: 5 * 60 },
  { name: "Deep Work", work: 50 * 60, break: 10 * 60 },
  { name: "Long Focus", work: 90 * 60, break: 15 * 60 },
];
