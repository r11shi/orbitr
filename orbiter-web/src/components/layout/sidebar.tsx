"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    HomeIcon,
    ActivityLogIcon,
    ExclamationTriangleIcon,
    PersonIcon,
    PlayIcon,
    GearIcon
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
    { label: "Overview", icon: HomeIcon, href: "/" },
    { label: "Workflows", icon: ActivityLogIcon, href: "/workflows" },
    { label: "Incidents", icon: ExclamationTriangleIcon, href: "/incidents" },
    { label: "Agents", icon: PersonIcon, href: "/agents" },
    { label: "Compliance", icon: PlayIcon, href: "/simulation" },
    { label: "Settings", icon: GearIcon, href: "/settings" },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = React.useState(false)

    return (
        <aside className={cn(
            "h-screen border-r border-border-subtle bg-bg-panel flex flex-col transition-all duration-300",
            collapsed ? "w-16" : "w-64"
        )}>
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-border-subtle">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shrink-0">
                    <div className="w-4 h-4 bg-black rounded-sm" />
                </div>
                {!collapsed && (
                    <span className="ml-3 font-mono font-medium tracking-tight text-sm">ORBITR</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center h-9 px-2.5 rounded-md text-sm transition-colors",
                                isActive
                                    ? "bg-bg-active text-text-bright shadow-sm"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-active/50"
                            )}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {!collapsed && (
                                <span className="ml-3 truncate">{item.label}</span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Status */}
            <div className="p-4 border-t border-border-subtle space-y-4">
                {!collapsed && (
                    <>
                        <div className="text-xs font-mono text-text-dim flex items-center justify-between">
                            <span>SYSTEM</span>
                            <span className="flex items-center text-status-active">
                                <span className="w-1.5 h-1.5 rounded-full bg-status-active mr-2" />
                                ONLINE
                            </span>
                        </div>
                        <div className="text-xs font-mono text-text-dim flex items-center justify-between">
                            <span>VERSION</span>
                            <span>v4.0.0</span>
                        </div>
                    </>
                )}
                {collapsed && (
                    <div className="flex justify-center">
                        <span className="w-2 h-2 rounded-full bg-status-active" />
                    </div>
                )}
            </div>
        </aside>
    )
}
