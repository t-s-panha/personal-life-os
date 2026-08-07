"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, CheckCircle2, Circle, Clock, AlertCircle, Calendar as CalendarIcon,
  Trash2, Edit2, ChevronRight, ChevronDown, ListFilter, Kanban, List, Sun, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Subtask {
  id: string;
  title: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number; // 1=Low, 2=Medium, 3=High, 4=Urgent
  status: "BACKLOG" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ARCHIVED";
  dueDate: string | null;
  category: string | null;
  order: number;
  subtasks: Subtask[];
  project?: { id: string; name: string } | null;
  goal?: { id: string; title: string } | null;
}

const KANBAN_COLUMNS = [
  { id: "BACKLOG", label: "Backlog", color: "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-300" },
  { id: "PLANNED", label: "Planned", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200" },
  { id: "COMPLETED", label: "Completed", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200" },
];

const PRIORITY_CONFIG: Record<number, { label: string; badge: string }> = {
  1: { label: "Low", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  2: { label: "Medium", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  3: { label: "High", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  4: { label: "Urgent", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 font-semibold" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"kanban" | "list" | "today" | "upcoming">("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Quick add state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState(2);

  // Modal form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "2",
    status: "BACKLOG" as Task["status"],
    dueDate: "",
    category: "",
  });

  // Subtask creation in edit modal
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    try {
      let url = "/api/tasks";
      if (activeTab === "today") url += "?view=today";
      if (activeTab === "upcoming") url += "?view=upcoming";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickTitle.trim(),
          priority: quickPriority,
          status: "PLANNED",
        }),
      });

      if (res.ok) {
        setQuickTitle("");
        fetchTasks();
      }
    } catch (err) {
      console.error("Quick add failed", err);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: parseInt(form.priority, 10),
        status: form.status,
        dueDate: form.dueDate || null,
        category: form.category.trim() || null,
      };

      let res;
      if (editingTask) {
        res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTask.id, ...payload }),
        });
      } else {
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingTask(null);
        resetForm();
        fetchTasks();
      }
    } catch (err) {
      console.error("Task save failed", err);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      priority: "2",
      status: "BACKLOG",
      dueDate: "",
      category: "",
    });
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority.toString(),
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      category: task.category || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error("Delete task failed", err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Update task status failed", err);
    }
  };

  const handlePriorityCycle = async (taskId: string, currentPriority: number) => {
    const nextPriority = currentPriority >= 4 ? 1 : currentPriority + 1;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: nextPriority } : t))
    );

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, priority: nextPriority }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Cycle priority failed", err);
    }
  };

  const handleAddSubtask = async (parentId: string) => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtaskTitle.trim(),
          parentId,
          priority: 2,
          status: "PLANNED",
        }),
      });

      if (res.ok) {
        setNewSubtaskTitle("");
        fetchTasks();
      }
    } catch (err) {
      console.error("Add subtask failed", err);
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Drag and drop handler for Kanban
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    handleStatusChange(taskId, targetStatus);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Organize, track, and complete your tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingTask(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleModalSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Task title..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Add details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="mt-1"
                  >
                    <option value="1">1 - Low</option>
                    <option value="2">2 - Medium</option>
                    <option value="3">3 - High</option>
                    <option value="4">4 - Urgent</option>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
                    className="mt-1"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    placeholder="Work, Health, Personal..."
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {editingTask && (
                <div className="pt-2 border-t space-y-2">
                  <label className="text-sm font-semibold flex items-center justify-between">
                    <span>Subtasks</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {editingTask.subtasks?.filter(s => s.status === "COMPLETED").length || 0} / {editingTask.subtasks?.length || 0} completed
                    </span>
                  </label>
                  
                  {editingTask.subtasks && editingTask.subtasks.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {editingTask.subtasks.map((st) => (
                        <div key={st.id} className="flex items-center justify-between gap-2 p-1.5 bg-accent/40 rounded text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={st.status === "COMPLETED"}
                              onChange={async () => {
                                const newStatus = st.status === "COMPLETED" ? "PLANNED" : "COMPLETED";
                                await fetch("/api/tasks", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: st.id, status: newStatus }),
                                });
                                fetchTasks();
                              }}
                              className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span className={cn("truncate", st.status === "COMPLETED" && "line-through text-muted-foreground")}>
                              {st.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/tasks?id=${st.id}`, { method: "DELETE" });
                              fetchTasks();
                            }}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      placeholder="Add subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubtask(editingTask.id);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs shrink-0"
                      onClick={() => handleAddSubtask(editingTask.id)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingTask ? "Save Changes" : "Create Task"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Add Bar */}
      <Card className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900/50">
        <CardContent className="p-4">
          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-3">
            <Input
              placeholder="Quick add a new task and press Enter..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="bg-background flex-1"
            />
            <Select
              value={quickPriority.toString()}
              onChange={(e) => setQuickPriority(parseInt(e.target.value, 10))}
              className="w-full sm:w-36 bg-background"
            >
              <option value="1">Low Priority</option>
              <option value="2">Medium Priority</option>
              <option value="3">High Priority</option>
              <option value="4">Urgent</option>
            </Select>
            <Button type="submit" className="w-full sm:w-auto shrink-0 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Quick Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Views Navigation */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("kanban")}
            className="flex items-center gap-2"
          >
            <Kanban className="w-4 h-4" /> Kanban Board
          </Button>
          <Button
            variant={activeTab === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("list")}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" /> All Tasks
          </Button>
          <Button
            variant={activeTab === "today" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("today")}
            className="flex items-center gap-2"
          >
            <Sun className="w-4 h-4 text-amber-500" /> Today
          </Button>
          <Button
            variant={activeTab === "upcoming" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("upcoming")}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-indigo-500" /> Upcoming
          </Button>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.id);
            return (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id as Task["status"])}
                className="flex flex-col rounded-xl border bg-card p-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", column.color)}>
                      {column.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{columnTasks.length}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                      Drag tasks here
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border group"
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  task.status === "COMPLETED" ? "PLANNED" : "COMPLETED"
                                )
                              }
                              className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            >
                              {task.status === "COMPLETED" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <p
                              onClick={() => openEdit(task)}
                              className={cn(
                                "text-sm font-medium flex-1 cursor-pointer hover:text-primary transition-colors line-clamp-2",
                                task.status === "COMPLETED" && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </p>
                            <button
                              onClick={() => handlePriorityCycle(task.id, task.priority)}
                              title="Click to cycle priority"
                            >
                              <Badge className={cn("text-[10px] px-1.5 py-0 cursor-pointer", PRIORITY_CONFIG[task.priority]?.badge)}>
                                {PRIORITY_CONFIG[task.priority]?.label}
                              </Badge>
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 pl-6">
                            <div className="flex items-center gap-2">
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-[11px]">
                                  <CalendarIcon className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                  <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                                  {task.subtasks.filter(s => s.status === "COMPLETED").length}/{task.subtasks.length}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] p-0.5 border rounded bg-background text-muted-foreground touch-manipulation cursor-pointer"
                                title="Move status"
                              >
                                <option value="BACKLOG">Backlog</option>
                                <option value="PLANNED">Planned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                              <button
                                onClick={() => openEdit(task)}
                                className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground touch-manipulation min-h-[28px] min-w-[28px]"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive touch-manipulation min-h-[28px] min-w-[28px]"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST / TODAY / UPCOMING VIEW */}
      {activeTab !== "kanban" && (
        <Card>
          <CardContent className="p-4">
            {tasks.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="font-medium">No tasks found for this view.</p>
                <p className="text-xs mt-1">Use the quick add bar above to create your first task!</p>
              </div>
            ) : (
              <div className="divide-y space-y-1">
                {tasks.map((task) => (
                  <div key={task.id} className="py-3 px-2 flex items-center justify-between hover:bg-accent/40 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            task.id,
                            task.status === "COMPLETED" ? "PLANNED" : "COMPLETED"
                          )
                        }
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {task.status === "COMPLETED" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => openEdit(task)}
                            className={cn(
                              "font-medium text-sm cursor-pointer hover:underline truncate",
                              task.status === "COMPLETED" && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </span>
                          {task.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {task.category}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <button onClick={() => handlePriorityCycle(task.id, task.priority)}>
                        <Badge className={cn("text-xs cursor-pointer", PRIORITY_CONFIG[task.priority]?.badge)}>
                          {PRIORITY_CONFIG[task.priority]?.label}
                        </Badge>
                      </button>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {task.status}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(task)}
                          className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
