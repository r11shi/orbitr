"use client"

import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel"
import { cn } from "@/lib/utils"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface StatCardProps {
    title: string
    value: string | number
    unit?: string
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    status?: "normal" | "critical" | "proc"
    scanline?: boolean
    chartData?: any[] // Optional sparkline data
    showChart?: boolean // Whether to render sparkline
}

const DEFAULT_CHART = [
    { val: 40 }, { val: 30 }, { val: 45 }, { val: 50 }, { val: 35 }, { val: 55 }, { val: 60 }
]

export function StatCard({ title, value, unit, trend, trendValue, status = "normal", scanline = false, chartData = DEFAULT_CHART, showChart = true }: StatCardProps) {
    return (
        <Panel className={cn(
            "h-full transition-colors duration-500 flex flex-col relative overflow-hidden",
            status === "critical" && "border-status-alert/50 bg-status-alert/5",
            status === "proc" && "border-status-warn/50"
        )}>
            {scanline && <div className="animate-scanline" />}

            <PanelHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 pb-2 border-none bg-transparent relative z-10">
                <PanelTitle>{title}</PanelTitle>
                {status === "proc" && (
                    <div className="h-2 w-2 rounded-full bg-status-warn animate-pulse" />
                )}
            </PanelHeader>

            <PanelContent className="pt-0 relative z-10 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-baseline space-x-2">
                        <div className={cn(
                            "text-4xl font-mono font-medium tracking-tighter",
                            status === "critical" ? "text-status-alert" : "text-white"
                        )}>
                            {value}
                        </div>
                        {unit && (
                            <span className="text-xs text-text-dim font-mono uppercase">{unit}</span>
                        )}
                    </div>

                    {trendValue && (
                        <div className="mt-2 text-xs font-mono flex items-center space-x-1">
                            <span className={cn(
                                trend === "up" ? "text-status-active" : trend === "down" ? "text-status-alert" : "text-text-dim"
                            )}>
                                {trend === "up" ? "↑" : "↓"} {trendValue}
                            </span>
                            <span className="text-zinc-600">vs last hr</span>
                        </div>
                    )}
                </div>

                {/* Sparkline Chart */}
                {showChart && (
                    <div className="h-10 mt-2 -mx-2 opacity-50">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={status === "critical" ? "#FF3333" : "#00FF94"} stopOpacity={0.4} />
                                        <stop offset="100%" stopColor={status === "critical" ? "#FF3333" : "#00FF94"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke={status === "critical" ? "#FF3333" : "#00FF94"}
                                    strokeWidth={2}
                                    fill={`url(#grad-${title})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </PanelContent>
        </Panel>
    )
}
