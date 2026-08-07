import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAnalyticsDateRanges,
  getRawAnalyticsData,
  calculateAnalyticsSummary,
  AnalyticsRange,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rangeParam = (searchParams.get("range") || "30d") as AnalyticsRange;

    const ranges = getAnalyticsDateRanges(rangeParam);
    const rawData = await getRawAnalyticsData(session.user.id, ranges);
    const summary = calculateAnalyticsSummary(rawData, ranges, rangeParam);

    return NextResponse.json({
      range: rangeParam,
      ...summary,
      // Backward compatibility fields for UI
      taskCompletionRate: summary.overview.taskCompletionRate,
      activeHabitsCount: summary.overview.activeHabitsCount,
      totalStudyHours: summary.overview.studyHours,
      workoutsLoggedCount: summary.overview.workoutCount,
      avgSleepQuality: summary.overview.avgSleepQuality,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
