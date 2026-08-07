"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Repeat,
  Clock,
  Dumbbell,
  Moon,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ShieldCheck,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductivityScore {
  score: number | null;
  status: "available" | "insufficient_data";
  previousScore: number | null;
  change: number | null;
  breakdown: {
    tasksScore: number;
    focusScore: number;
    goalScore: number | null;
    productiveTimeScore: number;
    planningScore: number;
  } | null;
  explanation: string;
}

interface DisciplineScore {
  score: number | null;
  status: "available" | "insufficient_data";
  previousScore: number | null;
  change: number | null;
  breakdown: {
    habitsScore: number | null;
    taskFollowThroughScore: number | null;
    studyConsistencyScore: number | null;
    focusConsistencyScore: number | null;
    workoutConsistencyScore: number | null;
    sleepConsistencyScore: number | null;
    dailyReviewsScore: number | null;
  } | null;
  activeWeights: Record<string, number> | null;
  explanation: string;
}

interface GoalHealthSummary {
  totalActive: number;
  onTrackCount: number;
  atRiskCount: number;
  behindCount: number;
  notStartedCount: number;
  completedCount: number;
}

interface AnalyticsData {
  range: string;
  productivityScore: ProductivityScore;
  disciplineScore: DisciplineScore;
  goalHealthSummary?: GoalHealthSummary;
  lifeBalance?: {
    totalTrackedHours: number;
    distribution: { area: string; hours: number; pct: number }[];
  };
  insights?: {
    id: string;
    type: "FACT" | "TREND" | "CORRELATION" | "RECOMMENDATION";
    category: string;
    title: string;
    description: string;
    metric?: string;
  }[];
  overview: {
    taskCompletionRate: number;
    tasksCompleted: number;
    taskCompletionTrend: number;
    trackedHours: number;
    trackedHoursTrend: number;
    studyHours: number;
    studyHoursTrend: number;
    focusHours: number;
    focusHoursTrend: number;
    activeHabitsCount: number;
    completedHabitLogsCount: number;
    habitConsistencyTrend: number;
    workoutCount: number;
    workoutTrend: number;
    totalVolumeKg: number;
    avgSleepDuration: number;
    avgSleepQuality: number;
    totalSubjectsCount: number;
    totalSkillsCount: number;
    completedGoalsCount: number;
    activeGoalsCount: number;
  };
  categoryDistribution: { name: string; hours: number }[];
}

