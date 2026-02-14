export interface ProjectionPoint {
    year: number;
    age: number; // calculated if dob provided, else index
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    eventCost: number; // if any event happens this year
    eventName?: string;
}

export interface Asset {
    currentValue: number;
    returnRate: number; // %
    investedAmount?: number;
}

export interface Liability {
    outstandingAmount: number;
    interestRate: number; // %
    emi: number;
    endDate?: string | Date | null;
}

export interface LifeEvent {
    name: string;
    cost: number;
    date: string | Date;
}

export function calculateProjections(
    assets: Asset[],
    liabilities: Liability[],
    events: LifeEvent[],
    yearsToProject: number = 20,
    startYear: number = new Date().getFullYear()
): ProjectionPoint[] {
    let projections: ProjectionPoint[] = [];

    // Clone initial state to avoid mutation if we were doing accumulation
    // actually for simple projection we can calculate each year independantly or iteratively

    // Let's do iterative to handle "cash/assets reduction due to events"

    let currentAssets = assets.map(a => ({ ...a }));
    let currentLiabilities = liabilities.map(l => ({ ...l }));

    for (let i = 0; i <= yearsToProject; i++) {
        const currentYear = startYear + i;

        // 1. Calculate Total Assets for this year (Before events)
        // Applying growth to assets
        // If i > 0, we grow the previous year's assets
        if (i > 0) {
            currentAssets = currentAssets.map(asset => ({
                ...asset,
                currentValue: asset.currentValue * (1 + asset.returnRate / 100)
            }));
        }

        // 2. Calculate Liabilities (Amortization)
        // Simplified: Reduce outstanding by (EMI * 12) - Interest
        // Or just project loan schedule. 
        // If we simply reduce by EMI, we need to account for interest.
        // Outstanding(t) = Outstanding(t-1) * (1 + r) - EMI * 12
        if (i > 0) {
            currentLiabilities = currentLiabilities.map(liability => {
                if (liability.outstandingAmount <= 0) return liability;

                const annualRate = liability.interestRate / 100;
                const interest = liability.outstandingAmount * annualRate;
                let principalRepayment = (liability.emi * 12) - interest;

                // If EMI is too low to cover interest, debt grows (trap)
                // But assume normal loan.

                let newBalance = liability.outstandingAmount - principalRepayment;
                if (newBalance < 0) newBalance = 0;

                return { ...liability, outstandingAmount: newBalance };
            });
        }

        // 3. Handle Events
        // Check if any event happens in this year
        const yearEvents = events.filter(e => {
            const eventYear = new Date(e.date).getFullYear();
            return eventYear === currentYear;
        });

        let eventCost = 0;
        let eventNames: string[] = [];

        yearEvents.forEach(e => {
            eventCost += e.cost;
            eventNames.push(e.name);

            // Subtract cost from assets?
            // We assume we pay from assets (liquidate or cash).
            // For simplicity, we reduce proportionaly from all assets or just "Total Assets" figure?
            // Better to reduce from "currentAssets" proportionally to simulate liquidation.
            // Or specific asset type "CASH".
            // Let's reduce from total by reducing each asset by percentage?
            // Total Assets = Sum(currentAssets)
            // Ratio = (Total - Cost) / Total
            // Apply Ratio to all assets.
        });

        let totalAssetValue = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);

        if (eventCost > 0 && totalAssetValue > 0) {
            let remainingAssetValue = totalAssetValue - eventCost;
            if (remainingAssetValue < 0) remainingAssetValue = 0; // Debt trap?

            const ratio = remainingAssetValue / totalAssetValue;
            currentAssets = currentAssets.map(a => ({
                ...a,
                currentValue: a.currentValue * ratio
            }));

            totalAssetValue = remainingAssetValue;
        }

        const totalLiabilityValue = currentLiabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);

        projections.push({
            year: currentYear,
            age: 0, // Placeholder
            totalAssets: Math.round(totalAssetValue),
            totalLiabilities: Math.round(totalLiabilityValue),
            netWorth: Math.round(totalAssetValue - totalLiabilityValue),
            eventCost: Math.round(eventCost),
            eventName: eventNames.join(", ")
        });
    }

    return projections;
}
