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
    endDate: z.string().optional().nullable(), // Receive as string, convert to Date if needed, or keep as string if Schema allows? Schema says DateTime.
});

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const liabilities = await db.liability.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(liabilities);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch liabilities" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Handle date conversion if needed. 
        // If endDate is provided as string, we might need to convert it to ISO-8601 Date object
        if (body.endDate) {
            body.endDate = new Date(body.endDate);
        }

        const validatedData = liabilitySchema.parse({
            ...body,
            // Zod schema expects endDate to be handled? I defined it as string above?
            // Let's adjust schema to accept Date or string and transform
            endDate: body.endDate ? new Date(body.endDate).toISOString() : null
        });

        // Wait, if I parse it as string in Zod, I can't pass it to Prisma as DateTime directly if Prisma expects Date object.
        // I should refine the schema.

        const createData = {
            type: validatedData.type,
            name: validatedData.name,
            outstandingAmount: validatedData.outstandingAmount,
            interestRate: validatedData.interestRate,
            emi: validatedData.emi,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
            userId: session.user.id
        };

        const liability = await db.liability.create({
            data: createData,
        });

        return NextResponse.json(liability, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to create liability" }, { status: 500 });
    }
}
