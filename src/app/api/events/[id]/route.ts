import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const existingEvent = await db.lifeEvent.findUnique({
            where: { id },
        });

        if (!existingEvent || existingEvent.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await db.lifeEvent.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
