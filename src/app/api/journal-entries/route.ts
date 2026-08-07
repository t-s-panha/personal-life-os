import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const journalSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(["DAILY", "STUDY", "WORK", "IDEAS", "REFLECTION", "GRATITUDE", "LESSONS"]).default("DAILY"),
  title: z.string().optional().nullable(),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  mood: z.number().min(1).max(10).optional().nullable(),
  energy: z.number().min(1).max(10).optional().nullable(),
  gratitude: z.string().optional().nullable(),
  lessons: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: any = { userId: session.user.id };
    if (type) where.type = type;
    if (start && end) where.date = { gte: new Date(start), lte: new Date(end) };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Journal GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = journalSchema.parse(body);

    const entry = await prisma.journalEntry.create({
      data: {
        ...validated,
        userId: session.user.id,
        date: new Date(validated.date),
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error("Journal POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    await prisma.journalEntry.updateMany({ where: { id, userId: session.user.id }, data: updateData });
    const updated = await prisma.journalEntry.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Journal PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.journalEntry.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Journal DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
