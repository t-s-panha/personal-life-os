import { TaskStatus, GoalTimeframe, GoalHealth, HabitFrequency, JournalType, BookStatus, ProjectStatus, CourseStatus } from "@prisma/client";

export type { TaskStatus, GoalTimeframe, GoalHealth, HabitFrequency, JournalType, BookStatus, ProjectStatus, CourseStatus };

// User types
export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: TaskStatus;
  dueDate: Date | null;
  startDate: Date | null;
  completedAt: Date | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  category: string | null;
  tags: string[];
  projectId: string | null;
  goalId: string | null;
  parentId: string | null;
  subtasks?: Task[];
  order: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: number;
  status?: TaskStatus;
  dueDate?: Date | string;
  startDate?: Date | string;
  estimatedDuration?: number;
  category?: string;
  tags?: string[];
  projectId?: string;
  goalId?: string;
  parentId?: string;
  notes?: string;
}

// Goal types
export interface Goal {
  id: string;
  title: string;
  description: string | null;
  parentId: string | null;
  children?: Goal[];
  timeframe: GoalTimeframe;
  startDate: Date;
  targetDate: Date;
  targetValue: number;
  currentValue: number;
  progress: number;
  health: GoalHealth;
  category: string;
  isArchived: boolean;
  tasks?: Task[];
  milestones?: Milestone[];
  createdAt: Date;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  targetDate: Date;
  completedAt: Date | null;
  order: number;
}

// Habit types
export interface Habit {
  id: string;
  name: string;
  description: string | null;
  category: string;
  frequency: HabitFrequency;
  targetDays: string | null;
  targetCount: number;
  reminderTime: string | null;
  goalId: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  consistencyRate: number;
  isActive: boolean;
  order: number;
  logs?: HabitLog[];
  createdAt: Date;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  count: number;
  notes: string | null;
}

// Time tracking types
export interface TimeEntry {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  category: string;
  description: string | null;
  taskId: string | null;
  projectId: string | null;
  productivityRating: number | null;
  source: string;
  createdAt: Date;
}

// Focus session types
export interface FocusSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  presetName: string;
  workDuration: number;
  breakDuration: number;
  distractions: number;
  focusRating: number | null;
  isCompleted: boolean;
}

// Dashboard types
export interface DashboardData {
  dailyScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  studyHours: number;
  focusHours: number;
  workoutCompleted: boolean;
  sleepDuration: number | null;
  topTasks: Task[];
  todayHabits: Habit[];
  recentTimeEntries: TimeEntry[];
  goalProgress: { title: string; progress: number }[];
}

// Stats types
export interface TimeStats {
  category: string;
  totalSeconds: number;
  percentage: number;
}

export interface DailyStats {
  date: string;
  productiveTime: number;
  totalTracked: number;
  tasksCompleted: number;
  habitsCompleted: number;
  focusMinutes: number;
}
