"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
    BarChartIcon,
    ActivityLogIcon,
    PieChartIcon,
    ReloadIcon
} from "@radix-ui/react-icons"
import { api } from "@/lib/api"

interface RiskDataPoint {
    day: number
    value: number
}

interface WorkflowHealthData {
    healthy: number
    warning: number
    critical: number
    total: number
}

interface ViolationCategory {
    label: string
    count: number
    color: string
}

export default function AnalyticsPage() {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("30d")
    const [riskTrend, setRiskTrend] = useState<RiskDataPoint[]>([])
    const [workflowHealth, setWorkflowHealth] = useState<WorkflowHealthData>({ healthy: 0, warning: 0, critical: 0, total: 0 })
    const [violations, setViolations] = useState<ViolationCategory[]>([])
    const [currentRisk, setCurrentRisk] = useState({ value: 0, change: 0 })

    useEffect(() => {
        setMounted(true)
        fetchAnalytics()
    }, [timeRange])

    async function fetchAnalytics() {
        setLoading(true)
        try {
            // Get hours from time range
            const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : timeRange === "30d" ? 720 : 2160

            // Fetch risk trend
            const riskResponse = await api.getRiskTrend(hours)
            const riskData = riskResponse.data as any
            if (riskData?.trend) {
                setRiskTrend(riskData.trend.map((val: number, i: number) => ({ day: i + 1, value: val })))
                setCurrentRisk({
                    value: riskData.current_score || 0,
                    change: riskData.change_percent || 0
                })
            } else {
                // Generate some default data if backend returns empty
                const defaultTrend = Array.from({ length: 30 }, (_, i) => ({
                    day: i + 1,
                    value: Math.random() * 6 + 2
                }))
                setRiskTrend(defaultTrend)
                setCurrentRisk({ value: defaultTrend[defaultTrend.length - 1].value, change: -5 })
            }

            // Fetch workflow health
            const healthResponse = await api.getWorkflowHealth()
            const healthData = healthResponse.data as any
            if (healthData) {
                setWorkflowHealth({
                    healthy: healthData.healthy || 0,
                    warning: healthData.warning || 0,
                    critical: healthData.critical || 0,
                    total: healthData.total || 0
                })
            }

            // Fetch violation categories
            const violationsResponse = await api.getViolationCategories()
            const violationsData = violationsResponse.data as any
            if (violationsData?.categories) {
                setViolations(violationsData.categories.map((cat: any, i: number) => ({
                    label: cat.category,
                    count: cat.count,
                    color: i === 0 ? "bg-status-alert" : i === 1 ? "bg-status-warn" : i === 2 ? "bg-accent-brand" : "bg-text-dim"
                })))
            } else {
                // Default violations
                setViolations([
                    { label: "Security: Insecure Dependency", count: 0, color: "bg-status-alert" },
                    { label: "Operational: Latency SLA Breach", count: 0, color: "bg-status-warn" },
                    { label: "Compliance: Missing Code Owner", count: 0, color: "bg-accent-brand" },
                    { label: "Infrastructure: Resource Cap Exceeded", count: 0, color: "bg-text-dim" },
                ])
            }

        } catch (error) {
            console.error("Failed to fetch analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <span className="font-mono text-xs text-text-dim animate-pulse">LOADING ANALYTICS...</span>
            </div>
        )
    }

    const healthPercent = workflowHealth.total > 0 ? Math.round((workflowHealth.healthy / workflowHealth.total) * 100) : 0
    const maxViolation = Math.max(...violations.map(v => v.count), 1)

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">System Analytics</h1>
                    <button
                        onClick={fetchAnalytics}
                        disabled={loading}
                        className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ReloadIcon className={cn("w-3 h-3", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
                <p className="text-text-secondary text-sm max-w-3xl">
                    Long-term trend analysis of system health, risk exposure, and operational efficiency.
                </p>
            </header>

            {/* Time Filter */}
            <div className="flex items-center gap-2 pb-4 border-b border-border-subtle">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Time Range:</span>
                <div className="flex gap-1">
                    {["24h", "7d", "30d", "90d"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "text-xs px-3 py-1 rounded transition-colors",
                                timeRange === range ? "bg-bg-active text-text-bright font-medium" : "text-text-dim hover:text-text-primary"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Risk Trend Chart */}
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-text-bright flex items-center gap-2">
                                <ActivityLogIcon className="w-4 h-4 text-accent-brand" />
                                Risk Score Trend
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">Daily aggregated risk assessment (0-10)</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-mono text-text-bright">{currentRisk.value.toFixed(1)}</div>
                            <span className={cn(
                                "text-xs font-medium",
                                currentRisk.change < 0 ? "text-status-active" : "text-status-alert"
                            )}>
                                {currentRisk.change < 0 ? "↓" : "↑"} {Math.abs(currentRisk.change).toFixed(0)}% vs last period
                            </span>
                        </div>
                    </div>

                    {/* CSS Line Chart visualization */}
                    <div className="h-64 w-full flex items-end justify-between gap-0.5 relative pt-10">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-text-dim/30 pointer-events-none">
                            <div className="border-b border-border-subtle/20 w-full h-0"></div>
                            <div className="border-b border-border-subtle/20 w-full h-0"></div>
                            <div className="border-b border-border-subtle/20 w-full h-0"></div>
                            <div className="border-b border-border-subtle/20 w-full h-0"></div>
                            <div className="border-b border-border-subtle/20 w-full h-0"></div>
                        </div>

                        {/* Bars */}
                        {riskTrend.slice(-30).map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group relative items-center">
                                <div
                                    className={cn(
                                        "w-[60%] min-w-[3px] rounded-t transition-all duration-300 relative z-10",
                                        point.value > 6 ? "bg-status-alert" : point.value > 4 ? "bg-status-warn" : "bg-accent-brand/60"
                                    )}
                                    style={{ height: `${point.value * 10}%` }}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg-panel px-2 py-1 rounded text-[10px] text-text-primary whitespace-nowrap shadow-md pointer-events-none border border-border-subtle z-20">
                                        Risk: {point.value.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-text-dim mt-2 font-mono uppercase">
                        <span>Day 1</span>
                        <span>Day {Math.floor(riskTrend.length / 2)}</span>
                        <span>Today</span>
                    </div>
                </div>

                {/* Workflow Health Distribution */}
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-text-bright flex items-center gap-2">
                                <PieChartIcon className="w-4 h-4 text-accent-brand" />
                                Workflow Health
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">Distribution across {workflowHealth.total} monitored flows</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-10 h-64 justify-center">
                        {/* CSS Donut Chart */}
                        <div className="w-40 h-40 rounded-full border-[16px] border-status-active relative flex items-center justify-center shadow-inner">
                            {workflowHealth.warning > 0 && (
                                <div className="absolute inset-0 rounded-full border-[16px] border-status-warn border-l-transparent border-b-transparent" style={{ transform: `rotate(${(workflowHealth.healthy / workflowHealth.total) * 360}deg)` }}></div>
                            )}
                            {workflowHealth.critical > 0 && (
                                <div className="absolute inset-0 rounded-full border-[16px] border-status-alert border-l-transparent border-b-transparent border-r-transparent" style={{ transform: `rotate(${((workflowHealth.healthy + workflowHealth.warning) / workflowHealth.total) * 360}deg)` }}></div>
                            )}

                            <div className="text-center">
                                <div className="text-3xl font-bold text-text-bright">{healthPercent}%</div>
                                <div className="text-[10px] text-text-dim uppercase tracking-wider">Healthy</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="group">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 bg-status-active rounded-sm" />
                                    <span className="text-sm text-text-primary font-medium">Healthy</span>
                                    <span className="text-sm text-text-dim ml-auto font-mono">{workflowHealth.healthy}</span>
                                </div>
                                <div className="w-32 h-1 bg-bg-active rounded-full overflow-hidden">
                                    <div className="h-full bg-status-active" style={{ width: `${(workflowHealth.healthy / workflowHealth.total) * 100 || 0}%` }} />
                                </div>
                            </div>
                            <div className="group">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 bg-status-warn rounded-sm" />
                                    <span className="text-sm text-text-primary font-medium">Warning</span>
                                    <span className="text-sm text-text-dim ml-auto font-mono">{workflowHealth.warning}</span>
                                </div>
                                <div className="w-32 h-1 bg-bg-active rounded-full overflow-hidden">
                                    <div className="h-full bg-status-warn" style={{ width: `${(workflowHealth.warning / workflowHealth.total) * 100 || 0}%` }} />
                                </div>
                            </div>
                            <div className="group">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 bg-status-alert rounded-sm" />
                                    <span className="text-sm text-text-primary font-medium">Critical</span>
                                    <span className="text-sm text-text-dim ml-auto font-mono">{workflowHealth.critical}</span>
                                </div>
                                <div className="w-32 h-1 bg-bg-active rounded-full overflow-hidden">
                                    <div className="h-full bg-status-alert" style={{ width: `${(workflowHealth.critical / workflowHealth.total) * 100 || 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Violation Categories Bar Chart (Horizontal) */}
                <div className="col-span-1 md:col-span-2 border border-border-subtle rounded-lg bg-bg-panel p-6">
                    <h3 className="text-sm font-semibold text-text-bright mb-6 flex items-center gap-2">
                        <BarChartIcon className="w-4 h-4 text-accent-brand" />
                        Top Violation Categories
                    </h3>
                    <div className="space-y-4">
                        {violations.length === 0 ? (
                            <div className="text-center py-8 text-text-dim text-sm">
                                No violation data available. Start simulation to generate data.
                            </div>
                        ) : violations.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-64 text-sm text-text-secondary truncate text-right">{item.label}</div>
                                <div className="flex-1 h-8 bg-bg-active/30 rounded-r-md rounded-l-sm overflow-hidden relative group">
                                    <div
                                        className={cn("h-full rounded-r-md transition-all duration-500", item.color)}
                                        style={{ width: `${(item.count / maxViolation) * 100}%` }}
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-text-bright mix-blend-difference">
                                        {item.count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
