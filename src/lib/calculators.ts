export interface ProjectionPoint {
    year: number;
    age: number; // calculated if dob provided, else index
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    eventCost: number; // Tracks net flow from modifications this year
    eventName?: string;
}

export interface Modification {
    amount: number;
    date: string | Date;
    note?: string;
}

export interface Asset {
    id?: string; // Optional for new assets not yet saved
    name: string;
    returnRate: number; // %
    investedAmount: number;
    interestType?: string; // SIMPLE or COMPOUND
    modifications?: Modification[];
}

export interface Liability {
    id?: string;
    name: string;
    outstandingAmount: number;
    interestRate: number; // %
    emi: number;
    endDate?: string | Date | null;
    modifications?: Modification[];
}

export function calculateProjections(
    assets: Asset[],
    liabilities: Liability[],
    yearsToProject: number = 20,
    startYear: number = new Date().getFullYear()
): ProjectionPoint[] {
    let projections: ProjectionPoint[] = [];

    // Initialize Current State
    let currentAssets = assets.map(a => ({
        ...a,
        currentValue: a.investedAmount
    }));
    let currentLiabilities = liabilities.map(l => ({
        ...l,
        currentOutstanding: l.outstandingAmount
    }));

    for (let i = 0; i <= yearsToProject; i++) {
        const currentYear = startYear + i;
        let yearlyEventCost = 0; // Tracks net money flow (Withdrawals = +cost, Injections = -cost logic from before? No, let's just track Net Change)
        // Actually, "eventCost" in the chart red/green dots was useful.
        // Let's repurpose it:
        // +ve = Expenses/Withdrawals/Payments (Money Leaving)
        // -ve = Income/Injections (Money Entering)
        // Wait, for consistent graph:
        // Income/Injection -> Green Dot
        // Expense/Withdrawal -> Red Dot

        let significantEvents: string[] = [];

        // 1. Process Asset Modifications & Growth
        currentAssets = currentAssets.map(asset => {
            let val = asset.currentValue;

            // A. Apply Modifications for this year
            if (asset.modifications) {
                const yearMods = asset.modifications.filter(m => new Date(m.date).getFullYear() === currentYear);
                yearMods.forEach(m => {
                    // m.amount > 0 = Investment (Add to value)
                    // m.amount < 0 = Withdrawal (Subtract from value)

                    val += m.amount;

                    // Track for Chart
                    if (m.amount > 0) {
                        yearlyEventCost -= m.amount; // Injections are "Negative Cost" (Income)
                        significantEvents.push(`${asset.name}: +${Math.round(m.amount)}`);
                    } else {
                        yearlyEventCost += Math.abs(m.amount); // Withdrawals are "Positive Cost" (Expense)
                        significantEvents.push(`${asset.name}: -${Math.round(Math.abs(m.amount))}`);
                    }
                });
            }

            // B. Apply Growth (only if not year 0, OR if we decide year 0 gets no growth but just initial state)
            // Usually Year 0 is "Today". Growth starts from Year 1.
            if (i > 0) {
                if (asset.interestType === "SIMPLE") {
                    // Simple Interest on original Principal ONLY? 
                    // Or on (Principal + Injections)? 
                    // Converting Simple Interest to handle dynamic injections is tricky. 
                    // Let's assume Simple Interest only applies to the *Invested Amount* tracked separately, 
                    // and modifications just add/subtract from the 'Principle' bucket effectively.
                    // For simplicity in this complex view, let's treat injections as adding to the principal base.
                    const annualGain = val * (asset.returnRate / 100);
                    val += annualGain;
                } else {
                    // Compound
                    val = val * (1 + asset.returnRate / 100);
                }
            }

            return { ...asset, currentValue: val };
        });

        // 2. Process Liability Modifications & Amortization
        currentLiabilities = currentLiabilities.map(liability => {
            let balance = liability.currentOutstanding;

            // A. Apply Modifications (Lump Sum Payments)
            if (liability.modifications) {
                const yearMods = liability.modifications.filter(m => new Date(m.date).getFullYear() === currentYear);
                yearMods.forEach(m => {
                    // m.amount is always positive in DB (payment)
                    balance -= m.amount;

                    // Track for Chart (Payment = Expense/Red Dot -> CHANGED to Green/Positive Impact)
                    yearlyEventCost -= m.amount;
                    significantEvents.push(`${liability.name}: Paid ${Math.round(m.amount)}`);
                });
            }

            if (balance < 0) balance = 0;

            // B. Apply Interest & EMI (Amortization)
            if (i > 0 && balance > 0) {
                const annualRate = liability.interestRate / 100;
                const interest = balance * annualRate;
                const principalRepayment = (liability.emi * 12) - interest;

                // If EMI < Interest, debt grows.
                balance = balance - principalRepayment;
            }

            if (balance < 0) balance = 0;

            return { ...liability, currentOutstanding: balance };
        });

        const totalAssetValue = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);
        const totalLiabilityValue = currentLiabilities.reduce((sum, l) => sum + l.currentOutstanding, 0);

        projections.push({
            year: currentYear,
            age: 0,
            totalAssets: Math.round(totalAssetValue),
            totalLiabilities: Math.round(totalLiabilityValue),
            netWorth: Math.round(totalAssetValue - totalLiabilityValue),
            eventCost: Math.round(yearlyEventCost),
            eventName: significantEvents.slice(0, 3).join(", ") + (significantEvents.length > 3 ? "..." : "")
        });
    }

    return projections;
}