const RANGES = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProdBreakdown, setShowProdBreakdown] = useState(false);
  const [showDiscBreakdown, setShowDiscBreakdown] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${selectedRange}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const renderTrend = (trend: number) => {
    if (trend === 0) return <span className="text-xs text-muted-foreground font-normal">--</span>;
    const isPositive = trend > 0;
    return (
      <span className={cn("text-xs font-semibold flex items-center gap-0.5", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? `+${trend}%` : `${trend}%`} vs last period
      </span>
    );
  };

  const ps = data?.productivityScore;
  const ds = data?.disciplineScore;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Intelligence</h1>
          <p className="text-muted-foreground mt-1">Personal performance insights, productivity feedback, and consistency metrics</p>
        </div>

        {/* Range Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-card p-1 border rounded-xl">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant={selectedRange === r.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRange(r.value)}
              className="text-xs px-3 h-8"
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Updating analytics range...</div>
      ) : !data ? (
        <Card className="py-12 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
          <p className="font-medium">No analytics data available.</p>
        </Card>
      ) : (
        <>
          {/* DUAL SCORES SECTION: PRODUCTIVITY & DISCIPLINE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PRODUCTIVITY SCORE CARD */}
            <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h2 className="text-lg font-bold">Productivity</h2>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        Meaningful Output
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ps?.explanation}
                    </p>
                  </div>

                  {ps?.status === "insufficient_data" ? (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Need a few days of data to calculate.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-background/80 dark:bg-card/80 p-3 rounded-xl border shadow-sm shrink-0">
                      <div>
                        <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                          {ps?.score}<span className="text-xs text-muted-foreground font-normal"> / 100</span>
                        </p>
                        {ps?.change !== null && ps?.change !== undefined && (
                          <p className={cn("text-[11px] font-semibold flex items-center gap-0.5 mt-0.5", ps.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                            {ps.change >= 0 ? `+${ps.change}` : ps.change} pts vs last
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProdBreakdown((prev) => !prev)}
                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        {showProdBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* EXPANDABLE BREAKDOWN */}
                {showProdBreakdown && ps?.breakdown && (
                  <div className="pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Priority Tasks</span>
                        <span className="font-bold text-emerald-600">{ps.breakdown.tasksScore}/100</span>
                      </div>
                      <Progress value={ps.breakdown.tasksScore} className="h-1" />
                    </div>
                    <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Focus & Deep Work</span>
                        <span className="font-bold text-indigo-600">{ps.breakdown.focusScore}/100</span>
                      </div>
                      <Progress value={ps.breakdown.focusScore} className="h-1" />
                    </div>
                    <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Goal Progress</span>
                        <span className="font-bold text-purple-600">{ps.breakdown.goalScore ?? "N/A"}</span>
                      </div>
                      <Progress value={ps.breakdown.goalScore || 0} className="h-1" />
                    </div>
                    <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Productive Time</span>
                        <span className="font-bold text-blue-600">{ps.breakdown.productiveTimeScore}/100</span>
                      </div>
                      <Progress value={ps.breakdown.productiveTimeScore} className="h-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DISCIPLINE SCORE CARD */}
            <Card className="border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h2 className="text-lg font-bold">Discipline</h2>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        Consistency & Commitments
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ds?.explanation}
                    </p>
                  </div>

                  {ds?.status === "insufficient_data" ? (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Need a few days of data to calculate.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-background/80 dark:bg-card/80 p-3 rounded-xl border shadow-sm shrink-0">
                      <div>
                        <p className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                          {ds?.score}<span className="text-xs text-muted-foreground font-normal"> / 100</span>
                        </p>
                        {ds?.change !== null && ds?.change !== undefined && (
                          <p className={cn("text-[11px] font-semibold flex items-center gap-0.5 mt-0.5", ds.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                            {ds.change >= 0 ? `+${ds.change}` : ds.change} pts vs last
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDiscBreakdown((prev) => !prev)}
                        className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        {showDiscBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* EXPANDABLE BREAKDOWN */}
                {showDiscBreakdown && ds?.breakdown && (
                  <div className="pt-3 border-t grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {ds.breakdown.habitsScore !== null && (
                      <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Habits ({ds.activeWeights?.habits || 30}%)</span>
                          <span className="font-bold text-indigo-600">{ds.breakdown.habitsScore}/100</span>
                        </div>
                        <Progress value={ds.breakdown.habitsScore} className="h-1" />
                      </div>
                    )}
                    {ds.breakdown.taskFollowThroughScore !== null && (
                      <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Planned Follow-Through</span>
                          <span className="font-bold text-indigo-600">{ds.breakdown.taskFollowThroughScore}/100</span>
                        </div>
                        <Progress value={ds.breakdown.taskFollowThroughScore} className="h-1" />
                      </div>
                    )}
                    {ds.breakdown.focusConsistencyScore !== null && (
                      <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Focus Consistency</span>
                          <span className="font-bold text-indigo-600">{ds.breakdown.focusConsistencyScore}/100</span>
                        </div>
                        <Progress value={ds.breakdown.focusConsistencyScore} className="h-1" />
                      </div>
                    )}
                    {ds.breakdown.workoutConsistencyScore !== null && (
                      <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Workout Frequency</span>
                          <span className="font-bold text-indigo-600">{ds.breakdown.workoutConsistencyScore}/100</span>
                        </div>
                        <Progress value={ds.breakdown.workoutConsistencyScore} className="h-1" />
                      </div>
                    )}
                    {ds.breakdown.sleepConsistencyScore !== null && (
                      <div className="p-2 bg-background/60 dark:bg-card/60 border rounded space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Sleep Schedule</span>
                          <span className="font-bold text-indigo-600">{ds.breakdown.sleepConsistencyScore}/100</span>
                        </div>
                        <Progress value={ds.breakdown.sleepConsistencyScore} className="h-1" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* GOAL HEALTH SUMMARY BANNER */}
          {data.goalHealthSummary && data.goalHealthSummary.totalActive > 0 && (
            <Card className="p-4 bg-card/60 border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Goal Health Summary ({data.goalHealthSummary.totalActive} Active Goals)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    🟢 {data.goalHealthSummary.onTrackCount} On Track
                  </Badge>
                  {data.goalHealthSummary.atRiskCount > 0 && (
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      🟡 {data.goalHealthSummary.atRiskCount} At Risk
                    </Badge>
                  )}
                  {data.goalHealthSummary.behindCount > 0 && (
                    <Badge variant="outline" className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      🔴 {data.goalHealthSummary.behindCount} Behind
                    </Badge>
                  )}
                  {data.goalHealthSummary.notStartedCount > 0 && (
                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      ⚪ {data.goalHealthSummary.notStartedCount} Not Started
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* KPI Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Task Completion</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold">{data.overview.taskCompletionRate}%</p>
              <div>{renderTrend(data.overview.taskCompletionTrend)}</div>
            </CardContent></Card>

            <Card><CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Time Tracked</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">{data.overview.trackedHours}h</p>
              <div>{renderTrend(data.overview.trackedHoursTrend)}</div>
            </CardContent></Card>

            <Card><CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Study Hours</span>
                <BookOpen className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">{data.overview.studyHours}h</p>
              <div>{renderTrend(data.overview.studyHoursTrend)}</div>
            </CardContent></Card>

            <Card><CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Focus Hours</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold">{data.overview.focusHours}h</p>
              <div>{renderTrend(data.overview.focusHoursTrend)}</div>
            </CardContent></Card>
          </div>

          {/* Module Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold">{data.overview.completedHabitLogsCount} completions</p>
                  <p className="text-xs text-muted-foreground">Across {data.overview.activeHabitsCount} active habits</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold">{data.overview.workoutCount} workouts</p>
                  <p className="text-xs text-muted-foreground">{data.overview.totalVolumeKg.toLocaleString()} kg total volume</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold">{data.overview.avgSleepDuration}h avg sleep</p>
                  <p className="text-xs text-muted-foreground">Quality rating: {data.overview.avgSleepQuality}/10</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Life Balance & Smart Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LIFE BALANCE BREAKDOWN */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Life Balance Distribution</CardTitle>
                <CardDescription>Proportional focus across core life dimensions ({RANGES.find(r => r.value === selectedRange)?.label})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.lifeBalance?.distribution ? (
                  data.lifeBalance.distribution.map((area) => (
                    <div key={area.area} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{area.area}</span>
                        <span className="text-muted-foreground">{area.hours}h ({area.pct}%)</span>
                      </div>
                      <Progress value={area.pct} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">No life balance data logged.</div>
                )}
              </CardContent>
            </Card>

            {/* DETERMINISTIC SMART INSIGHTS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Insights Engine</CardTitle>
                <CardDescription>Deterministic performance facts, trends, and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.insights && data.insights.length > 0 ? (
                  data.insights.map((insight) => (
                    <div key={insight.id} className="p-3 bg-accent/40 border rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{insight.title}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {insight.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Keep tracking activities to generate smart performance insights.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Time Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Time Allocation ({RANGES.find(r => r.value === selectedRange)?.label})</CardTitle>
              <CardDescription>Distribution of logged focus and activity hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.categoryDistribution.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No logged category hours for this range.
                </div>
              ) : (
                data.categoryDistribution.map((item) => {
                  const maxHours = Math.max(...data.categoryDistribution.map((c) => c.hours), 1);
                  const percentage = Math.round((item.hours / maxHours) * 100);

                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="capitalize">{item.name}</span>
                        <span>{item.hours} hours</span>
                      </div>
                      <Progress value={percentage} className="h-2.5" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
