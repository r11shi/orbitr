"use client"

import { useState } from "react"
import { AgentStatus } from "@/types"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

export default function AgentsPage() {
    // Mock Agent Data representing the Swarm
    const [agents] = useState<AgentStatus[]>([
        {
            id: "ag-1",
            name: "Compliance Sentinel",
            status: "active",
            lastActive: "Now",
            task: "Scanning committed code for PII violations in PR #402"
        },
        {
            id: "ag-2",
            name: "Security Watchdog",
            status: "active",
            lastActive: "2m ago",
            task: "Analyzing intrusion attempts on gateway-service"
        },
        {
            id: "ag-3",
            name: "Resource Auditor",
            status: "idle",
            lastActive: "15m ago",
            task: "Waiting for scheduled audit cycle"
        },
        {
            id: "ag-4",
            name: "Pattern Detective",
            status: "processing",
            lastActive: "Now",
            task: "Correlating log anomalies across 3 services"
        },
        {
            id: "ag-5",
            name: "Supervisor Agent",
            status: "active",
            lastActive: "Now",
            task: "Orchestrating response to Incident INC-9942"
        },
        {
            id: "ag-6",
            name: "Infrastructure Monitor",
            status: "offline",
            lastActive: "1h ago",
            task: "Maintenance mode enabled"
        }
    ])

    return (
        <div className="w-full max-w-none px-6 md:px-8 py-6 space-y-8">
            <header className="flex flex-col gap-1.5">
                <h1 className="text-xl font-medium tracking-tight text-text-bright">Agent Swarm</h1>
                <p className="text-text-secondary text-sm max-w-3xl">
                    Autonomous agents monitoring, analyzing, and protecting the system.
                    Read-only view of current operational parameters.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        className="group border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4 hover:border-border-strong transition-colors relative overflow-hidden"
                    >
                        {/* Active Scanline for processing/active agents */}
                        {(agent.status === 'active' || agent.status === 'processing') && (
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-status-active to-transparent opacity-50" />
                        )}

                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-md flex items-center justify-center text-[10px] font-mono border",
                                    agent.status === 'active' || agent.status === 'processing'
                                        ? "bg-status-active/10 border-status-active/30 text-status-active"
                                        : "bg-bg-void border-border-subtle text-text-dim"
                                )}>
                                    {agent.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-medium text-text-bright text-sm">{agent.name}</h3>
                                    <span className="text-xs text-text-dim font-mono">{agent.id}</span>
                                </div>
                            </div>
                            <StatusBadge status={agent.status} />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div>
                                <span className="text-[10px] text-text-dim uppercase tracking-wider font-mono">Current Task</span>
                                <p className="text-sm text-text-primary mt-1 line-clamp-2 min-h-[2.5em]">
                                    {agent.task || "No active task"}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                                <div>
                                    <span className="text-[10px] text-text-dim uppercase tracking-wider font-mono block">Last Active</span>
                                    <span className="text-xs text-text-secondary font-mono">{agent.lastActive}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-text-dim uppercase tracking-wider font-mono block text-right">Efficiency</span>
                                    <span className="text-xs text-status-active font-mono">99.9%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
