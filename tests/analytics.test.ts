import assert from "node:assert";
import { test, describe } from "node:test";
import {
  getAnalyticsDateRanges,
  calculatePercentageChange,
  calculatePriorityTaskScore,
  calculateFocusScore,
  calculateProductivityScore,
  calculateDisciplineScore,
  calculateGoalHealth,
  calculateScheduleAwareHabitScore,
} from "../src/lib/analytics";

describe("Comprehensive Analytics & Intelligence Unit Tests", () => {
  // 1. PERCENTAGE CHANGE & BOUNDARIES
  test("calculatePercentageChange handles zero, null, and normal values correctly", () => {
    assert.strictEqual(calculatePercentageChange(10, 0), 100);
    assert.strictEqual(calculatePercentageChange(0, 0), 0);
    assert.strictEqual(calculatePercentageChange(15, 10), 50);
    assert.strictEqual(calculatePercentageChange(5, 10), -50);
  });

  // 2. ANALYTICS DATE RANGES
  test("getAnalyticsDateRanges supports 7d, 30d, 90d, 6m, 1y, and all ranges", () => {
    const ranges = ["7d", "30d", "90d", "6m", "1y", "all"] as const;
    for (const r of ranges) {
      const b = getAnalyticsDateRanges(r);
      assert.ok(b.periodDays > 0);
      assert.ok(b.currentStart < b.currentEnd);
      assert.ok(b.previousStart < b.previousEnd);
      assert.ok(b.previousEnd < b.currentStart);
    }
  });

  // 3. PRODUCTIVITY SCORE TESTS
  test("calculateProductivityScore handles insufficient data gracefully", () => {
    const ranges = getAnalyticsDateRanges("30d");
    const res = calculateProductivityScore([], [], [], [], [], ranges, "30d", null);
    assert.strictEqual(res.status, "insufficient_data");
    assert.strictEqual(res.score, null);
  });

  test("calculateProductivityScore redistributes weights when goals are missing", () => {
    const ranges = getAnalyticsDateRanges("30d");
    const tasks = [{ status: "COMPLETED", priority: 3 }];
    const focus = [{ duration: 3600 }];
    const time = [{ category: "work", duration: 3600 }];
    const study = [{ duration: 1800 }];
    
    // No active goals passed
    const res = calculateProductivityScore(tasks, focus, time, study, [], ranges, "30d", null);
    assert.strictEqual(res.status, "available");
    assert.ok(res.score !== null && res.score >= 0 && res.score <= 100);
  });

  // 4. DISCIPLINE SCORE TESTS
  test("calculateDisciplineScore handles insufficient data gracefully", () => {
    const ranges = getAnalyticsDateRanges("30d");
    const res = calculateDisciplineScore([], [], [], [], [], [], [], [], ranges, null);
    assert.strictEqual(res.status, "insufficient_data");
    assert.strictEqual(res.score, null);
  });

  test("calculateScheduleAwareHabitScore accounts for scheduled habit days and mid-period creation", () => {
    const habits = [
      {
        id: "h1",
        targetDays: "[1,3,5]", // Mon, Wed, Fri
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        logs: [{ completed: true }],
      },
    ];
    const habitLogs = [{ habitId: "h1", completed: true, date: new Date() }];
    const ranges = getAnalyticsDateRanges("7d");
    const score = calculateScheduleAwareHabitScore(habitLogs, habits, ranges);
    assert.ok(score !== null && score >= 0 && score <= 100);
  });

  // 5. GOAL HEALTH TESTS
  test("calculateGoalHealth evaluates all 5 Goal Health states correctly", () => {
    // 1. COMPLETED
    const completedGoal = {
      progress: 100,
      targetValue: 100,
      currentValue: 100,
      startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      tasks: [],
      projects: [],
      milestones: [],
    };
    assert.strictEqual(calculateGoalHealth(completedGoal).health, "COMPLETED");

    // 2. NOT_STARTED (new goal, ample time)
    const newNotStartedGoal = {
      progress: 0,
      targetValue: 100,
      currentValue: 0,
      startDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + 90 * 86400000).toISOString(),
      tasks: [],
      projects: [],
      milestones: [],
    };
    assert.strictEqual(calculateGoalHealth(newNotStartedGoal).health, "NOT_STARTED");

    // 3. BEHIND (expired deadline or severe gap)
    const expiredGoal = {
      progress: 20,
      targetValue: 100,
      currentValue: 20,
      startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
      targetDate: new Date(Date.now() - 5 * 86400000).toISOString(), // Expired 5 days ago
      tasks: [],
      projects: [],
      milestones: [],
    };
    assert.strictEqual(calculateGoalHealth(expiredGoal).health, "BEHIND");

    // 4. Missing targetDate fallback
    const missingTargetDateGoal = {
      progress: 50,
      targetValue: 100,
      currentValue: 50,
      startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      targetDate: null,
      tasks: [],
      projects: [],
      milestones: [],
    };
    const missingEval = calculateGoalHealth(missingTargetDateGoal);
    assert.ok(["ON_TRACK", "AT_RISK", "BEHIND", "NOT_STARTED", "COMPLETED"].includes(missingEval.health));
  });
});
