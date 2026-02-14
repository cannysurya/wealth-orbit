import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const assetSchema = z.object({
    type: z.string(),
    name: z.string().min(1, "Name is required"),
    investedAmount: z.number().min(0),
    returnRate: z.number().min(0),
    interestType: z.enum(["SIMPLE", "COMPOUND"]).default("COMPOUND"),
});

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const body = await req.json();
        const validatedData = assetSchema.parse(body);

        // Verify ownership
        const existingAsset = await db.asset.findUnique({
            where: { id },
        });

        if (!existingAsset || existingAsset.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        const updatedAsset = await db.asset.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(updatedAsset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            if (error instanceof z.ZodError) {
                return NextResponse.json({ error: (error as any).errors || (error as any).issues }, { status: 400 });
            }
        }
        return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
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
        // Verify ownership
        const existingAsset = await db.asset.findUnique({
            where: { id },
        });

        if (!existingAsset || existingAsset.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await db.asset.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }
}
