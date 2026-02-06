"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    ActivitySquare,
    AlertTriangle,
    Users,
    FileText,
    Settings,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Workflows", icon: ActivitySquare, href: "/workflows" },
    { label: "Incidents", icon: AlertTriangle, href: "/incidents" },
    { label: "Agents", icon: Users, href: "/agents" },
    { label: "Compliance", icon: FileText, href: "/simulation" },
    { label: "Settings", icon: Settings, href: "/settings" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="h-screen w-64 border-r border-border-strong/50 bg-gradient-to-b from-bg-panel to-bg-elevated flex flex-col overflow-hidden">
            {/* Logo Header */}
            <div className="h-16 flex items-center px-6 border-b border-border-strong/30">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-tertiary p-2 flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:shadow-accent-primary/40 transition-all">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold tracking-tight text-text-bright text-lg">ORBITER</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                "text-sm font-medium",
                                isActive
                                    ? "bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 text-accent-primary border border-accent-primary/30 shadow-lg shadow-accent-primary/10"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-active/50 border border-transparent"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-all", isActive && "text-accent-primary")} />
                            <span>{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer Status */}
            <div className="p-4 border-t border-border-strong/30 space-y-3 bg-gradient-to-t from-bg-active/50">
                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-text-dim font-semibold uppercase tracking-wider">Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-status-active animate-pulse" />
                            <span className="text-status-active font-medium">ONLINE</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-text-dim">
                        <span>Version</span>
                        <span className="font-mono text-xs">4.0.0</span>
                    </div>
                </div>
                <button className="w-full py-2 px-3 rounded-lg border border-border-strong/50 text-text-secondary text-xs font-medium hover:bg-bg-active hover:text-text-primary hover:border-accent-primary transition-all">
                    Help & Support
                </button>
            </div>
        </aside>
    )
}
