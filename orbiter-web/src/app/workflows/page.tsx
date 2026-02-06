"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    ActivityLogIcon,
    ArrowRightIcon,
    ReloadIcon,
    CheckCircledIcon,
    ExclamationTriangleIcon,
    CrossCircledIcon
} from "@radix-ui/react-icons"
import { api } from "@/lib/api"

interface Workflow {
    id: string
    name: string
    status: "healthy" | "warning" | "failed" | "pending"
    lastRun: string
    successRate: number
    avgDuration: string
    source?: string
}

export default function WorkflowsPage() {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [workflows, setWorkflows] = useState<Workflow[]>([])

    useEffect(() => {
        setMounted(true)
        fetchWorkflows()
    }, [])

    async function fetchWorkflows() {
        setLoading(true)
        try {
            const response = await api.getWorkflows()
            const data = response.data as any
            if (data?.workflows) {
                setWorkflows(data.workflows.map((w: any) => ({
                    id: w.id,
                    name: w.name || `Workflow ${w.id}`,
                    status: w.status || "pending",
                    lastRun: formatTime(w.last_run || w.created_at),
                    successRate: w.success_rate || 0,
                    avgDuration: w.avg_duration || "N/A",
                    source: w.source
                })))
            } else {
                // Default empty state
                setWorkflows([])
            }
        } catch (error) {
            console.error("Failed to fetch workflows:", error)
        } finally {
            setLoading(false)
        }
    }

    function formatTime(ts: any): string {
        if (!ts) return "Never"
        try {
            const date = new Date(ts)
            const now = new Date()
            const diff = now.getTime() - date.getTime()
            const mins = Math.floor(diff / 60000)

            if (mins < 1) return "Just now"
            if (mins < 60) return `${mins}m ago`
            const hours = Math.floor(mins / 60)
            if (hours < 24) return `${hours}h ago`
            return date.toLocaleDateString()
        } catch {
            return "Unknown"
        }
    }

    if (!mounted) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <span className="font-mono text-xs text-text-dim animate-pulse">LOADING WORKFLOWS...</span>
            </div>
        )
    }

    const healthyCount = workflows.filter(w => w.status === "healthy").length
    const warningCount = workflows.filter(w => w.status === "warning").length
    const failedCount = workflows.filter(w => w.status === "failed").length

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">Workflows</h1>
                    <button
                        onClick={fetchWorkflows}
                        disabled={loading}
                        className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ReloadIcon className={cn("w-3 h-3", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
                <p className="text-text-secondary text-sm max-w-3xl">
                    Monitor compliance workflows and state machine transitions.
                </p>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                    <div className="flex items-center gap-2 text-status-active mb-2">
                        <CheckCircledIcon className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Healthy</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{healthyCount}</div>
                </div>
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                    <div className="flex items-center gap-2 text-status-warn mb-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Warning</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{warningCount}</div>
                </div>
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                    <div className="flex items-center gap-2 text-status-alert mb-2">
                        <CrossCircledIcon className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Failed</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{failedCount}</div>
                </div>
            </div>

            {/* Workflows List */}
            <div className="border border-border-subtle rounded-lg bg-bg-panel overflow-hidden">
                {loading && workflows.length === 0 ? (
                    <div className="p-8 text-center text-text-dim text-sm">
                        Loading workflows...
                    </div>
                ) : workflows.length === 0 ? (
                    <div className="p-8 text-center">
                        <ActivityLogIcon className="w-8 h-8 text-text-dim mx-auto mb-3" />
                        <p className="text-text-dim text-sm mb-2">No active workflows</p>
                        <p className="text-xs text-text-secondary">
                            Workflows are created automatically when events trigger compliance checks.
                            Start the simulation to generate test workflows.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-subtle">
                        {workflows.map((workflow) => (
                            <Link
                                key={workflow.id}
                                href={`/workflows/${workflow.id}`}
                                className="flex items-center justify-between p-4 hover:bg-bg-active/30 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status Indicator */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center border",
                                        workflow.status === "healthy" && "bg-status-active/10 border-status-active/30",
                                        workflow.status === "warning" && "bg-status-warn/10 border-status-warn/30",
                                        workflow.status === "failed" && "bg-status-alert/10 border-status-alert/30",
                                        workflow.status === "pending" && "bg-bg-active border-border-subtle"
                                    )}>
                                        <ActivityLogIcon className={cn(
                                            "w-5 h-5",
                                            workflow.status === "healthy" && "text-status-active",
                                            workflow.status === "warning" && "text-status-warn",
                                            workflow.status === "failed" && "text-status-alert",
                                            workflow.status === "pending" && "text-text-dim"
                                        )} />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-text-bright group-hover:text-accent-brand transition-colors">
                                            {workflow.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                                            <span className="font-mono">{workflow.id}</span>
                                            {workflow.source && (
                                                <span className="px-1.5 py-0.5 bg-bg-active rounded text-[10px]">
                                                    {workflow.source}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-text-dim">Last Run</div>
                                        <div className="text-sm font-mono text-text-primary">{workflow.lastRun}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-text-dim">Success Rate</div>
                                        <div className={cn(
                                            "text-sm font-mono",
                                            workflow.successRate >= 95 ? "text-status-active" :
                                                workflow.successRate >= 80 ? "text-status-warn" : "text-status-alert"
                                        )}>
                                            {workflow.successRate}%
                                        </div>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 text-text-dim group-hover:text-text-primary transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
