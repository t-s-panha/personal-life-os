import assert from "node:assert";
import { test, describe } from "node:test";
import { calculateElapsedSeconds, ActiveTimer } from "../src/context/TimerContext";

describe("Global Persistent Timer Unit Tests", () => {
  test("calculateElapsedSeconds computes exact elapsed time based on timestamps", () => {
    const nowMs = 1700000000000;
    const startedAt = new Date(nowMs - 120 * 1000).toISOString(); // Started 120s ago

    const timer: ActiveTimer = {
      startedAt,
      pausedAt: null,
      accumulatedPausedMs: 0,
      description: "Coding session",
      category: "work",
    };

    const elapsed = calculateElapsedSeconds(timer, nowMs);
    assert.strictEqual(elapsed, 120);
  });

  test("calculateElapsedSeconds correctly deducts paused time", () => {
    const nowMs = 1700000000000;
    const startedAt = new Date(nowMs - 300 * 1000).toISOString(); // Started 300s ago

    // Paused for 60 seconds total
    const timer: ActiveTimer = {
      startedAt,
      pausedAt: null,
      accumulatedPausedMs: 60 * 1000,
      description: "Study session",
      category: "study",
    };

    // 300s total - 60s paused = 240s active elapsed
    const elapsed = calculateElapsedSeconds(timer, nowMs);
    assert.strictEqual(elapsed, 240);
  });

  test("calculateElapsedSeconds handles active paused state", () => {
    const nowMs = 1700000000000;
    const startedAt = new Date(nowMs - 600 * 1000).toISOString(); // Started 600s ago
    const pausedAt = new Date(nowMs - 100 * 1000).toISOString(); // Paused 100s ago

    const timer: ActiveTimer = {
      startedAt,
      pausedAt,
      accumulatedPausedMs: 50 * 1000, // 50s previously paused
      description: "Reading",
      category: "reading",
    };

    // Total elapsed wall clock = 600s
    // Paused = 50s + 100s = 150s
    // Active = 600s - 150s = 450s
    const elapsed = calculateElapsedSeconds(timer, nowMs);
    assert.strictEqual(elapsed, 450);
  });

  test("calculateElapsedSeconds returns 0 for null timer or invalid date", () => {
    assert.strictEqual(calculateElapsedSeconds(null), 0);

    const invalidTimer: ActiveTimer = {
      startedAt: "invalid-date",
      pausedAt: null,
      accumulatedPausedMs: 0,
      description: "",
      category: "work",
    };
    assert.strictEqual(calculateElapsedSeconds(invalidTimer), 0);
  });
});
