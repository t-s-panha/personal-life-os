import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const timeEntrySchema = z.object({
  category: z.string().default("work"),
  description: z.string().optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional().nullable(),
  duration: z.number().int().optional().nullable(),
  productivityRating: z.number().int().min(1).max(5).optional().nullable(),
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

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/time error:", error);
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
    const validated = timeEntrySchema.parse(body);

    const start = validated.startTime ? new Date(validated.startTime) : new Date();
    const end = validated.endTime ? new Date(validated.endTime) : new Date();
    const duration = validated.duration ?? Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));

    const entry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        category: validated.category,
        description: validated.description,
        startTime: start,
        endTime: end,
        duration,
        productivityRating: validated.productivityRating || 4,
        source: "manual",
        taskId: validated.taskId || null,
        projectId: validated.projectId || null,
      },
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/time error:", error);
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

    await prisma.timeEntry.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/time error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
