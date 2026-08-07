import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    if (!body || !body.version || !body.data) {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }

    const { data } = body;
    let createdCount = 0;
    let skippedCount = 0;

    // Restore Tasks safely
    if (Array.isArray(data.tasks)) {
      for (const t of data.tasks) {
        if (!t.title) continue;
        const existing = await prisma.task.findUnique({ where: { id: t.id || "" } });
        if (existing) {
          skippedCount++;
        } else {
          await prisma.task.create({
            data: {
              id: t.id,
              userId,
              title: t.title,
              description: t.description,
              priority: t.priority || 2,
              status: t.status || "TODO",
              dueDate: t.dueDate ? new Date(t.dueDate) : null,
              createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            },
          });
          createdCount++;
        }
      }
    }

    // Restore Habits safely
    if (Array.isArray(data.habits)) {
      for (const h of data.habits) {
        if (!h.name) continue;
        const existing = await prisma.habit.findUnique({ where: { id: h.id || "" } });
        if (existing) {
          skippedCount++;
        } else {
          await prisma.habit.create({
            data: {
              id: h.id,
              userId,
              name: h.name,
              category: h.category || "general",
              frequency: h.frequency || "DAILY",
              targetDays: h.targetDays || null,
              createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
            },
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Restore completed: ${createdCount} records imported, ${skippedCount} duplicate records skipped.`,
      createdCount,
      skippedCount,
    });
  } catch (error) {
    console.error("POST /api/settings/import error:", error);
    return NextResponse.json({ error: "Import failed. Verify JSON format." }, { status: 500 });
  }
}
