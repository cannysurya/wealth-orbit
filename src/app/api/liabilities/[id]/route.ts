import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const liabilitySchema = z.object({
    type: z.string(),
    name: z.string().min(1, "Name is required"),
    outstandingAmount: z.number().min(0),
    interestRate: z.number().min(0),
    emi: z.number().min(0),
    endDate: z.string().optional().nullable(),
});

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const body = await req.json();

        const validatedData = liabilitySchema.parse({
            ...body,
            endDate: body.endDate ? new Date(body.endDate).toISOString() : null
        });

        const existingLiability = await db.liability.findUnique({
            where: { id },
        });

        if (!existingLiability || existingLiability.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        const updateData = {
            type: validatedData.type,
            name: validatedData.name,
            outstandingAmount: validatedData.outstandingAmount,
            interestRate: validatedData.interestRate,
            emi: validatedData.emi,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        };

        const updatedLiability = await db.liability.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedLiability);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update liability" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const existingLiability = await db.liability.findUnique({
            where: { id },
        });

        if (!existingLiability || existingLiability.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await db.liability.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete liability" }, { status: 500 });
    }
}
