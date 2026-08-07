import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const workoutSetInputSchema = z.object({
  exerciseName: z.string().min(1),
  reps: z.number().int().default(10),
  weight: z.number().default(0),
});

const workoutCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().default("Push"),
  date: z.string().optional(),
  durationMinutes: z.number().int().default(45),
  totalVolume: z.number().default(0),
  rating: z.number().int().min(1).max(5).default(4),
  notes: z.string().optional().nullable(),
  sets: z.array(workoutSetInputSchema).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [workouts, exercises] = await Promise.all([
      prisma.workout.findMany({
        where: { userId: session.user.id },
        include: {
          sets: {
            include: { exercise: true },
          },
        },
        orderBy: { date: "desc" },
        take: 20,
      }),
      prisma.exercise.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ workouts, exercises });
  } catch (error) {
    console.error("GET /api/fitness error:", error);
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
    const validated = workoutCreateSchema.parse(body);

    const workoutDate = validated.date ? startOfDay(new Date(validated.date)) : startOfDay(new Date());

    let calculatedVolume = validated.totalVolume;
    let totalSetsCount = 0;
    let totalRepsCount = 0;

    if (validated.sets && validated.sets.length > 0) {
      calculatedVolume = validated.sets.reduce((sum, s) => sum + (s.reps * s.weight), 0);
      totalSetsCount = validated.sets.length;
      totalRepsCount = validated.sets.reduce((sum, s) => sum + s.reps, 0);
    }

    const workout = await prisma.workout.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        type: validated.type,
        date: workoutDate,
        duration: validated.durationMinutes * 60,
        totalVolume: calculatedVolume,
        totalSets: totalSetsCount,
        totalReps: totalRepsCount,
        rating: validated.rating,
        notes: validated.notes,
      },
    });

    if (validated.sets && validated.sets.length > 0) {
      for (let i = 0; i < validated.sets.length; i++) {
        const setInput = validated.sets[i];

        // Find or create Exercise
        let exercise = await prisma.exercise.findFirst({
          where: { userId: session.user.id, name: setInput.exerciseName },
        });

        if (!exercise) {
          exercise = await prisma.exercise.create({
            data: {
              userId: session.user.id,
              name: setInput.exerciseName,
              category: validated.type.toLowerCase(),
            },
          });
        }

        await prisma.workoutSet.create({
          data: {
            workoutId: workout.id,
            exerciseId: exercise.id,
            setNumber: i + 1,
            reps: setInput.reps,
            weight: setInput.weight,
          },
        });
      }
    }

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/fitness error:", error);
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

    await prisma.workout.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/fitness error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
