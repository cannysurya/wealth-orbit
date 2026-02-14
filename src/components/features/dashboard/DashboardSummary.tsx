"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { Loader2 } from "lucide-react";

export function DashboardSummary() {
    const { data: assets, isLoading: assetsLoading } = useQuery({
        queryKey: ["assets"],
        queryFn: async () => (await fetch("/api/assets")).json(),
    });

    const { data: liabilities, isLoading: liabilitiesLoading } = useQuery({
        queryKey: ["liabilities"],
        queryFn: async () => (await fetch("/api/liabilities")).json(),
    });

    if (assetsLoading || liabilitiesLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const totalAssets = assets?.reduce((sum: number, a: any) => sum + a.currentValue, 0) || 0;
    const totalLiabilities = liabilities?.reduce((sum: number, l: any) => sum + l.outstandingAmount, 0) || 0;
    const netWorth = totalAssets - totalLiabilities;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet className="w-24 h-24" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
                <div className="mt-2 text-3xl font-bold text-primary flex items-baseline gap-2">
                    {formatCurrency(totalAssets)}
                    <span className="text-xs text-green-500 flex items-center bg-green-500/10 px-1 rounded-sm">
                        <ArrowUpRight className="w-3 h-3" /> Growth
                    </span>
                </div>
            </div>

            <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CreditCard className="w-24 h-24 text-destructive" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Liabilities</h3>
                <div className="mt-2 text-3xl font-bold text-destructive flex items-baseline gap-2">
                    {formatCurrency(totalLiabilities)}
                    <span className="text-xs text-red-500 flex items-center bg-red-500/10 px-1 rounded-sm">
                        <ArrowDownRight className="w-3 h-3" /> Debt
                    </span>
                </div>
            </div>

            <div className="glass-card rounded-xl p-6 relative overflow-hidden group bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-24 h-24 text-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Net Worth</h3>
                <div className="mt-2 text-3xl font-bold text-foreground">
                    {formatCurrency(netWorth)}
                </div>
            </div>
        </div>
    );
}
