"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Moon, Star, Calendar, Trash2, TrendingUp, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface SleepRecord {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  duration: number;
  quality: number | null;
  notes: string | null;
}

export default function SleepPage() {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    duration: "8.0",
    quality: "8",
    notes: "",
  });

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/sleep");
      if (res.ok) setRecords(await res.json());
    } catch (err) {
      console.error("Failed to fetch sleep records", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          duration: parseFloat(form.duration) || 8,
          quality: parseInt(form.quality, 10) || 8,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setForm({
          date: new Date().toISOString().split("T")[0],
          duration: "8.0",
          quality: "8",
          notes: "",
        });
        fetchRecords();
      }
    } catch (err) {
      console.error("Log sleep record failed", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sleep record?")) return;
    try {
      const res = await fetch(`/api/sleep?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchRecords();
    } catch (err) {
      console.error("Delete sleep record failed", err);
    }
  };

  const avgDuration = records.length > 0
    ? Math.round((records.reduce((acc, curr) => acc + curr.duration, 0) / records.length) * 10) / 10
    : 0;

  const avgQuality = records.length > 0
    ? Math.round((records.reduce((acc, curr) => acc + (curr.quality || 7), 0) / records.length) * 10) / 10
    : 0;

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading sleep records...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sleep & Recovery</h1>
          <p className="text-muted-foreground mt-1">Track sleep duration, quality score, and consistency</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4" /> Log Sleep
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Log Sleep Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sleep Duration (hours)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Sleep Quality (1-10)</label>
                  <Select
                    value={form.quality}
                    onChange={(e) => setForm({ ...form, quality: e.target.value })}
                    className="mt-1"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((q) => (
                      <option key={q} value={q.toString()}>
                        {q} / 10 {q >= 8 ? "(Restful)" : q >= 6 ? "(Moderate)" : "(Poor)"}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes & Factors</label>
                <Input
                  placeholder="Felt energized, light caffeine late..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-bold">{avgDuration} hrs</p>
            <p className="text-xs text-muted-foreground font-medium">Average Sleep Duration</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-bold">{avgQuality} / 10</p>
            <p className="text-xs text-muted-foreground font-medium">Average Quality Rating</p>
          </div>
        </Card>
      </div>

      {/* Sleep Log History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sleep History</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Moon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-medium">No sleep records logged.</p>
              <p className="text-xs mt-1">Start tracking your sleep to monitor recovery patterns!</p>
            </div>
          ) : (
            <div className="divide-y space-y-2">
              {records.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between hover:bg-accent/30 rounded-lg px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <span className="font-bold text-foreground text-sm">{r.duration} hrs</span>
                    <Badge variant="secondary" className="text-xs">
                      Quality: {r.quality || 8}/10
                    </Badge>
                    <button
                      onClick={() => handleDelete(r.id)}
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
