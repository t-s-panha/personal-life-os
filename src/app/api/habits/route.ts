import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, subDays } from "date-fns";

export const dynamic = "force-dynamic";

const habitCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  category: z.string().default("general"),
  frequency: z.enum(["DAILY", "WEEKLY", "SPECIFIC_DAYS"]).default("DAILY"),
  targetCount: z.number().int().default(1),
});

const habitLogSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().min(1),
  completed: z.boolean(),
});

import { calculateHabitStreaks } from "@/lib/habits";
import { getZonedStartOfDay } from "@/lib/timezone";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        logs: {
          where: { completed: true },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { order: "asc" },
    });

    const enrichedHabits = habits.map((habit) => {
      const { currentStreak, longestStreak, totalCompletions } = calculateHabitStreaks(
        habit.logs,
        habit.targetDays
      );

      return {
        ...habit,
        currentStreak,
        longestStreak,
        totalCompletions,
      };
    });

    return NextResponse.json(enrichedHabits);
  } catch (error) {
    console.error("GET /api/habits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Check if logging completion vs creating habit
    if (body.habitId && body.completed !== undefined) {
      const { habitId, date, completed } = habitLogSchema.parse(body);
      
      // Parse canonical YYYY-MM-DD as UTC midnight
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      const canonicalDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      if (completed) {
        // Toggle ON: Upsert completed log
        await prisma.habitLog.upsert({
          where: { habitId_date: { habitId, date: canonicalDate } },
          update: { completed: true, count: 1 },
          create: { habitId, userId: session.user.id, date: canonicalDate, completed: true, count: 1 },
        });
      } else {
        // Toggle OFF: Delete log record completely to prevent stale DB state
        await prisma.habitLog.deleteMany({
          where: { habitId, date: canonicalDate },
        });
      }

      // Recalculate authoritative streak/stats from DB
      const logs = await prisma.habitLog.findMany({
        where: { habitId, completed: true },
        orderBy: { date: "desc" },
      });
      const totalCompletions = logs.length;

      const habit = await prisma.habit.findUnique({ where: { id: habitId } });
      const { currentStreak, longestStreak } = calculateHabitStreaks(logs, habit?.targetDays);

      await prisma.habit.update({
        where: { id: habitId },
        data: { totalCompletions, currentStreak },
      });

      return NextResponse.json({
        habitId,
        date: date.split("T")[0],
        completed,
        currentStreak,
        longestStreak,
        totalCompletions,
        logs,
      });
    }

    // Creating new habit
    const validated = habitCreateSchema.parse(body);
    const habit = await prisma.habit.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        frequency: validated.frequency,
        targetCount: validated.targetCount,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/habits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.habit.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/habits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
