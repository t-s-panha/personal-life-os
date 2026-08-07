import assert from "node:assert";
import { test, describe } from "node:test";
import { calculateHabitStreaks, parseTargetDays } from "../src/lib/habits";
import { getZonedDateString, DEFAULT_OFFSET_MINUTES } from "../src/lib/timezone";

describe("Habit Streaks & Schedule Engine Unit Tests", () => {
  // Test A & B: Daily habit, 10 consecutive completed days -> streak 10, total 10
  test("Daily habit calculates streak beyond 7 visible days", () => {
    const baseMs = new Date("2026-08-08T12:00:00Z").getTime();
    const logs = [];

    // 10 consecutive completed days ending today
    for (let i = 0; i < 10; i++) {
      const date = new Date(baseMs - i * 86400000);
      logs.push({ date: date.toISOString(), completed: true });
    }

    const res = calculateHabitStreaks(logs, "[0,1,2,3,4,5,6]", DEFAULT_OFFSET_MINUTES, new Date(baseMs));
    assert.strictEqual(res.currentStreak, 10);
    assert.strictEqual(res.totalCompletions, 10);
    assert.strictEqual(res.longestStreak, 10);
  });

  // Test C: Mon/Wed/Fri habit across 2 weeks
  test("Mon/Wed/Fri habit streak counts scheduled opportunities, ignoring off-schedule days", () => {
    const nowInput = new Date("2026-08-07T12:00:00Z"); // Friday
    const logs = [
      { date: "2026-08-07T10:00:00Z", completed: true }, // Fri
      { date: "2026-08-05T10:00:00Z", completed: true }, // Wed
      { date: "2026-08-03T10:00:00Z", completed: true }, // Mon
      { date: "2026-07-31T10:00:00Z", completed: true }, // Fri
    ];

    const targetDays = "[1,3,5]"; // Mon, Wed, Fri
    const res = calculateHabitStreaks(logs, targetDays, DEFAULT_OFFSET_MINUTES, nowInput);
    assert.strictEqual(res.currentStreak, 4);
    assert.strictEqual(res.totalCompletions, 4);
  });

  // Test D: Missed scheduled day resets streak
  test("Missed scheduled opportunity breaks current streak", () => {
    const nowInput = new Date("2026-08-08T12:00:00Z"); // Saturday
    const logs = [
      { date: "2026-08-07T10:00:00Z", completed: true }, // Friday
      // Missed Thursday 2026-08-06!
      { date: "2026-08-05T10:00:00Z", completed: true }, // Wednesday
      { date: "2026-08-04T10:00:00Z", completed: true }, // Tuesday
    ];

    const res = calculateHabitStreaks(logs, "[0,1,2,3,4,5,6]", DEFAULT_OFFSET_MINUTES, nowInput);
    assert.strictEqual(res.currentStreak, 1);
    assert.strictEqual(res.totalCompletions, 3);
    assert.strictEqual(res.longestStreak, 2);
  });

  // Test E: Toggling log off recalculates totals deterministically
  test("Toggling log off removes log and recalculates totals deterministically", () => {
    const nowInput = new Date("2026-08-08T12:00:00Z");
    const logsBefore = [
      { date: "2026-08-08T10:00:00Z", completed: true },
      { date: "2026-08-07T10:00:00Z", completed: true },
      { date: "2026-08-06T10:00:00Z", completed: true },
    ];
    const resBefore = calculateHabitStreaks(logsBefore, "[0,1,2,3,4,5,6]", DEFAULT_OFFSET_MINUTES, nowInput);
    assert.strictEqual(resBefore.currentStreak, 3);
    assert.strictEqual(resBefore.totalCompletions, 3);

    // Toggle 2026-08-07 OFF (uncheck day 07 -> log removed from DB)
    const logsAfter = [
      { date: "2026-08-08T10:00:00Z", completed: true },
      { date: "2026-08-06T10:00:00Z", completed: true },
    ];
    const resAfter = calculateHabitStreaks(logsAfter, "[0,1,2,3,4,5,6]", DEFAULT_OFFSET_MINUTES, nowInput);
    assert.strictEqual(resAfter.currentStreak, 1); // Streak from 08 breaks at missed 07
    assert.strictEqual(resAfter.totalCompletions, 2);

    // Recheck 2026-08-07 ON
    const logsRechecked = [
      { date: "2026-08-08T10:00:00Z", completed: true },
      { date: "2026-08-07T10:00:00Z", completed: true },
      { date: "2026-08-06T10:00:00Z", completed: true },
    ];
    const resRechecked = calculateHabitStreaks(logsRechecked, "[0,1,2,3,4,5,6]", DEFAULT_OFFSET_MINUTES, nowInput);
    assert.strictEqual(resRechecked.currentStreak, 3);
    assert.strictEqual(resRechecked.totalCompletions, 3);
  });

  // Test G: Timezone 00:05 Phnom Penh completion
  test("00:05 Phnom Penh completion is assigned to correct Cambodian date", () => {
    const utcLogDate = new Date(Date.UTC(2026, 7, 7, 17, 5, 0));
    const zonedDateStr = getZonedDateString(utcLogDate, DEFAULT_OFFSET_MINUTES);
    assert.strictEqual(zonedDateStr, "2026-08-08");

    const logs = [{ date: utcLogDate.toISOString(), completed: true }];
    const res = calculateHabitStreaks(logs, "[0,1,2,3,4,5,6]", DEFAULT_OFFSET_MINUTES, new Date("2026-08-08T12:00:00Z"));
    assert.strictEqual(res.totalCompletions, 1);
  });
});
