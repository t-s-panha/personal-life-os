import { prisma } from "./prisma";
import { startOfDay, endOfDay, subDays, subMonths, subYears, differenceInDays } from "date-fns";

export type AnalyticsRange = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

export interface DateRangeBoundaries {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  periodDays: number;
}

export interface ProductivityScoreBreakdown {
  tasksScore: number;
  focusScore: number;
  goalScore: number | null;
  productiveTimeScore: number;
  planningScore: number;
}

export interface ProductivityScoreResult {
  score: number | null;
  status: "available" | "insufficient_data";
  previousScore: number | null;
  change: number | null;
  breakdown: ProductivityScoreBreakdown | null;
  explanation: string;
}

export interface DisciplineScoreBreakdown {
  habitsScore: number | null;
  taskFollowThroughScore: number | null;
  studyConsistencyScore: number | null;
  focusConsistencyScore: number | null;
  workoutConsistencyScore: number | null;
  sleepConsistencyScore: number | null;
  dailyReviewsScore: number | null;
}

export interface DisciplineScoreResult {
  score: number | null;
  status: "available" | "insufficient_data";
  previousScore: number | null;
  change: number | null;
  breakdown: DisciplineScoreBreakdown | null;
  activeWeights: Record<string, number> | null;
  explanation: string;
}

export interface GoalHealthEvaluation {
  health: "COMPLETED" | "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "BEHIND";
  healthReason: string;
  expectedProgress: number | null;
  progressGap: number | null;
  timeElapsedPct: number | null;
  daysRemaining: number | null;
  daysSinceLastActivity: number;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
}

export interface GoalHealthSummary {
  totalActive: number;
  onTrackCount: number;
  atRiskCount: number;
  behindCount: number;
  notStartedCount: number;
  completedCount: number;
}

export interface AnalyticsInsight {
  id: string;
  type: "FACT" | "TREND" | "CORRELATION" | "RECOMMENDATION";
  category: "productivity" | "habits" | "study" | "fitness" | "sleep" | "life_balance";
  title: string;
  description: string;
  metric?: string;
}

/**
 * Returns Date boundaries for current and previous equivalent periods based on range.
 */
export function getAnalyticsDateRanges(range: AnalyticsRange = "30d"): DateRangeBoundaries {
  const now = new Date();
  const currentEnd = endOfDay(now);
  let currentStart: Date;
  let periodDays = 30;

  switch (range) {
    case "7d":
      periodDays = 7;
      currentStart = startOfDay(subDays(now, 6));
      break;
    case "30d":
      periodDays = 30;
      currentStart = startOfDay(subDays(now, 29));
      break;
    case "90d":
      periodDays = 90;
      currentStart = startOfDay(subDays(now, 89));
      break;
    case "6m":
      periodDays = 180;
      currentStart = startOfDay(subMonths(now, 6));
      break;
    case "1y":
      periodDays = 365;
      currentStart = startOfDay(subYears(now, 1));
      break;
    case "all":
      periodDays = 365 * 5;
      currentStart = startOfDay(subYears(now, 5));
      break;
    default:
      periodDays = 30;
      currentStart = startOfDay(subDays(now, 29));
      break;
  }

  const previousEnd = endOfDay(subDays(currentStart, 1));
  const previousStart = startOfDay(subDays(previousEnd, periodDays - 1));

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    periodDays,
  };
}

/**
 * Safely calculates percentage change between current and previous values.
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/* ============================================================================
   PRODUCTIVITY SCORE CALCULATORS (0-100)
============================================================================ */

export function calculatePriorityTaskScore(tasks: any[]): number {
  if (!tasks.length) return 100;
  const totalWeight = tasks.reduce((sum, t) => sum + (t.priority || 2), 0);
  const completedWeight = tasks
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + (t.priority || 2), 0);
  return Math.min(100, Math.round((completedWeight / (totalWeight || 1)) * 100));
}

export function calculateFocusScore(sessions: any[], periodDays: number): number {
  if (!sessions.length) return 0;
  const cappedSessions = sessions.map((s) => Math.min(10800, s.duration || 0));
  const totalSeconds = cappedSessions.reduce((sum, d) => sum + d, 0);

  const effectiveDays = Math.min(90, Math.max(1, periodDays));
  const targetSeconds = effectiveDays * 1.5 * 3600;

  const completedCount = sessions.filter((s) => s.isCompleted).length;
  const completionRatio = sessions.length > 0 ? completedCount / sessions.length : 1;

  const rawScore = Math.min(100, (totalSeconds / (targetSeconds || 1)) * 100);
  return Math.min(100, Math.round(rawScore * (0.8 + 0.2 * completionRatio)));
}

export function getRelevantGoals(goals: any[], ranges: DateRangeBoundaries, rangeType: string): any[] {
  const { currentStart, currentEnd } = ranges;

  return goals.filter((g) => {
    if (["7d", "30d", "90d"].includes(rangeType) && g.timeframe === "VISION") {
      return false;
    }
    const gStart = g.startDate ? new Date(g.startDate) : new Date(0);
    const gTarget = g.targetDate ? new Date(g.targetDate) : new Date(Date.now() + 365 * 86400000);

    const isOverlapping = gStart <= currentEnd && gTarget >= currentStart;
    const hasMilestoneActivity = g.milestones?.some((m: any) =>
      m.completedAt && new Date(m.completedAt) >= currentStart && new Date(m.completedAt) <= currentEnd
    );

    return isOverlapping || hasMilestoneActivity;
  });
}

