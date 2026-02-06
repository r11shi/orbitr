import { cn } from "@/lib/utils"
import { AgentStatus } from "@/types"

interface AgentStatusRailProps {
    agents: AgentStatus[]
}

export function AgentStatusRail({ agents }: AgentStatusRailProps) {
    const activeCount = agents.filter(a => a.status === "active").length
    const processingCount = agents.filter(a => a.status === "processing").length
    const idleCount = agents.filter(a => a.status === "idle").length
    const offlineCount = agents.filter(a => a.status === "offline").length

    return (
        <div className="border border-border-subtle rounded-lg bg-bg-panel p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-medium text-text-secondary uppercase tracking-widest">
                        Agent Swarm
                    </h3>
                    <span className="text-[10px] font-mono text-text-dim px-2 py-0.5 bg-bg-active rounded">
                        {agents.length} TOTAL
                    </span>
                </div>

                {/* Status Summary */}
                <div className="flex items-center gap-5 text-[10px] font-mono">
                    {activeCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-active pulse-active" />
                            <span className="text-status-active">{activeCount} ACTIVE</span>
                        </div>
                    )}
                    {processingCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-warn pulse-active" />
                            <span className="text-status-warn">{processingCount} PROCESSING</span>
                        </div>
                    )}
                    {idleCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-idle" />
                            <span className="text-status-idle">{idleCount} IDLE</span>
                        </div>
                    )}
                    {offlineCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-alert" />
                            <span className="text-status-alert">{offlineCount} OFFLINE</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Agent Pills */}
            <div className="flex flex-wrap gap-2">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        className={cn(
                            "group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer",
                            agent.status === "active" && "border-status-active/30 bg-status-active/5 hover:bg-status-active/10 hover:border-status-active/50",
                            agent.status === "processing" && "border-status-warn/30 bg-status-warn/5 hover:bg-status-warn/10 hover:border-status-warn/50",
                            agent.status === "idle" && "border-status-idle/30 bg-status-idle/5 hover:bg-status-idle/10 hover:border-status-idle/50",
                            agent.status === "offline" && "border-status-alert/30 bg-status-alert/5 hover:bg-status-alert/10 hover:border-status-alert/50"
                        )}
                        title={agent.task || `Last active: ${agent.lastActive}`}
                    >
                        {/* Status Dot */}
                        <span
                            className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                agent.status === "active" && "bg-status-active pulse-active",
                                agent.status === "processing" && "bg-status-warn pulse-active",
                                agent.status === "idle" && "bg-status-idle",
                                agent.status === "offline" && "bg-status-alert"
                            )}
                        />

                        {/* Agent Name */}
                        <span className={cn(
                            "text-[11px] tracking-tight transition-colors",
                            agent.status === "active" && "text-status-active",
                            agent.status === "processing" && "text-status-warn",
                            agent.status === "idle" && "text-text-dim",
                            agent.status === "offline" && "text-status-alert"
                        )}>
                            {agent.name}
                        </span>

                        {/* Tooltip on hover */}
                        {agent.task && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bg-active border border-border-strong rounded text-[10px] text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <div className="font-mono">{agent.task}</div>
                                <div className="text-text-dim mt-1">{agent.lastActive}</div>
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border-strong" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
