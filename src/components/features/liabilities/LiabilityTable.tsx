"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LiabilityForm } from "./LiabilityForm";
import { ModificationDialog } from "../modifications/ModificationDialog";

interface Liability {
    id: string;
    name: string;
    type: string;
    outstandingAmount: number;
    interestRate: number;
    emi: number;
    endDate?: string;
    modifications: any[];
}

export function LiabilityTable() {
    const queryClient = useQueryClient();

    const { data: liabilities, isLoading, isError } = useQuery<Liability[]>({
        queryKey: ["liabilities"],
        queryFn: async () => {
            const response = await fetch("/api/liabilities");
            if (!response.ok) throw new Error("Failed to fetch liabilities");
            return response.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/liabilities/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete liability");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
            toast.success("Liability deleted");
        },
        onError: () => {
            toast.error("Failed to delete liability");
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-destructive" />
            </div>
        );
    }

    if (isError) {
        return <div className="text-center text-destructive p-8">Failed to load liabilities.</div>;
    }

    if (!liabilities || liabilities.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/5 rounded-lg border border-dashed border-muted">
                <h3 className="text-lg font-medium">No liabilities tracked</h3>
                <p className="text-muted-foreground mt-1">Add your first liability to start tracking.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-white/10 glass overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Liability Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead className="text-right">Interest Rate</TableHead>
                        <TableHead className="text-right">EMI</TableHead>
                        <TableHead className="text-right">End Date</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {liabilities.map((liability) => (
                        <TableRow key={liability.id} className="hover:bg-muted/5">
                            <TableCell className="font-medium">{liability.name}</TableCell>
                            <TableCell className="text-muted-foreground text-xs uppercase tracking-wider">{liability.type}</TableCell>
                            <TableCell className="text-right font-bold text-destructive">₹{liability.outstandingAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{liability.interestRate}%</TableCell>
                            <TableCell className="text-right">₹{liability.emi.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {liability.endDate ? format(new Date(liability.endDate), "MMM yyyy") : "-"}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <ModificationDialog
                                        type="liability"
                                        itemId={liability.id}
                                        itemName={liability.name}
                                        existingModifications={liability.modifications}
                                    />
                                    <LiabilityForm
                                        initialData={liability}
                                        trigger={
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteMutation.mutate(liability.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
