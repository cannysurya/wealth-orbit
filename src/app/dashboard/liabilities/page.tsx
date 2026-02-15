import { LiabilityForm } from "@/components/features/liabilities/LiabilityForm";
import { LiabilityTable } from "@/components/features/liabilities/LiabilityTable";

export default function LiabilitiesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Liabilities</h1>
                    <p className="text-muted-foreground hidden md:block">Track your debts and plan your freedom.</p>
                </div>
                <LiabilityForm />
            </div>

            <div className="grid gap-6">
                <div className="glass-card rounded-xl p-1">
                    <LiabilityTable />
                </div>
            </div>
        </div>
    );
}
