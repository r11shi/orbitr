"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

type Insight = {
    id: string
    event_type: string
    severity: string
    summary: string
    source: string
    timestamp: number
    risk_score?: number
}

type Agent = {
    id: string
    name: string
    status: string
    lastActive?: string
}

export default function DashboardPage() {
    const [insights, setInsights] = useState<Insight[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [workflows, setWorkflows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [insightsRes, agentsRes, workflowsRes] = await Promise.all([
                    api.getInsights({ limit: 20 }),
                    api.getAgentStatus(),
                    api.getWorkflows()
                ])

                setInsights((insightsRes.data as any)?.insights || [])
                setAgents((agentsRes.data as any)?.agents || [])
                setWorkflows((workflowsRes.data as any)?.workflows || [])
            } catch (e) {
                console.error("Failed to fetch data", e)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

    const severityColors: Record<string, string> = {
        Critical: "bg-red-500/20 text-red-400 border-red-500/50",
        High: "bg-orange-500/20 text-orange-400 border-orange-500/50",
        Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
        Low: "bg-green-500/20 text-green-400 border-green-500/50"
    }

    const stats = {
        critical: insights.filter(i => i.severity === "Critical").length,
        high: insights.filter(i => i.severity === "High").length,
        medium: insights.filter(i => i.severity === "Medium").length,
        low: insights.filter(i => i.severity === "Low").length,
        activeAgents: agents.filter(a => a.status === "active").length,
        totalAgents: agents.length,
        activeWorkflows: workflows.filter(w => w.status === "in_progress").length
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
                    <span className="text-cyan-500 font-mono text-sm animate-pulse">LOADING DASHBOARD...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-6 font-mono">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-cyan-400">ORBITER DASHBOARD</h1>
                        <p className="text-gray-500 text-sm">Real-time SDLC Compliance & Monitoring</p>
                    </div>
                    <a href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        ← Back to Live Feed
                    </a>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                        <div className="text-3xl font-bold text-red-400">{stats.critical}</div>
                        <div className="text-xs text-red-300 uppercase">Critical</div>
                    </div>
                    <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
                        <div className="text-3xl font-bold text-orange-400">{stats.high}</div>
                        <div className="text-xs text-orange-300 uppercase">High</div>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                        <div className="text-3xl font-bold text-yellow-400">{stats.medium}</div>
                        <div className="text-xs text-yellow-300 uppercase">Medium</div>
                    </div>
                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                        <div className="text-3xl font-bold text-green-400">{stats.low}</div>
                        <div className="text-xs text-green-300 uppercase">Low</div>
                    </div>
                    <div className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-4">
                        <div className="text-3xl font-bold text-cyan-400">{stats.activeAgents}/{stats.totalAgents}</div>
                        <div className="text-xs text-cyan-300 uppercase">Agents</div>
                    </div>
                    <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                        <div className="text-3xl font-bold text-purple-400">{stats.activeWorkflows}</div>
                        <div className="text-xs text-purple-300 uppercase">Workflows</div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                        <div className="text-3xl font-bold text-blue-400">{insights.length}</div>
                        <div className="text-xs text-blue-300 uppercase">Total Events</div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Recent Insights */}
                    <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-cyan-400 mb-4">Recent Insights</h2>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {insights.slice(0, 15).map((insight) => (
                                <a
                                    key={insight.id}
                                    href={`/?id=${insight.id}`}
                                    className="block bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-cyan-600 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-xs font-bold border",
                                                    severityColors[insight.severity] || "bg-gray-700 text-gray-300"
                                                )}>
                                                    {insight.severity}
                                                </span>
                                                <span className="text-xs text-gray-500">{insight.event_type}</span>
                                            </div>
                                            <p className="text-sm text-gray-200">{insight.summary}</p>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Agent: {insight.source} • {new Date(insight.timestamp * 1000).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                            {insights.length === 0 && (
                                <div className="text-gray-500 text-center py-8">
                                    No insights yet. Run a demo to generate data.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Agents Panel */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-cyan-400 mb-4">Agent Status</h2>
                        <div className="space-y-2">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={cn(
                                        "p-3 rounded-lg border",
                                        agent.status === "active"
                                            ? "bg-green-900/20 border-green-800"
                                            : "bg-gray-800/50 border-gray-700"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-200">{agent.name}</span>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded",
                                            agent.status === "active"
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-600 text-gray-300"
                                        )}>
                                            {agent.status}
                                        </span>
                                    </div>
                                    {agent.lastActive && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Last: {agent.lastActive}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h3 className="text-sm font-bold text-gray-400 mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => fetch("http://localhost:8000/simulation/quick-demo", { method: "POST" })}
                                    className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
                                >
                                    Run Demo
                                </button>
                                <button
                                    onClick={() => fetch("http://localhost:8000/simulation/reset", { method: "POST" })}
                                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
                                >
                                    Clear Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
