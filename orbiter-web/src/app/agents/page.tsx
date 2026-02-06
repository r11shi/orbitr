"use client"

import { useState, useEffect } from "react"
import { fetchAgents } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { ArrowUpIcon } from "@radix-ui/react-icons"

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadAgents = async () => {
            const data = await fetchAgents()
            setAgents(data)
            setLoading(false)
        }
        loadAgents()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-status-active"
            case "idle":
                return "text-text-dim"
            default:
                return "text-text-secondary"
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="font-mono text-xs text-text-dim animate-pulse">INITIALIZING AGENTS...</span>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-auto">
            <div className="min-h-screen bg-gradient-to-b from-bg-void to-bg-panel/20">
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                    {/* Header */}
                    <header className="flex flex-col gap-2 border-b border-border-subtle pb-8">
                        <h1 className="text-3xl font-medium tracking-tight text-text-bright">Agent Swarm</h1>
                        <p className="text-text-secondary text-sm">
                            Status and performance metrics of autonomous agents in your system.
                        </p>
                    </header>

                    {/* Agent Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {agents.map((agent) => (
                            <div key={agent.id} className="group border border-border-subtle bg-bg-panel hover:border-border-strong hover:bg-bg-active/20 rounded-lg p-6 transition-all cursor-pointer">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium text-text-bright group-hover:text-accent-brand transition-colors mb-1">
                                            {agent.name}
                                        </h3>
                                        <span className={`text-xs font-mono ${getStatusColor(agent.status)}`}>
                                            <span className="mr-2">
                                                {agent.status === "active" ? "●" : "○"}
                                            </span>
                                            {agent.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-border-subtle">
                                    <div>
                                        <span className="text-xs font-mono text-text-dim uppercase tracking-widest block mb-1">Tasks Processed</span>
                                        <span className="text-2xl font-mono font-medium text-text-bright">{agent.tasks_processed}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-mono text-text-dim uppercase tracking-widest block mb-1">Success Rate</span>
                                        <span className="text-2xl font-mono font-medium text-status-active">{agent.success_rate}%</span>
                                    </div>
                                </div>

                                {/* Last Action */}
                                <div>
                                    <span className="text-xs font-mono text-text-dim uppercase tracking-widest block mb-2">Last Action</span>
                                    <p className="text-sm text-text-secondary leading-relaxed">{agent.last_action}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {agents.length === 0 && (
                        <div className="flex items-center justify-center py-12 border border-border-subtle rounded-lg">
                            <span className="text-text-dim text-sm">No agents available</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
