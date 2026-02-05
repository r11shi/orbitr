import { cn } from "@/lib/utils"

export interface TimelineEvent {
    id: string
    timestamp: string
    label: string
    source: string
    severity?: "normal" | "warning" | "critical"
    details?: string
}

interface TimelineProps {
    events: TimelineEvent[]
}

export function Timeline({ events }: TimelineProps) {
    return (
        <div className="relative space-y-4 font-mono text-sm py-2">
            <div className="absolute top-0 bottom-0 left-[5.5rem] w-px bg-border-subtle" />

            {events.map((event) => (
                <div key={event.id} className="relative flex items-baseline group">
                    {/* Timestamp */}
                    <div className="w-20 shrink-0 text-xs text-text-dim text-right pr-4 tabular-nums">
                        {event.timestamp}
                    </div>

                    {/* Dot */}
                    <div className={cn(
                        "absolute left-[5.35rem] w-3 h-3 rounded-full border-2 border-bg-void z-10",
                        event.severity === "critical" ? "bg-status-alert" :
                            event.severity === "warning" ? "bg-status-warn" :
                                "bg-border-strong group-hover:bg-text-secondary transition-colors"
                    )} />

                    {/* Content */}
                    <div className="flex-1 pl-6 pt-0.5">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "font-medium",
                                event.severity === "critical" ? "text-status-alert" :
                                    event.severity === "warning" ? "text-status-warn" :
                                        "text-text-primary"
                            )}>
                                {event.label}
                            </span>
                            <span className="text-xs text-text-dim px-1.5 py-0.5 bg-bg-active rounded">
                                {event.source}
                            </span>
                        </div>
                        {event.details && (
                            <p className="mt-1 text-text-secondary text-xs leading-relaxed max-w-prose">
                                {event.details}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
