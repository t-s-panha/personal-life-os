import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  goalId: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).default("PLANNING"),
  deadline: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = { userId: session.user.id };
    if (status) where.status = status;

    const projects = await prisma.project.findMany({
      where,
      include: {
        goal: { select: { id: true, title: true } },
        tasks: { select: { id: true, status: true } },
        milestones: { orderBy: { order: "asc" } },
        timeEntries: { orderBy: { startTime: "desc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate progress
    const projectsWithProgress = projects.map(p => {
      const completed = p.tasks.filter((t: any) => t.status === "COMPLETED").length;
      const total = p.tasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : p.progress;
      return { ...p, progress };
    });

    return NextResponse.json(projectsWithProgress);
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = projectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        ...validated,
        userId: session.user.id,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error("Projects POST error:", error);
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
    if (data.deadline) updateData.deadline = new Date(data.deadline);

    await prisma.project.updateMany({ where: { id, userId: session.user.id }, data: updateData });
    const updated = await prisma.project.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Projects PATCH error:", error);
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

    await prisma.project.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Projects DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
