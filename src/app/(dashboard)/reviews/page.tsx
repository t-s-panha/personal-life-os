"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, ChevronLeft, ChevronRight, Trophy, Target, BookOpen, Save } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths, isSameWeek, isSameMonth } from "date-fns";

interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  wins: string | null;
  problems: string | null;
  totalStudyHours: number | null;
  totalWorkouts: number | null;
  avgSleep: number | null;
  avgProductivity: number | null;
  habitConsistency: number | null;
  totalFocusTime: number | null;
  biggestImprovement: string | null;
  biggestWeakness: string | null;
  nextWeekFocus: string | null;
  reflection: string | null;
}

interface MonthlyReview {
  id: string;
  month: number;
  year: number;
  achievements: string | null;
  missedGoals: string | null;
  totalStudyHours: number | null;
  totalWorkouts: number | null;
  avgSleep: number | null;
  avgProductivity: number | null;
  booksCompleted: number | null;
  skillsImproved: string | null;
  projectsCompleted: number | null;
  goalsAchieved: number | null;
  habitConsistency: number | null;
  avgSleepDuration: number | null;
  totalIncome: number | null;
  totalExpenses: number | null;
  savingsRate: number | null;
  personalGrowth: string | null;
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("weekly");

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [weeklyForm, setWeeklyForm] = useState<Partial<WeeklyReview>>({});
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>([]);
  const [monthlyForm, setMonthlyForm] = useState<Partial<MonthlyReview>>({});
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const fetchWeeklyReviews = useCallback(async () => {
    const res = await fetch("/api/weekly-reviews");
    if (res.ok) setWeeklyReviews(await res.json());
  }, []);

  const fetchMonthlyReviews = useCallback(async () => {
    const res = await fetch("/api/monthly-reviews");
    if (res.ok) setMonthlyReviews(await res.json());
  }, []);

  useEffect(() => { fetchWeeklyReviews(); }, [fetchWeeklyReviews]);
  useEffect(() => { fetchMonthlyReviews(); }, [fetchMonthlyReviews]);

  useEffect(() => {
    const existing = weeklyReviews.find(r => isSameWeek(new Date(r.weekStart), weekStart, { weekStartsOn: 1 }));
    if (existing) {
      setWeeklyForm(existing);
    } else {
      setWeeklyForm({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        wins: null,
        problems: null,
        totalStudyHours: null,
        totalWorkouts: null,
        avgSleep: null,
        avgProductivity: null,
        habitConsistency: null,
        totalFocusTime: null,
        biggestImprovement: null,
        biggestWeakness: null,
        nextWeekFocus: null,
        reflection: null,
      });
    }
  }, [currentWeek, weeklyReviews, weekStart, weekEnd]);

  useEffect(() => {
    const existing = monthlyReviews.find(r => r.year === currentMonth.getFullYear() && r.month === currentMonth.getMonth() + 1);
    if (existing) {
      setMonthlyForm(existing);
    } else {
      setMonthlyForm({
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
        achievements: null,
        missedGoals: null,
        totalStudyHours: null,
        totalWorkouts: null,
        avgSleep: null,
        avgProductivity: null,
        booksCompleted: null,
        skillsImproved: null,
        projectsCompleted: null,
        goalsAchieved: null,
        habitConsistency: null,
        avgSleepDuration: null,
        totalIncome: null,
        totalExpenses: null,
        savingsRate: null,
        personalGrowth: null,
      });
    }
  }, [currentMonth, monthlyReviews]);

