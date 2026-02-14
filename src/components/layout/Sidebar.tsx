"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    TrendingUp,
    Settings,
    LogOut,
    Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Assets",
        href: "/dashboard/assets",
        icon: Wallet,
    },
    {
        title: "Liabilities",
        href: "/dashboard/liabilities",
        icon: CreditCard,
    },
    {
        title: "Projections",
        href: "/dashboard/projections",
        icon: TrendingUp,
    },
    {
        title: "Events",
        href: "/dashboard/events",
        icon: Target,
    },
];

export function SidebarContent() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col justify-between text-sidebar-foreground">
            <div className="px-4 py-6">
                <Link href="/dashboard" className="flex items-center gap-2 px-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 p-1 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">WealthOrbit</span>
                </Link>
                <div className="mt-8 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                        >
                            <span
                                className={cn(
                                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="p-4 border-t border-border/50">
                <Link href="/dashboard/settings">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-1"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export function Sidebar({ className }: { className?: string }) {
    return (
        <div className={cn("flex h-screen w-64 flex-col border-r border-border bg-sidebar glass", className)}>
            <SidebarContent />
        </div>
    );
}
