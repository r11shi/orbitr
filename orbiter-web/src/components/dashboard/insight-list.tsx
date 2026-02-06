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
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-widest">Recent Activity</h3>
            <div className="relative border-l border-border-subtle ml-3 space-y-8 py-2">
                {insights.length === 0 ? (
                    <div className="p-8 text-center text-text-dim">
                        <p className="text-sm">No recent activity</p>
                    </div>
                ) : (
                    insights.map((insight, i) => (
                        <div 
                            key={insight.id} 
                            className="relative pl-6 opacity-0 animate-in slide-in-from-left duration-500"
                            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                        >
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-bg-void bg-border-strong group-hover:bg-status-active transition-colors" />

                            <div className="flex flex-col gap-1">
                                <div className="flex items-baseline gap-3">
                                    <span className="font-mono text-xs text-status-active">{insight.agent}</span>
                                    <span className="font-mono text-[10px] text-text-dim">{insight.timestamp}</span>
                                </div>

                                <p className="text-sm text-text-primary leading-relaxed max-w-prose hover:text-accent-brand transition-colors">
                                    {insight.message}
                                </p>

                                {insight.context && (
                                    <div className="mt-2 p-3 bg-bg-active/50 rounded border border-border-subtle">
                                        <p className="text-xs font-mono text-text-secondary">{insight.context}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
