"use client";

import { useState, useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    ReferenceLine,
    Legend
} from "recharts";
import { calculateProjections, Asset, Liability, ProjectionPoint } from "@/lib/calculators";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Flame, Settings2 } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useProjectionStore } from "@/store/useProjectionStore";

interface ProjectionChartProps {
    assets: any[];
    liabilities: any[];
}

export function ProjectionChart({ assets, liabilities }: ProjectionChartProps) {
    const { years: projectionYears } = useProjectionStore();
    const [visible, setVisible] = useState({
        netWorth: true,
        assets: false,
        liabilities: true,
        fireTarget: false
    });

    // Fetch FIRE Settings
    const { data: fireSettings } = useQuery({
        queryKey: ["fireSettings"],
        queryFn: async () => {
            const res = await fetch("/api/fire");
            if (!res.ok) return null;
            return res.json();
        }
    });

    const safeAssets = Array.isArray(assets) ? assets : [];
    const safeLiabilities = Array.isArray(liabilities) ? liabilities : [];

    // 1. Chart Data (Dynamic based on store years)
    const data = useMemo(() => {
        if (!safeAssets.length && !safeLiabilities.length) return [];

        // Map DB objects to Calculator interfaces
        const calcAssets: Asset[] = safeAssets.map((a: any) => ({
            name: a.name,
            currentValue: a.currentValue,
            returnRate: a.returnRate,
            investedAmount: a.investedAmount,
            interestType: a.interestType,
            modifications: a.modifications
        }));

        const calcLiabilities: Liability[] = safeLiabilities.map((l: any) => ({
            name: l.name,
            outstandingAmount: l.outstandingAmount,
            interestRate: l.interestRate,
            emi: l.emi,
            endDate: l.endDate,
            modifications: l.modifications
        }));

        return calculateProjections(calcAssets, calcLiabilities, projectionYears);
    }, [safeAssets, safeLiabilities, projectionYears]);

    // 2. FIRE Data (Fixed duration based on Max Age)
    const fireMetrics = useMemo(() => {
        if (!fireSettings || !fireSettings.annualExpenses) return null;

        const currentAge = fireSettings.currentAge || 25;
        const maxAge = fireSettings.maxAge || 100;
        const yearsToProject = Math.max(1, maxAge - currentAge);

        // Calculate long-term projections strictly for FIRE check
        const calcAssets: Asset[] = safeAssets.map((a: any) => ({
            name: a.name,
            currentValue: a.currentValue,
            returnRate: a.returnRate,
            investedAmount: a.investedAmount,
            interestType: a.interestType,
            modifications: a.modifications
        }));

        const calcLiabilities: Liability[] = safeLiabilities.map((l: any) => ({
            name: l.name,
            outstandingAmount: l.outstandingAmount,
            interestRate: l.interestRate,
            emi: l.emi,
            endDate: l.endDate,
            modifications: l.modifications
        }));

        const longTermData = calculateProjections(calcAssets, calcLiabilities, yearsToProject);

        const expenses = fireSettings.annualExpenses;
        const swr = fireSettings.safeWithdrawalRate || 4.0;
        const fireNumber = expenses * (100 / swr);
        const inflation = fireSettings.inflationRate || 6.0;
        const startYear = new Date().getFullYear();

        // Calculate Inflation Adjusted FIRE Target for each year
        const fireTargetCurve = longTermData.map(d => {
            const yearsPassed = d.year - startYear;
            const inflatedFireNumber = fireNumber * Math.pow(1 + inflation / 100, yearsPassed);
            return {
                year: d.year,
                fireTarget: inflatedFireNumber
            };
        });

        const yearReached = longTermData.find(d => {
            const yearsPassed = d.year - startYear;
            const inflatedFireNumber = fireNumber * Math.pow(1 + inflation / 100, yearsPassed);
            return d.netWorth >= inflatedFireNumber;
        });

        return {
            fireNumber,
            year: yearReached ? yearReached.year : null,
            isReached: !!yearReached,
            fireTargetCurve // Return this to use in chart if needed, or we mix it into main data
        };
    }, [safeAssets, safeLiabilities, fireSettings]);

    // Merge fireTarget into main chart data
    const chartData = useMemo(() => {
        if (!data.length || !fireMetrics?.fireTargetCurve) return data;

        return data.map(d => {
            const target = fireMetrics.fireTargetCurve.find(t => t.year === d.year);
            return {
                ...d,
                fireTarget: target ? target.fireTarget : null
            };
        });
    }, [data, fireMetrics]);

    if (!chartData.length && (!safeAssets.length && !safeLiabilities.length)) return <div>No data to project</div>;
    // Handle case where empty data but initialized arrays
    if (!chartData.length && (safeAssets.length || safeLiabilities.length)) return <div>Loading projections...</div>;


    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        return `₹${value.toLocaleString()}`;
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Worth ({projectionYears}Y)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{chartData.length > 0 ? formatCurrency(chartData[chartData.length - 1].netWorth as number) : "₹0"}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assets ({projectionYears}Y)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{chartData.length > 0 ? formatCurrency(chartData[chartData.length - 1].totalAssets as number) : "₹0"}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Debt Free By</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {chartData.find(d => (d.totalLiabilities as number) <= 0)?.year || `${projectionYears}+ Years`}
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card border-orange-500/20 bg-orange-500/5">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-orange-500">Retire By</CardTitle>
                        <Link href="/dashboard/fire">
                            <Flame className="w-4 h-4 text-orange-500 hover:text-orange-400 cursor-pointer" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">
                            {fireMetrics ? (
                                fireMetrics.year || `Never`
                            ) : (
                                <span className="text-base text-muted-foreground">Set up FIRE</span>
                            )}
                        </div>
                        {fireMetrics && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Goal: {formatCurrency(Math.round(fireMetrics.fireNumber))}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="glass-card p-4 rounded-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                    <div className="flex gap-2 text-sm text-muted-foreground">
                        <span>Projection Analysis</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <button
                                onClick={() => setVisible(prev => ({ ...prev, netWorth: !prev.netWorth }))}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${visible.netWorth ? "bg-[oklch(0.65_0.15_190)]/10 border-[oklch(0.65_0.15_190)] text-[oklch(0.65_0.15_190)] font-medium" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${visible.netWorth ? "bg-[oklch(0.65_0.15_190)]" : "bg-gray-400"}`} />
                                <span className="hidden sm:inline">Net Worth</span>
                                <span className="sm:hidden">NW</span>
                            </button>
                            <button
                                onClick={() => setVisible(prev => ({ ...prev, assets: !prev.assets }))}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${visible.assets ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 font-medium" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${visible.assets ? "bg-emerald-500" : "bg-gray-400"}`} />
                                <span className="hidden sm:inline">Assets</span>
                                <span className="sm:hidden">Ast</span>
                            </button>
                            <button
                                onClick={() => setVisible(prev => ({ ...prev, liabilities: !prev.liabilities }))}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${visible.liabilities ? "bg-red-500/10 border-red-500 text-red-500 font-medium" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${visible.liabilities ? "bg-red-500" : "bg-gray-400"}`} />
                                <span className="hidden sm:inline">Liabilities</span>
                                <span className="sm:hidden">Lbl</span>
                            </button>
                            <button
                                onClick={() => setVisible(prev => ({ ...prev, fireTarget: !prev.fireTarget }))}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${visible.fireTarget ? "bg-orange-500/10 border-orange-500 text-orange-500 font-medium" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${visible.fireTarget ? "bg-orange-500" : "bg-gray-400"}`} />
                                <span className="hidden sm:inline">FIRE Target</span>
                                <span className="sm:hidden">FIRE</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="oklch(0.65 0.15 190)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="oklch(0.65 0.15 190)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="year" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCurrency}
                            />
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const point = payload[0].payload as ProjectionPoint & { fireTarget?: number };
                                        return (
                                            <div className="glass bg-background/95 p-3 rounded-lg border border-border shadow-xl text-xs">
                                                <p className="font-bold mb-2 text-base">{label}</p>
                                                <div className="space-y-1">
                                                    <p className="text-primary">Net Worth: {formatCurrency(point.netWorth)}</p>
                                                    <p className="text-emerald-500">Assets: {formatCurrency(point.totalAssets)}</p>
                                                    <p className="text-red-500">Liabilities: {formatCurrency(point.totalLiabilities)}</p>
                                                    {point.fireTarget && (
                                                        <p className="text-orange-500 font-medium">FIRE Target: {formatCurrency(point.fireTarget)}</p>
                                                    )}
                                                    {point.eventCost !== 0 && (
                                                        <div className="mt-2 pt-2 border-t border-border">
                                                            <p className={`font-semibold ${point.eventCost < 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                                Event: {point.eventName}
                                                            </p>
                                                            <p className={point.eventCost < 0 ? "text-emerald-500" : "text-red-500"}>
                                                                {point.eventCost < 0 ? "+" : "-"} {formatCurrency(Math.abs(point.eventCost))}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            {visible.netWorth && (
                                <Area
                                    type="monotone"
                                    dataKey="netWorth"
                                    stroke="oklch(0.65 0.15 190)"
                                    fillOpacity={1}
                                    fill="url(#colorNetWorth)"
                                    name="Net Worth"
                                    strokeWidth={2}
                                    animationDuration={1000}
                                    dot={(props: any) => {
                                        const { payload } = props;
                                        if (payload.eventCost !== 0) {
                                            return (
                                                <svg
                                                    cx={props.cx}
                                                    cy={props.cy}
                                                    width={10}
                                                    height={10}
                                                    fill={payload.eventCost < 0 ? "#10b981" : "#ef4444"}
                                                    viewBox="0 0 10 10"
                                                    style={{ transform: `translate(${props.cx - 5}px, ${props.cy - 5}px)` }}
                                                >
                                                    <circle cx="5" cy="5" r="4" />
                                                </svg>
                                            );
                                        }
                                        return <></>;
                                    }}
                                />
                            )}

                            {/* FIRE Target Line */}
                            {visible.fireTarget && (
                                <Area
                                    type="monotone"
                                    dataKey="fireTarget"
                                    stroke="#f97316" // Orange-500
                                    strokeDasharray="5 5"
                                    fillOpacity={0}
                                    name="FIRE Target"
                                    strokeWidth={2}
                                    animationDuration={1000}
                                />
                            )}

                            {visible.assets && (
                                <Area
                                    type="monotone"
                                    dataKey="totalAssets"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorAssets)"
                                    name="Total Assets"
                                    strokeWidth={2}
                                    animationDuration={1000}
                                />
                            )}

                            {visible.liabilities && (
                                <Area
                                    type="monotone"
                                    dataKey="totalLiabilities"
                                    stroke="#ef4444"
                                    fillOpacity={0.1}
                                    fill="#ef4444"
                                    name="Liabilities"
                                    strokeWidth={2}
                                    animationDuration={1000}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div >
    );
}