export function calculateGoalContributionScore(relevantGoals: any[]): number | null {
  if (!relevantGoals.length) return null;
  const totalProgress = relevantGoals.reduce((sum, g) => sum + (g.progress || 0), 0);
  return Math.min(100, Math.round(totalProgress / relevantGoals.length));
}

export function calculateProductiveTimeScore(
  timeEntries: any[],
  studySessions: any[],
  periodDays: number
): number {
  const productiveCategories = ["work", "study", "coding", "reading"];
  const cappedEntries = timeEntries.map((e) => ({
    ...e,
    duration: Math.min(14400, e.duration || 0),
  }));
  const cappedStudy = studySessions.map((s) => ({
    ...s,
    duration: Math.min(14400, s.duration || 0),
  }));

  const productiveEntries = cappedEntries.filter((e) =>
    productiveCategories.includes((e.category || "").toLowerCase())
  );
  const entrySeconds = productiveEntries.reduce((sum, e) => sum + e.duration, 0);

  const studyEntryStartTimes = cappedEntries
    .filter((e) => (e.category || "").toLowerCase() === "study" && e.startTime)
    .map((e) => new Date(e.startTime).getTime());

  let standaloneStudySeconds = 0;
  cappedStudy.forEach((s) => {
    if (!s.startTime) return;
    const sTime = new Date(s.startTime).getTime();
    const isOverlapping = studyEntryStartTimes.some((tTime) => Math.abs(tTime - sTime) < 120000);
    if (!isOverlapping) {
      standaloneStudySeconds += s.duration;
    }
  });

  const totalProductiveSeconds = entrySeconds + standaloneStudySeconds;

  const effectiveDays = Math.min(90, Math.max(1, periodDays));
  const targetSeconds = effectiveDays * 2.5 * 3600;

  return Math.min(100, Math.round((totalProductiveSeconds / (targetSeconds || 1)) * 100));
}

export function calculatePlanningScore(tasks: any[]): number {
  const now = new Date();
  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED");

  let penalty = 0;
  overdueTasks.forEach((t) => {
    if (t.priority === 4) penalty += 10;
    else if (t.priority === 3) penalty += 7;
    else if (t.priority === 2) penalty += 4;
    else penalty += 2;
  });

  const cappedPenalty = Math.min(50, penalty);
  return Math.max(0, 100 - cappedPenalty);
}

export function calculateProductivityScore(
  currentTasks: any[],
  currentFocusSessions: any[],
  currentTimeEntries: any[],
  currentStudySessions: any[],
  allGoals: any[],
  ranges: DateRangeBoundaries,
  rangeType: string = "30d",
  prevScore?: number | null
): ProductivityScoreResult {
  const hasTasks = currentTasks.length > 0;
  const hasFocus = currentFocusSessions.length > 0;
  const hasTime = currentTimeEntries.length > 0;
  const hasStudy = currentStudySessions.length > 0;

  if (!hasTasks && !hasFocus && !hasTime && !hasStudy) {
    return {
      score: null,
      status: "insufficient_data",
      previousScore: prevScore ?? null,
      change: null,
      breakdown: null,
      explanation: "Track a few days of tasks, focus sessions, or time entries to unlock your Productivity Score.",
    };
  }

  const tasksScore = calculatePriorityTaskScore(currentTasks);
  const focusScore = calculateFocusScore(currentFocusSessions, ranges.periodDays);
  const relevantGoals = getRelevantGoals(allGoals, ranges, rangeType);
  const goalScore = calculateGoalContributionScore(relevantGoals);
  const productiveTimeScore = calculateProductiveTimeScore(currentTimeEntries, currentStudySessions, ranges.periodDays);
  const planningScore = calculatePlanningScore(currentTasks);

  let finalScore = 0;

  if (goalScore === null) {
    finalScore = Math.round(
      tasksScore * 0.4375 +
      focusScore * 0.3125 +
      productiveTimeScore * 0.125 +
      planningScore * 0.125
    );
  } else {
    finalScore = Math.round(
      tasksScore * 0.35 +
      focusScore * 0.25 +
      goalScore * 0.20 +
      productiveTimeScore * 0.10 +
      planningScore * 0.10
    );
  }

  finalScore = Math.min(100, Math.max(0, finalScore));

  const change = prevScore !== undefined && prevScore !== null ? finalScore - prevScore : null;

  let explanationParts: string[] = [];
  if (tasksScore >= 80) explanationParts.push("Strong task execution across high-priority work");
  else if (tasksScore < 50) explanationParts.push("Task completion rate was lower than expected");

  if (focusScore >= 75) explanationParts.push("excellent focus & deep work consistency");
  else if (focusScore < 40) explanationParts.push("focus duration fell below target");

  if (planningScore < 80) explanationParts.push("some important tasks are currently overdue");

  let explanation = explanationParts.length > 0
    ? explanationParts.join(", ") + "."
    : "Steady productivity performance across tasks and focus metrics.";

  explanation = explanation.charAt(0).toUpperCase() + explanation.slice(1);

  return {
    score: finalScore,
    status: "available",
    previousScore: prevScore ?? null,
    change,
    breakdown: {
      tasksScore,
      focusScore,
      goalScore,
      productiveTimeScore,
      planningScore,
    },
    explanation,
  };
}

