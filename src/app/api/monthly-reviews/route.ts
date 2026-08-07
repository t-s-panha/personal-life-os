import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getAnalyticsDateRanges, getRawAnalyticsData, calculateAnalyticsSummary } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const auto = searchParams.get("auto");

    if (auto === "true") {
      const ranges = getAnalyticsDateRanges("30d");
      const rawData = await getRawAnalyticsData(session.user.id, ranges);
      const summary = calculateAnalyticsSummary(rawData, ranges, "30d");

      return NextResponse.json({
        productivityScore: summary.productivityScore.score,
        disciplineScore: summary.disciplineScore.score,
        studyHours: summary.overview.studyHours,
        focusHours: summary.overview.focusHours,
        workoutCount: summary.overview.workoutCount,
        avgSleepDuration: summary.overview.avgSleepDuration,
        completedHabitLogsCount: summary.overview.completedHabitLogsCount,
        activeGoalsCount: summary.overview.activeGoalsCount,
        goalHealthSummary: summary.goalHealthSummary,
        totalTrackedHours: summary.overview.trackedHours,
      });
    }

    const reviews = await prisma.monthlyReview.findMany({
      where: { userId: session.user.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Monthly reviews GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { month, year, ...data } = body;

    const review = await prisma.monthlyReview.upsert({
      where: {
        userId_year_month: {
          userId: session.user.id,
          year: Number(year),
          month: Number(month),
        },
      },
      update: data,
      create: {
        userId: session.user.id,
        year: Number(year),
        month: Number(month),
        ...data,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Monthly reviews POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
