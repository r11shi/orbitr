import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PulseMetric {
    label: string
    value: string | number
    status?: "normal" | "warning" | "critical"
    trend?: string
}

interface SystemPulseProps {
    metrics: PulseMetric[]
}

export function SystemPulse({ metrics }: SystemPulseProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric, i) => {
                const isTrendingUp = metric.trend?.includes("↑") || metric.trend?.includes("resolved");
                const isTrendingDown = metric.trend?.includes("↓") || metric.trend?.includes("Optimal");
                
                return (
                    <div
                        key={i}
                        className={cn(
                            "group relative overflow-hidden rounded-lg border transition-all duration-300",
                            "bg-gradient-to-br from-bg-panel to-bg-elevated",
                            "hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/20",
                            metric.status === "critical" && "border-status-alert/50 hover:border-status-alert",
                            metric.status === "warning" && "border-status-warn/50 hover:border-status-warn",
                            (!metric.status || metric.status === "normal") && "border-border-strong/50"
                        )}
                    >
                        {/* Animated Background Glow */}
                        <div
                            className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                metric.status === "critical" && "bg-status-alert/5",
                                metric.status === "warning" && "bg-status-warn/5",
                                (!metric.status || metric.status === "normal") && "bg-accent-primary/5"
                            )}
                        />

                        {/* Content */}
                        <div className="relative p-6 flex flex-col justify-between h-32">
                            {/* Label */}
                            <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                                {metric.label}
                            </span>

                            {/* Main Value */}
                            <div className="mt-3 flex items-end justify-between">
                                <span
                                    className={cn(
                                        "text-3xl font-bold tracking-tight",
                                        metric.status === "critical" && "text-status-alert",
                                        metric.status === "warning" && "text-status-warn",
                                        (!metric.status || metric.status === "normal") && "text-text-bright"
                                    )}
                                >
                                    {metric.value}
                                </span>
                            </div>

                            {/* Trend */}
                            {metric.trend && (
                                <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                                    {isTrendingUp && <TrendingUp className="w-3.5 h-3.5 text-status-success" />}
                                    {isTrendingDown && <TrendingDown className="w-3.5 h-3.5 text-status-active" />}
                                    <span
                                        className={cn(
                                            isTrendingUp && "text-status-success",
                                            isTrendingDown && "text-status-active",
                                            !isTrendingUp && !isTrendingDown && "text-text-dim"
                                        )}
                                    >
                                        {metric.trend}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Status Indicator Dot */}
                        <div
                            className={cn(
                                "absolute top-2 right-2 w-2 h-2 rounded-full",
                                metric.status === "critical" && "bg-status-alert animate-pulse",
                                metric.status === "warning" && "bg-status-warn animate-pulse",
                                (!metric.status || metric.status === "normal") && "bg-status-active"
                            )}
                        />
                    </div>
                )
            })}
        </div>
    )
}
