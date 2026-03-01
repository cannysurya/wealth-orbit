
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createGoalSchema = z.object({
    name: z.string().min(1, "Name is required"),
    targetAmount: z.number().positive("Target amount must be positive"),
    targetDate: z.string().transform((str) => new Date(str)),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
});

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const goals = await prisma.goal.findMany({
            where: { userId: session.user.id },
            orderBy: { targetDate: "asc" },
        });
        return NextResponse.json(goals);
    } catch (error) {
        console.error("Error fetching goals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const json = await req.json();
        const body = createGoalSchema.parse(json);

        const goal = await prisma.goal.create({
            data: {
                userId: session.user.id,
                ...body,
            },
        });

        return NextResponse.json(goal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 });
        }
        console.error("Error creating goal:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
