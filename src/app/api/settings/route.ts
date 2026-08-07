import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsUpdateSchema = z.object({
  displayName: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  timezone: z.string().optional(),
  sleepTarget: z.number().optional(),
  theme: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  reminderTime: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        settings: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/settings error:", error);
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
    const validated = settingsUpdateSchema.parse(body);

    if (validated.displayName !== undefined || validated.bio !== undefined || validated.timezone !== undefined || validated.sleepTarget !== undefined) {
      await prisma.profile.upsert({
        where: { userId: session.user.id },
        update: {
          ...(validated.displayName !== undefined && { displayName: validated.displayName }),
          ...(validated.bio !== undefined && { bio: validated.bio }),
          ...(validated.timezone !== undefined && { timezone: validated.timezone }),
          ...(validated.sleepTarget !== undefined && { sleepTarget: validated.sleepTarget }),
        },
        create: {
          userId: session.user.id,
          displayName: validated.displayName || session.user.name || "User",
          bio: validated.bio,
          timezone: validated.timezone || "UTC",
          sleepTarget: validated.sleepTarget || 8.0,
        },
      });

      if (validated.displayName) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { name: validated.displayName },
        });
      }
    }

    if (validated.theme !== undefined || validated.emailNotifications !== undefined || validated.reminderTime !== undefined) {
      await prisma.userSettings.upsert({
        where: { userId: session.user.id },
        update: {
          ...(validated.theme !== undefined && { theme: validated.theme }),
          ...(validated.emailNotifications !== undefined && { emailNotifications: validated.emailNotifications }),
          ...(validated.reminderTime !== undefined && { reminderTime: validated.reminderTime }),
        },
        create: {
          userId: session.user.id,
          theme: validated.theme || "system",
          emailNotifications: validated.emailNotifications ?? true,
          reminderTime: validated.reminderTime || "09:00",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
