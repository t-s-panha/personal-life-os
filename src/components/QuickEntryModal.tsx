"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Zap, Repeat, BookOpen, Dumbbell, Moon, Plus, Command } from "lucide-react";

export function QuickEntryModal() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("task");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Task state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState(2);

  // Focus state
  const [focusTitle, setFocusTitle] = useState("");
  const [focusCategory, setFocusCategory] = useState("work");

  // Journal Note state
  const [journalContent, setJournalContent] = useState("");
  const [journalMood, setJournalMood] = useState(7);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          priority: Number(taskPriority),
          status: "TODO",
        }),
      });
      if (res.ok) {
        setStatusMsg("Task created!");
        setTaskTitle("");
        setTimeout(() => setOpen(false), 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFocus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: focusTitle.trim() || "Deep Focus Session",
          category: focusCategory,
          duration: 1500,
        }),
      });
      if (res.ok) {
        setStatusMsg("Focus session active!");
        setFocusTitle("");
        setTimeout(() => setOpen(false), 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Quick Note",
          content: journalContent.trim(),
          mood: Number(journalMood),
          type: "DAILY",
          date: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setStatusMsg("Note saved to Journal!");
        setJournalContent("");
        setTimeout(() => setOpen(false), 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Time state
  const [timeDesc, setTimeDesc] = useState("");
  const [timeMinutes, setTimeMinutes] = useState(30);

  // Study state
  const [studySubject, setStudySubject] = useState("");
  const [studyMinutes, setStudyMinutes] = useState(45);

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeDesc.trim()) return;
    setLoading(true);
    try {
      const durationSec = Number(timeMinutes) * 60;
      const end = new Date();
      const start = new Date(end.getTime() - durationSec * 1000);
      const res = await fetch("/api/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: timeDesc.trim(),
          category: "work",
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          duration: durationSec,
        }),
      });
      if (res.ok) {
        setStatusMsg("Time logged!");
        setTimeDesc("");
        setTimeout(() => setOpen(false), 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9 px-2.5 rounded-lg border bg-card/60 touch-manipulation"
      >
        <Zap className="w-4 h-4 text-primary" />
        <span className="font-medium">Quick Entry</span>
        <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 ml-1">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Quick Capture</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fast entry across tasks, focus timers, time logs, and journal notes.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2 space-y-4">
            <TabsList className="grid grid-cols-4 h-8 text-xs">
              <TabsTrigger value="task" className="text-xs">Task</TabsTrigger>
              <TabsTrigger value="focus" className="text-xs">Focus</TabsTrigger>
              <TabsTrigger value="time" className="text-xs">Time</TabsTrigger>
              <TabsTrigger value="note" className="text-xs">Journal</TabsTrigger>
            </TabsList>

            {/* QUICK TASK TAB */}
            <TabsContent value="task">
              <form onSubmit={handleCreateTask} className="space-y-3">
                <Input
                  placeholder="Task title..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="text-xs h-9"
                  autoFocus
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Priority</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((p) => (
                      <Badge
                        key={p}
                        variant={taskPriority === p ? "default" : "outline"}
                        onClick={() => setTaskPriority(p)}
                        className="cursor-pointer text-[10px] px-2 py-0.5"
                      >
                        P{p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={loading || !taskTitle.trim()} className="w-full text-xs h-8 mt-2">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
                </Button>
              </form>
            </TabsContent>

            {/* QUICK FOCUS TAB */}
            <TabsContent value="focus">
              <form onSubmit={handleStartFocus} className="space-y-3">
                <Input
                  placeholder="Session objective (optional)..."
                  value={focusTitle}
                  onChange={(e) => setFocusTitle(e.target.value)}
                  className="text-xs h-9"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Category</span>
                  <select
                    value={focusCategory}
                    onChange={(e) => setFocusCategory(e.target.value)}
                    className="text-xs p-1 border rounded bg-background"
                  >
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="coding">Coding</option>
                    <option value="reading">Reading</option>
                  </select>
                </div>
                <Button type="submit" disabled={loading} className="w-full text-xs h-8 mt-2 bg-emerald-600 hover:bg-emerald-700">
                  <Zap className="w-3.5 h-3.5 mr-1" /> Start 25m Focus Session
                </Button>
              </form>
            </TabsContent>

            {/* QUICK TIME TAB */}
            <TabsContent value="time">
              <form onSubmit={handleLogTime} className="space-y-3">
                <Input
                  placeholder="Activity description..."
                  value={timeDesc}
                  onChange={(e) => setTimeDesc(e.target.value)}
                  className="text-xs h-9"
                  autoFocus
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Duration (minutes)</span>
                  <Input
                    type="number"
                    min="5"
                    max="480"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(Number(e.target.value))}
                    className="w-24 text-xs h-8"
                  />
                </div>
                <Button type="submit" disabled={loading || !timeDesc.trim()} className="w-full text-xs h-8 mt-2">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Log Time Entry
                </Button>
              </form>
            </TabsContent>

            {/* QUICK JOURNAL NOTE TAB */}
            <TabsContent value="note">
              <form onSubmit={handleSaveNote} className="space-y-3">
                <textarea
                  placeholder="Quick thought or reflection..."
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full p-2 text-xs border rounded bg-background min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mood (1-10): {journalMood}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={journalMood}
                    onChange={(e) => setJournalMood(Number(e.target.value))}
                    className="w-28"
                  />
                </div>
                <Button type="submit" disabled={loading || !journalContent.trim()} className="w-full text-xs h-8 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Save Note
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
