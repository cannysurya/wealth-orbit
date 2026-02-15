import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const settings = await prisma.fireSettings.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json(settings || {});
    } catch (error) {
        console.error("Error fetching FIRE settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();
        const settings = await prisma.fireSettings.upsert({
            where: { userId: session.user.id },
            update: {
                annualExpenses: parseFloat(data.annualExpenses),
                inflationRate: parseFloat(data.inflationRate),
                safeWithdrawalRate: parseFloat(data.safeWithdrawalRate),
                currentAge: parseInt(data.currentAge),
                retirementAgeGoal: parseInt(data.retirementAgeGoal),
                maxAge: parseInt(data.maxAge || "100"),
            },
            create: {
                userId: session.user.id,
                annualExpenses: parseFloat(data.annualExpenses),
                inflationRate: parseFloat(data.inflationRate),
                safeWithdrawalRate: parseFloat(data.safeWithdrawalRate),
                currentAge: parseInt(data.currentAge),
                retirementAgeGoal: parseInt(data.retirementAgeGoal),
                maxAge: parseInt(data.maxAge || "100"),
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating FIRE settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
