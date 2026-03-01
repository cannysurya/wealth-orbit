"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface BreakdownPieChartProps {
    data: any[];
    title: string;
}

const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d",
    "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57", "#ffc658"
];

/**
 * @deprecated Use `BreakdownTable` instead. Kept for legacy support or future reference.
 */
export function BreakdownPieChart({ data, title }: BreakdownPieChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-center p-4 text-muted-foreground">No data available</div>;
    }

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={65}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={(props: any) => {
                            const { name, percent } = props;
                            if (percent < 0.01) return null;
                            const truncatedName = name.length > 4 ? name.substring(0, 3) + ".." : name;
                            return `${truncatedName} ${(percent * 100).toFixed(0)}%`;
                        }}
                        className="text-[10px]"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "var(--radius)",
                            color: "var(--foreground)",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        itemStyle={{ color: "var(--foreground)" }}
                        formatter={(value: any, name: any, props: any) => [formatCurrency(value), props.payload.name]}
                    />
                    <Legend
                        iconType="circle"
                        formatter={(value, entry: any) => {
                            const { payload } = entry;
                            return <span className="text-xs text-foreground ml-1">{value} ({formatCurrency(payload.value)})</span>;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
