import { AgentStatus } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface AgentRailProps {
    agents: AgentStatus[]
}

export function AgentRail({ agents }: AgentRailProps) {
    return (
        <div className="w-full flex-shrink-0 flex flex-col border-r border-border-subtle bg-bg-void/50 h-full overflow-y-auto">
            <div className="p-4 border-b border-border-subtle">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-mono text-text-dim">Active Agents</h2>
            </div>

            <div className="flex flex-col">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        className={cn(
                            "group flex flex-col p-4 border-b border-border-subtle hover:bg-bg-active transition-colors cursor-pointer relative",
                            agent.status === "processing" && "bg-status-active/5"
                        )}
                    >
                        {/* Active Indicator Line */}
                        {agent.status === "processing" && (
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-status-active" />
                        )}

                        <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                                "font-mono text-sm font-semibold tracking-tight",
                                agent.status === "active" || agent.status === "processing" ? "text-white" : "text-text-dim"
                            )}>
                                {agent.name}
                            </span>

                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                agent.status === "active" ? "bg-status-active shadow-[0_0_8px_rgba(0,255,148,0.5)]" :
                                    agent.status === "processing" ? "bg-status-warn animate-pulse" :
                                        "bg-zinc-800"
                            )} />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-600 uppercase">{agent.id}</span>
                            <span className="text-[10px] text-text-dim">{agent.lastActive}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
