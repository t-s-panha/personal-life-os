import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const goalCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  timeframe: z.enum(["VISION", "YEAR_3_5", "ANNUAL", "QUARTERLY", "MONTHLY", "WEEKLY", "DAILY"]).default("ANNUAL"),
  category: z.string().default("personal"),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  targetValue: z.number().default(100),
  currentValue: z.number().default(0),
  metricUnit: z.string().optional().nullable(),
});

const goalUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  timeframe: z.enum(["VISION", "YEAR_3_5", "ANNUAL", "QUARTERLY", "MONTHLY", "WEEKLY", "DAILY"]).optional(),
  category: z.string().optional(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  health: z.enum(["NOT_STARTED", "ON_TRACK", "AT_RISK", "BEHIND", "COMPLETED"]).optional(),
  isArchived: z.boolean().optional(),
});

import { calculateGoalHealth } from "@/lib/analytics";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe");
    const category = searchParams.get("category");

    let whereClause: any = {
      userId: session.user.id,
      isArchived: false,
    };

    if (timeframe && timeframe !== "ALL") whereClause.timeframe = timeframe;
    if (category && category !== "ALL") whereClause.category = category;

    const rawGoals = await prisma.goal.findMany({
      where: whereClause,
      include: {
        milestones: { orderBy: { order: "asc" } },
        tasks: { select: { id: true, title: true, status: true, updatedAt: true } },
        projects: { select: { id: true, name: true, progress: true } },
      },
      orderBy: { targetDate: "asc" },
    });

    const goalsWithHealth = rawGoals.map((goal) => {
      const healthEval = calculateGoalHealth(goal);
      return {
        ...goal,
        health: healthEval.health,
        healthReason: healthEval.healthReason,
        expectedProgress: healthEval.expectedProgress,
        progressGap: healthEval.progressGap,
        daysRemaining: healthEval.daysRemaining,
        daysSinceLastActivity: healthEval.daysSinceLastActivity,
      };
    });

    return NextResponse.json(goalsWithHealth);
  } catch (error) {
    console.error("GET /api/goals error:", error);
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

    // Check if adding a milestone
    if (body.goalId && body.milestoneTitle) {
      const milestone = await prisma.milestone.create({
        data: {
          goalId: body.goalId,
          title: body.milestoneTitle,
          targetDate: body.targetDate ? new Date(body.targetDate) : new Date(Date.now() + 30 * 86400000),
        },
      });
      return NextResponse.json(milestone, { status: 201 });
    }

    const validated = goalCreateSchema.parse(body);

    const targetVal = validated.targetValue || 100;
    const currentVal = validated.currentValue || 0;
    const progress = Math.min(Math.round((currentVal / targetVal) * 100), 100);

    let health: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "BEHIND" | "COMPLETED" = "ON_TRACK";
    if (progress === 100) health = "COMPLETED";
    else if (progress === 0) health = "NOT_STARTED";

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        title: validated.title,
        description: validated.description,
        timeframe: validated.timeframe,
        category: validated.category,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        targetDate: validated.targetDate ? new Date(validated.targetDate) : new Date(Date.now() + 365 * 86400000),
        targetValue: targetVal,
        currentValue: currentVal,
        progress,
        health,
        metricUnit: validated.metricUnit,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Check if toggling milestone
    if (body.toggleMilestoneId) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: body.toggleMilestoneId },
      });
      if (milestone) {
        const updated = await prisma.milestone.update({
          where: { id: body.toggleMilestoneId },
          data: { completedAt: milestone.completedAt ? null : new Date() },
        });
        return NextResponse.json(updated);
      }
    }

    const validated = goalUpdateSchema.parse(body);

    const existing = await prisma.goal.findFirst({
      where: { id: validated.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const targetVal = validated.targetValue ?? existing.targetValue;
    const currentVal = validated.currentValue ?? existing.currentValue;
    const progress = Math.min(Math.round((currentVal / (targetVal || 1)) * 100), 100);

    let health = validated.health ?? existing.health;
    if (!validated.health) {
      if (progress >= 100) health = "COMPLETED";
      else if (progress === 0) health = "NOT_STARTED";
      else health = "ON_TRACK";
    }

    const updated = await prisma.goal.update({
      where: { id: validated.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.timeframe !== undefined && { timeframe: validated.timeframe }),
        ...(validated.category !== undefined && { category: validated.category }),
        ...(validated.currentValue !== undefined && { currentValue: validated.currentValue }),
        ...(validated.targetValue !== undefined && { targetValue: validated.targetValue }),
        ...(validated.isArchived !== undefined && { isArchived: validated.isArchived }),
        progress,
        health,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("PATCH /api/goals error:", error);
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

    if (!id) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    await prisma.goal.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
