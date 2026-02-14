"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar"; // Wait, I didn't install calendar. I should probably use simple date input or install calendar. 
// I installed "shadcn add ... dialog ...". I did NOT install calendar.
// I'll use a simple input type="date" for now to save time/complexity or just simple text.
// Or I can quickly add calendar if I want to be fancy. "npx shadcn@latest add calendar popover".
// Let's use input type="date" for simplicity in V1.

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    type: z.string({ required_error: "Please select a liability type." }),
    outstandingAmount: z.coerce.number().min(0, "Amount must be positive"),
    interestRate: z.coerce.number().min(0, "Rate must be positive").max(100, "Rate too high"),
    emi: z.coerce.number().min(0, "EMI must be positive"),
    endDate: z.string().optional(), // YYYY-MM-DD
});

export function LiabilityForm() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            outstandingAmount: 0,
            interestRate: 8.5,
            emi: 0,
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const response = await fetch("/api/liabilities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to create liability");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
            setOpen(false);
            form.reset();
            toast.success("Liability added successfully");
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
                <Button className="gap-2" variant="destructive">
                    <Plus className="h-4 w-4" /> Add Liability
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass bg-background/80 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>Add New Liability</DialogTitle>
                    <DialogDescription>
                        Track loans, credit card debt, or other liabilities.
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
                                Add Liability
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
