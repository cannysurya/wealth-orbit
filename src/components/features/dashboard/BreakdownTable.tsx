"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BreakdownItem {
    id: string;
    name: string;
    type: string;
    investedAmount?: number;
    outstandingAmount?: number;
}

interface BreakdownTableProps {
    items: BreakdownItem[];
}

const COLORS = [
    "#c084fc", // Purple
    "#38bdf8", // Light Blue
    "#94a3b8", // Gray
    "#67e8f9", // Cyan
    "#f472b6", // Pink
    "#86efac", // Light Green
    "#fcd34d", // Yellow
    "#fdba74", // Orange
    "#818cf8", // Indigo
    "#fca5a5", // Red
];

type SortKey = "weight" | "value";
type SortDirection = "asc" | "desc";

export function BreakdownTable({ items }: BreakdownTableProps) {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    if (!items || items.length === 0) {
        return <div className="text-center p-4 text-muted-foreground">No data available</div>;
    }

    // Determine value key based on first item
    const valueKey = "investedAmount" in items[0] && items[0].investedAmount !== undefined ? "investedAmount" : "outstandingAmount";

    // Calculate total value
    const totalValue = items.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);

    // Group items by type
    const groupedItems = items.reduce((acc, item) => {
        const type = item.type || "Other";
        if (!acc[type]) acc[type] = { name: type, value: 0, items: [] };
        acc[type].value += Number(item[valueKey]) || 0;
        acc[type].items.push(item);
        return acc;
    }, {} as Record<string, { name: string; value: number; items: BreakdownItem[] }>);

    // Calculate percentages for progress bar (needed before sorting by weight)
    let processedCategories = Object.values(groupedItems).map((category, index) => ({
        ...category,
        percentage: totalValue > 0 ? (category.value / totalValue) * 100 : 0,
        color: COLORS[index % COLORS.length]
    }));

    // Apply sorting
    if (sortConfig) {
        processedCategories.sort((a, b) => {
            const aVal = sortConfig.key === "value" ? a.value : a.percentage;
            const bVal = sortConfig.key === "value" ? b.value : b.percentage;

            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    } else {
        // Default sort (by value descending)
        processedCategories.sort((a, b) => b.value - a.value);
    }

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = "desc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="w-full flex gap-4 mt-2">
            <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col gap-3 w-full">
                    <div className="flex justify-between items-center text-sm mb-1 px-1">
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground w-full">
                            {processedCategories.map(cat => (
                                <div key={cat.name} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                    <span>{cat.name} <span className="text-foreground ml-1">{(cat.percentage < 0.1 ? 0 : cat.percentage).toFixed(0)}%</span></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Segmented Progress Bar */}
                    <div className="h-2 w-full flex rounded-full overflow-hidden bg-secondary">
                        {processedCategories.map(cat => (
                            <div
                                key={`segment-${cat.name}`}
                                style={{
                                    width: `${cat.percentage}%`,
                                    backgroundColor: cat.color,
                                    borderRight: '2px solid var(--background)'
                                }}
                                title={`${cat.name}: ${cat.percentage.toFixed(2)}%`}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    {/* Table Header */}
                    <div className="mt-4 border-b pb-2">
                        <div className="grid grid-cols-12 gap-4 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="col-span-5 flex items-center">Name</div>
                            <div
                                className="col-span-4 flex justify-end items-center cursor-pointer hover:text-foreground transition-colors group select-none"
                                onClick={() => handleSort("weight")}
                            >
                                Weight
                                <div className="ml-1 w-4 h-4 flex items-center justify-center opacity-50 group-hover:opacity-100 min-w-4 min-h-4">
                                    {sortConfig?.key === "weight" ? (
                                        sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    ) : null}
                                </div>
                            </div>
                            <div
                                className="col-span-3 flex justify-end items-center cursor-pointer hover:text-foreground transition-colors group select-none"
                                onClick={() => handleSort("value")}
                            >
                                Value
                                <div className="ml-1 w-4 h-4 flex items-center justify-center opacity-50 group-hover:opacity-100 min-w-4 min-h-4">
                                    {sortConfig?.key === "value" ? (
                                        sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expandable Table Rows */}
                    <div className="flex flex-col max-h-[100%] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary">
                        {processedCategories.map((category) => (
                            <div key={category.name} className="flex flex-col border-b last:border-b-0 py-1">
                                {/* Category Row */}
                                <div
                                    className="grid grid-cols-12 gap-4 px-2 py-3 hover:bg-secondary/30 cursor-pointer rounded-md transition-colors items-center group"
                                    onClick={() => toggleCategory(category.name)}
                                >
                                    <div className="col-span-5 flex items-center gap-2 text-sm text-foreground overflow-hidden">
                                        <div className="text-muted-foreground/50 group-hover:text-foreground transition-colors flex-shrink-0 flex items-center">
                                            {expandedCategories[category.name] ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                            <div className="w-2 h-2 rounded-full ml-1.5" style={{ backgroundColor: category.color }} />
                                        </div>
                                        <span className="font-medium truncate uppercase">{category.name}</span>
                                    </div>

                                    <div className="col-span-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
                                        <div className="flex-1 flex items-center justify-end max-w-[100px] opacity-70">
                                            <div className="h-1.5 rounded-full w-full bg-secondary overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${Math.max(5, category.percentage)}%`, backgroundColor: category.color }} />
                                            </div>
                                        </div>
                                        <span className="w-12 text-right text-foreground font-medium">{category.percentage.toFixed(0)}%</span>
                                    </div>

                                    <div className="col-span-3 text-right text-sm font-medium whitespace-nowrap">
                                        {formatCurrency(category.value)}
                                    </div>
                                </div>

                                {/* Expanded Items */}
                                {expandedCategories[category.name] && (
                                    <div className="flex flex-col py-1 pl-10 pr-2 bg-secondary/5 rounded-b-md mb-2">
                                        {category.items.map((item, idx) => {
                                            const itemValue = Number(item[valueKey as keyof BreakdownItem]) || 0;
                                            const itemPercentage = totalValue > 0 ? (itemValue / totalValue) * 100 : 0;

                                            return (
                                                <div key={item.id || idx} className="grid grid-cols-12 gap-4 py-2 border-b last:border-b-0 border-border/10 text-sm">
                                                    <div className="col-span-5 text-muted-foreground pl-8 truncate flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                                                        {item.name}
                                                    </div>
                                                    <div className="col-span-4 text-right text-muted-foreground/80 text-sm flex items-center justify-end">
                                                        {itemPercentage.toFixed(2)}%
                                                    </div>
                                                    <div className="col-span-3 text-right text-muted-foreground whitespace-nowrap">
                                                        {formatCurrency(itemValue)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
