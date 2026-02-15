import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const modificationSchema = z.object({
    amount: z.number(), // Positive for investment, Negative for withdrawal
    date: z.string(), // YYYY-MM-DD
    note: z.string().optional(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Correct type for Next.js 15+ dynamic routes (params is a Promise)
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const assetId = id;

        // Verify asset ownership
        const asset = await db.asset.findUnique({
            where: { id: assetId },
        });

        if (!asset || asset.userId !== session.user.id) {
            return NextResponse.json({ error: "Asset not found or unauthorized" }, { status: 404 });
        }

        const body = await req.json();
        const validatedData = modificationSchema.parse(body);

        const modification = await db.assetModification.create({
            data: {
                assetId,
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
