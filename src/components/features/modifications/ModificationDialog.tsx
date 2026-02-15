"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Plus, Minus, History } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Modification {
    id: string;
    amount: number;
    date: string | Date;
    note?: string;
}

interface ModificationDialogProps {
    type: "asset" | "liability";
    itemId: string;
    itemName: string;
    existingModifications?: Modification[]; // Passed from parent (Table) which fetches it
    trigger?: React.ReactNode;
}

export function ModificationDialog({ type, itemId, itemName, existingModifications = [], trigger }: ModificationDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [note, setNote] = useState("");
    const [mode, setMode] = useState<"add" | "subtract">("add"); // For Assets: Add = Invest, Subtract = Withdraw. Liability: Always "pay" (reduce)

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: async (data: { amount: number; date: string; note: string }) => {
            const endpoint = type === "asset"
                ? `/api/assets/${itemId}/modifications`
                : `/api/liabilities/${itemId}/modifications`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save modification");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [type === "asset" ? "assets" : "liabilities"] });
            toast.success("Modification saved successfully");
            setOpen(false);
            setAmount("");
            setNote("");
            setDate(format(new Date(), "yyyy-MM-dd"));
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !date) return;

        let finalAmount = parseFloat(amount);
        if (type === "asset" && mode === "subtract") {
            finalAmount = -finalAmount;
        }
        // Liability modifications are always positive in API (reduces debt), logic handled in calculator

        createMutation.mutate({
            amount: finalAmount,
            date,
            note,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-card border-white/10">
                <DialogHeader>
                    <DialogTitle>{type === "asset" ? "Manage Asset" : "Manage Liability"}: {itemName}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="new" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                        <TabsTrigger value="new">Add Transaction</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="new" className="space-y-4 pt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {type === "asset" && (
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={mode === "add" ? "default" : "outline"}
                                        className={cn("flex-1", mode === "add" && "bg-green-600 hover:bg-green-700")}
                                        onClick={() => setMode("add")}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Invest
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={mode === "subtract" ? "default" : "outline"}
                                        className={cn("flex-1", mode === "subtract" && "bg-red-600 hover:bg-red-700")}
                                        onClick={() => setMode("subtract")}
                                    >
                                        <Minus className="w-4 h-4 mr-2" /> Withdraw
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note">Note (Optional)</Label>
                                <Input
                                    id="note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={type === "asset" ? "Annual Bonus" : "Part Payment"}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending && <CalendarIcon className="mr-2 h-4 w-4 animate-spin" />}
                                {type === "asset"
                                    ? (mode === "add" ? "Add Investment" : "Withdraw Funds")
                                    : "Record Payment"
                                }
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="history" className="pt-4">
                        {existingModifications.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {existingModifications
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((mod) => (
                                        <div key={mod.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 border border-white/5">
                                            <div>
                                                <p className="font-medium text-sm">{mod.note || "Transaction"}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(mod.date), "dd MMM yyyy")}</p>
                                            </div>
                                            <div className={cn("font-bold",
                                                mod.amount > 0 ? "text-green-500" : "text-red-500"
                                            )}>
                                                {mod.amount > 0 ? "+" : ""}
                                                {mod.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
