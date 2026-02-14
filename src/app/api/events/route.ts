import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const eventSchema = z.object({
    name: z.string().min(1, "Name is required"),
    cost: z.number().min(0),
    date: z.string(), // YYYY-MM-DD
});

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const events = await db.lifeEvent.findMany({
            where: { userId: session.user.id },
            orderBy: { date: "asc" },
        });
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedData = eventSchema.parse(body);

        const event = await db.lifeEvent.create({
            data: {
                name: validatedData.name,
                cost: validatedData.cost,
                date: new Date(validatedData.date),
                userId: session.user.id,
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
