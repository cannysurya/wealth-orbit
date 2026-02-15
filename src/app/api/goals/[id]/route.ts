
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateGoalSchema = z.object({
    name: z.string().min(1).optional(),
    targetAmount: z.number().positive().optional(),
    targetDate: z.string().transform((str) => new Date(str)).optional(),
    currentAmount: z.number().min(0).optional(),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const goalId = id;
        const json = await req.json();
        const body = updateGoalSchema.parse(json);

        // Verify ownership
        const existingGoal = await prisma.goal.findUnique({
            where: { id: goalId },
        });

        if (!existingGoal || existingGoal.userId !== session.user.id) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        const updatedGoal = await prisma.goal.update({
            where: { id: goalId },
            data: body,
        });

        return NextResponse.json(updatedGoal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 });
        }
        console.error("Error updating goal:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const goalId = id;

        // Verify ownership
        const existingGoal = await prisma.goal.findUnique({
            where: { id: goalId },
        });

        if (!existingGoal || existingGoal.userId !== session.user.id) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        await prisma.goal.delete({
            where: { id: goalId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting goal:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
