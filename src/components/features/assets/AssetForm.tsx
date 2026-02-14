"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    type: z.string({
        required_error: "Please select an asset type.",
    }),
    investedAmount: z.coerce.number().min(0, "Amount must be positive"),
    currentValue: z.coerce.number().min(0, "Value must be positive"),
    returnRate: z.coerce.number().min(0, "Rate must be positive").max(100, "Rate too high").default(10), // CAGR
});

export function AssetForm() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            investedAmount: 0,
            currentValue: 0,
            returnRate: 10,
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const response = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to create asset");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            setOpen(false);
            form.reset();
            toast.success("Asset added successfully");
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass bg-background/80 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription>
                        Track a new investment or asset here.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asset Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. HDFC Bank Stock" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select asset type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="STOCK">Stock / Equity</SelectItem>
                                            <SelectItem value="MF">Mutual Fund</SelectItem>
                                            <SelectItem value="FD">Fixed Deposit</SelectItem>
                                            <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                                            <SelectItem value="GOLD">Gold</SelectItem>
                                            <SelectItem value="CRYPTO">Crypto</SelectItem>
                                            <SelectItem value="PF">EPF / PPF</SelectItem>
                                            <SelectItem value="CASH_BANK">Cash / Bank</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="investedAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invested (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currentValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Value (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="returnRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expected Return (CAGR %)</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Input type="number" step="0.1" {...field} />
                                            <span className="text-muted-foreground text-sm">%</span>
                                        </div>
                                    </FormControl>
                                    <FormDescription>Used for future projections.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Asset
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
