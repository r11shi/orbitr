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
    if (insights.length === 0) {
        return (
            <div className="p-6 border border-border-subtle border-dashed rounded-lg text-center">
                <span className="text-text-dim text-sm">No recent context available.</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-widest">Recent Context</h3>
            <div className="relative border-l-2 border-border-subtle ml-3 space-y-5 py-2 max-h-[500px] overflow-y-auto pr-2">
                {insights.map((insight, i) => (
                    <div key={insight.id || i} className="relative pl-6">
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-bg-void bg-border-strong" />

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-baseline gap-3">
                                <span className="font-mono text-xs text-status-active font-medium">@{insight.agent}</span>
                                <span className="font-mono text-[10px] text-text-dim">{insight.timestamp}</span>
                            </div>

                            <p className="text-sm text-text-primary leading-relaxed">
                                {insight.message}
                            </p>

                            {insight.context && (
                                <div className="mt-1.5 p-3 bg-bg-active/50 rounded-lg border border-border-subtle">
                                    <p className="text-xs font-mono text-text-secondary leading-relaxed">{insight.context}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
