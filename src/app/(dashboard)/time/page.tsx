"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, Square, Plus, Trash2, Tag, Star, BarChart2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimeEntry {
  id: string;
  category: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  productivityRating: number | null;
  task?: { id: string; title: string } | null;
  project?: { id: string; name: string } | null;
}

const CATEGORIES = [
  { value: "work", label: "Work", color: "bg-blue-500 text-white" },
  { value: "study", label: "Study", color: "bg-purple-500 text-white" },
  { value: "coding", label: "Coding", color: "bg-indigo-500 text-white" },
  { value: "reading", label: "Reading", color: "bg-amber-500 text-white" },
  { value: "exercise", label: "Exercise", color: "bg-emerald-500 text-white" },
  { value: "entertainment", label: "Entertainment", color: "bg-rose-500 text-white" },
  { value: "other", label: "Other", color: "bg-slate-500 text-white" },
];

export default function TimePage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerCategory, setTimerCategory] = useState("work");
  const [timerDesc, setTimerDesc] = useState("");
  const [timerTaskId, setTimerTaskId] = useState("");
  const [timerProjectId, setTimerProjectId] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Manual entry form state
  const [form, setForm] = useState({
    category: "work",
    description: "",
    durationMinutes: "30",
    productivityRating: "4",
    taskId: "",
    projectId: "",
  });

  const fetchEntries = useCallback(async () => {
    try {
      const [timeRes, tasksRes, projRes] = await Promise.all([
        fetch("/api/time"),
        fetch("/api/tasks"),
        fetch("/api/projects"),
      ]);
      if (timeRes.ok) setEntries(await timeRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (projRes.ok) setProjects(await projRes.json());
    } catch (err) {
      console.error("Failed to fetch time entries", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Live timer interval
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!timerRunning && elapsedSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, elapsedSeconds]);

  const handleStartTimer = () => {
    setElapsedSeconds(0);
    setTimerRunning(true);
  };

  const handleStopTimer = async () => {
    setTimerRunning(false);
    if (elapsedSeconds < 5) return;

    try {
      const now = new Date();
      const start = new Date(now.getTime() - elapsedSeconds * 1000);

      await fetch("/api/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: timerCategory,
          description: timerDesc || "Live focus session",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
          duration: elapsedSeconds,
          taskId: timerTaskId || null,
          projectId: timerProjectId || null,
        }),
      });

      setTimerDesc("");
      setTimerTaskId("");
      setTimerProjectId("");
      setElapsedSeconds(0);
      fetchEntries();
    } catch (err) {
      console.error("Failed to save timer entry", err);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(form.durationMinutes, 10);
    if (!minutes || minutes <= 0) return;

    const seconds = minutes * 60;
    const now = new Date();
    const start = new Date(now.getTime() - seconds * 1000);

    try {
      const res = await fetch("/api/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          description: form.description || null,
          startTime: start.toISOString(),
          endTime: now.toISOString(),
          duration: seconds,
          productivityRating: parseInt(form.productivityRating, 10),
          taskId: form.taskId || null,
          projectId: form.projectId || null,
        }),
      });

      if (res.ok) {
        setForm({ category: "work", description: "", durationMinutes: "30", productivityRating: "4", taskId: "", projectId: "" });
        fetchEntries();
      }
    } catch (err) {
      console.error("Manual time add failed", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      const res = await fetch(`/api/time?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchEntries();
    } catch (err) {
      console.error("Delete time entry failed", err);
    }
  };

  const totalTrackedSeconds = entries.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading time tracking...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Log activities, measure focus, and monitor daily time usage</p>
        </div>
        <Card className="bg-primary/5 border-primary/20 p-3 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Today</p>
            <p className="text-lg font-bold">{formatDuration(totalTrackedSeconds)}</p>
          </div>
        </Card>
      </div>

      {/* Live Timer Widget */}
      <Card className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 flex-1 w-full">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Live Stopwatch Timer</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="What are you working on right now?"
                  value={timerDesc}
                  onChange={(e) => setTimerDesc(e.target.value)}
                  disabled={timerRunning}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Select
                  value={timerCategory}
                  onChange={(e) => setTimerCategory(e.target.value)}
                  disabled={timerRunning}
                  className="bg-white/10 border-white/20 text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="text-slate-900">
                      {cat.label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={timerTaskId}
                  onChange={(e) => setTimerTaskId(e.target.value)}
                  disabled={timerRunning}
                  className="bg-white/10 border-white/20 text-white"
                >
                  <option value="" className="text-slate-900">-- Link Task (Optional) --</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id} className="text-slate-900">
                      {t.title}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-wider">
                {formatDuration(elapsedSeconds)}
              </span>

              {timerRunning ? (
                <Button onClick={handleStopTimer} size="lg" variant="destructive" className="flex items-center gap-2">
                  <Square className="w-5 h-5" /> Stop & Save
                </Button>
              ) : (
                <Button onClick={handleStartTimer} size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" /> Start Timer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Form & Daily History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual Add */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Manual Time Log</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Task or activity title..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Productivity Rating (1-5)</label>
                <Select
                  value={form.productivityRating}
                  onChange={(e) => setForm({ ...form, productivityRating: e.target.value })}
                  className="mt-1"
                >
                  <option value="5">5 - Extreme focus</option>
                  <option value="4">4 - High focus</option>
                  <option value="3">3 - Normal</option>
                  <option value="2">2 - Low focus</option>
                  <option value="1">1 - Distracted</option>
                </Select>
              </div>

              <Button type="submit" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Time Entry
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Entries List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Today's Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="font-medium">No time logged today.</p>
                <p className="text-xs mt-1">Start the live timer above or log a manual entry!</p>
              </div>
            ) : (
              <div className="divide-y space-y-2">
                {entries.map((entry) => {
                  const catConfig = CATEGORIES.find((c) => c.value === entry.category) || CATEGORIES[6];
                  return (
                    <div key={entry.id} className="py-3 flex items-center justify-between hover:bg-accent/40 rounded-lg px-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge className={cn("text-xs capitalize", catConfig.color)}>
                          {entry.category}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{entry.description || "Activity"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {entry.productivityRating && (
                          <span className="text-xs text-amber-500 flex items-center gap-1 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" /> {entry.productivityRating}/5
                          </span>
                        )}
                        <span className="font-mono font-semibold text-sm">
                          {formatDuration(entry.duration || 0)}
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
