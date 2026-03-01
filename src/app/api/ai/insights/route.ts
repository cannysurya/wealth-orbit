
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// --- Helper Functions ---

function calculatePMT(rate: number, nper: number, pv: number, fv: number, type: 0 | 1 = 0) {
    // Basic PMT implementation for monthly investment needed
    // rate: monthly interest rate
    // nper: number of months
    // pv: present value (current savings)
    // fv: future value (goal amount)

    if (rate === 0) return (fv - pv) / nper;

    const pvif = Math.pow(1 + rate, nper);
    const pmt = (rate / (pvif - 1)) * -(pv * pvif + fv);
    return Math.abs(pmt); // We want the magnitude of payment
}

function analyzeGoals(goals: any[], projections: any[], totalAssets: number) {
    return goals.map((goal: any) => {
        const targetYear = new Date(goal.targetDate).getFullYear();
        const projection = projections.find((p: any) => p.year === targetYear);

        // Sanity Check: If no assets and not reached goal, you cannot be on track.
        if (totalAssets === 0 && totalAssets < goal.targetAmount) {
            const shortfall = goal.targetAmount - totalAssets;
            return {
                name: goal.name,
                status: "AT_RISK",
                message: `You have 0 assets. You need to save ₹${(shortfall / 100000).toFixed(1)}L.`,
                action: "Start investing immediately."
            };
        }

        if (!projection) return {
            name: goal.name,
            status: "UNKNOWN",
            message: "Target date is too far to predict.",
            action: null
        };

        const projectedNetWorth = projection.netWorth;
        const surplus = projectedNetWorth - goal.targetAmount;

        if (surplus >= 0) {
            return {
                name: goal.name,
                status: "ON_TRACK",
                message: `You are on track! Projected Net Worth: ₹${(projectedNetWorth / 100000).toFixed(1)}L vs Goal: ₹${(goal.targetAmount / 100000).toFixed(1)}L.`,
                action: "Maintain current investments."
            };
        } else {
            // Reverse Calc: How much extra SIP needed?
            // Assumptions: 12% annual return (0.01 monthly), remaining months
            const today = new Date();
            const targetDate = new Date(goal.targetDate);
            const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());

            if (monthsRemaining <= 0) return { name: goal.name, status: "FAILED", message: "Goal date passed.", action: "Re-evaluate goal." };

            const shortfall = Math.abs(surplus);
            // We need to bridge the 'shortfall' amount. 
            // Simplified: calculate PMT to reach the FULL goal amount, then subtract current SIP... 
            // Better: PMT to bridge the gap.
            // Using a simplified Gap / Months approach for now, or a basic PMT on the Shortfall
            const rate = 0.12 / 12; // 1% monthly
            const extraMonthlyInvestment = calculatePMT(rate, monthsRemaining, 0, -shortfall);

            return {
                name: goal.name,
                status: "AT_RISK",
                message: `You may fall short by ₹${(shortfall / 100000).toFixed(1)}L.`,
                action: `Increase monthly SIP by ₹${Math.ceil(extraMonthlyInvestment / 500) * 500} to bridge the gap.`
            };
        }
    });
}

function analyzeDebt(liabilities: any[]) {
    const highInterestDebts = liabilities.filter((l: any) => l.interestRate > 10);
    const recommendations = [];

    if (highInterestDebts.length > 0) {
        const worstDebt = highInterestDebts.sort((a: any, b: any) => b.interestRate - a.interestRate)[0];
        recommendations.push({
            type: "CRITICAL",
            title: "Debt Optimization",
            message: `Your ${worstDebt.name} has a high interest rate of ${worstDebt.interestRate}%. This is likely dragging down your wealth creation.`,
            action: "Consider prioritizing this loan payoff over equity investments."
        });
    }

    return recommendations;
}

function analyzeAllocation(assets: any[], totalLiabilities: number) {
    const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.currentValue || a.investedAmount), 0);
    if (totalAssets === 0) return [];

    const liquidAssets = assets.filter((a: any) => ["CASH_BANK", "FD"].includes(a.type))
        .reduce((sum: number, a: any) => sum + (a.currentValue || a.investedAmount), 0);

    const liquidRatio = (liquidAssets / totalAssets) * 100;
    const recommendations = [];

    // Emergency Fund Check (Roughly 5% of assets or covering liab EMIs - hard to know EMIs perfectly without user input, just assume 6 months EMI roughly)
    // Assume monthly expense = 2% of total assets (random heuristic) or just fixed amount.
    // Better: 6 months of living expenses. Let's say ₹3L min.
    if (liquidAssets < 100000) {
        recommendations.push({
            type: "WARNING",
            title: "Emergency Fund Low",
            message: `You have only ₹${(liquidAssets / 1000).toFixed(0)}k in liquid assets.`,
            action: "Build an emergency fund of at least ₹3-5 Lakhs in FD/Savings."
        });
    } else if (liquidRatio > 40) {
        recommendations.push({
            type: "OPPORTUNITY",
            title: "Too Much Cash",
            message: `You have ${liquidRatio.toFixed(0)}% of your portfolio in low-yield liquid assets.`,
            action: "Consider moving excess cash into Equity Mutual Funds for better long-term growth."
        });
    }

    return recommendations;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { assets, liabilities, goals, projections } = await req.json();

        // 1. Data Aggregation
        const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.currentValue || a.investedAmount), 0);
        const totalLiabilities = liabilities.reduce((sum: number, l: any) => sum + (l.currentOutstanding || l.outstandingAmount), 0);
        const netWorth = totalAssets - totalLiabilities;
        const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

        // 2. Multi-faceted Analysis
        const goalInsights = analyzeGoals(goals, projections, totalAssets);
        const debtInsights = analyzeDebt(liabilities);
        const allocationInsights = analyzeAllocation(assets, totalLiabilities);

        // 3. Scoring (0-100)
        let score = 100;
        if (debtRatio > 40) score -= 20;
        if (debtRatio > 60) score -= 20;
        if (goalInsights.some((g: any) => g.status === "AT_RISK")) score -= 15;
        if (goalInsights.some((g: any) => g.status === "FAILED")) score -= 10;
        if (allocationInsights.some((a: any) => a.type === "WARNING")) score -= 10;

        // 4. Consolidate Advice
        const allRecommendations = [
            ...debtInsights,
            ...allocationInsights,
            ...goalInsights.filter((g: any) => g.status !== "ON_TRACK" && g.status !== "UNKNOWN").map((g: any) => ({
                type: g.status === "AT_RISK" ? "STRATEGY" : "WARNING",
                title: `Goal Gap: ${g.name}`,
                message: g.message,
                action: g.action
            }))
        ];

        // If no "bad" news, give generic good advice
        if (allRecommendations.length === 0) {
            if (totalAssets === 0 && totalLiabilities === 0 && goalInsights.length === 0) {
                allRecommendations.push({
                    type: "INFO",
                    title: "Start Your Journey",
                    message: "You haven't added any financial data yet. Add Assets or Goals to get personalized insights.",
                    action: "Add your first Asset"
                });
                score = 50; // Neutral score for new users
            } else {
                allRecommendations.push({
                    type: "INFO",
                    title: "Keep it up!",
                    message: "Your financial health is excellent. You are on track for all goals.",
                    action: "Review your portfolio quarterly."
                });
            }
        }

        const insight = {
            score: Math.max(0, score),
            netWorth,
            goalAnalysis: goalInsights,
            recommendations: allRecommendations
        };

        return NextResponse.json(insight);

    } catch (error) {
        console.error("Error generating insights:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
