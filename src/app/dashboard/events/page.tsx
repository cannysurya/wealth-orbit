"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventForm } from "@/components/features/events/EventForm";
import { Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface LifeEvent {
    id: string;
    name: string;
    cost: number;
    date: string;
    type?: string;
}

export default function EventsPage() {
    const queryClient = useQueryClient();

    const { data: events, isLoading, isError } = useQuery<LifeEvent[]>({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await fetch("/api/events");
            if (!response.ok) throw new Error("Failed to fetch events");
            return response.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/events/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete event");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
            toast.success("Event deleted");
        },
        onError: () => {
            toast.error("Failed to delete event");
        },
    });

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (isError) return <div className="p-8 text-destructive">Failed to load events</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight glow">Financial Events</h2>
                    <p className="text-muted-foreground">
                        Plan for future expenses (e.g., House, Wedding) and income (e.g., Bonus, Inheritance).
                    </p>
                </div>
                <EventForm />
            </div>

            <div className="rounded-md border border-white/10 glass overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!events?.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No events added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow key={event.id} className="hover:bg-muted/5">
                                    <TableCell className="font-medium">{event.name}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full ${event.type === "INCOME"
                                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                                            }`}>
                                            {event.type || "EXPENSE"}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${event.type === "INCOME" ? "text-emerald-500" : "text-destructive"
                                        }`}>
                                        {event.type === "INCOME" ? "+" : "-"}₹{event.cost.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {format(new Date(event.date), "MMM yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => deleteMutation.mutate(event.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
