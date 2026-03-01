"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, CreditCard, Percent } from "lucide-react";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils"; // Using centralized utility
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BreakdownTable } from "./BreakdownTable";

export function DashboardSummary() {
    const [selectedCategory, setSelectedCategory] = useState<"assets" | "liabilities" | null>(null);

    const { data: assets, isLoading: assetsLoading } = useQuery({
        queryKey: ["assets"],
        queryFn: async () => {
            const res = await fetch("/api/assets");
            if (!res.ok) throw new Error("Failed to fetch assets");
            return res.json();
        },
    });

    const { data: liabilities, isLoading: liabilitiesLoading } = useQuery({
        queryKey: ["liabilities"],
        queryFn: async () => {
            const res = await fetch("/api/liabilities");
            if (!res.ok) throw new Error("Failed to fetch liabilities");
            return res.json();
        },
    });

    if (assetsLoading || liabilitiesLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const totalAssets = Array.isArray(assets) ? assets.reduce((sum: number, a: any) => sum + a.investedAmount, 0) : 0;
    const totalLiabilities = Array.isArray(liabilities) ? liabilities.reduce((sum: number, l: any) => sum + l.outstandingAmount, 0) : 0;
    const netWorth = totalAssets - totalLiabilities;

    // Debt to Asset Ratio
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

    let ratioColor = "text-green-500";
    let ratioText = "Healthy";
    let ratioIconColor = "text-green-500";

    if (debtToAssetRatio >= 30 && debtToAssetRatio < 60) {
        ratioColor = "text-yellow-500";
        ratioText = "Moderate";
        ratioIconColor = "text-yellow-500";
    } else if (debtToAssetRatio >= 60) {
        ratioColor = "text-red-500";
        ratioText = "High Risk";
        ratioIconColor = "text-red-500";
    }

    return (
        <>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    className="glass-card rounded-xl p-6 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedCategory("assets")}
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
                    <div className="mt-2 text-2xl font-bold text-primary flex items-baseline gap-2">
                        {formatCurrency(totalAssets)}
                    </div>
                </div>

                <div
                    className="glass-card rounded-xl p-6 relative overflow-hidden group cursor-pointer hover:border-destructive/50 transition-colors"
                    onClick={() => setSelectedCategory("liabilities")}
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard className="w-24 h-24 text-destructive" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Liabilities</h3>
                    <div className="mt-2 text-2xl font-bold text-destructive flex items-baseline gap-2">
                        {formatCurrency(totalLiabilities)}
                    </div>
                </div>

                <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Percent className={`w-24 h-24 ${ratioIconColor}`} />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">Debt-to-Asset Ratio</h3>
                    <div className={`mt-2 text-2xl font-bold ${ratioColor} flex items-baseline gap-2`}>
                        {debtToAssetRatio.toFixed(1)}%
                        <span className="text-xs text-muted-foreground">
                            {ratioText}
                        </span>
                    </div>
                </div>

                <div className="glass-card rounded-xl p-6 relative overflow-hidden group bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-foreground" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">Net Worth</h3>
                    <div className="mt-2 text-2xl font-bold text-foreground">
                        {formatCurrency(netWorth)}
                    </div>
                </div>
            </div>

            <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between pr-8">
                            <span>{selectedCategory === "assets" ? "Asset Distribution" : "Liability Distribution"}</span>
                        </DialogTitle>
                        <DialogDescription className="flex items-center justify-between pr-8">
                            Breakdown of your {selectedCategory}.
                        </DialogDescription>
                    </DialogHeader>
                    <BreakdownTable items={selectedCategory === "assets" ? assets || [] : liabilities || []} />
                </DialogContent>
            </Dialog>
        </>
    );
}
