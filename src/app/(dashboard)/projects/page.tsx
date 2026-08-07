"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, FolderKanban, Clock, CheckCircle2, Target, Calendar } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  deadline: string | null;
  totalTimeSpent: number;
  tasks: { status: string }[];
  milestones: any[];
  goal: { title: string } | null;
}

const STATUS_COLORS = {
  PLANNING: "bg-gray-500",
  ACTIVE: "bg-blue-500",
  PAUSED: "bg-yellow-500",
  COMPLETED: "bg-green-500",
  ARCHIVED: "bg-purple-500",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState("ALL");

  const [form, setForm] = useState({ name: "", description: "", status: "PLANNING", deadline: "", goalId: "" });

  const fetchProjects = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.append("status", filter);
    const res = await fetch(`/api/projects?${params}`);
    setProjects(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = editingProject
      ? { id: editingProject.id, ...form, deadline: form.deadline || null }
      : { ...form, deadline: form.deadline || null };
    await fetch("/api/projects", {
      method: editingProject ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setIsDialogOpen(false);
    setEditingProject(null);
    setForm({ name: "", description: "", status: "PLANNING", deadline: "", goalId: "" });
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    fetchProjects();
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
      deadline: project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
      goalId: "",
    });
    setIsDialogOpen(true);
  };

  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;

  if (loading) return <div className="flex items-center justify-center h-full">Loading projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and milestones</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProject(null); setForm({ name: "", description: "", status: "PLANNING", deadline: "", goalId: "" }); }}>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Input placeholder="Project name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
                <Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingProject ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <FolderKanban className="w-5 h-5 text-blue-500" />
          <div><p className="text-2xl font-bold">{projects.length}</p><p className="text-xs text-muted-foreground">Total Projects</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Target className="w-5 h-5 text-green-500" />
          <div><p className="text-2xl font-bold">{activeProjects}</p><p className="text-xs text-muted-foreground">Active</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-purple-500" />
          <div><p className="text-2xl font-bold">{completedProjects}</p><p className="text-xs text-muted-foreground">Completed</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-500" />
          <div><p className="text-2xl font-bold">{formatDuration(projects.reduce((s, p) => s + p.totalTimeSpent, 0))}</p><p className="text-xs text-muted-foreground">Total Time</p></div>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["ALL", "ACTIVE", "PLANNING", "COMPLETED", "PAUSED"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "ALL" ? "All" : s}
          </Button>
        ))}
      </div>

      {/* Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(project => {
          const completedTasks = project.tasks.filter(t => t.status === "COMPLETED").length;
          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-white", STATUS_COLORS[project.status as keyof typeof STATUS_COLORS])}>
                      {project.status}
                    </Badge>
                    {project.goal && <Badge variant="outline" className="text-xs">{project.goal.title}</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(project)}><Edit2 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(project.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{project.name}</h3>
                {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}

                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{completedTasks}/{project.tasks.length} tasks</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {project.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span>{formatDuration(project.totalTimeSpent)}</span>
                  {project.milestones.length > 0 && <span>{project.milestones.length} milestones</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {projects.length === 0 && (
          <Card className="col-span-full"><CardContent className="p-8 text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No projects yet. Start one!</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
