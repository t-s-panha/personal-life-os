"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Repeat, CheckCircle2, Circle, Flame, Calendar, Trash2, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface HabitLog {
  id: string;
  date: string;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  description: string | null;
  category: string;
  frequency: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  logs: HabitLog[];
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "discipline",
    frequency: "DAILY",
  });

  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(startOfDay(new Date()), 6 - i));

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) setHabits(await res.json());
    } catch (err) {
      console.error("Failed to fetch habits", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setForm({ name: "", description: "", category: "discipline", frequency: "DAILY" });
        fetchHabits();
      }
    } catch (err) {
      console.error("Create habit failed", err);
    }
  };

  const toggleLog = async (habitId: string, date: Date, currentCompleted: boolean) => {
    const dateStr = date.toISOString().split("T")[0];

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const updatedLogs = [...h.logs];
        const existingIdx = updatedLogs.findIndex((l) => isSameDay(new Date(l.date), date));
        if (existingIdx >= 0) {
          updatedLogs[existingIdx] = { ...updatedLogs[existingIdx], completed: !currentCompleted };
        } else {
          updatedLogs.push({ id: Math.random().toString(), date: dateStr, completed: true });
        }
        return { ...h, logs: updatedLogs };
      })
    );

    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: dateStr,
          completed: !currentCompleted,
        }),
      });
      fetchHabits();
    } catch (err) {
      console.error("Toggle habit log failed", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this habit?")) return;
    try {
      const res = await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchHabits();
    } catch (err) {
      console.error("Delete habit failed", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading habits...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
          <p className="text-muted-foreground mt-1">Build daily consistency and track active streaks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium">Habit Name</label>
                <Input
                  placeholder="Drink 3L water, Meditate, Exercise..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Motivation or instructions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1"
                  >
                    <option value="discipline">Discipline</option>
                    <option value="fitness">Fitness</option>
                    <option value="study">Study</option>
                    <option value="health">Health</option>
                    <option value="mindfulness">Mindfulness</option>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <Select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="mt-1"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Habit</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Habit List Table / Cards */}
      {habits.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground">
          <Repeat className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
          <p className="font-medium">No active habits found.</p>
          <p className="text-xs mt-1">Start building good routines by adding your first habit!</p>
        </Card>
      ) : (
        <Card>
          <CardHeader className="p-4 pb-2 border-b hidden sm:flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Habit</CardTitle>
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground font-semibold">Last 7 Days</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {habits.map((habit) => (
              <div key={habit.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{habit.name}</p>
                      <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0">
                        {habit.category}
                      </Badge>
                    </div>
                    {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {habit.currentStreak || 0} day streak
                      </span>
                      <span>Total: {habit.totalCompletions}</span>
                    </div>
                  </div>
                </div>

                {/* 7-day checkboxes */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0">
                  <div className="flex items-center gap-2">
                    {last7Days.map((day) => {
                      const log = habit.logs.find((l) => isSameDay(new Date(l.date), day));
                      const isCompleted = !!log?.completed;
                      const isToday = isSameDay(day, new Date());

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => toggleLog(habit.id, day, isCompleted)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all text-[10px] font-medium border",
                            isCompleted
                              ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                              : "bg-background hover:bg-accent text-muted-foreground border-muted",
                            isToday && !isCompleted && "border-primary font-bold"
                          )}
                          title={`${format(day, "EEE, MMM d")}: ${isCompleted ? "Completed" : "Not completed"}`}
                        >
                          <span className="text-[9px] opacity-80">{format(day, "EEE")[0]}</span>
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3 opacity-40" />}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
