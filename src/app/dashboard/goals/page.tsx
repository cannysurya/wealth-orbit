"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventForm } from "@/components/features/events/EventForm";
import { Loader2, Trash2, Calendar, Flag } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LifeEvent {
    id: string;
    name: string;
    cost: number;
    date: string;
}

export default function GoalsPage() {
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Goals & Events</h1>
                    <p className="text-muted-foreground">Major milestones you are planning for.</p>
                </div>
                <EventForm />
            </div>

            <div className="relative border-l-2 border-primary/20 ml-4 space-y-8 py-4">
                {events && events.length === 0 && (
                    <div className="ml-8 text-muted-foreground italic">No goals set yet. Add one to see the timeline.</div>
                )}

                {events?.map((event) => (
                    <div key={event.id} className="relative ml-8">
                        <div className="absolute -left-[41px] bg-background border border-primary/50 text-primary rounded-full w-6 h-6 flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <div className="glass-card p-4 rounded-lg flex justify-between items-center group">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {event.name}
                                    <span className="text-xs font-normal text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                                        {format(new Date(event.date), "MMM yyyy")}
                                    </span>
                                </h3>
                                <p className="text-2xl font-bold mt-1 text-primary">₹{event.cost.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Target Cost</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMutation.mutate(event.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
