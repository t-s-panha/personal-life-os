import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  category: z.string().default("technical"),
  currentLevel: z.string().default("beginner"),
  targetLevel: z.string().default("intermediate"),
  progress: z.number().default(0),
});

const studySessionSchema = z.object({
  subjectId: z.string().min(1),
  topic: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(1),
  productivityRating: z.number().int().min(1).max(5).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subjects, studySessions] = await Promise.all([
      prisma.subject.findMany({
        where: { userId: session.user.id, isActive: true },
        include: { courses: true },
        orderBy: { order: "asc" },
      }),
      prisma.studySession.findMany({
        where: { userId: session.user.id },
        include: { subject: { select: { id: true, name: true } } },
        orderBy: { startTime: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({ subjects, studySessions });
  } catch (error) {
    console.error("GET /api/education error:", error);
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

    // Check if creating study session vs subject
    if (body.subjectId) {
      const { subjectId, topic, durationMinutes, productivityRating } = studySessionSchema.parse(body);
      const durationSeconds = durationMinutes * 60;
      const now = new Date();
      const start = new Date(now.getTime() - durationSeconds * 1000);

      const studySession = await prisma.studySession.create({
        data: {
          userId: session.user.id,
          subjectId,
          topic: topic || "General Study",
          duration: durationSeconds,
          startTime: start,
          endTime: now,
          productivityRating: productivityRating || 4,
        },
      });

      // Update subject total study hours
      const addedHours = Math.round((durationMinutes / 60) * 10) / 10;
      await prisma.subject.update({
        where: { id: subjectId },
        data: { totalStudyHours: { increment: addedHours } },
      });

      return NextResponse.json(studySession, { status: 201 });
    }

    // Creating Subject
    const validated = subjectSchema.parse(body);
    const subject = await prisma.subject.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        currentLevel: validated.currentLevel,
        targetLevel: validated.targetLevel,
        progress: validated.progress,
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/education error:", error);
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

    await prisma.subject.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/education error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
