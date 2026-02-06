"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ReloadIcon } from "@radix-ui/react-icons"

interface ContextItem {
    type: "event" | "finding" | "workflow"
    timestamp: number
    icon: string
    message: string
    detail?: string | null
    severity?: string
    correlation_id?: string
    workflow_id?: string
}

interface RecentContextProps {
    className?: string
}

export function RecentContext({ className }: RecentContextProps) {
    const [items, setItems] = useState<ContextItem[]>([])
    const [loading, setLoading] = useState(true)

    async function fetchContext() {
        try {
            const response = await fetch("http://localhost:8000/system/context?limit=15")
            const data = await response.json()
            if (data.context) {
                setItems(data.context)
            }
        } catch (e) {
            console.error("Failed to fetch context:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContext()
        const interval = setInterval(fetchContext, 10000) // Poll every 10s (reduced from 5s)
        return () => clearInterval(interval)
    }, [])

    const formatTime = (ts: number) => {
        const date = new Date(ts * 1000)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case "Critical": return "text-red-400"
            case "High": return "text-amber-400"
            case "Medium": return "text-yellow-400"
            default: return "text-emerald-400"
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "event": return "border-blue-500/30 bg-blue-500/5"
            case "finding": return "border-amber-500/30 bg-amber-500/5"
            case "workflow": return "border-purple-500/30 bg-purple-500/5"
            default: return "border-border-subtle bg-bg-panel"
        }
    }

    return (
        <div className={cn("border border-border-subtle rounded-lg bg-bg-panel overflow-hidden", className)}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <h3 className="text-sm font-medium text-text-bright flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Recent Context
                </h3>
                <button onClick={fetchContext} className="text-text-dim hover:text-text-primary">
                    <ReloadIcon className={cn("w-3 h-3", loading && "animate-spin")} />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {items.length === 0 ? (
                    <div className="p-6 text-center text-text-dim text-sm">
                        No recent activity. Run a demo scenario to see live events.
                    </div>
                ) : (
                    <div className="divide-y divide-border-subtle">
                        {items.map((item, idx) => (
                            <div
                                key={`${item.type}-${item.timestamp}-${idx}`}
                                className={cn(
                                    "px-4 py-2.5 hover:bg-bg-active/30 transition-colors border-l-2",
                                    getTypeColor(item.type)
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-base shrink-0">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-xs font-mono truncate",
                                            getSeverityColor(item.severity)
                                        )}>
                                            {item.message}
                                        </p>
                                        {item.detail && (
                                            <p className="text-[10px] text-text-dim mt-0.5 truncate">
                                                {item.detail}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-text-dim font-mono shrink-0">
                                        {formatTime(item.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
