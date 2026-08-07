"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getGreeting, formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  CheckCircle2, Circle, Clock, Target, TrendingUp, Moon,
  Dumbbell, BookOpen, GraduationCap, Zap, Flame, ArrowRight,
} from "lucide-react";

interface DashboardData {
  dailyScore: number;
  productivityScore?: { score: number | null; explanation?: string };
  disciplineScore?: { score: number | null; explanation?: string };
  topInsights?: { id: string; title: string; description: string; type: string }[];
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  studyHours: number;
  focusHours: number;
  workoutCompleted: boolean;
  sleepDuration: number | null;
  topTasks: any[];
  todayHabits: any[];
  recentTimeEntries: any[];
  goalProgress: any[];
  weeklyStudyHours: number;
  weeklyWorkouts: number;
  totalSubjects: number;
  totalSkills: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => { setData(data); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full">Loading dashboard...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{getGreeting()}, {session?.user?.name || "there"}</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Dual Scores Grid (Productivity & Discipline) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Productivity Score</p>
                <p className="text-4xl font-extrabold mt-1">
                  {data.productivityScore?.score !== null && data.productivityScore?.score !== undefined ? `${data.productivityScore.score}/100` : "N/A"}
                </p>
              </div>
              <Zap className="w-8 h-8 text-emerald-200 opacity-80" />
            </div>
            <p className="text-xs text-emerald-100 mt-2 line-clamp-1">{data.productivityScore?.explanation || "Priority tasks & focus output"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Discipline Score</p>
                <p className="text-4xl font-extrabold mt-1">
                  {data.disciplineScore?.score !== null && data.disciplineScore?.score !== undefined ? `${data.disciplineScore.score}/100` : "N/A"}
                </p>
              </div>
              <Flame className="w-8 h-8 text-indigo-200 opacity-80" />
            </div>
            <p className="text-xs text-indigo-100 mt-2 line-clamp-1">{data.disciplineScore?.explanation || "Habits & routine consistency"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Insights Banner (if available) */}
      {data.topInsights && data.topInsights.length > 0 && (
        <Card className="bg-accent/40 border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">Smart Insight</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">{data.topInsights[0].type}</span>
              </div>
              <p className="text-xs font-semibold">{data.topInsights[0].title}</p>
              <p className="text-xs text-muted-foreground">{data.topInsights[0].description}</p>
            </div>
            <Link href="/analytics" className="text-xs font-semibold text-primary hover:underline shrink-0 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div><p className="text-2xl font-bold">{data.tasksCompleted}/{data.tasksTotal}</p><p className="text-xs text-muted-foreground">Tasks</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-500" />
            <div><p className="text-2xl font-bold">{data.habitsCompleted}/{data.habitsTotal}</p><p className="text-xs text-muted-foreground">Habits</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <div><p className="text-2xl font-bold">{data.studyHours}h</p><p className="text-xs text-muted-foreground">Study</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div><p className="text-2xl font-bold">{data.focusHours}h</p><p className="text-xs text-muted-foreground">Focus</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Phase 2 & 3 Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/education">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold">{data.weeklyStudyHours}h</p>
                  <p className="text-xs text-muted-foreground">Study this week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/skills">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{data.totalSkills}</p>
                  <p className="text-xs text-muted-foreground">Skills tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/fitness">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{data.weeklyWorkouts}</p>
                  <p className="text-xs text-muted-foreground">Workouts this week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/sleep">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">{data.sleepDuration ? `${data.sleepDuration}h` : "-"}</p>
                  <p className="text-xs text-muted-foreground">Last night</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Priorities */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Top Priorities</h3>
              <Link href="/tasks" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(!data.topTasks || data.topTasks.length === 0) ? (
              <p className="text-muted-foreground text-sm">No tasks for today. <Link href="/tasks" className="text-primary hover:underline">Add some!</Link></p>
            ) : (
              <div className="space-y-3">
                {data.topTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <Circle className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.dueDate && <p className="text-xs text-muted-foreground">Due {new Date(task.dueDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Habits</h3>
              <Link href="/habits" className="text-sm text-primary hover:underline flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(!data.todayHabits || data.todayHabits.length === 0) ? (
              <p className="text-muted-foreground text-sm">No habits yet.</p>
            ) : (
              <div className="space-y-3">
                {data.todayHabits.map((habit) => {
                  const isDone = habit.logs?.some((l: any) => l.completed);
                  return (
                    <div key={habit.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      {isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                      <span className={isDone ? "line-through text-muted-foreground text-sm" : "text-sm"}>{habit.name}</span>
                      {habit.currentStreak > 0 && <Flame className="w-3 h-3 text-orange-500 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active Goals</h3>
            <Link href="/goals" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {data.goalProgress.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
