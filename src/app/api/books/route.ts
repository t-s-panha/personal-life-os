import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().optional().nullable(),
  category: z.string().default("non-fiction"),
  status: z.enum(["WANT_TO_READ", "READING", "COMPLETED", "ABANDONED"]).default("WANT_TO_READ"),
  totalPages: z.number().optional().nullable(),
  currentPage: z.number().default(0),
  rating: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  keyLessons: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = { userId: session.user.id };
    if (status) where.status = status;

    const books = await prisma.book.findMany({
      where,
      include: { readingSessions: { orderBy: { startTime: "desc" }, take: 3 } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Books GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = bookSchema.parse(body);

    const book = await prisma.book.create({
      data: { ...validated, userId: session.user.id, progress: validated.totalPages ? (validated.currentPage / validated.totalPages) * 100 : 0 },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error("Books POST error:", error);
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
    if (data.currentPage !== undefined && data.totalPages) {
      updateData.progress = (data.currentPage / data.totalPages) * 100;
    }
    if (data.status === "COMPLETED" && !data.completedDate) {
      updateData.completedDate = new Date();
    }

    await prisma.book.updateMany({ where: { id, userId: session.user.id }, data: updateData });
    const updated = await prisma.book.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Books PATCH error:", error);
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

    await prisma.book.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Books DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
