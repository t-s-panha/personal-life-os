import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const readingSchema = z.object({
  bookId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
  pagesRead: z.number().default(0),
  startPage: z.number().optional().nullable(),
  endPage: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    const where: any = { userId: session.user.id };
    if (bookId) where.bookId = bookId;

    const sessions = await prisma.readingSession.findMany({
      where,
      include: { book: { select: { title: true, author: true } } },
      orderBy: { startTime: "desc" },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Reading sessions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = readingSchema.parse(body);

    const duration = validated.endTime
      ? Math.round((new Date(validated.endTime).getTime() - new Date(validated.startTime).getTime()) / 1000)
      : null;

    const session_data = await prisma.readingSession.create({
      data: {
        ...validated,
        userId: session.user.id,
        startTime: new Date(validated.startTime),
        endTime: validated.endTime ? new Date(validated.endTime) : null,
        duration,
      },
    });

    // Update book progress
    if (validated.endPage) {
      const book = await prisma.book.findUnique({ where: { id: validated.bookId } });
      if (book) {
        const newPage = Math.max(book.currentPage, validated.endPage);
        await prisma.book.update({
          where: { id: validated.bookId },
          data: {
            currentPage: newPage,
            progress: book.totalPages ? (newPage / book.totalPages) * 100 : 0,
            totalReadingTime: { increment: duration || 0 },
            status: book.totalPages && newPage >= book.totalPages ? "COMPLETED" : "READING",
          },
        });
      }
    }

    return NextResponse.json(session_data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error("Reading sessions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