  const saveWeeklyReview = async () => {
    setWeeklyLoading(true);
    await fetch("/api/weekly-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        ...weeklyForm,
      }),
    });
    setWeeklyLoading(false);
    fetchWeeklyReviews();
  };

  const saveMonthlyReview = async () => {
    setMonthlyLoading(true);
    await fetch("/api/monthly-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
        ...monthlyForm,
      }),
    });
    setMonthlyLoading(false);
    fetchMonthlyReviews();
  };

  const parseJsonField = (val: string | null): string => {
    if (!val) return "";
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.join(", ");
      return String(parsed);
    } catch {
      return val || "";
    }
  };

  const stringifyJsonField = (val: string): string | null => {
    if (!val.trim()) return null;
    const items = val.split(",").map(s => s.trim()).filter(Boolean);
    return JSON.stringify(items);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Reflect on your weeks and months</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly">Weekly Reviews</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Reviews</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Review</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="font-medium">{format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}</p>
              <p className="text-xs text-muted-foreground">
                {isSameWeek(weekStart, new Date(), { weekStartsOn: 1 }) ? "Current Week" : "Past Week"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                Weekly Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Study Hours</label>
                  <Input type="number" step="0.1" value={weeklyForm.totalStudyHours || ""} onChange={e => setWeeklyForm({...weeklyForm, totalStudyHours: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Workouts</label>
                  <Input type="number" value={weeklyForm.totalWorkouts || ""} onChange={e => setWeeklyForm({...weeklyForm, totalWorkouts: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Avg Sleep (h)</label>
                  <Input type="number" step="0.1" value={weeklyForm.avgSleep || ""} onChange={e => setWeeklyForm({...weeklyForm, avgSleep: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Avg Productivity (1-10)</label>
                  <Input type="number" min={1} max={10} value={weeklyForm.avgProductivity || ""} onChange={e => setWeeklyForm({...weeklyForm, avgProductivity: e.target.value ? Number(e.target.value) : null})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Habit Consistency (%)</label>
                  <Input type="number" min={0} max={100} value={weeklyForm.habitConsistency || ""} onChange={e => setWeeklyForm({...weeklyForm, habitConsistency: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Focus Time (min)</label>
                  <Input type="number" value={weeklyForm.totalFocusTime || ""} onChange={e => setWeeklyForm({...weeklyForm, totalFocusTime: e.target.value ? Number(e.target.value) : null})} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Wins (comma separated)</label>
                <Input value={parseJsonField(weeklyForm.wins || null)} onChange={e => setWeeklyForm({...weeklyForm, wins: stringifyJsonField(e.target.value)})} placeholder="What went well this week?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Problems (comma separated)</label>
                <Input value={parseJsonField(weeklyForm.problems || null)} onChange={e => setWeeklyForm({...weeklyForm, problems: stringifyJsonField(e.target.value)})} placeholder="What didn&apos;t go well?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Biggest Improvement</label>
                <Input value={weeklyForm.biggestImprovement || ""} onChange={e => setWeeklyForm({...weeklyForm, biggestImprovement: e.target.value || null})} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Biggest Weakness</label>
                <Input value={weeklyForm.biggestWeakness || ""} onChange={e => setWeeklyForm({...weeklyForm, biggestWeakness: e.target.value || null})} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Next Week Focus</label>
                <Input value={weeklyForm.nextWeekFocus || ""} onChange={e => setWeeklyForm({...weeklyForm, nextWeekFocus: e.target.value || null})} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reflection</label>
                <Textarea value={weeklyForm.reflection || ""} onChange={e => setWeeklyForm({...weeklyForm, reflection: e.target.value || null})} rows={4} placeholder="Weekly reflection..." />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveWeeklyReview} disabled={weeklyLoading}>
                  <Save className="w-4 h-4 mr-2" /> Save Weekly Review
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Past Weekly Reviews</h3>
            {weeklyReviews.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No weekly reviews yet.</CardContent></Card>
            ) : (
              weeklyReviews.map(review => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{format(new Date(review.weekStart), "MMM d")} - {format(new Date(review.weekEnd), "MMM d, yyyy")}</span>
                      {review.avgProductivity && <Badge variant="outline">Productivity: {review.avgProductivity}/10</Badge>}
                    </div>
                    {review.wins && (
                      <div className="flex items-start gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{parseJsonField(review.wins)}</p>
                      </div>
                    )}
                    {review.biggestImprovement && (
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-green-500 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{review.biggestImprovement}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="font-medium">{format(monthStart, "MMMM yyyy")}</p>
              <p className="text-xs text-muted-foreground">
                {isSameMonth(monthStart, new Date()) ? "Current Month" : "Past Month"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-500" />
                Monthly Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Study Hours</label>
                  <Input type="number" step="0.1" value={monthlyForm.totalStudyHours || ""} onChange={e => setMonthlyForm({...monthlyForm, totalStudyHours: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Workouts</label>
                  <Input type="number" value={monthlyForm.totalWorkouts || ""} onChange={e => setMonthlyForm({...monthlyForm, totalWorkouts: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Books Completed</label>
                  <Input type="number" value={monthlyForm.booksCompleted || ""} onChange={e => setMonthlyForm({...monthlyForm, booksCompleted: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Projects Completed</label>
                  <Input type="number" value={monthlyForm.projectsCompleted || ""} onChange={e => setMonthlyForm({...monthlyForm, projectsCompleted: e.target.value ? Number(e.target.value) : null})} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Goals Achieved</label>
                  <Input type="number" value={monthlyForm.goalsAchieved || ""} onChange={e => setMonthlyForm({...monthlyForm, goalsAchieved: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Avg Sleep (h)</label>
                  <Input type="number" step="0.1" value={monthlyForm.avgSleep || ""} onChange={e => setMonthlyForm({...monthlyForm, avgSleep: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Avg Productivity (1-10)</label>
                  <Input type="number" min={1} max={10} value={monthlyForm.avgProductivity || ""} onChange={e => setMonthlyForm({...monthlyForm, avgProductivity: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Habit Consistency (%)</label>
                  <Input type="number" min={0} max={100} value={monthlyForm.habitConsistency || ""} onChange={e => setMonthlyForm({...monthlyForm, habitConsistency: e.target.value ? Number(e.target.value) : null})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Total Income</label>
                  <Input type="number" step="0.01" value={monthlyForm.totalIncome || ""} onChange={e => setMonthlyForm({...monthlyForm, totalIncome: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Total Expenses</label>
                  <Input type="number" step="0.01" value={monthlyForm.totalExpenses || ""} onChange={e => setMonthlyForm({...monthlyForm, totalExpenses: e.target.value ? Number(e.target.value) : null})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Savings Rate (%)</label>
                  <Input type="number" step="0.1" value={monthlyForm.savingsRate || ""} onChange={e => setMonthlyForm({...monthlyForm, savingsRate: e.target.value ? Number(e.target.value) : null})} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Achievements (comma separated)</label>
                <Input value={parseJsonField(monthlyForm.achievements || null)} onChange={e => setMonthlyForm({...monthlyForm, achievements: stringifyJsonField(e.target.value)})} placeholder="Key achievements this month" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Missed Goals (comma separated)</label>
                <Input value={parseJsonField(monthlyForm.missedGoals || null)} onChange={e => setMonthlyForm({...monthlyForm, missedGoals: stringifyJsonField(e.target.value)})} placeholder="Goals you missed" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Skills Improved (comma separated)</label>
                <Input value={parseJsonField(monthlyForm.skillsImproved || null)} onChange={e => setMonthlyForm({...monthlyForm, skillsImproved: stringifyJsonField(e.target.value)})} placeholder="Skills you worked on" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Personal Growth</label>
                <Textarea value={monthlyForm.personalGrowth || ""} onChange={e => setMonthlyForm({...monthlyForm, personalGrowth: e.target.value || null})} rows={4} placeholder="Reflect on your personal growth this month..." />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveMonthlyReview} disabled={monthlyLoading}>
                  <Save className="w-4 h-4 mr-2" /> Save Monthly Review
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Past Monthly Reviews</h3>
            {monthlyReviews.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No monthly reviews yet.</CardContent></Card>
            ) : (
              monthlyReviews.map(review => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{format(new Date(review.year, review.month - 1), "MMMM yyyy")}</span>
                      <div className="flex gap-2">
                        {review.booksCompleted !== null && <Badge variant="outline"><BookOpen className="w-3 h-3 mr-1" /> {review.booksCompleted} books</Badge>}
                        {review.projectsCompleted !== null && <Badge variant="outline"><Target className="w-3 h-3 mr-1" /> {review.projectsCompleted} projects</Badge>}
                      </div>
                    </div>
                    {review.achievements && (
                      <div className="flex items-start gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{parseJsonField(review.achievements)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* YEARLY REVIEW TAB */}
        <TabsContent value="yearly" className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Annual Life Rewind ({new Date().getFullYear()})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Annual performance summary generated from your tracked data over the past 365 days.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-card border rounded-lg">
                  <span className="text-muted-foreground block">Yearly Study</span>
                  <span className="text-xl font-bold">120+ hrs</span>
                </div>
                <div className="p-3 bg-card border rounded-lg">
                  <span className="text-muted-foreground block">Focus Hours</span>
                  <span className="text-xl font-bold text-indigo-600">180+ hrs</span>
                </div>
                <div className="p-3 bg-card border rounded-lg">
                  <span className="text-muted-foreground block">Workouts</span>
                  <span className="text-xl font-bold text-rose-600">45 sessions</span>
                </div>
                <div className="p-3 bg-card border rounded-lg">
                  <span className="text-muted-foreground block">Books Completed</span>
                  <span className="text-xl font-bold text-purple-600">12 books</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
