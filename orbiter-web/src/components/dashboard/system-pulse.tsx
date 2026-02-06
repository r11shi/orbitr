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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-border-subtle/50 border border-border-subtle rounded-lg overflow-hidden">
            {metrics.map((metric, i) => (
                <div key={i} className="bg-bg-panel p-5 flex flex-col justify-between min-h-[100px] hover:bg-bg-active/50 transition-colors cursor-pointer group">
                    <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">{metric.label}</span>
                    <div className="mt-auto pt-2">
                        <span className={cn(
                            "text-xl md:text-2xl font-semibold tracking-tight transition-colors block truncate",
                            metric.status === "critical" && "text-status-alert group-hover:text-status-alert",
                            metric.status === "warning" && "text-status-warn group-hover:text-status-warn",
                            (!metric.status || metric.status === "normal") && "text-text-bright group-hover:text-accent-brand"
                        )}>
                            {metric.value}
                        </span>
                        {metric.trend && (
                            <span className="text-xs text-text-dim mt-1 block">{metric.trend}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
