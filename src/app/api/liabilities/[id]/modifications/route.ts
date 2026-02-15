import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const modificationSchema = z.object({
    amount: z.number().positive("Amount must be positive"), // Always positive (reduces debt)
    date: z.string(), // YYYY-MM-DD
    note: z.string().optional(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const liabilityId = id;

        // Verify liability ownership
        const liability = await db.liability.findUnique({
            where: { id: liabilityId },
        });

        if (!liability || liability.userId !== session.user.id) {
            return NextResponse.json({ error: "Liability not found or unauthorized" }, { status: 404 });
        }

        const body = await req.json();
        const validatedData = modificationSchema.parse(body);

        const modification = await db.liabilityModification.create({
            data: {
                liabilityId,
                amount: validatedData.amount,
                date: new Date(validatedData.date),
                note: validatedData.note,
            },
        });

        return NextResponse.json(modification, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create modification" }, { status: 500 });
    }
}
