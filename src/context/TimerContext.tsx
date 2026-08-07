"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ActiveTimer {
  startedAt: string; // ISO string
  pausedAt: string | null; // ISO string if currently paused
  accumulatedPausedMs: number;
  description: string;
  category: string;
  taskId?: string | null;
  projectId?: string | null;
  productivityRating?: number | null;
}

export interface StartTimerInput {
  description?: string;
  category?: string;
  taskId?: string | null;
  projectId?: string | null;
  productivityRating?: number | null;
}

interface TimerContextType {
  activeTimer: ActiveTimer | null;
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  isSubmitting: boolean;
  startTimer: (input?: StartTimerInput) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<boolean>;
  discardTimer: () => void;
}

const TIMER_STORAGE_KEY = "personal_life_os_active_timer";

export function calculateElapsedSeconds(timer: ActiveTimer | null, nowMs: number = Date.now()): number {
  if (!timer || !timer.startedAt) return 0;
  const startMs = new Date(timer.startedAt).getTime();
  if (isNaN(startMs)) return 0;

  let pausedMs = timer.accumulatedPausedMs || 0;
  if (timer.pausedAt) {
    const pauseStartMs = new Date(timer.pausedAt).getTime();
    if (!isNaN(pauseStartMs)) {
      pausedMs += Math.max(0, nowMs - pauseStartMs);
    }
  }

  const diffMs = Math.max(0, nowMs - startMs - pausedMs);
  return Math.floor(diffMs / 1000);
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore active timer from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed: ActiveTimer = JSON.parse(saved);
        if (parsed && parsed.startedAt) {
          const startMs = new Date(parsed.startedAt).getTime();
          // Validate timestamp is valid and not absurdly old (> 48 hours)
          if (!isNaN(startMs) && Date.now() - startMs < 48 * 3600 * 1000) {
            setActiveTimer(parsed);
          } else {
            localStorage.removeItem(TIMER_STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore timer from localStorage", e);
    }
  }, []);

  // Save active timer state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (activeTimer) {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(activeTimer));
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save timer to localStorage", e);
    }
  }, [activeTimer]);

  // Update elapsed seconds using timestamp math once per second
  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }

    // Initial update
    setElapsedSeconds(calculateElapsedSeconds(activeTimer));

    // Tick interval
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsedSeconds(activeTimer));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = (input?: StartTimerInput) => {
    const now = new Date().toISOString();
    const newTimer: ActiveTimer = {
      startedAt: now,
      pausedAt: null,
      accumulatedPausedMs: 0,
      description: input?.description || "",
      category: input?.category || "work",
      taskId: input?.taskId || null,
      projectId: input?.projectId || null,
      productivityRating: input?.productivityRating ?? 4,
    };
    setActiveTimer(newTimer);
  };

  const pauseTimer = () => {
    if (!activeTimer || activeTimer.pausedAt) return;
    setActiveTimer({
      ...activeTimer,
      pausedAt: new Date().toISOString(),
    });
  };

  const resumeTimer = () => {
    if (!activeTimer || !activeTimer.pausedAt) return;
    const nowMs = Date.now();
    const pauseStartMs = new Date(activeTimer.pausedAt).getTime();
    const additionalPausedMs = Math.max(0, nowMs - pauseStartMs);

    setActiveTimer({
      ...activeTimer,
      pausedAt: null,
      accumulatedPausedMs: (activeTimer.accumulatedPausedMs || 0) + additionalPausedMs,
    });
  };

  const discardTimer = () => {
    setActiveTimer(null);
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  // Authoritative single-stop function with idempotency guard
  const stopTimer = async (): Promise<boolean> => {
    if (!activeTimer || isSubmitting) return false;

    const totalSeconds = calculateElapsedSeconds(activeTimer);
    const endTime = new Date().toISOString();
    const startTime = activeTimer.startedAt;

    setIsSubmitting(true);

    try {
      // Don't persist empty timers under 3 seconds
      if (totalSeconds >= 3) {
        const res = await fetch("/api/time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: activeTimer.description.trim() || null,
            category: activeTimer.category || "work",
            startTime,
            endTime,
            duration: totalSeconds,
            productivityRating: activeTimer.productivityRating || 4,
            taskId: activeTimer.taskId || null,
            projectId: activeTimer.projectId || null,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to persist time entry to server");
        }
      }

      // Success: clear timer state
      setActiveTimer(null);
      localStorage.removeItem(TIMER_STORAGE_KEY);
      return true;
    } catch (err) {
      console.error("Stop timer failed:", err);
      // Keep active timer state intact on error so user can retry!
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRunning = Boolean(activeTimer && !activeTimer.pausedAt);
  const isPaused = Boolean(activeTimer && activeTimer.pausedAt);

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        isRunning,
        isPaused,
        elapsedSeconds,
        isSubmitting,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        discardTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
