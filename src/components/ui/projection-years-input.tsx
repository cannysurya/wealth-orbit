"use client";

import { Input } from "@/components/ui/input";
import { useProjectionStore } from "@/store/useProjectionStore";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

export function ProjectionYearsInput() {
    const { years, setYears } = useProjectionStore();
    const [tempYears, setTempYears] = useState(years.toString());

    useEffect(() => {
        setTempYears(years.toString());
    }, [years]);

    const handleUpdate = () => {
        const val = parseInt(tempYears);
        if (val > 0 && val <= 100) {
            setYears(val);
        } else {
            setTempYears(years.toString());
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                    <Settings2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Projection:</span> {years} Years
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Projection Duration</Label>
                        <p className="text-xs text-muted-foreground">
                            Set the number of years to forecast your wealth growth.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={tempYears}
                            onChange={(e) => setTempYears(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                            type="number"
                            min="1"
                            max="100"
                            className="h-9"
                        />
                        <Button size="sm" onClick={handleUpdate}>Update</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
