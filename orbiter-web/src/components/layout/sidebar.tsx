"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    HomeIcon,
    ActivityLogIcon,
    ExclamationTriangleIcon,
    PersonIcon,
    FileTextIcon,
    BarChartIcon,
    FileIcon,
    GearIcon,
    SunIcon,
    MoonIcon,
    ChatBubbleIcon
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/providers/theme-provider"

const NAV_ITEMS = [
    { label: "Dashboard", icon: HomeIcon, href: "/" },
    { label: "Workflows", icon: ActivityLogIcon, href: "/workflows" },
    { label: "Incidents", icon: ExclamationTriangleIcon, href: "/incidents" },
    { label: "Policies", icon: FileTextIcon, href: "/policies" },
]

interface SidebarProps {
    onChatToggle?: () => void
}

export function Sidebar({ onChatToggle }: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = React.useState(false)
    const { theme, setTheme } = useTheme()

    return (
        <aside className={cn(
            "h-screen border-r border-border-subtle bg-bg-panel flex flex-col transition-all duration-300 z-30",
            collapsed ? "w-14" : "w-56"
        )}>
            {/* Header */}
            <div
                className="h-14 flex items-center px-4 border-b border-border-subtle cursor-pointer hover:bg-bg-active/50 transition-colors"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="w-8 h-8 bg-text-bright rounded-md flex items-center justify-center shrink-0 shadow-sm border border-border-strong/10">
                    <div className="w-4 h-4 bg-bg-void rounded-sm border border-border-subtle" />
                </div>
                {!collapsed && (
                    <span className="ml-3 font-mono font-medium tracking-tight text-sm text-text-bright">ORBITR</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center h-9 px-2.5 rounded-md text-sm transition-all duration-200 group",
                                isActive
                                    ? "bg-bg-active text-text-bright shadow-sm font-medium"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-active/50"
                            )}
                        >
                            <item.icon className={cn(
                                "w-4 h-4 shrink-0 transition-colors",
                                isActive ? "text-text-bright" : "text-text-dim group-hover:text-text-primary"
                            )} />
                            {!collapsed && (
                                <span className="ml-3 truncate">{item.label}</span>
                            )}
                        </Link>
                    )
                })}

                <div className="pt-2 mt-2 border-t border-border-subtle/50">
                    <button
                        onClick={onChatToggle}
                        className={cn(
                            "w-full flex items-center h-9 px-2.5 rounded-md text-sm transition-all duration-200 group text-text-secondary hover:text-text-primary hover:bg-bg-active/50"
                        )}
                    >
                        <ChatBubbleIcon className="w-4 h-4 shrink-0 text-accent-brand" />
                        {!collapsed && (
                            <span className="ml-3 truncate">Ask Orbiter</span>
                        )}
                    </button>
                </div>
            </nav>

            {/* Bottom Status & Actions */}
            <div className="p-2 border-t border-border-subtle space-y-2 bg-bg-panel/50">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={cn(
                        "flex items-center w-full h-9 px-2.5 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-active/50 transition-colors",
                        collapsed && "justify-center px-0"
                    )}
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? (
                        <SunIcon className="w-4 h-4 shrink-0" />
                    ) : (
                        <MoonIcon className="w-4 h-4 shrink-0" />
                    )}
                    {!collapsed && <span className="ml-3">Toggle Theme</span>}
                </button>

                {!collapsed && (
                    <div className="px-2.5 py-2 rounded-md bg-bg-active/30 border border-border-subtle/30">
                        <div className="text-[10px] font-mono text-text-dim flex items-center justify-between mb-1">
                            <span>SYSTEM</span>
                            <span className="flex items-center text-status-active font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-status-active mr-1.5 animate-pulse" />
                                ONLINE
                            </span>
                        </div>
                        <div className="text-[10px] font-mono text-text-dim flex items-center justify-between">
                            <span>VERSION</span>
                            <span>v3.0.0</span>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}
