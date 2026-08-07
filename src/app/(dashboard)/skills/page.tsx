"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Zap, Star, Edit2, Trash2, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Skill {
  id: string;
  name: string;
  category: string;
  currentLevel: number; // 1-5
  targetLevel: number; // 1-5
  importance: number; // 1-5
  totalHours: number;
  lastPracticed: string | null;
  notes: string | null;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Novice",
  2: "Advanced Beginner",
  3: "Competent",
  4: "Proficient",
  5: "Expert",
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "technical",
    currentLevel: "2",
    targetLevel: "4",
    importance: "4",
    totalHours: "20",
    notes: "",
  });

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      if (res.ok) setSkills(await res.json());
    } catch (err) {
      console.error("Failed to fetch skills", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const payload = {
        ...(editingSkill && { id: editingSkill.id }),
        name: form.name.trim(),
        category: form.category,
        currentLevel: parseInt(form.currentLevel, 10),
        targetLevel: parseInt(form.targetLevel, 10),
        importance: parseInt(form.importance, 10),
        totalHours: parseFloat(form.totalHours) || 0,
        notes: form.notes.trim() || null,
      };

      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingSkill(null);
        resetForm();
        fetchSkills();
      }
    } catch (err) {
      console.error("Save skill failed", err);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "technical",
      currentLevel: "2",
      targetLevel: "4",
      importance: "4",
      totalHours: "20",
      notes: "",
    });
  };

  const openEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setForm({
      name: skill.name,
      category: skill.category,
      currentLevel: skill.currentLevel.toString(),
      targetLevel: skill.targetLevel.toString(),
      importance: skill.importance.toString(),
      totalHours: skill.totalHours.toString(),
      notes: skill.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this skill?")) return;
    try {
      const res = await fetch(`/api/skills?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchSkills();
    } catch (err) {
      console.error("Delete skill failed", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading skills matrix...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skill Matrix</h1>
          <p className="text-muted-foreground mt-1">Track proficiency levels, practice hours, and target mastery</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingSkill(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{editingSkill ? "Edit Skill" : "Add New Skill"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium">Skill Name</label>
                <Input
                  placeholder="Python, Spatial Analysis, Public Speaking..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
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
                    <option value="technical">Technical</option>
                    <option value="language">Language</option>
                    <option value="soft_skill">Soft Skill</option>
                    <option value="general">General</option>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Importance (1-5)</label>
                  <Select
                    value={form.importance}
                    onChange={(e) => setForm({ ...form, importance: e.target.value })}
                    className="mt-1"
                  >
                    <option value="5">5 - Critical</option>
                    <option value="4">4 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="2">2 - Low</option>
                    <option value="1">1 - Optional</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Level (1-5)</label>
                  <Select
                    value={form.currentLevel}
                    onChange={(e) => setForm({ ...form, currentLevel: e.target.value })}
                    className="mt-1"
                  >
                    <option value="1">1 - Novice</option>
                    <option value="2">2 - Advanced Beginner</option>
                    <option value="3">3 - Competent</option>
                    <option value="4">4 - Proficient</option>
                    <option value="5">5 - Expert</option>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Level (1-5)</label>
                  <Select
                    value={form.targetLevel}
                    onChange={(e) => setForm({ ...form, targetLevel: e.target.value })}
                    className="mt-1"
                  >
                    <option value="1">1 - Novice</option>
                    <option value="2">2 - Advanced Beginner</option>
                    <option value="3">3 - Competent</option>
                    <option value="4">4 - Proficient</option>
                    <option value="5">5 - Expert</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Practiced Hours</label>
                <Input
                  type="number"
                  value={form.totalHours}
                  onChange={(e) => setForm({ ...form, totalHours: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingSkill ? "Save Changes" : "Create Skill"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skills Matrix Grid */}
      {skills.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
          <p className="font-medium">No skills in your matrix.</p>
          <p className="text-xs mt-1">Add your skills to map out competence levels and goals!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <Card key={skill.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-semibold">
                    {skill.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(skill)} className="p-1 hover:bg-accent rounded text-muted-foreground">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(skill.id)} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold mt-2">{skill.name}</CardTitle>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {/* Level Star Rating Indicator */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1">
                    <span>Level {skill.currentLevel} ({LEVEL_LABELS[skill.currentLevel]})</span>
                    <span>Target: Level {skill.targetLevel}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={cn(
                          "h-2.5 flex-1 rounded-full transition-all",
                          skill.currentLevel >= lvl
                            ? "bg-amber-500 shadow-sm"
                            : skill.targetLevel >= lvl
                            ? "bg-amber-200 dark:bg-amber-950/50"
                            : "bg-slate-200 dark:bg-slate-800"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span className="font-semibold text-foreground">{skill.totalHours} hours practiced</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Importance: {skill.importance}/5
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
