import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { getAnalyticsDateRanges, getRawAnalyticsData, calculateAnalyticsSummary } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      tasks,
      habits,
      timeEntries,
      focusSessions,
      sleepRecord,
      goals,
      studySessions,
      workouts,
    ] = await Promise.all([
      prisma.task.findMany({ where: { userId: session.user.id } }),
      prisma.habit.findMany({
        where: { userId: session.user.id, isActive: true },
        include: { logs: { where: { date: { gte: dayStart, lte: dayEnd } } } },
      }),
      prisma.timeEntry.findMany({
        where: { userId: session.user.id, startTime: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.focusSession.findMany({
        where: { userId: session.user.id, startTime: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.sleepRecord.findFirst({
        where: { userId: session.user.id, date: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.goal.findMany({
        where: { userId: session.user.id, isArchived: false },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.studySession.findMany({
        where: { userId: session.user.id, startTime: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.workout.findMany({
        where: { userId: session.user.id, date: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    const tasksTotal = tasks.filter(t => t.status !== "ARCHIVED" && t.status !== "CANCELLED").length;
    const tasksCompleted = tasks.filter(t => t.status === "COMPLETED").length;
    const habitsTotal = habits.length;
    const habitsCompleted = habits.filter(h => h.logs.some(l => l.completed)).length;

    const studySeconds = studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const focusSeconds = focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalTracked = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const productiveSeconds = timeEntries
      .filter(e => !["entertainment", "social"].includes(e.category))
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    // Calculate daily score (0-100)
    const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 20 : 0;
    const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 20 : 0;
    const focusScore = Math.min((focusSeconds / 3600) * 10, 20);
    const studyScore = Math.min((studySeconds / 3600) * 10, 20);
    const productivityScore = totalTracked > 0 ? (productiveSeconds / totalTracked) * 20 : 0;
    const dailyScore = Math.round(taskScore + habitScore + focusScore + studyScore + productivityScore);

    // Weekly stats
    const weeklyStudy = await prisma.studySession.findMany({
      where: { userId: session.user.id, startTime: { gte: weekStart } },
    });
    const weeklyWorkouts = await prisma.workout.findMany({
      where: { userId: session.user.id, date: { gte: weekStart } },
    });

    const analyticsRanges = getAnalyticsDateRanges("7d");
    const analyticsRaw = await getRawAnalyticsData(session.user.id, analyticsRanges);
    const analyticsSummary = calculateAnalyticsSummary(analyticsRaw, analyticsRanges, "7d");

    return NextResponse.json({
      dailyScore,
      productivityScore: analyticsSummary.productivityScore,
      disciplineScore: analyticsSummary.disciplineScore,
      goalHealthSummary: analyticsSummary.goalHealthSummary,
      topInsights: analyticsSummary.insights.slice(0, 2),
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      habitsTotal,
      studyHours: Math.round((studySeconds / 3600) * 10) / 10,
      focusHours: Math.round((focusSeconds / 3600) * 10) / 10,
      workoutCompleted: workouts.length > 0,
      sleepDuration: sleepRecord?.duration || null,
      topTasks: tasks
        .filter(t => t.status !== "COMPLETED" && t.status !== "ARCHIVED" && t.status !== "CANCELLED")
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3),
      todayHabits: habits,
      recentTimeEntries: timeEntries.slice(0, 5),
      goalProgress: goals.map(g => ({ id: g.id, title: g.title, progress: g.progress })),
      weeklyStudyHours: Math.round(weeklyStudy.reduce((s, sess) => s + (sess.duration || 0), 0) / 3600 * 10) / 10,
      weeklyWorkouts: weeklyWorkouts.length,
      totalSubjects: await prisma.subject.count({ where: { userId: session.user.id } }),
      totalSkills: await prisma.skill.count({ where: { userId: session.user.id } }),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
