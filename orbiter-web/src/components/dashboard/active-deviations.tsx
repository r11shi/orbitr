import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface Deviation {
    id: string
    title: string
    severity: "Low" | "Medium" | "High" | "Critical"
    time: string
    agent: string
}

interface ActiveDeviationsProps {
    deviations: Deviation[]
}

export function ActiveDeviations({ deviations }: ActiveDeviationsProps) {
    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "Critical":
                return AlertCircle
            case "High":
                return AlertTriangle
            default:
                return Info
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "Critical":
                return "from-status-alert/20 to-status-alert/5 border-status-alert/30 text-status-alert"
            case "High":
                return "from-status-warn/20 to-status-warn/5 border-status-warn/30 text-status-warn"
            default:
                return "from-status-info/20 to-status-info/5 border-status-info/30 text-status-info"
        }
    }

    if (deviations.length === 0) {
        return (
            <div className="p-8 border border-border-strong/50 border-dashed rounded-lg text-center bg-gradient-to-br from-bg-panel/50 to-bg-elevated/50">
                <Info className="w-8 h-8 text-text-dim mx-auto mb-3" />
                <p className="text-text-dim text-sm font-medium">No active issues</p>
                <p className="text-text-dim text-xs mt-1">System is operating normally</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Critical Alerts</h3>
                <span className="text-xs font-mono text-text-dim bg-status-alert/20 text-status-alert px-2 py-1 rounded">
                    {deviations.length} issue{deviations.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="space-y-3">
                {deviations.map((dev) => {
                    const IconComponent = getSeverityIcon(dev.severity)
                    
                    return (
                        <div
                            key={dev.id}
                            className={cn(
                                "group relative overflow-hidden rounded-lg border transition-all duration-300",
                                "bg-gradient-to-br hover:shadow-lg hover:shadow-accent-primary/10",
                                "hover:border-accent-primary cursor-pointer p-4",
                                getSeverityColor(dev.severity)
                            )}
                        >
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative flex items-start gap-3">
                                {/* Icon */}
                                <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-text-bright group-hover:text-accent-primary transition-colors mb-1 line-clamp-2">
                                        {dev.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                                        <span className="font-mono bg-bg-active/80 px-2 py-1 rounded group-hover:bg-accent-primary/20 transition-colors">
                                            {dev.agent}
                                        </span>
                                        <span className="text-text-dim">•</span>
                                        <span className="font-mono text-text-dim">{dev.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="inline-block text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-current/10">
                                            {dev.severity}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Dot */}
                                <div className={cn(
                                    "w-3 h-3 rounded-full flex-shrink-0 mt-1 animate-pulse",
                                    dev.severity === "Critical" && "bg-status-alert",
                                    dev.severity === "High" && "bg-status-warn",
                                    dev.severity !== "Critical" && dev.severity !== "High" && "bg-status-info"
                                )} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
