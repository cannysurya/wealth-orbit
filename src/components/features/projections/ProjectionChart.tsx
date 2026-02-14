"use client";

import { useMemo } from "react";
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
import { calculateProjections, Asset, Liability, LifeEvent, ProjectionPoint } from "@/lib/calculators";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectionChartProps {
    assets: any[];
    liabilities: any[];
    events: any[];
}

export function ProjectionChart({ assets, liabilities, events }: ProjectionChartProps) {
    const data = useMemo(() => {
        if (!assets || !liabilities || !events) return [];

        // Map DB objects to Calculator interfaces
        const calcAssets: Asset[] = assets.map((a: any) => ({
            currentValue: a.currentValue,
            returnRate: a.returnRate,
            investedAmount: a.investedAmount
        }));

        const calcLiabilities: Liability[] = liabilities.map((l: any) => ({
            outstandingAmount: l.outstandingAmount,
            interestRate: l.interestRate,
            emi: l.emi,
            endDate: l.endDate
        }));

        const calcEvents: LifeEvent[] = events.map((e: any) => ({
            name: e.name,
            cost: e.cost,
            date: e.date
        }));

        return calculateProjections(calcAssets, calcLiabilities, calcEvents, 20);
    }, [assets, liabilities, events]);

    if (!data.length) return <div>No data to project</div>;

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        return `₹${value.toLocaleString()}`;
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Worth (20Y)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data[data.length - 1].netWorth)}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Assets (20Y)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(data[data.length - 1].totalAssets)}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Debt Free By</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {data.find(d => d.totalLiabilities <= 0)?.year || "20+ Years"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="h-[400px] w-full glass-card p-4 rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.65 0.15 190)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="oklch(0.65 0.15 190)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
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
                                    const point = payload[0].payload as ProjectionPoint;
                                    return (
                                        <div className="glass bg-background/95 p-3 rounded-lg border border-border shadow-xl text-xs">
                                            <p className="font-bold mb-2 text-base">{label}</p>
                                            <div className="space-y-1">
                                                <p className="text-primary">Net Worth: {formatCurrency(point.netWorth)}</p>
                                                <p className="text-green-500">Assets: {formatCurrency(point.totalAssets)}</p>
                                                <p className="text-destructive">Liabilities: {formatCurrency(point.totalLiabilities)}</p>
                                                {point.eventCost > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-border">
                                                        <p className="font-semibold text-yellow-500">Event: {point.eventName}</p>
                                                        <p className="text-yellow-500">- {formatCurrency(point.eventCost)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="netWorth"
                            stroke="oklch(0.65 0.15 190)"
                            fillOpacity={1}
                            fill="url(#colorNetWorth)"
                            name="Net Worth"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="totalLiabilities"
                            stroke="#ef4444"
                            fillOpacity={0.1}
                            fill="#ef4444"
                            name="Liabilities"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
