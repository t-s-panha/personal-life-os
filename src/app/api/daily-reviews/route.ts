import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";

const reviewSchema = z.object({
  date: z.string().datetime(),
  // Morning
  sleepDuration: z.number().optional().nullable(),
  sleepQuality: z.number().min(1).max(10).optional().nullable(),
  energy: z.number().min(1).max(10).optional().nullable(),
  motivation: z.number().min(1).max(10).optional().nullable(),
  morningMood: z.number().min(1).max(10).optional().nullable(),
  topPriority: z.string().optional(),
  topTasks: z.string().optional(),
  distractions: z.string().optional(),
  // Evening
  completedTasks: z.number().optional().nullable(),
  missedTasks: z.number().optional().nullable(),
  missedReason: z.string().optional(),
  productivity: z.number().min(1).max(10).optional().nullable(),
  focusTime: z.number().optional().nullable(),
  wastedTime: z.number().optional().nullable(),
  eveningMood: z.number().min(1).max(10).optional().nullable(),
  eveningEnergy: z.number().min(1).max(10).optional().nullable(),
  stress: z.number().min(1).max(10).optional().nullable(),
  discipline: z.number().min(1).max(10).optional().nullable(),
  wentWell: z.string().optional(),
  wentBadly: z.string().optional(),
  learned: z.string().optional(),
  improveTomorrow: z.string().optional(),
  journal: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (date) {
      const d = new Date(date);
      const review = await prisma.dailyReview.findUnique({
        where: { userId_date: { userId: session.user.id, date: d } },
      });
      return NextResponse.json(review || null);
    }

    const reviews = await prisma.dailyReview.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Daily review GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = reviewSchema.parse(body);

    const date = new Date(validated.date);
    date.setHours(0, 0, 0, 0);

    // Auto-calculate scores
    const missed = validated.missedTasks ?? 0;
    const completed = validated.completedTasks ?? 0;
    const totalTasks = completed + missed;
    const taskScore = totalTasks > 0
      ? Math.round((completed / totalTasks) * 30)
      : 0;
    const habitScore = Math.round(((validated.discipline || 5) / 10) * 20);
    const moodScore = Math.round((((validated.eveningMood || 5) + (validated.morningMood || 5)) / 20) * 20);
    const productivityScore = Math.round(((validated.productivity || 5) / 10) * 30);
    const dailyScore = Math.min(taskScore + habitScore + moodScore + productivityScore, 100);

    const review = await prisma.dailyReview.upsert({
      where: { userId_date: { userId: session.user.id, date } },
      update: { ...validated, dailyScore, disciplineScore: habitScore, productivityScore },
      create: {
        ...validated,
        userId: session.user.id,
        date,
        dailyScore,
        disciplineScore: habitScore,
        productivityScore,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error("Daily review POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
