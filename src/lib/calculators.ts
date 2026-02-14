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
    returnRate: number; // %
    investedAmount: number;
    interestType?: string; // SIMPLE or COMPOUND
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
    type?: string; // EXPENSE or INCOME
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

    // Start with investedAmount as current value
    let currentAssets = assets.map(a => ({
        ...a,
        currentValue: a.investedAmount
    }));
    let currentLiabilities = liabilities.map(l => ({ ...l }));

    for (let i = 0; i <= yearsToProject; i++) {
        const currentYear = startYear + i;

        // 1. Calculate Total Assets for this year (Before events)
        // Applying growth to assets
        // If i > 0, we grow the previous year's assets
        if (i > 0) {
            currentAssets = currentAssets.map(asset => {
                let newValue = asset.currentValue;

                if (asset.interestType === "SIMPLE") {
                    // Simple Interest: Interest is calculated on the principal (investedAmount)
                    // Gain = Principal * Rate
                    // NewValue = PreviousValue + Gain
                    const annualGain = asset.investedAmount * (asset.returnRate / 100);
                    newValue = asset.currentValue + annualGain;
                } else {
                    // Compound Interest (Default)
                    // Since this loop runs annually, we apply 1 year of growth to the accumulated value.
                    // NewValue = PreviousValue * (1 + AnnualRate)
                    // This allows us to handle correctly situations where the principal is reduced by Life Events in intermediate years.
                    newValue = asset.currentValue * (1 + asset.returnRate / 100);
                }

                return {
                    ...asset,
                    currentValue: newValue
                };
            });
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
            if (e.type === "INCOME") {
                eventCost -= e.cost; // Negative cost = Income
                eventNames.push(`${e.name} (+${Math.round(e.cost)})`);
            } else {
                eventCost += e.cost;
                eventNames.push(`${e.name} (-${Math.round(e.cost)})`);
            }
        });

        let totalAssetValue = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);

        if (eventCost !== 0) {
            let remainingAssetValue = totalAssetValue - eventCost;

            // If strictly negative remaining value, floor at 0 (debt trap scenario not fully modeled)
            if (remainingAssetValue < 0) remainingAssetValue = 0;

            if (totalAssetValue > 0) {
                const ratio = remainingAssetValue / totalAssetValue;
                currentAssets = currentAssets.map(a => ({
                    ...a,
                    currentValue: a.currentValue * ratio
                }));
                totalAssetValue = remainingAssetValue;
            }
            // Note: If totalAssetValue is 0 and we have income, 
            // strictly speaking we should add it to a new asset or a default "Savings" asset.
            // For this version, we'll accept the limitation that you need at least one asset to grow wealth.
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
