import { Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar - Hidden on mobile */}
            <Sidebar className="hidden md:flex" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header - Visible only on mobile */}
                <header className="flex h-16 items-center border-b border-border/50 bg-background/50 backdrop-blur-md px-4 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-ml-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 bg-sidebar border-r border-border">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <div className="ml-4 font-semibold text-lg tracking-tight">WealthOrbit</div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
