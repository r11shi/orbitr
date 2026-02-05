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
                <div key={i} className="bg-bg-panel p-6 flex flex-col justify-between h-32 hover:bg-bg-active/50 transition-colors">
                    <span className="text-sm font-mono text-text-secondary uppercase tracking-wider">{metric.label}</span>
                    <div className="mt-2">
                        <span className={cn(
                            "text-3xl font-medium tracking-tight",
                            metric.status === "critical" && "text-status-alert",
                            metric.status === "warning" && "text-status-warn",
                            (!metric.status || metric.status === "normal") && "text-text-bright"
                        )}>
                            {metric.value}
                        </span>
                        {metric.trend && (
                            <span className="ml-2 text-xs text-text-dim">{metric.trend}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
