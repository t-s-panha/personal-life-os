import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const sleepRecordSchema = z.object({
  date: z.string().optional(),
  bedTime: z.string().optional(),
  wakeTime: z.string().optional(),
  duration: z.number().default(8),
  quality: z.number().int().min(1).max(10).default(8),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sleepRecords = await prisma.sleepRecord.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    return NextResponse.json(sleepRecords);
  } catch (error) {
    console.error("GET /api/sleep error:", error);
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
    const validated = sleepRecordSchema.parse(body);

    const recordDate = validated.date ? startOfDay(new Date(validated.date)) : startOfDay(new Date());

    const bedTime = validated.bedTime ? new Date(validated.bedTime) : new Date(recordDate.getTime() - 8 * 3600000);
    const wakeTime = validated.wakeTime ? new Date(validated.wakeTime) : recordDate;

    const sleepRecord = await prisma.sleepRecord.upsert({
      where: { userId_date: { userId: session.user.id, date: recordDate } },
      update: {
        bedTime,
        wakeTime,
        duration: validated.duration,
        quality: validated.quality,
        notes: validated.notes,
      },
      create: {
        userId: session.user.id,
        date: recordDate,
        bedTime,
        wakeTime,
        duration: validated.duration,
        quality: validated.quality,
        notes: validated.notes,
      },
    });

    return NextResponse.json(sleepRecord, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/sleep error:", error);
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

    await prisma.sleepRecord.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sleep error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
