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
import { AssetForm } from "./AssetForm";
import { ModificationDialog } from "../modifications/ModificationDialog";

interface Asset {
    id: string;
    name: string;
    type: string;
    investedAmount: number;
    returnRate: number;
    interestType: string;
    updatedAt: string;
    modifications: any[]; // Using any for simplicity here, or import the type
}

export function AssetTable() {
    const queryClient = useQueryClient();

    const { data: assets, isLoading, isError } = useQuery<Asset[]>({
        queryKey: ["assets"],
        queryFn: async () => {
            const response = await fetch("/api/assets");
            if (!response.ok) throw new Error("Failed to fetch assets");
            return response.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/assets/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete asset");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            toast.success("Asset deleted");
        },
        onError: () => {
            toast.error("Failed to delete asset");
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return <div className="text-center text-destructive p-8">Failed to load assets.</div>;
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/5 rounded-lg border border-dashed border-muted">
                <h3 className="text-lg font-medium">No assets tracked yet</h3>
                <p className="text-muted-foreground mt-1">Add your first asset to start tracking.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-white/10 glass overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Invested</TableHead>
                        <TableHead className="text-right">Return</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assets.map((asset) => {
                        return (
                            <TableRow key={asset.id} className="hover:bg-muted/5">
                                <TableCell className="font-medium">{asset.name}</TableCell>
                                <TableCell className="text-muted-foreground text-xs uppercase tracking-wider">{asset.type}</TableCell>
                                <TableCell className="text-right">₹{asset.investedAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    <div className="flex flex-col items-end">
                                        <span>{asset.returnRate}%</span>
                                        <span className="text-[10px] uppercase">{asset.interestType === "SIMPLE" ? "Simple" : "CAGR"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <ModificationDialog
                                            type="asset"
                                            itemId={asset.id}
                                            itemName={asset.name}
                                            existingModifications={asset.modifications}
                                        />
                                        <AssetForm
                                            initialData={asset}
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
                                            onClick={() => deleteMutation.mutate(asset.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div >
    );
}