/* ============================================================================
   DISCIPLINE SCORE CALCULATORS (0-100)
============================================================================ */

export function calculateScheduleAwareHabitScore(
  habitLogs: any[],
  activeHabits: any[],
  ranges: DateRangeBoundaries
): number | null {
  if (!activeHabits.length) return null;

  const { currentStart, currentEnd } = ranges;
  let totalExpectedOpportunities = 0;
  let completedScheduleLogs = 0;

  activeHabits.forEach((habit) => {
    const habitCreated = habit.createdAt ? new Date(habit.createdAt) : new Date(0);
    let targetDayArray: number[] | null = null;
    if (habit.targetDays) {
      try {
        targetDayArray = JSON.parse(habit.targetDays);
      } catch (err) {
        targetDayArray = null;
      }
    }

    let d = new Date(currentStart);
    while (d <= currentEnd) {
      if (d >= habitCreated) {
        const dayOfWeek = d.getDay();
        const isTargetDay = targetDayArray && Array.isArray(targetDayArray)
          ? targetDayArray.includes(dayOfWeek)
          : true;

        if (isTargetDay) {
          totalExpectedOpportunities++;
        }
      }
      d.setDate(d.getDate() + 1);
    }

    const habitLogsForHabit = habitLogs.filter((l) => l.habitId === habit.id && l.completed);
    habitLogsForHabit.forEach((log) => {
      const logDate = new Date(log.date);
      if (logDate >= habitCreated) {
        const dayOfWeek = logDate.getDay();
        const isTargetDay = targetDayArray && Array.isArray(targetDayArray)
          ? targetDayArray.includes(dayOfWeek)
          : true;
        if (isTargetDay) {
          completedScheduleLogs++;
        }
      }
    });
  });

  if (totalExpectedOpportunities === 0) return 100;

  return Math.min(100, Math.round((completedScheduleLogs / totalExpectedOpportunities) * 100));
}

export function calculateTaskFollowThroughScore(tasks: any[]): number | null {
  const dueTasks = tasks.filter((t) => t.dueDate || ["PLANNED", "IN_PROGRESS", "COMPLETED"].includes(t.status));
  if (!dueTasks.length) return null;
  const completed = dueTasks.filter((t) => t.status === "COMPLETED").length;
  return Math.min(100, Math.round((completed / dueTasks.length) * 100));
}

export function calculateStudyConsistencyScore(studySessions: any[], periodDays: number): number | null {
  if (!studySessions.length) return null;
  const studyDays = new Set(studySessions.map((s) => new Date(s.startTime).toISOString().split("T")[0])).size;
  const effectiveDays = Math.min(90, Math.max(1, periodDays));
  const targetDays = Math.min(effectiveDays, Math.max(1, Math.ceil(effectiveDays * (4 / 7))));
  return Math.min(100, Math.round((studyDays / targetDays) * 100));
}

export function calculateFocusConsistencyScore(focusSessions: any[], periodDays: number): number | null {
  if (!focusSessions.length) return null;
  const focusDays = new Set(focusSessions.filter((f) => f.isCompleted).map((f) => new Date(f.startTime).toISOString().split("T")[0])).size;
  const effectiveDays = Math.min(90, Math.max(1, periodDays));
  const targetDays = Math.min(effectiveDays, Math.max(1, Math.ceil(effectiveDays * (5 / 7))));
  return Math.min(100, Math.round((focusDays / targetDays) * 100));
}

export function calculateWorkoutConsistencyScore(workouts: any[], periodDays: number): number | null {
  if (!workouts.length) return null;
  const workoutDays = new Set(workouts.map((w) => new Date(w.date).toISOString().split("T")[0])).size;
  const effectiveDays = Math.min(90, Math.max(1, periodDays));
  const targetDays = Math.min(effectiveDays, Math.max(1, Math.ceil(effectiveDays * (3 / 7))));
  return Math.min(100, Math.round((workoutDays / targetDays) * 100));
}

export function calculateSleepRoutineConsistencyScore(sleepRecords: any[]): number | null {
  if (!sleepRecords.length) return null;

  const bedHours: number[] = [];
  const wakeHours: number[] = [];

  sleepRecords.forEach((r) => {
    if (r.bedTime) {
      const b = new Date(r.bedTime);
      bedHours.push(b.getHours() + b.getMinutes() / 60);
    }
    if (r.wakeTime) {
      const w = new Date(r.wakeTime);
      wakeHours.push(w.getHours() + w.getMinutes() / 60);
    }
  });

  if (bedHours.length === 0 || wakeHours.length === 0) {
    const idealDurationCount = sleepRecords.filter((s) => s.duration >= 7 && s.duration <= 9).length;
    return Math.min(100, Math.round((idealDurationCount / sleepRecords.length) * 100));
  }

  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const medBed = median(bedHours);
  const medWake = median(wakeHours);

  const bedDev = bedHours.reduce((sum, h) => sum + Math.abs(h - medBed), 0) / bedHours.length;
  const wakeDev = wakeHours.reduce((sum, h) => sum + Math.abs(h - medWake), 0) / wakeHours.length;
  const avgDev = (bedDev + wakeDev) / 2;

  const routineScore = Math.max(0, 100 - Math.round(avgDev * 25));
  return Math.min(100, routineScore);
}

