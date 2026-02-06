import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
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
    if (deviations.length === 0) {
        return (
            <div className="p-6 border border-border-subtle border-dashed rounded-lg text-center">
                <span className="text-text-dim text-sm">No active deviations detected. System nominal.</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-widest">Active Deviations</h3>
            <div className="border border-border-subtle rounded-lg divide-y divide-border-subtle bg-bg-panel max-h-[500px] overflow-y-auto">
                {deviations.map((dev) => (
                    <div key={dev.id} className="p-4 flex items-start gap-3 hover:bg-bg-active/30 transition-colors cursor-pointer group">
                        <div className={cn(
                            "mt-1 w-2 h-2 rounded-full shrink-0",
                            dev.severity === "Critical" ? "bg-status-alert pulse-active" :
                                dev.severity === "High" ? "bg-status-warn" : "bg-status-idle"
                        )} />

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className="text-sm font-medium text-text-bright group-hover:text-accent-brand transition-colors leading-snug">
                                    {dev.title}
                                </span>
                                <span className="text-xs font-mono text-text-dim whitespace-nowrap shrink-0">{dev.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <span className="font-mono bg-bg-active px-1.5 py-0.5 rounded text-[10px]">{dev.agent}</span>
                                <span className="text-[11px]">flags severity {dev.severity}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
