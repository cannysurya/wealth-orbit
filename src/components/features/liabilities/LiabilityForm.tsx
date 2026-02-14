"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
    name: z.string().min(2, "Name must be at least 2 characters."),
    type: z.string().min(1, "Please select a liability type."),
    outstandingAmount: z.coerce.number().min(0, "Amount must be positive"),
    interestRate: z.coerce.number().min(0, "Rate must be positive").max(100, "Rate too high"),
    emi: z.coerce.number().min(0, "EMI must be positive"),
    endDate: z.string().optional(), // YYYY-MM-DD
});

interface LiabilityFormProps {
    initialData?: any;
    trigger?: React.ReactNode;
}

export function LiabilityForm({ initialData, trigger }: LiabilityFormProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            type: "",
            outstandingAmount: 0,
            interestRate: 8.5,
            emi: 0,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                // Ensure date is in YYYY-MM-DD format for input type="date"
                let formattedDate = "";
                if (initialData.endDate) {
                    try {
                        formattedDate = new Date(initialData.endDate).toISOString().split('T')[0];
                    } catch (e) { /* ignore */ }
                }

                form.reset({
                    name: initialData.name,
                    type: initialData.type,
                    outstandingAmount: initialData.outstandingAmount,
                    interestRate: initialData.interestRate,
                    emi: initialData.emi,
                    endDate: formattedDate,
                });
            } else {
                form.reset({
                    name: "",
                    type: "",
                    outstandingAmount: 0,
                    interestRate: 8.5,
                    emi: 0,
                    endDate: "",
                });
            }
        }
    }, [open, initialData, form]);


    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const url = isEditing ? `/api/liabilities/${initialData.id}` : "/api/liabilities";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error(isEditing ? "Failed to update liability" : "Failed to create liability");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
            setOpen(false);
            if (!isEditing) form.reset();
            toast.success(isEditing ? "Liability updated successfully" : "Liability added successfully");
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
                    <Button className="gap-2" variant="destructive">
                        <Plus className="h-4 w-4" /> Add Liability
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass bg-background/80 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Liability" : "Add New Liability"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your liability details." : "Track loans, credit card debt, or other liabilities."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Liability Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Home Loan (HDFC)" {...field} />
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
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="HOME_LOAN">Home Loan</SelectItem>
                                            <SelectItem value="CAR_LOAN">Car Loan</SelectItem>
                                            <SelectItem value="PERSONAL_LOAN">Personal Loan</SelectItem>
                                            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                                            <SelectItem value="EDUCATION_LOAN">Education Loan</SelectItem>
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
                                name="outstandingAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Outstanding (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="interestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interest Rate (%)</FormLabel>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="emi"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly EMI (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expected End Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">Optional</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending} variant="destructive">
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Update Liability" : "Add Liability"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
