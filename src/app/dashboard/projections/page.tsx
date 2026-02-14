"use client";

import { useQuery } from "@tanstack/react-query";
import { ProjectionChart } from "@/components/features/projections/ProjectionChart";
import { Loader2 } from "lucide-react";

export default function ProjectionsPage() {
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

    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const res = await fetch("/api/events");
            if (!res.ok) throw new Error("Failed to fetch events");
            return res.json();
        },
    });

    if (assetsLoading || liabilitiesLoading || eventsLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Future & Projections</h1>
                <p className="text-muted-foreground">See how your wealth grows over time.</p>
            </div>

            <ProjectionChart
                assets={assets || []}
                liabilities={liabilities || []}
                events={events || []}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="font-semibold mb-2">Assumptions</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Asset growth is compounded annually based on your inputs.</li>
                        <li>Liabilities are amortized monthly with interest.</li>
                        <li>Life Events serve as cash outflows in their respective years.</li>
                        <li>Inflation is not yet adjusted (Nominal Value).</li>
                    </ul>
                </div>
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="font-semibold mb-2">Tip</h3>
                    <p className="text-sm text-muted-foreground">
                        Try adding more high-growth assets or reducing liability interest rates to see how your Net Worth curve improves!
                    </p>
                </div>
            </div>
        </div>
    );
}
