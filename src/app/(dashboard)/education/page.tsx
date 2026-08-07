"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GraduationCap, BookOpen, Clock, Star, Trash2, Award } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  category: string;
  currentLevel: string;
  targetLevel: string;
  progress: number;
  totalStudyHours: number;
}

interface StudySession {
  id: string;
  topic: string | null;
  duration: number | null;
  productivityRating: number | null;
  startTime: string;
  subject: { id: string; name: string };
}

export default function EducationPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);

  // Subject Form
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    description: "",
    category: "technical",
    currentLevel: "beginner",
    targetLevel: "advanced",
    progress: "25",
  });

  // Session Form
  const [sessionForm, setSessionForm] = useState({
    subjectId: "",
    topic: "",
    durationMinutes: "45",
    productivityRating: "4",
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/education");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
        setSessions(data.studySessions || []);
        if (data.subjects?.length > 0 && !sessionForm.subjectId) {
          setSessionForm((prev) => ({ ...prev, subjectId: data.subjects[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch education data", err);
    } finally {
      setLoading(false);
    }
  }, [sessionForm.subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return;

    try {
      const res = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subjectForm,
          progress: parseFloat(subjectForm.progress) || 0,
        }),
      });

      if (res.ok) {
        setIsSubjectDialogOpen(false);
        setSubjectForm({ name: "", description: "", category: "technical", currentLevel: "beginner", targetLevel: "advanced", progress: "25" });
        fetchData();
      }
    } catch (err) {
      console.error("Create subject failed", err);
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.subjectId) return;

    try {
      const res = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: sessionForm.subjectId,
          topic: sessionForm.topic || null,
          durationMinutes: parseInt(sessionForm.durationMinutes, 10) || 30,
          productivityRating: parseInt(sessionForm.productivityRating, 10) || 4,
        }),
      });

      if (res.ok) {
        setIsSessionDialogOpen(false);
        setSessionForm((prev) => ({ ...prev, topic: "" }));
        fetchData();
      }
    } catch (err) {
      console.error("Log study session failed", err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    try {
      const res = await fetch(`/api/education?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete subject failed", err);
    }
  };

  const totalStudyHours = subjects.reduce((acc, curr) => acc + (curr.totalStudyHours || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading education & subjects...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Education & Subjects</h1>
          <p className="text-muted-foreground mt-1">Track subjects, courses, study hours, and knowledge growth</p>
        </div>
        <div className="flex items-center gap-2">
          {subjects.length > 0 && (
            <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Log Study Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Log Study Session</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSessionSubmit} className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium">Select Subject</label>
                    <Select
                      value={sessionForm.subjectId}
                      onChange={(e) => setSessionForm({ ...sessionForm, subjectId: e.target.value })}
                      className="mt-1"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Topic / Notes</label>
                    <Input
                      placeholder="e.g. Chapter 3 - Remote Sensing Algorithms"
                      value={sessionForm.topic}
                      onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Duration (mins)</label>
                      <Input
                        type="number"
                        value={sessionForm.durationMinutes}
                        onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Productivity (1-5)</label>
                      <Select
                        value={sessionForm.productivityRating}
                        onChange={(e) => setSessionForm({ ...sessionForm, productivityRating: e.target.value })}
                        className="mt-1"
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Low</option>
                        <option value="1">1 - Poor</option>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsSessionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Log Session</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubjectSubmit} className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium">Subject Name</label>
                  <Input
                    placeholder="Python, Remote Sensing, Machine Learning..."
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Subject overview and goals..."
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={subjectForm.category}
                      onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                      className="mt-1"
                    >
                      <option value="technical">Technical</option>
                      <option value="language">Language</option>
                      <option value="academic">Academic</option>
                      <option value="general">General</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Progress %</label>
                    <Input
                      type="number"
                      value={subjectForm.progress}
                      onChange={(e) => setSubjectForm({ ...subjectForm, progress: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Current Level</label>
                    <Select
                      value={subjectForm.currentLevel}
                      onChange={(e) => setSubjectForm({ ...subjectForm, currentLevel: e.target.value })}
                      className="mt-1"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Target Level</label>
                    <Select
                      value={subjectForm.targetLevel}
                      onChange={(e) => setSubjectForm({ ...subjectForm, targetLevel: e.target.value })}
                      className="mt-1"
                    >
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Subject</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
          <p className="font-medium">No subjects created yet.</p>
          <p className="text-xs mt-1">Add subjects to start logging study hours and tracking level advancement!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <Card key={sub.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-semibold">
                    {sub.category}
                  </Badge>
                  <button
                    onClick={() => handleDeleteSubject(sub.id)}
                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <CardTitle className="text-lg font-bold mt-2">{sub.name}</CardTitle>
                {sub.description && <p className="text-xs text-muted-foreground line-clamp-2">{sub.description}</p>}
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span>Mastery Progress</span>
                    <span>{sub.progress}%</span>
                  </div>
                  <Progress value={sub.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span className="capitalize font-medium text-foreground">
                    Level: {sub.currentLevel} → {sub.targetLevel}
                  </span>
                  <span className="font-semibold text-primary">{sub.totalStudyHours}h studied</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Study Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Study Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No recent study sessions logged.
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="font-medium text-sm">{sess.subject?.name || "Subject"}</p>
                      <p className="text-xs text-muted-foreground">{sess.topic || "Study session"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {sess.productivityRating && (
                      <span className="text-amber-500 flex items-center gap-1 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {sess.productivityRating}/5
                      </span>
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
