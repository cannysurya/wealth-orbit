"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Flame, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function FireSettingsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<{
        annualExpenses: number;
        inflationRate: number;
        safeWithdrawalRate: number;
        currentAge: number;
        maxAge: number | string;
    }>({
        annualExpenses: 0,
        inflationRate: 6.0,
        safeWithdrawalRate: 4.0,
        currentAge: 25,
        maxAge: 100
    });

    const { data: settings, isLoading } = useQuery({
        queryKey: ["fireSettings"],
        queryFn: async () => {
            const res = await fetch("/api/fire");
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        }
    });

    useEffect(() => {
        if (settings && Object.keys(settings).length > 0) {
            setFormData({
                annualExpenses: settings.annualExpenses || 0,
                inflationRate: settings.inflationRate || 6.0,
                safeWithdrawalRate: settings.safeWithdrawalRate || 4.0,
                currentAge: settings.currentAge || 25,
                maxAge: settings.maxAge || 100
            });
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                maxAge: data.maxAge === "" ? 100 : Number(data.maxAge)
            };
            const res = await fetch("/api/fire", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to save settings");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fireSettings"] });
            toast.success("FIRE settings saved successfully");
            router.refresh();
        },
        onError: () => {
            toast.error("Failed to save settings");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    const fireNumber = formData.annualExpenses * (100 / formData.safeWithdrawalRate);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                    <Flame className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">FIRE Analysis</h1>
                    <p className="text-muted-foreground">Plan your Financial Independence and Retire Early journey.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Update your parameters to calculate your FIRE number.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Annual Expenses (Today's Value)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        value={formData.annualExpenses}
                                        onChange={(e) => setFormData({ ...formData, annualExpenses: parseFloat(e.target.value) || 0 })}
                                        className="pl-8"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Include rent, food, travel, insurance, etc.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Current Age</Label>
                                <Input
                                    type="number"
                                    value={formData.currentAge}
                                    onChange={(e) => setFormData({ ...formData, currentAge: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Inflation Rate ({formData.inflationRate}%)</Label>
                                </div>
                                <Slider
                                    value={[formData.inflationRate]}
                                    min={2}
                                    max={12}
                                    step={0.5}
                                    onValueChange={(val) => setFormData({ ...formData, inflationRate: val[0] })}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Life Expectancy (Max Age)</Label>
                                <Input
                                    type="number"
                                    value={formData.maxAge}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, maxAge: val === "" ? "" : parseInt(val) });
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">Used to calculate if your savings will last until this age.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Safe Withdrawal Rate ({formData.safeWithdrawalRate}%)</Label>
                                </div>
                                <Slider
                                    value={[formData.safeWithdrawalRate]}
                                    min={2}
                                    max={6}
                                    step={0.1}
                                    onValueChange={(val) => setFormData({ ...formData, safeWithdrawalRate: val[0] })}
                                    className="py-2"
                                />
                                <p className="text-xs text-muted-foreground">Standard is 4% (Rule of 25). Conservative is 3%.</p>
                            </div>

                            <Button type="submit" className="w-full" disabled={mutation.isPending}>
                                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Settings
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="glass-card border-orange-500/20 bg-orange-500/5">
                        <CardHeader>
                            <CardTitle className="text-orange-500">Your FIRE Number</CardTitle>
                            <CardDescription>The amount you need to accumulate to cover expenses indefinitely.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">
                                ₹{(fireNumber / 10000000).toFixed(2)} Cr
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                = ₹{formData.annualExpenses.toLocaleString()} / {formData.safeWithdrawalRate}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>What is FIRE?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                <strong className="text-foreground">Financial Independence, Retire Early (FIRE)</strong> is a movement dedicated to extreme savings and investment that allows you to retire far earlier than traditional budgets permit.
                            </p>
                            <p>
                                The core concept is that once your net worth is <strong>25x your annual expenses</strong> (assuming a 4% withdrawal rate), your investments can generate enough passive income to cover your living costs forever.
                            </p>
                            <p>
                                Use this tool to track your progress towards this number based on your actual assets and projected growth.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
