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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dayStart = startOfDay(targetDate);

    // Get 7 days window for weekly view context
    const sevenDaysAgo = subDays(dayStart, 6);

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        logs: {
          where: { date: { gte: sevenDaysAgo } },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(habits);
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
      const logDate = startOfDay(new Date(date));

      const log = await prisma.habitLog.upsert({
        where: { habitId_date: { habitId, date: logDate } },
        update: { completed, count: completed ? 1 : 0 },
        create: { habitId, userId: session.user.id, date: logDate, completed, count: completed ? 1 : 0 },
      });

      // Recalculate streak/stats
      const logs = await prisma.habitLog.findMany({
        where: { habitId, completed: true },
        orderBy: { date: "desc" },
      });
      const totalCompletions = logs.length;

      await prisma.habit.update({
        where: { id: habitId },
        data: { totalCompletions },
      });

      return NextResponse.json(log);
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
