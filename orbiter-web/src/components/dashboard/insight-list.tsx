import { cn } from "@/lib/utils"
import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons"

interface Insight {
    id: string
    message: string
    agent: string
    timestamp: string
    context?: string
    context_score?: number
    evidence?: {
        policy_id?: string
        frameworks?: string[]
        event_type?: string
    }
    severity?: string
}

interface InsightListProps {
    insights: Insight[]
}

export function InsightList({ insights }: InsightListProps) {
    const [expandedId, setExpandedId] = React.useState<string | null>(null)

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
                {insights.map((insight, i) => {
                    const isViolation = insight.message?.toLowerCase().includes("violation") ||
                        insight.message?.toLowerCase().includes("detected")
                    const isExpanded = expandedId === insight.id

                    return (
                        <div key={insight.id || i} className="relative pl-6">
                            <div className={cn(
                                "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-bg-void",
                                isViolation ? "bg-status-alert" : "bg-border-strong"
                            )} />

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-baseline gap-3 flex-wrap">
                                    <span className={cn(
                                        "font-mono text-xs font-medium",
                                        isViolation ? "text-status-alert" : "text-status-active"
                                    )}>@{insight.agent}</span>
                                    <span className="font-mono text-[10px] text-text-dim">{insight.timestamp}</span>

                                    {/* Context Score Badge */}
                                    {insight.context_score !== undefined && insight.context_score > 0 && (
                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent-brand/10 text-accent-brand border border-accent-brand/20">
                                            Brain: {insight.context_score}%
                                        </span>
                                    )}
                                </div>

                                <p className={cn(
                                    "text-sm leading-relaxed",
                                    isViolation ? "text-status-alert font-medium" : "text-text-primary"
                                )}>
                                    {insight.message}
                                </p>

                                {/* Evidence Expander */}
                                {insight.evidence && (
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                                        className="flex items-center gap-1 text-[10px] text-text-dim hover:text-text-secondary transition-colors mt-1"
                                    >
                                        {isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                                        {isExpanded ? "Hide Evidence" : "Show Evidence"}
                                    </button>
                                )}

                                {/* Expanded Evidence Panel */}
                                {isExpanded && insight.evidence && (
                                    <div className="mt-2 p-3 bg-bg-active/50 rounded-lg border border-border-subtle space-y-1">
                                        {insight.evidence.policy_id && (
                                            <p className="text-xs font-mono text-text-secondary">
                                                <span className="text-text-dim">Policy:</span> {insight.evidence.policy_id}
                                            </p>
                                        )}
                                        {insight.evidence.frameworks && insight.evidence.frameworks.length > 0 && (
                                            <p className="text-xs font-mono text-text-secondary">
                                                <span className="text-text-dim">Frameworks:</span> {insight.evidence.frameworks.join(", ")}
                                            </p>
                                        )}
                                        {insight.evidence.event_type && (
                                            <p className="text-xs font-mono text-text-secondary">
                                                <span className="text-text-dim">Event:</span> {insight.evidence.event_type}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {insight.context && !insight.evidence && (
                                    <div className="mt-1.5 p-3 bg-bg-active/50 rounded-lg border border-border-subtle">
                                        <p className="text-xs font-mono text-text-secondary leading-relaxed">{insight.context}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