export function calculateDailyReviewSplitScore(dailyReviews: any[], periodDays: number): number | null {
  if (!dailyReviews.length) return null;

  const effectiveDays = Math.min(90, Math.max(1, periodDays));
  let totalReviewCredits = 0;

  dailyReviews.forEach((r) => {
    let dayCredit = 0;
    const hasMorning = r.sleepDuration !== null || r.morningMood !== null || r.topPriority !== null || r.topTasks !== null;
    if (hasMorning) dayCredit += 0.5;

    const hasEvening = r.eveningMood !== null || r.completedTasks !== null || r.journal !== null || r.wentWell !== null;
    if (hasEvening) dayCredit += 0.5;

    if (!hasMorning && !hasEvening) dayCredit += 0.5;

    totalReviewCredits += dayCredit;
  });

  return Math.min(100, Math.round((totalReviewCredits / effectiveDays) * 100));
}

export function calculateDisciplineScore(
  habitLogs: any[],
  activeHabitsList: any[],
  tasks: any[],
  studySessions: any[],
  focusSessions: any[],
  workouts: any[],
  sleepRecords: any[],
  dailyReviews: any[],
  ranges: DateRangeBoundaries,
  prevScore?: number | null
): DisciplineScoreResult {
  if (!ranges) {
    return {
      score: null,
      status: "insufficient_data",
      previousScore: prevScore ?? null,
      change: null,
      breakdown: null,
      activeWeights: null,
      explanation: "Insufficient routine tracking to compute Discipline Score.",
    };
  }

  const habitsScore = calculateScheduleAwareHabitScore(habitLogs, activeHabitsList, ranges);
  const taskFollowThroughScore = calculateTaskFollowThroughScore(tasks);
  const studyConsistencyScore = calculateStudyConsistencyScore(studySessions, ranges.periodDays);
  const focusConsistencyScore = calculateFocusConsistencyScore(focusSessions, ranges.periodDays);
  const workoutConsistencyScore = calculateWorkoutConsistencyScore(workouts, ranges.periodDays);
  const sleepConsistencyScore = calculateSleepRoutineConsistencyScore(sleepRecords);
  const dailyReviewsScore = calculateDailyReviewSplitScore(dailyReviews, ranges.periodDays);

  const baseWeights: Record<string, { weight: number; score: number | null }> = {
    habits: { weight: 30, score: habitsScore },
    taskFollowThrough: { weight: 20, score: taskFollowThroughScore },
    studyConsistency: { weight: 15, score: studyConsistencyScore },
    focusConsistency: { weight: 10, score: focusConsistencyScore },
    workoutConsistency: { weight: 10, score: workoutConsistencyScore },
    sleepConsistency: { weight: 10, score: sleepConsistencyScore },
    dailyReviews: { weight: 5, score: dailyReviewsScore },
  };

  const availableComponents = Object.entries(baseWeights).filter(([_, item]) => item.score !== null);

  if (availableComponents.length < 2) {
    return {
      score: null,
      status: "insufficient_data",
      previousScore: prevScore ?? null,
      change: null,
      breakdown: {
        habitsScore,
        taskFollowThroughScore,
        studyConsistencyScore,
        focusConsistencyScore,
        workoutConsistencyScore,
        sleepConsistencyScore,
        dailyReviewsScore,
      },
      activeWeights: null,
      explanation: "Track habit check-ins, planned tasks, or daily reviews across a few days to calculate your Discipline Score.",
    };
  }

  const totalAvailableBaseWeight = availableComponents.reduce((sum, [_, item]) => sum + item.weight, 0);

  let finalScore = 0;
  const activeWeights: Record<string, number> = {};

  availableComponents.forEach(([key, item]) => {
    const normWeight = (item.weight / totalAvailableBaseWeight) * 100;
    activeWeights[key] = Math.round(normWeight);
    finalScore += (item.score as number) * (item.weight / totalAvailableBaseWeight);
  });

  finalScore = Math.min(100, Math.max(0, Math.round(finalScore)));
  const change = prevScore !== undefined && prevScore !== null ? finalScore - prevScore : null;

  let explanationParts: string[] = [];
  if (habitsScore !== null && habitsScore >= 80) explanationParts.push("Strong schedule-aligned habit consistency");
  if (taskFollowThroughScore !== null && taskFollowThroughScore >= 75) explanationParts.push("reliable follow-through on planned commitments");
  if (focusConsistencyScore !== null && focusConsistencyScore < 50) explanationParts.push("focus sessions were less regular this period");

  let explanation = explanationParts.length > 0
    ? explanationParts.join(", ") + "."
    : "Steady routine consistency and commitment follow-through.";

  explanation = explanation.charAt(0).toUpperCase() + explanation.slice(1);

  return {
    score: finalScore,
    status: "available",
    previousScore: prevScore ?? null,
    change,
    breakdown: {
      habitsScore,
      taskFollowThroughScore,
      studyConsistencyScore,
      focusConsistencyScore,
      workoutConsistencyScore,
      sleepConsistencyScore,
      dailyReviewsScore,
    },
    activeWeights,
    explanation,
  };
}

/* ============================================================================
   GOAL HEALTH CALCULATORS
============================================================================ */

