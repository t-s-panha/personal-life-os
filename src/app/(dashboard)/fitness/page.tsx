"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Dumbbell, Calendar, Clock, Trophy, Flame, Star, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Workout {
  id: string;
  name: string;
  type: string;
  date: string;
  duration: number | null;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  rating: number | null;
  notes: string | null;
  sets: any[];
}

export default function FitnessPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Exercise sets state inside modal
  const [sets, setSets] = useState<{ exerciseName: string; weight: number; reps: number }[]>([]);
  const [newExName, setNewExName] = useState("");
  const [newWeight, setNewWeight] = useState("60");
  const [newReps, setNewReps] = useState("10");

  const [form, setForm] = useState({
    name: "Push Day",
    type: "Push",
    date: new Date().toISOString().split("T")[0],
    durationMinutes: "45",
    totalVolume: "1500",
    rating: "4",
    notes: "",
  });

  const fetchWorkouts = useCallback(async () => {
    try {
      const res = await fetch("/api/fitness");
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data.workouts || []);
      }
    } catch (err) {
      console.error("Failed to fetch workouts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleAddSet = () => {
    if (!newExName.trim()) return;
    setSets((prev) => [
      ...prev,
      {
        exerciseName: newExName.trim(),
        weight: parseFloat(newWeight) || 0,
        reps: parseInt(newReps, 10) || 10,
      },
    ]);
  };

  const handleRemoveSet = (index: number) => {
    setSets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const res = await fetch("/api/fitness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMinutes: parseInt(form.durationMinutes, 10) || 45,
          totalVolume: sets.length > 0 ? sets.reduce((s, item) => s + (item.weight * item.reps), 0) : (parseFloat(form.totalVolume) || 0),
          rating: parseInt(form.rating, 10) || 4,
          sets: sets.length > 0 ? sets : undefined,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setSets([]);
        setForm({
          name: "Push Day",
          type: "Push",
          date: new Date().toISOString().split("T")[0],
          durationMinutes: "45",
          totalVolume: "1500",
          rating: "4",
          notes: "",
        });
        fetchWorkouts();
      }
    } catch (err) {
      console.error("Create workout failed", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workout log?")) return;
    try {
      const res = await fetch(`/api/fitness?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchWorkouts();
    } catch (err) {
      console.error("Delete workout failed", err);
    }
  };

  const totalVolumeAllTime = workouts.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading fitness logs...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fitness & Workouts</h1>
          <p className="text-muted-foreground mt-1">Track workouts, volume, sets, and physical performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="w-4 h-4" /> Log Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Log Workout</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium">Workout Name</label>
                <Input
                  placeholder="Push Day, Leg Session, 5k Run..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1"
                  >
                    <option value="Push">Push</option>
                    <option value="Pull">Pull</option>
                    <option value="Legs">Legs</option>
                    <option value="Full Body">Full Body</option>
                    <option value="Cardio">Cardio</option>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration (mins)</label>
                  <Input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Total Volume (kg)</label>
                  <Input
                    type="number"
                    value={form.totalVolume}
                    onChange={(e) => setForm({ ...form, totalVolume: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Rating (1-5)</label>
                <Select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="mt-1"
                >
                  <option value="5">5 - Great Session</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Low Energy</option>
                  <option value="1">1 - Poor</option>
                </Select>
              </div>

              {/* Exercise Set Builder */}
              <div className="pt-2 border-t space-y-3">
                <label className="text-sm font-semibold flex items-center justify-between">
                  <span>Exercise Sets (Optional)</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {sets.length} set(s) added
                  </span>
                </label>

                {sets.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {sets.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-accent/40 rounded">
                        <span className="font-medium">{s.exerciseName}</span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>{s.weight} kg × {s.reps} reps</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(idx)}
                            className="hover:text-destructive text-muted-foreground"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <Input
                    placeholder="Exercise name (e.g. Bench Press)"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    className="sm:col-span-2 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Weight kg"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={newReps}
                    onChange={(e) => setNewReps(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={handleAddSet}
                >
                  + Add Set
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Save Workout</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{workouts.length}</p>
            <p className="text-xs text-muted-foreground">Workouts Logged</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalVolumeAllTime.toLocaleString()} kg</p>
            <p className="text-xs text-muted-foreground">Total Weight Lifted</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {Math.round(workouts.reduce((acc, w) => acc + ((w.duration || 0) / 60), 0))} min
            </p>
            <p className="text-xs text-muted-foreground">Total Exercise Time</p>
          </div>
        </Card>
      </div>

      {/* Workouts History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workout History</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-medium">No workouts logged yet.</p>
              <p className="text-xs mt-1">Log your training sessions to track personal records!</p>
            </div>
          ) : (
            <div className="divide-y">
              {workouts.map((w) => (
                <div key={w.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{w.name}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {w.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(w.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{w.totalVolume} kg volume</span>
                    <span>{w.duration ? `${Math.round(w.duration / 60)} mins` : "-"}</span>
                    {w.rating && (
                      <span className="text-amber-500 font-medium flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {w.rating}/5
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
