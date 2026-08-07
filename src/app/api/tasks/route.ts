import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay, addDays } from "date-fns";

export const dynamic = "force-dynamic";

const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(4).default(2),
  status: z.enum(["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ARCHIVED"]).default("BACKLOG"),
  dueDate: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  estimatedDuration: z.number().int().optional().nullable(),
});

const taskUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(4).optional(),
  status: z.enum(["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ARCHIVED"]).optional(),
  dueDate: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
  order: z.number().int().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // today, upcoming, kanban, all
    const status = searchParams.get("status");

    let whereClause: any = {
      userId: session.user.id,
      status: { notIn: ["ARCHIVED"] },
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (view === "today") {
      const today = new Date();
      whereClause.dueDate = {
        gte: startOfDay(today),
        lte: endOfDay(today),
      };
    } else if (view === "upcoming") {
      const tomorrow = addDays(new Date(), 1);
      whereClause.dueDate = {
        gte: startOfDay(tomorrow),
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
        project: {
          select: { id: true, name: true },
        },
        goal: {
          select: { id: true, title: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
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
    const validated = taskCreateSchema.parse(body);

    const highestOrder = await prisma.task.findFirst({
      where: { userId: session.user.id, status: validated.status },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        status: validated.status,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        category: validated.category,
        projectId: validated.projectId || null,
        goalId: validated.goalId || null,
        parentId: validated.parentId || null,
        estimatedDuration: validated.estimatedDuration || null,
        order: (highestOrder?.order ?? 0) + 1,
      },
      include: {
        subtasks: true,
        project: { select: { id: true, name: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/tasks error:", error);
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
    const validated = taskUpdateSchema.parse(body);

    const existing = await prisma.task.findFirst({
      where: { id: validated.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let completedAt = existing.completedAt;
    if (validated.status) {
      if (validated.status === "COMPLETED" && existing.status !== "COMPLETED") {
        completedAt = new Date();
      } else if (validated.status !== "COMPLETED") {
        completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id: validated.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.priority !== undefined && { priority: validated.priority }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.dueDate !== undefined && { dueDate: validated.dueDate ? new Date(validated.dueDate) : null }),
        ...(validated.category !== undefined && { category: validated.category }),
        ...(validated.projectId !== undefined && { projectId: validated.projectId || null }),
        ...(validated.goalId !== undefined && { goalId: validated.goalId || null }),
        ...(validated.order !== undefined && { order: validated.order }),
        completedAt,
      },
      include: {
        subtasks: true,
        project: { select: { id: true, name: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    // Cascading Progress Update (Task -> Project -> Goal)
    if (updated.projectId) {
      const projectTasks = await prisma.task.findMany({
        where: { projectId: updated.projectId, status: { notIn: ["ARCHIVED", "CANCELLED"] } },
      });
      if (projectTasks.length > 0) {
        const completedCount = projectTasks.filter((t) => t.status === "COMPLETED").length;
        const newProjectProgress = Math.round((completedCount / projectTasks.length) * 100);
        const updatedProj = await prisma.project.update({
          where: { id: updated.projectId },
          data: { progress: newProjectProgress },
        });

        if (updatedProj.goalId) {
          const goalProjects = await prisma.project.findMany({
            where: { goalId: updatedProj.goalId },
          });
          if (goalProjects.length > 0) {
            const avgProjProgress = Math.round(
              goalProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / goalProjects.length
            );
            await prisma.goal.update({
              where: { id: updatedProj.goalId },
              data: { progress: avgProjProgress },
            });
          }
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("PATCH /api/tasks error:", error);
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
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    await prisma.task.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
