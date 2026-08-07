import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const focusSessionSchema = z.object({
  presetName: z.string().default("Pomodoro"),
  workDuration: z.number().int().default(1500),
  breakDuration: z.number().int().default(300),
  duration: z.number().int().optional(),
  distractions: z.number().int().default(0),
  focusRating: z.number().int().min(1).max(5).optional().nullable(),
  isCompleted: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  taskId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
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

    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/focus error:", error);
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
    const validated = focusSessionSchema.parse(body);

    const end = validated.endTime ? new Date(validated.endTime) : new Date();
    const start = validated.startTime ? new Date(validated.startTime) : new Date(end.getTime() - (validated.duration || validated.workDuration) * 1000);

    const focusSession = await prisma.focusSession.create({
      data: {
        userId: session.user.id,
        presetName: validated.presetName,
        workDuration: validated.workDuration,
        breakDuration: validated.breakDuration,
        duration: validated.duration || validated.workDuration,
        distractions: validated.distractions,
        focusRating: validated.focusRating || 4,
        isCompleted: validated.isCompleted,
        startTime: start,
        endTime: end,
        taskId: validated.taskId || null,
        projectId: validated.projectId || null,
      },
    });

    // Idempotent TimeEntry Auto-creation Safeguard
    if (validated.isCompleted) {
      const existingTimeEntry = await prisma.timeEntry.findFirst({
        where: {
          userId: session.user.id,
          startTime: start,
          duration: validated.duration || validated.workDuration,
        },
      });

      if (!existingTimeEntry) {
        await prisma.timeEntry.create({
          data: {
            userId: session.user.id,
            description: `Focus Session: ${validated.presetName}`,
            category: "work",
            startTime: start,
            endTime: end,
            duration: validated.duration || validated.workDuration,
            taskId: validated.taskId || null,
            projectId: validated.projectId || null,
          },
        });
      }
    }

    return NextResponse.json(focusSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/focus error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
