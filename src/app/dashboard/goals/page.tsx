
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Target, BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateProjections } from "@/lib/calculators";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function GoalsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Data for Analysis
    const { data: assets } = useQuery({ queryKey: ["assets"], queryFn: () => fetch("/api/assets").then(r => r.json()) });
    const { data: liabilities } = useQuery({ queryKey: ["liabilities"], queryFn: () => fetch("/api/liabilities").then(r => r.json()) });
    const { data: goals, isLoading: goalsLoading } = useQuery({ queryKey: ["goals"], queryFn: () => fetch("/api/goals").then(r => r.json()) });

    // Calculate Projections locally for instant feedback
    const projections = (assets && liabilities) ? calculateProjections(assets, liabilities) : [];

    // Fetch AI Insights
    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ["insights", assets, liabilities, goals],
        queryFn: async () => {
            if (!assets || !liabilities || !goals) return null;
            const res = await fetch("/api/ai/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assets, liabilities, goals, projections })
            });
            if (!res.ok) throw new Error("Failed to fetch insights");
            return res.json();
        },
        enabled: !!assets && !!liabilities && !!goals
    });

    const createGoalMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create goal");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            setIsDialogOpen(false);
            toast.success("Goal created successfully!");
        },
        onError: () => toast.error("Failed to create goal"),
    });

    const deleteGoalMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete goal");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            toast.success("Goal deleted successfully");
        },
        onError: () => toast.error("Failed to delete goal"),
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createGoalMutation.mutate({
            name: formData.get("name"),
            targetAmount: parseFloat(formData.get("targetAmount") as string),
            targetDate: formData.get("targetDate"),
            currentAmount: parseFloat(formData.get("currentAmount") as string) || 0,
        });
    };

    if (goalsLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Smart Planning</h2>
                    <p className="text-muted-foreground mt-1">AI-driven financial strategy & goal tracking.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Add Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set a Financial Goal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Goal Name</Label>
                                <Input id="name" name="name" placeholder="e.g. Dream House" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                                <Input id="targetAmount" name="targetAmount" type="number" step="1000" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currentAmount">Current Savings (Optional)</Label>
                                <Input id="currentAmount" name="currentAmount" type="number" step="1000" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetDate">Target Date</Label>
                                <Input id="targetDate" name="targetDate" type="date" required />
                            </div>
                            <Button type="submit" className="w-full" disabled={createGoalMutation.isPending}>
                                {createGoalMutation.isPending ? "Creating..." : "Save Goal"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* AI Insights Section */}
            {goals && goals.length > 0 && (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Health Score Card */}
                    <Card className="md:col-span-1 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-primary" /> Financial Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-6">
                            {insightsLoading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            ) : insights ? (
                                <>
                                    <div className="relative flex items-center justify-center w-32 h-32">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={351.86} strokeDashoffset={351.86 - (351.86 * insights.score) / 100} className={cn("text-primary transition-all duration-1000 ease-out", insights.score < 50 ? "text-red-500" : insights.score < 80 ? "text-yellow-500" : "text-green-500")} strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-3xl font-bold">{insights.score}</span>
                                            <span className="text-xs text-muted-foreground uppercase">Score</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-center text-sm text-muted-foreground">
                                        {insights.score >= 80 ? "Excellent! You are mastering your finances." : insights.score >= 50 ? "Good start, but room for optimization." : "Attention needed. Review recommendations below."}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Add data to view score</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recommendations Panel */}
                    <Card className="md:col-span-2 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl">Strategy & Recommendations</CardTitle>
                            <CardDescription>Actionable steps to improve your wealth trajectory.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {insightsLoading ? (
                                <div className="space-y-3">
                                    <div className="h-16 w-full bg-secondary/30 animate-pulse rounded-lg" />
                                    <div className="h-16 w-full bg-secondary/30 animate-pulse rounded-lg" />
                                </div>
                            ) : insights?.recommendations?.length > 0 ? (
                                insights.recommendations.map((rec: any, i: number) => (
                                    <div key={i} className={cn("p-4 rounded-lg border border-l-4 transition-all hover:bg-secondary/20",
                                        rec.type === "CRITICAL" ? "bg-red-500/10 border-red-500 border-l-red-500" :
                                            rec.type === "WARNING" ? "bg-yellow-500/10 border-yellow-500 border-l-yellow-500" :
                                                rec.type === "OPPORTUNITY" ? "bg-blue-500/10 border-blue-500 border-l-blue-500" :
                                                    rec.type === "STRATEGY" ? "bg-purple-500/10 border-purple-500 border-l-purple-500" :
                                                        "bg-green-500/10 border-green-500 border-l-green-500"
                                    )}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h4 className={cn("font-semibold text-sm flex items-center gap-2",
                                                    rec.type === "CRITICAL" ? "text-red-500" :
                                                        rec.type === "WARNING" ? "text-yellow-500" :
                                                            rec.type === "OPPORTUNITY" ? "text-blue-500" :
                                                                rec.type === "STRATEGY" ? "text-purple-500" :
                                                                    "text-green-500"
                                                )}>
                                                    {rec.type === "CRITICAL" && <AlertTriangle className="w-4 h-4" />}
                                                    {rec.type === "WARNING" && <AlertTriangle className="w-4 h-4" />}
                                                    {rec.type === "OPPORTUNITY" && <TrendingUp className="w-4 h-4" />}
                                                    {rec.type === "STRATEGY" && <Target className="w-4 h-4" />}
                                                    {rec.type === "INFO" && <CheckCircle2 className="w-4 h-4" />}
                                                    {rec.title}
                                                </h4>
                                                <p className="text-sm mt-1 text-foreground/90">{rec.message}</p>
                                            </div>
                                        </div>
                                        {rec.action && (
                                            <div className="mt-3 pt-3 border-t border-border/10 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <ArrowRight className="w-3 h-3" />
                                                Action: <span className="text-foreground">{rec.action}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No immediate actions needed. You are doing great!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Goals Grid */}
            <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Your Goals
            </h3>

            {goals && goals.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-card/50">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No goals set yet</h3>
                    <p className="text-muted-foreground mb-4">Start planning your future by adding a financial goal.</p>
                    <Button onClick={() => setIsDialogOpen(true)} variant="outline">Create First Goal</Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {goals?.map((goal: any) => {
                        const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                        // Use AI status if available
                        const status = insights?.goalAnalysis?.find((g: any) => g.name === goal.name)?.status;

                        return (
                            <Card key={goal.id} className={cn("group hover:border-primary/50 transition-all duration-300",
                                status === "AT_RISK" ? "border-red-500/30 bg-red-500/5" :
                                    status === "FAILED" ? "border-red-500/50 bg-red-500/10" : ""
                            )}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                                            <CardDescription className="text-xs mt-1">
                                                Target: {new Date(goal.targetDate).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to delete this goal?")) {
                                                        deleteGoalMutation.mutate(goal.id);
                                                    }
                                                }}
                                                disabled={deleteGoalMutation.isPending}
                                            >
                                                {deleteGoalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </Button>
                                            <div className={cn("p-2 rounded-full", status === "AT_RISK" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary")}>
                                                <Target className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>{formatCurrency(goal.currentAmount)}</span>
                                        <span className="text-muted-foreground">of {formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                    <Progress value={progress} className={cn("h-2", status === "AT_RISK" ? "bg-red-950" : "")} />
                                    <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
                                        {status === "AT_RISK" ? (
                                            <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Projected to fail</span>
                                        ) : (
                                            <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> On Track</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
