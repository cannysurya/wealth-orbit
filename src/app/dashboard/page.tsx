"use client"; // Needs client for summary or use server component for fetching

// We can just use the DashboardSummary client component
import { DashboardSummary } from "@/components/features/dashboard/DashboardSummary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectionChart } from "@/components/features/projections/ProjectionChart";
import { useQuery } from "@tanstack/react-query";

import { ProjectionYearsInput } from "@/components/ui/projection-years-input";

export default function DashboardPage() {
    // We can fetch data here too for the small chart
    const { data: assets } = useQuery({ queryKey: ["assets"], queryFn: async () => (await fetch("/api/assets")).json() });
    const { data: liabilities } = useQuery({ queryKey: ["liabilities"], queryFn: async () => (await fetch("/api/liabilities")).json() });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground hidden md:block">Overview of your financial universe.</p>
                </div>
                <div className="flex gap-2">
                    <ProjectionYearsInput />
                    <Link href="/dashboard/assets">
                        <Button>Manage Assets</Button>
                    </Link>
                </div>
            </div>

            <DashboardSummary />

            <div className="glass-card rounded-xl p-6 min-w-0">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-base">Financial Projection</h3>
                    <Link href="/dashboard/projections">
                        <Button variant="ghost" className="gap-2">View Full Analysis <ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                </div>
                <div>
                    {/* Reuse chart but maybe simplified? Or just same chart */}
                    <ProjectionChart assets={assets || []} liabilities={liabilities || []} />
                </div>
            </div>
        </div>
    );
}
