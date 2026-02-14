import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const assetSchema = z.object({
    type: z.string(),
    name: z.string().min(1, "Name is required"),
    currentValue: z.number().min(0),
    investedAmount: z.number().min(0),
    returnRate: z.number().min(0),
});

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const assets = await db.asset.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(assets);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedData = assetSchema.parse(body);

        const asset = await db.asset.create({
            data: {
                ...validatedData,
                userId: session.user.id,
            },
        });

        return NextResponse.json(asset, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
    }
}
