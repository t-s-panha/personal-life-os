import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  category: z.string().default("technical"),
  currentLevel: z.number().int().min(1).max(5).default(1),
  targetLevel: z.number().int().min(1).max(5).default(3),
  importance: z.number().int().min(1).max(5).default(3),
  totalHours: z.number().default(0),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: [{ importance: "desc" }, { currentLevel: "desc" }],
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error("GET /api/skills error:", error);
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
    const validated = skillSchema.parse(body);

    if (validated.id) {
      const updated = await prisma.skill.update({
        where: { id: validated.id },
        data: {
          name: validated.name,
          category: validated.category,
          currentLevel: validated.currentLevel,
          targetLevel: validated.targetLevel,
          importance: validated.importance,
          totalHours: validated.totalHours,
          notes: validated.notes,
          lastPracticed: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    const skill = await prisma.skill.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        category: validated.category,
        currentLevel: validated.currentLevel,
        targetLevel: validated.targetLevel,
        importance: validated.importance,
        totalHours: validated.totalHours,
        notes: validated.notes,
        lastPracticed: new Date(),
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/skills error:", error);
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

    await prisma.skill.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/skills error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