export function calculateGoalHealth(goal: any): GoalHealthEvaluation {
  const actualProgress = goal.progress || 0;

  const milestones = goal.milestones || [];
  const completedMilestonesCount = milestones.filter((m: any) => m.completedAt).length;
  const totalMilestonesCount = milestones.length;

  const tasks = goal.tasks || [];
  const completedTasksCount = tasks.filter((t: any) => t.status === "COMPLETED").length;

  // 1. COMPLETED
  if (actualProgress >= 100 || goal.health === "COMPLETED") {
    return {
      health: "COMPLETED",
      healthReason: "Goal achieved! All objectives and target metrics reached.",
      expectedProgress: 100,
      progressGap: 0,
      timeElapsedPct: 100,
      daysRemaining: 0,
      daysSinceLastActivity: 0,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  // 2. PAUSED / ARCHIVED
  if (goal.isArchived) {
    return {
      health: "NOT_STARTED",
      healthReason: "Goal is archived.",
      expectedProgress: null,
      progressGap: null,
      timeElapsedPct: null,
      daysRemaining: null,
      daysSinceLastActivity: 0,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  const now = new Date();
  const createdAt = goal.createdAt ? new Date(goal.createdAt) : now;
  const goalAgeDays = Math.max(0, differenceInDays(now, createdAt));

  let expectedProgress: number | null = null;
  let progressGap: number | null = null;
  let timeElapsedPct: number | null = null;
  let daysRemaining: number | null = null;

  if (goal.targetDate) {
    const targetDate = new Date(goal.targetDate);
    const startDate = goal.startDate ? new Date(goal.startDate) : createdAt;

    const totalDays = Math.max(1, differenceInDays(targetDate, startDate));
    const elapsedDays = Math.max(0, differenceInDays(now, startDate));

    timeElapsedPct = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    expectedProgress = timeElapsedPct;
    progressGap = actualProgress - expectedProgress;
    daysRemaining = differenceInDays(targetDate, now);
  }

  const activityDates: Date[] = [
    new Date(goal.updatedAt || createdAt),
    new Date(createdAt),
  ];

  milestones.forEach((m: any) => {
    if (m.completedAt) activityDates.push(new Date(m.completedAt));
  });

  tasks.forEach((t: any) => {
    if (t.updatedAt) activityDates.push(new Date(t.updatedAt));
  });

  const mostRecentActivity = new Date(Math.max(...activityDates.map((d) => d.getTime())));
  const daysSinceLastActivity = Math.max(0, differenceInDays(now, mostRecentActivity));

  let inactivityThresholdDays = 14;
  let gracePeriodDays = 7;
  switch (goal.timeframe) {
    case "DAILY":
    case "WEEKLY":
      inactivityThresholdDays = 3;
      gracePeriodDays = 2;
      break;
    case "MONTHLY":
      inactivityThresholdDays = 7;
      gracePeriodDays = 4;
      break;
    case "QUARTERLY":
      inactivityThresholdDays = 14;
      gracePeriodDays = 7;
      break;
    case "ANNUAL":
    case "YEAR_3_5":
    case "VISION":
      inactivityThresholdDays = 30;
      gracePeriodDays = 7;
      break;
  }

  const isWithinGracePeriod = goalAgeDays <= gracePeriodDays;

  // 3. BEHIND
  if (daysRemaining !== null && daysRemaining < 0) {
    return {
      health: "BEHIND",
      healthReason: `Deadline passed ${Math.abs(daysRemaining)} day(s) ago with incomplete objectives.`,
      expectedProgress,
      progressGap,
      timeElapsedPct,
      daysRemaining,
      daysSinceLastActivity,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  if (progressGap !== null && progressGap <= -25) {
    return {
      health: "BEHIND",
      healthReason: `Actual progress (${actualProgress}%) is ${Math.abs(progressGap)}% behind expected timeline (${expectedProgress}%).`,
      expectedProgress,
      progressGap,
      timeElapsedPct,
      daysRemaining,
      daysSinceLastActivity,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  // 4. AT_RISK
  if (progressGap !== null && progressGap <= -10) {
    return {
      health: "AT_RISK",
      healthReason: `Actual progress (${actualProgress}%) is ${Math.abs(progressGap)}% behind expected timeline (${expectedProgress}%).`,
      expectedProgress,
      progressGap,
      timeElapsedPct,
      daysRemaining,
      daysSinceLastActivity,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  if (daysRemaining !== null && daysRemaining <= 7 && actualProgress < 70) {
    return {
      health: "AT_RISK",
      healthReason: `Deadline is in ${daysRemaining} days with ${100 - actualProgress}% remaining.`,
      expectedProgress,
      progressGap,
      timeElapsedPct,
      daysRemaining,
      daysSinceLastActivity,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  if (!isWithinGracePeriod && daysSinceLastActivity > inactivityThresholdDays && actualProgress < 90) {
    return {
      health: "AT_RISK",
      healthReason: `No recorded activity for ${daysSinceLastActivity} days.`,
      expectedProgress,
      progressGap,
      timeElapsedPct,
      daysRemaining,
      daysSinceLastActivity,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  // 5. NOT_STARTED
  if (actualProgress === 0 && completedMilestonesCount === 0 && completedTasksCount === 0) {
    return {
      health: "NOT_STARTED",
      healthReason: "Goal has not been started yet.",
      expectedProgress,
      progressGap,
      timeElapsedPct,
      daysRemaining,
      daysSinceLastActivity,
      completedMilestonesCount,
      totalMilestonesCount,
    };
  }

  // 6. ON_TRACK
  let trackReason = "Progress is on schedule with recent activity.";
  if (progressGap !== null && progressGap > 0) {
    trackReason = `Progress (${actualProgress}%) is ${progressGap}% ahead of expected timeline.`;
  }

  return {
    health: "ON_TRACK",
    healthReason: trackReason,
    expectedProgress,
    progressGap,
    timeElapsedPct,
    daysRemaining,
    daysSinceLastActivity,
    completedMilestonesCount,
    totalMilestonesCount,
  };
}

export function calculateGoalHealthSummary(goalsWithHealth: any[]): GoalHealthSummary {
  const activeGoals = goalsWithHealth.filter((g) => !g.isArchived);

  return {
    totalActive: activeGoals.length,
    onTrackCount: activeGoals.filter((g) => g.health === "ON_TRACK").length,
    atRiskCount: activeGoals.filter((g) => g.health === "AT_RISK").length,
    behindCount: activeGoals.filter((g) => g.health === "BEHIND").length,
    notStartedCount: activeGoals.filter((g) => g.health === "NOT_STARTED").length,
    completedCount: activeGoals.filter((g) => g.health === "COMPLETED").length,
  };
}

/* ============================================================================
   MODULE ANALYTICS CALCULATORS (TIME, HABITS, EDUCATION, FITNESS, SLEEP, BALANCE)
============================================================================ */

export function calculateLifeBalanceAnalytics(
  timeEntries: any[],
  focusSessions: any[],
  studySessions: any[],
  workouts: any[],
  sleepRecords: any[],
  ranges: DateRangeBoundaries
) {
  const periodDays = Math.max(1, ranges.periodDays);
  const totalAvailableHours = periodDays * 24;

  const workSeconds = timeEntries
    .filter((e) => ["work", "coding", "project"].includes((e.category || "").toLowerCase()))
    .reduce((sum, e) => sum + (e.duration || 0), 0) +
    focusSessions.reduce((sum, f) => sum + (f.duration || 0), 0);

  const studySeconds = studySessions.reduce((sum, s) => sum + (s.duration || 0), 0) +
    timeEntries
      .filter((e) => ["study", "reading"].includes((e.category || "").toLowerCase()))
      .reduce((sum, e) => sum + (e.duration || 0), 0);

  const fitnessSeconds = workouts.length * 3600; // estimated 1h per workout session
  const sleepHours = sleepRecords.reduce((sum, s) => sum + (s.duration || 0), 0);
  const sleepSeconds = sleepHours * 3600;

  const personalSeconds = timeEntries
    .filter((e) => ["personal", "health", "mindfulness"].includes((e.category || "").toLowerCase()))
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const totalTrackedSeconds = workSeconds + studySeconds + fitnessSeconds + sleepSeconds + personalSeconds;
  const totalTrackedHours = Math.round((totalTrackedSeconds / 3600) * 10) / 10;

  const distribution = [
    { area: "Work & Career", hours: Math.round((workSeconds / 3600) * 10) / 10, pct: Math.round((workSeconds / (totalTrackedSeconds || 1)) * 100) },
    { area: "Education & Learning", hours: Math.round((studySeconds / 3600) * 10) / 10, pct: Math.round((studySeconds / (totalTrackedSeconds || 1)) * 100) },
    { area: "Fitness & Health", hours: Math.round((fitnessSeconds / 3600) * 10) / 10, pct: Math.round((fitnessSeconds / (totalTrackedSeconds || 1)) * 100) },
    { area: "Sleep & Rest", hours: Math.round(sleepHours * 10) / 10, pct: Math.round((sleepSeconds / (totalTrackedSeconds || 1)) * 100) },
    { area: "Personal & Wellbeing", hours: Math.round((personalSeconds / 3600) * 10) / 10, pct: Math.round((personalSeconds / (totalTrackedSeconds || 1)) * 100) },
  ];

  return {
    totalTrackedHours,
    distribution,
  };
}

export function generateDeterministicInsights(summaryData: any): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const { overview, productivityScore, disciplineScore, goalHealthSummary } = summaryData;

  // 1. Productivity Insight
  if (productivityScore?.score !== null && productivityScore?.score !== undefined) {
    if (productivityScore.score >= 80) {
      insights.push({
        id: "prod-high",
        type: "FACT",
        category: "productivity",
        title: "High Output Performance",
        description: `Your Productivity Score reached ${productivityScore.score}/100. High-priority task completion and focus hours are well-aligned.`,
        metric: `${productivityScore.score}/100`,
      });
    } else if (productivityScore.score < 50) {
      insights.push({
        id: "prod-low",
        type: "RECOMMENDATION",
        category: "productivity",
        title: "Focus Area Recommendation",
        description: "Task completion rate was lower this period. Try scheduling dedicated 25-minute Focus Sessions for top-priority items.",
      });
    }
  }

  // 2. Discipline / Habit Insight
  if (disciplineScore?.score !== null && disciplineScore?.score !== undefined) {
    if (disciplineScore.score >= 75) {
      insights.push({
        id: "disc-high",
        type: "TREND",
        category: "habits",
        title: "Consistent Commitment Adherence",
        description: `Discipline Score is ${disciplineScore.score}/100, reflecting strong habit check-in frequency and follow-through.`,
        metric: `${disciplineScore.score}/100`,
      });
    }
  }

  // 3. Goal Health Insight
  if (goalHealthSummary && goalHealthSummary.totalActive > 0) {
    if (goalHealthSummary.atRiskCount > 0 || goalHealthSummary.behindCount > 0) {
      insights.push({
        id: "goal-risk",
        type: "RECOMMENDATION",
        category: "productivity",
        title: "Goal Deadline Attention Required",
        description: `${goalHealthSummary.behindCount} goal(s) behind schedule and ${goalHealthSummary.atRiskCount} at risk. Review milestone progress.`,
        metric: `${goalHealthSummary.behindCount + goalHealthSummary.atRiskCount} goals`,
      });
    } else if (goalHealthSummary.onTrackCount === goalHealthSummary.totalActive) {
      insights.push({
        id: "goal-ontrack",
        type: "FACT",
        category: "productivity",
        title: "All Goals On Schedule",
        description: `All ${goalHealthSummary.totalActive} active goals are currently progressing on or ahead of schedule.`,
      });
    }
  }

  // 4. Study & Focus Correlation / Fact
  if (overview.studyHours > 0 && overview.focusHours > 0) {
    insights.push({
      id: "study-focus-fact",
      type: "FACT",
      category: "study",
      title: "Active Learning & Deep Work",
      description: `Log of ${overview.studyHours} study hours and ${overview.focusHours} focus hours recorded in this period.`,
      metric: `${overview.studyHours + overview.focusHours}h total`,
    });
  }

  return insights;
}

/* ============================================================================
   SHARED DATA ACCESS & SUMMARY AGGREGATOR
============================================================================ */

export async function getRawAnalyticsData(userId: string, ranges: DateRangeBoundaries) {
  const { currentStart, currentEnd, previousStart, previousEnd } = ranges;

  const [
    currentTasks,
    previousTasks,
    activeHabits,
    currentHabitLogs,
    previousHabitLogs,
    currentTimeEntries,
    previousTimeEntries,
    currentFocusSessions,
    previousFocusSessions,
    currentStudySessions,
    previousStudySessions,
    totalSubjectsCount,
    totalSkillsCount,
    currentWorkouts,
    previousWorkouts,
    currentSleepRecords,
    previousSleepRecords,
    currentBooks,
    currentReadingSessions,
    activeGoals,
    currentDailyReviews,
    previousDailyReviews,
  ] = await Promise.all([
    prisma.task.findMany({
      where: { userId, createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.task.findMany({
      where: { userId, createdAt: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.habit.findMany({ where: { userId, isActive: true } }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.focusSession.findMany({
      where: { userId, startTime: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.focusSession.findMany({
      where: { userId, startTime: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.studySession.findMany({
      where: { userId, startTime: { gte: currentStart, lte: currentEnd } },
      include: { subject: { select: { name: true } } },
    }),
    prisma.studySession.findMany({
      where: { userId, startTime: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.subject.count({ where: { userId, isActive: true } }),
    prisma.skill.count({ where: { userId, isActive: true } }),
    prisma.workout.findMany({
      where: { userId, date: { gte: currentStart, lte: currentEnd } },
      include: { sets: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.sleepRecord.findMany({
      where: { userId, date: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.sleepRecord.findMany({
      where: { userId, date: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.book.findMany({ where: { userId } }),
    prisma.readingSession.findMany({
      where: { userId, startTime: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.goal.findMany({
      where: { userId, isArchived: false },
      include: { milestones: true, tasks: true },
    }),
    prisma.dailyReview.findMany({
      where: { userId, date: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.dailyReview.findMany({
      where: { userId, date: { gte: previousStart, lte: previousEnd } },
    }),
  ]);

  return {
    currentTasks,
    previousTasks,
    activeHabits,
    currentHabitLogs,
    previousHabitLogs,
    currentTimeEntries,
    previousTimeEntries,
    currentFocusSessions,
    previousFocusSessions,
    currentStudySessions,
    previousStudySessions,
    totalSubjectsCount,
    totalSkillsCount,
    currentWorkouts,
    previousWorkouts,
    currentSleepRecords,
    previousSleepRecords,
    currentBooks,
    currentReadingSessions,
    activeGoals,
    currentDailyReviews,
    previousDailyReviews,
  };
}

export function calculateAnalyticsSummary(
  data: Awaited<ReturnType<typeof getRawAnalyticsData>>,
  ranges: DateRangeBoundaries,
  rangeType: string = "30d"
) {
  const {
    currentTasks,
    previousTasks,
    activeHabits,
    currentHabitLogs,
    previousHabitLogs,
    currentTimeEntries,
    previousTimeEntries,
    currentFocusSessions,
    previousFocusSessions,
    currentStudySessions,
    previousStudySessions,
    totalSubjectsCount,
    totalSkillsCount,
    currentWorkouts,
    previousWorkouts,
    currentSleepRecords,
    previousSleepRecords,
    activeGoals,
    currentDailyReviews,
    previousDailyReviews,
  } = data;

  const prevProdScore = calculateProductivityScore(
    previousTasks,
    previousFocusSessions,
    previousTimeEntries,
    previousStudySessions,
    activeGoals,
    ranges,
    rangeType
  );

  const productivityScore = calculateProductivityScore(
    currentTasks,
    currentFocusSessions,
    currentTimeEntries,
    currentStudySessions,
    activeGoals,
    ranges,
    rangeType,
    prevProdScore.score
  );

  const prevDiscScore = calculateDisciplineScore(
    previousHabitLogs,
    activeHabits,
    previousTasks,
    previousStudySessions,
    previousFocusSessions,
    previousWorkouts,
    previousSleepRecords,
    previousDailyReviews,
    ranges
  );

  const disciplineScore = calculateDisciplineScore(
    currentHabitLogs,
    activeHabits,
    currentTasks,
    currentStudySessions,
    currentFocusSessions,
    currentWorkouts,
    currentSleepRecords,
    currentDailyReviews,
    ranges,
    prevDiscScore.score
  );

  // Goal Health Evaluation
  const evaluatedGoals = activeGoals.map((g) => {
    const evalResult = calculateGoalHealth(g);
    return { ...g, ...evalResult };
  });

  const goalHealthSummary = calculateGoalHealthSummary(evaluatedGoals);

  // Task Metrics
  const tasksCreated = currentTasks.length;
  const tasksCompleted = currentTasks.filter((t) => t.status === "COMPLETED").length;
  const taskCompletionRate = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;
  const prevTasksCompleted = previousTasks.filter((t) => t.status === "COMPLETED").length;
  const taskCompletionTrend = calculatePercentageChange(tasksCompleted, prevTasksCompleted);

  // Time Metrics
  const currentTrackedSeconds = currentTimeEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
  const previousTrackedSeconds = previousTimeEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
  const trackedHours = Math.round((currentTrackedSeconds / 3600) * 10) / 10;
  const trackedHoursTrend = calculatePercentageChange(currentTrackedSeconds, previousTrackedSeconds);

  // Category distribution
  const categoryMap: Record<string, number> = {};
  currentTimeEntries.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Math.round((e.duration || 0) / 3600);
  });
  const categoryDistribution = Object.entries(categoryMap).map(([name, hours]) => ({
    name,
    hours,
  }));

  // Study Metrics
  const currentStudySeconds = currentStudySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const previousStudySeconds = previousStudySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const studyHours = Math.round((currentStudySeconds / 3600) * 10) / 10;
  const studyHoursTrend = calculatePercentageChange(currentStudySeconds, previousStudySeconds);

  // Focus Metrics
  const currentFocusSeconds = currentFocusSessions.reduce((acc, f) => acc + (f.duration || 0), 0);
  const previousFocusSeconds = previousFocusSessions.reduce((acc, f) => acc + (f.duration || 0), 0);
  const focusHours = Math.round((currentFocusSeconds / 3600) * 10) / 10;
  const focusHoursTrend = calculatePercentageChange(currentFocusSeconds, previousFocusSeconds);

  // Habit Metrics
  const completedHabitLogsCount = currentHabitLogs.filter((l) => l.completed).length;
  const prevCompletedHabitLogsCount = previousHabitLogs.filter((l) => l.completed).length;
  const habitConsistencyTrend = calculatePercentageChange(completedHabitLogsCount, prevCompletedHabitLogsCount);

  // Fitness Metrics
  const workoutCount = currentWorkouts.length;
  const workoutTrend = calculatePercentageChange(workoutCount, previousWorkouts.length);
  const totalVolumeKg = currentWorkouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0);

  // Sleep Metrics
  const avgSleepDuration = currentSleepRecords.length > 0
    ? Math.round((currentSleepRecords.reduce((acc, s) => acc + s.duration, 0) / currentSleepRecords.length) * 10) / 10
    : 8;
  const avgSleepQuality = currentSleepRecords.length > 0
    ? Math.round((currentSleepRecords.reduce((acc, s) => acc + (s.quality || 7), 0) / currentSleepRecords.length) * 10) / 10
    : 8;

  const completedGoalsCount = activeGoals.filter((g) => g.health === "COMPLETED" || g.progress >= 100).length;

  const lifeBalance = calculateLifeBalanceAnalytics(
    currentTimeEntries,
    currentFocusSessions,
    currentStudySessions,
    currentWorkouts,
    currentSleepRecords,
    ranges
  );

  const baseSummary = {
    ranges,
    productivityScore,
    disciplineScore,
    goalHealthSummary,
    lifeBalance,
    overview: {
      taskCompletionRate,
      tasksCompleted,
      taskCompletionTrend,
      trackedHours,
      trackedHoursTrend,
      studyHours,
      studyHoursTrend,
      focusHours,
      focusHoursTrend,
      activeHabitsCount: activeHabits.length,
      completedHabitLogsCount,
      habitConsistencyTrend,
      workoutCount,
      workoutTrend,
      totalVolumeKg,
      avgSleepDuration,
      avgSleepQuality,
      totalSubjectsCount,
      totalSkillsCount,
      completedGoalsCount,
      activeGoalsCount: activeGoals.length,
    },
    categoryDistribution,
  };

  const insights = generateDeterministicInsights(baseSummary);

  return {
    ...baseSummary,
    insights,
  };
}
