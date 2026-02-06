import { ChevronRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Insight {
    id: string
    message: string
    agent: string
    timestamp: string
    context?: string
}

interface InsightListProps {
    insights: Insight[]
}

export function InsightList({ insights }: InsightListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Activity Feed</h3>
                <span className="text-xs font-mono text-text-dim">Live</span>
            </div>

            {insights.length === 0 ? (
                <div className="p-12 border border-border-strong/50 border-dashed rounded-lg text-center bg-gradient-to-br from-bg-panel/50 to-bg-elevated/50">
                    <Zap className="w-8 h-8 text-text-dim mx-auto mb-3 opacity-50" />
                    <p className="text-text-dim text-sm font-medium">No activity yet</p>
                    <p className="text-text-dim text-xs mt-1">Events will appear here as they occur</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {insights.map((insight, index) => (
                        <div
                            key={insight.id}
                            className={cn(
                                "group relative overflow-hidden rounded-lg border transition-all duration-300",
                                "bg-gradient-to-r from-bg-panel/80 to-bg-elevated/80",
                                "hover:from-bg-panel hover:to-bg-elevated hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/10",
                                "border-border-strong/30 p-4 cursor-pointer",
                                "opacity-0 animate-in slide-in-from-top duration-500"
                            )}
                            style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
                        >
                            {/* Top accent bar */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Content */}
                            <div className="relative flex items-start gap-3">
                                {/* Timeline dot */}
                                <div className="relative mt-1 flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary shadow-lg shadow-accent-primary/50 group-hover:shadow-accent-primary/80 transition-all" />
                                </div>

                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary">
                                                {insight.agent}
                                            </span>
                                            <span className="font-mono text-xs text-text-dim">{insight.timestamp}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent-primary transition-colors opacity-0 group-hover:opacity-100" />
                                    </div>

                                    {/* Message */}
                                    <p className="text-sm text-text-primary leading-relaxed group-hover:text-accent-primary transition-colors">
                                        {insight.message}
                                    </p>

                                    {/* Context */}
                                    {insight.context && (
                                        <div className="mt-3 p-3 rounded-lg bg-bg-active/50 border border-border-strong/30 group-hover:border-accent-primary/30 transition-colors">
                                            <p className="text-xs font-mono text-text-secondary leading-relaxed">{insight.context}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
