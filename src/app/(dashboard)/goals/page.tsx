"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Target, TrendingUp, Calendar, CheckCircle2, AlertCircle, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  title: string;
  completedAt: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  timeframe: "VISION" | "YEAR_3_5" | "ANNUAL" | "QUARTERLY" | "MONTHLY" | "WEEKLY" | "DAILY";
  category: string;
  startDate: string;
  targetDate: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  health: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "BEHIND" | "COMPLETED";
  healthReason?: string;
  expectedProgress?: number | null;
  progressGap?: number | null;
  daysRemaining?: number | null;
  daysSinceLastActivity?: number;
  metricUnit: string | null;
  milestones?: Milestone[];
  tasks?: { id: string; title: string; status: string }[];
  projects?: { id: string; name: string; progress: number }[];
}

const HEALTH_COLORS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  ON_TRACK: { label: "On Track", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  AT_RISK: { label: "At Risk", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
  BEHIND: { label: "Behind", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
};

const TIMEFRAMES = [
  { value: "ALL", label: "All Timeframes" },
  { value: "VISION", label: "Vision (Long term)" },
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTimeframe, setFilterTimeframe] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [selectedGoalIdForMilestone, setSelectedGoalIdForMilestone] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    timeframe: "ANNUAL" as Goal["timeframe"],
    category: "education",
    targetValue: "100",
    currentValue: "0",
    metricUnit: "%",
    targetDate: "",
  });

  const fetchGoals = useCallback(async () => {
    try {
      let url = "/api/goals";
      if (filterTimeframe !== "ALL") url += `?timeframe=${filterTimeframe}`;

      const res = await fetch(url);
      if (res.ok) {
        setGoals(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  }, [filterTimeframe]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleMilestoneId: milestoneId }),
      });
      fetchGoals();
    } catch (err) {
      console.error("Toggle milestone failed", err);
    }
  };

  const handleAddMilestone = async (goalId: string) => {
    if (!newMilestoneTitle.trim()) return;

    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          milestoneTitle: newMilestoneTitle.trim(),
        }),
      });
      setNewMilestoneTitle("");
      setSelectedGoalIdForMilestone(null);
      fetchGoals();
    } catch (err) {
      console.error("Add milestone failed", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        timeframe: form.timeframe,
        category: form.category.trim() || "personal",
        targetValue: parseFloat(form.targetValue) || 100,
        currentValue: parseFloat(form.currentValue) || 0,
        metricUnit: form.metricUnit.trim() || null,
        targetDate: form.targetDate || undefined,
      };

      let res;
      if (editingGoal) {
        res = await fetch("/api/goals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingGoal.id, ...payload }),
        });
      } else {
        res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingGoal(null);
        resetForm();
        fetchGoals();
      }
    } catch (err) {
      console.error("Save goal failed", err);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      timeframe: "ANNUAL",
      category: "education",
      targetValue: "100",
      currentValue: "0",
      metricUnit: "%",
      targetDate: "",
    });
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || "",
      timeframe: goal.timeframe,
      category: goal.category,
      targetValue: goal.targetValue.toString(),
      currentValue: goal.currentValue.toString(),
      metricUnit: goal.metricUnit || "",
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      const res = await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchGoals();
    } catch (err) {
      console.error("Delete goal failed", err);
    }
  };

  const handleUpdateProgress = async (goal: Goal, delta: number) => {
    const nextVal = Math.max(0, Math.min(goal.targetValue, goal.currentValue + delta));
    try {
      await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goal.id, currentValue: nextVal }),
      });
      fetchGoals();
    } catch (err) {
      console.error("Update progress failed", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading goals...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals & Vision</h1>
          <p className="text-muted-foreground mt-1">Track high-level objectives and progress over time</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingGoal(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium">Goal Title</label>
                <Input
                  placeholder="Master geospatial analytics..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Details and motivation..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Timeframe</label>
                  <Select
                    value={form.timeframe}
                    onChange={(e) => setForm({ ...form, timeframe: e.target.value as Goal["timeframe"] })}
                    className="mt-1"
                  >
                    <option value="VISION">Vision (Long term)</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="MONTHLY">Monthly</option>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1"
                  >
                    <option value="education">Education</option>
                    <option value="career">Career</option>
                    <option value="fitness">Fitness</option>
                    <option value="personal">Personal</option>
                    <option value="finance">Finance</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Current</label>
                  <Input
                    type="number"
                    value={form.currentValue}
                    onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target</label>
                  <Input
                    type="number"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    placeholder="%, hrs, kg..."
                    value={form.metricUnit}
                    onChange={(e) => setForm({ ...form, metricUnit: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Target Date</label>
                <Input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingGoal ? "Save Changes" : "Create Goal"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {TIMEFRAMES.map((tf) => (
          <Button
            key={tf.value}
            variant={filterTimeframe === tf.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterTimeframe(tf.value)}
          >
            {tf.label}
          </Button>
        ))}
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
          <p className="font-medium">No goals found for this filter.</p>
          <p className="text-xs mt-1">Click New Goal to set your objectives!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-semibold">
                    {goal.timeframe} • {goal.category}
                  </Badge>
                  <Badge className={cn("text-xs", HEALTH_COLORS[goal.health]?.color)}>
                    {HEALTH_COLORS[goal.health]?.label}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold mt-2">{goal.title}</CardTitle>
                {goal.description && <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>}

                {goal.healthReason && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-accent/40 p-2 rounded mt-2 border text-left">
                    <span className="font-semibold">Status Note: </span>{goal.healthReason}
                  </p>
                )}
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span>Progress</span>
                    <span>
                      {goal.currentValue} / {goal.targetValue} {goal.metricUnit || ""} ({goal.progress}%)
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  {goal.expectedProgress !== null && goal.expectedProgress !== undefined && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 font-medium">
                      <span>Expected: {goal.expectedProgress}%</span>
                      {goal.progressGap !== null && goal.progressGap !== undefined && (
                        <span className={cn(goal.progressGap >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                          {goal.progressGap >= 0 ? `+${goal.progressGap}% ahead` : `${goal.progressGap}% behind`}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Milestones List */}
                <div className="space-y-1.5 border-t pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Milestones ({goal.milestones?.filter(m => m.completedAt).length || 0}/{goal.milestones?.length || 0})</span>
                    <button
                      onClick={() => setSelectedGoalIdForMilestone(selectedGoalIdForMilestone === goal.id ? null : goal.id)}
                      className="text-primary hover:underline text-[11px]"
                    >
                      + Add
                    </button>
                  </div>

                  {selectedGoalIdForMilestone === goal.id && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <Input
                        placeholder="Milestone title..."
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => handleAddMilestone(goal.id)}
                      >
                        Save
                      </Button>
                    </div>
                  )}

                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {goal.milestones.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={!!m.completedAt}
                            onChange={() => handleToggleMilestone(m.id)}
                            className="rounded border-slate-300 text-primary h-3.5 w-3.5"
                          />
                          <span className={cn("truncate", m.completedAt && "line-through text-muted-foreground")}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => handleUpdateProgress(goal, 5)}>
                      +5
                    </Button>
                    <button onClick={() => openEdit(goal)} className="p-1 hover:bg-accent rounded text-muted-foreground">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
