import { cn } from "@/lib/utils"

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-subtle border border-border-subtle rounded-lg overflow-hidden">
            {metrics.map((metric, i) => (
                <div key={i} className="bg-bg-panel p-6 flex flex-col justify-between h-32 hover:bg-bg-active/50 transition-colors group relative overflow-hidden">
                    {/* Animated background glow for critical status */}
                    {metric.status === "critical" && (
                        <div className="absolute inset-0 opacity-5 bg-status-alert group-hover:opacity-10 transition-opacity" />
                    )}

                    <span className="text-sm font-mono text-text-secondary uppercase tracking-wider relative z-10">{metric.label}</span>
                    <div className="mt-2 relative z-10">
                        <span className={cn(
                            "text-3xl font-medium tracking-tight",
                            metric.status === "critical" && "text-status-alert",
                            metric.status === "warning" && "text-status-warn",
                            (!metric.status || metric.status === "normal") && "text-text-bright"
                        )}>
                            {metric.value}
                        </span>
                        {metric.trend && (
                            <span className={cn(
                                "ml-2 text-xs",
                                metric.trend.includes("↓") || metric.trend.includes("Good") ? "text-status-active" :
                                metric.trend.includes("↑") || metric.trend.includes("Increasing") ? "text-status-warn" :
                                "text-text-dim"
                            )}>
                                {metric.trend}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
