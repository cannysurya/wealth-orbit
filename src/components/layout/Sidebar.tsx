"use client";

import Link from "next/link";
import Image from "next/image";
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
    Target,
    Flame,
    Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Review Goals",
        href: "/dashboard/goals",
        icon: Target,
    },
    {
        title: "FIRE Analysis",
        href: "/dashboard/fire",
        icon: Flame,
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
        title: "AI Assistant",
        href: "/dashboard/ai-assistant",
        icon: Bot,
    },
];

export function SidebarContent() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col justify-between text-sidebar-foreground">
            <div className="px-4 py-6">
                <Link href="/dashboard" className="flex items-center gap-2 px-2">
                    <Image src="/logo.svg" alt="Wealth Orbit" width={32} height={32} className="rounded-lg shadow-lg" />
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
