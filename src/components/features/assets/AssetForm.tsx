"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Edit2 } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    type: z.string().min(1, "Please select an asset type."),
    investedAmount: z.coerce.number().min(0, "Amount must be positive"),
    returnRate: z.coerce.number().min(0, "Rate must be positive").max(100, "Rate too high").default(10), // CAGR
    interestType: z.enum(["SIMPLE", "COMPOUND"]).default("COMPOUND"),
});

interface AssetFormProps {
    initialData?: any;
    trigger?: React.ReactNode;
}

export function AssetForm({ initialData, trigger }: AssetFormProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            type: "",
            investedAmount: 0,
            returnRate: 10,
            interestType: "COMPOUND",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    type: initialData.type,
                    investedAmount: initialData.investedAmount,
                    returnRate: initialData.returnRate,
                    interestType: initialData.interestType || "COMPOUND",
                });
            } else {
                form.reset({
                    name: "",
                    type: "",
                    investedAmount: 0,
                    returnRate: 10,
                    interestType: "COMPOUND",
                });
            }
        }
    }, [open, initialData, form]);

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = isEditing ? `/api/assets/${initialData.id}` : "/api/assets";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error(isEditing ? "Failed to update asset" : "Failed to create asset");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            setOpen(false);
            if (!isEditing) form.reset();
            toast.success(isEditing ? "Asset updated successfully" : "Asset added successfully");
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
                {trigger || (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Asset
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass bg-background/80 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Asset" : "Add New Asset"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your asset details." : "Track a new investment or asset here."}
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
                                name="returnRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Return Rate (%)</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" step="0.1" {...field} />
                                                <span className="text-muted-foreground text-sm">%</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="interestType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Interest Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="COMPOUND" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Compounding (CAGR)
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="SIMPLE" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Simple Interest
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Update Asset" : "Add Asset"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
