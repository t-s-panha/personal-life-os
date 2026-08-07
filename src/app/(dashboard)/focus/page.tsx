"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Zap, AlertTriangle, Star, CheckCircle2, Coffee } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FocusSession {
  id: string;
  presetName: string;
  duration: number | null;
  distractions: number;
  focusRating: number | null;
  startTime: string;
}

const PRESETS = [
  { label: "Pomodoro (25/5)", work: 25 * 60, break: 5 * 60 },
  { label: "Deep Work (50/10)", work: 50 * 60, break: 10 * 60 },
  { label: "Quick Sprint (15/3)", work: 15 * 60, break: 3 * 60 },
];

export default function FocusPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [loading, setLoading] = useState(true);

  // Timer state
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].work);
  const [isRunning, setIsRunning] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const [rating, setRating] = useState(4);

  const activePreset = PRESETS[selectedPresetIdx];

  const fetchSessions = useCallback(async () => {
    try {
      const [focusRes, tasksRes] = await Promise.all([
        fetch("/api/focus"),
        fetch("/api/tasks"),
      ]);
      if (focusRes.ok) setSessions(await focusRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
    } catch (err) {
      console.error("Failed to fetch focus sessions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      clearInterval(timer);
      handleFinishSession();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    setIsRunning(false);
    setMode("work");
    setTimeLeft(PRESETS[idx].work);
    setDistractions(0);
  };

  const handleToggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? activePreset.work : activePreset.break);
  };

  const handleLogDistraction = () => {
    setDistractions((prev) => prev + 1);
  };

  const handleFinishSession = async () => {
    setIsRunning(false);

    if (mode === "work") {
      try {
        await fetch("/api/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presetName: activePreset.label,
            workDuration: activePreset.work,
            breakDuration: activePreset.break,
            duration: activePreset.work,
            distractions,
            focusRating: rating,
            isCompleted: true,
            taskId: selectedTaskId || null,
          }),
        });
        fetchSessions();
      } catch (err) {
        console.error("Save focus session failed", err);
      }

      // Safe notification trigger for mobile/desktop browsers
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Focus Session Complete! 🎉", {
            body: `Great job completing ${activePreset.label}! Take a break.`,
          });
        } catch {
          // Ignore notification error on mobile browsers
        }
      }

      // Switch to break
      setMode("break");
      setTimeLeft(activePreset.break);
      setDistractions(0);
    } else {
      // Break completed, return to work
      setMode("work");
      setTimeLeft(activePreset.work);
    }
  };

  const totalFocusSeconds = sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading focus timer...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Focus Timer</h1>
          <p className="text-muted-foreground mt-1">Pomodoro interval timer to eliminate distractions and boost deep work</p>
        </div>
        <Card className="bg-primary/5 border-primary/20 p-3 flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Focus Today</p>
            <p className="text-lg font-bold">{formatDuration(totalFocusSeconds)}</p>
          </div>
        </Card>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2">
        {PRESETS.map((p, idx) => (
          <Button
            key={p.label}
            variant={selectedPresetIdx === idx ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset(idx)}
            disabled={isRunning}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Timer Main Card */}
      <Card className={cn(
        "text-white shadow-xl transition-all duration-500",
        mode === "work"
          ? "bg-gradient-to-br from-indigo-600 to-purple-800"
          : "bg-gradient-to-br from-emerald-600 to-teal-800"
      )}>
        <CardContent className="p-8 sm:p-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm font-semibold">
            {mode === "work" ? <Zap className="w-4 h-4 text-amber-300" /> : <Coffee className="w-4 h-4 text-emerald-200" />}
            {mode === "work" ? "DEEP FOCUS MODE" : "REST & BREAK TIME"}
          </div>

          <div className="text-6xl sm:text-8xl font-mono font-bold tracking-wider drop-shadow-md">
            {formatDuration(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              onClick={handleToggleTimer}
              size="lg"
              className={cn(
                "h-14 px-8 text-lg font-bold shadow-lg flex items-center gap-2",
                isRunning
                  ? "bg-amber-400 hover:bg-amber-500 text-slate-950"
                  : "bg-white text-slate-950 hover:bg-white/90"
              )}
            >
              {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              {isRunning ? "Pause" : "Start Focus"}
            </Button>
            <Button
              onClick={handleResetTimer}
              variant="outline"
              size="icon"
              className="h-14 w-14 border-white/20 bg-white/10 hover:bg-white/20 text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Distraction & Rating Bar */}
          {mode === "work" && (
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/10 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogDistraction}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> Log Distraction ({distractions})
              </Button>

              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                <span className="opacity-80">Rating:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={cn(
                      "p-0.5 rounded transition-transform hover:scale-110",
                      rating >= s ? "text-amber-300" : "text-white/30"
                    )}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Focus Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Zap className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-medium text-sm">No focus sessions completed today.</p>
              <p className="text-xs mt-1">Start the Pomodoro timer above to boost your productivity!</p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="font-medium text-sm">{sess.presetName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sess.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {sess.distractions > 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        {sess.distractions} distraction(s)
                      </Badge>
                    )}
                    <span className="font-mono font-semibold">
                      {formatDuration(sess.duration || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
