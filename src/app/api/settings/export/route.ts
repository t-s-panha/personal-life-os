import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format"); // "json" or "csv"
    const moduleName = searchParams.get("module"); // e.g. "tasks"

    const userId = session.user.id;

    if (format === "csv" && moduleName === "tasks") {
      const tasks = await prisma.task.findMany({ where: { userId } });
      const csvHeader = "id,title,status,priority,dueDate,createdAt\n";
      const csvRows = tasks
        .map((t) => `"${t.id}","${t.title.replace(/"/g, '""')}","${t.status}",${t.priority},"${t.dueDate || ""}","${t.createdAt.toISOString()}"`)
        .join("\n");

      return new Response(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="personal_life_os_tasks.csv"',
        },
      });
    }

    // Default Full JSON Backup
    const [
      tasks,
      goals,
      projects,
      habits,
      habitLogs,
      focusSessions,
      studySessions,
      workouts,
      sleepRecords,
      books,
      journalEntries,
      dailyReviews,
      weeklyReviews,
      monthlyReviews,
    ] = await Promise.all([
      prisma.task.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.project.findMany({ where: { userId } }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.habitLog.findMany({ where: { userId } }),
      prisma.focusSession.findMany({ where: { userId } }),
      prisma.studySession.findMany({ where: { userId } }),
      prisma.workout.findMany({ where: { userId } }),
      prisma.sleepRecord.findMany({ where: { userId } }),
      prisma.book.findMany({ where: { userId } }),
      prisma.journalEntry.findMany({ where: { userId } }),
      prisma.dailyReview.findMany({ where: { userId } }),
      prisma.weeklyReview.findMany({ where: { userId } }),
      prisma.monthlyReview.findMany({ where: { userId } }),
    ]);

    const backupPayload = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      user: { id: userId, email: session.user.email },
      data: {
        tasks,
        goals,
        projects,
        habits,
        habitLogs,
        focusSessions,
        studySessions,
        workouts,
        sleepRecords,
        books,
        journalEntries,
        dailyReviews,
        weeklyReviews,
        monthlyReviews,
      },
    };

    return new Response(JSON.stringify(backupPayload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="personal_life_os_backup.json"',
      },
    });
  } catch (error) {
    console.error("GET /api/settings/export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
