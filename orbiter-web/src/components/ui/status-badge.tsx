import { cn } from "@/lib/utils"

interface StatusBadgeProps {
    status: "healthy" | "normal" | "active" | "degraded" | "warning" | "failed" | "critical" | "offline" | "idle" | "monitoring" | "processing" | "passing" | "failing" | "resolved"
    label?: string
    className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
    const getStatusColor = (s: string) => {
        switch (s) {
            case "healthy":
            case "normal":
            case "active":
            case "passing":
            case "resolved":
                return "text-status-active bg-status-active/10 border-status-active/20"
            case "degraded":
            case "warning":
            case "monitoring":
            case "processing":
                return "text-status-warn bg-status-warn/10 border-status-warn/20"
            case "failed":
            case "critical":
            case "offline":
            case "failing":
                return "text-status-alert bg-status-alert/10 border-status-alert/20"
            case "idle":
            default:
                return "text-status-idle bg-status-idle/10 border-status-idle/20"
        }
    }

    const getDotColor = (s: string) => {
        switch (s) {
            case "healthy":
            case "normal":
            case "active":
            case "passing":
            case "resolved":
                return "bg-status-active"
            case "degraded":
            case "warning":
            case "monitoring":
            case "processing":
                return "bg-status-warn"
            case "failed":
            case "critical":
            case "offline":
            case "failing":
                return "bg-status-alert"
            case "idle":
            default:
                return "bg-status-idle"
        }
    }

    return (
        <div className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-mono",
            getStatusColor(status),
            className
        )}>
            <span className={cn("w-1 h-1 rounded-full mr-1.5", getDotColor(status))} />
            {label || status}
        </div>
    )
}
