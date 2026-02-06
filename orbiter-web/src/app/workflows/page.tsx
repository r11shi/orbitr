"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    ActivityLogIcon,
    ArrowRightIcon,
    ReloadIcon,
    CheckCircledIcon,
    ExclamationTriangleIcon,
    CrossCircledIcon,
    PlayIcon,
    LockOpen1Icon,
    ResetIcon,
    CheckIcon,
    Cross1Icon
} from "@radix-ui/react-icons"
import { api } from "@/lib/api"
import { WorkflowTimeline } from "@/components/workflows/workflow-timeline"
import { motion, AnimatePresence } from "framer-motion"

interface Workflow {
    id: string
    name: string
    status: "healthy" | "warning" | "failed" | "pending" | "blocked"
    lastRun: string
    successRate: number
    avgDuration: string
    source?: string
    current_step?: number
    total_steps?: number
    rawStatus?: string
}

export default function WorkflowsPage() {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const fetchWorkflows = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const response = await api.getWorkflows()
            const data = response.data as any
            if (data?.workflows) {
                setWorkflows(data.workflows.map((w: any) => {
                    const statusMap: Record<string, "healthy" | "warning" | "failed" | "pending" | "blocked"> = {
                        "completed": "healthy",
                        "approved": "healthy",
                        "in_progress": "warning",
                        "awaiting_approval": "warning",
                        "pending": "pending",
                        "rejected": "failed",
                        "escalated": "failed",
                        "blocked": "blocked",
                        "failed": "failed",
                        "expired": "failed"
                    };
                    const steps = w.steps || []
                    return {
                        id: w.workflow_id || w.id,
                        name: w.workflow_type ? w.workflow_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : `Workflow`,
                        status: statusMap[w.status] || "pending",
                        rawStatus: w.status,
                        lastRun: formatTime(w.updated_at * 1000),
                        successRate: w.status === "completed" ? 100 : w.status === "pending" ? 0 : 50,
                        avgDuration: "N/A",
                        source: w.metadata?.scenario || w.workflow_type,
                        current_step: w.current_step || 0,
                        total_steps: steps.length || 4
                    };
                }))
                setLastUpdated(new Date())
            } else {
                setWorkflows([])
            }
        } catch (error) {
            console.error("Failed to fetch workflows:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        setMounted(true)
        fetchWorkflows()
    }, [fetchWorkflows])

    // Auto-refresh every 5 seconds
    useEffect(() => {
        if (!autoRefresh) return
        const interval = setInterval(() => fetchWorkflows(true), 5000)
        return () => clearInterval(interval)
    }, [autoRefresh, fetchWorkflows])

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

    async function handleAdvance(workflowId: string, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setActionLoading(workflowId)
        try {
            const res = await fetch(`http://localhost:8000/workflows/${workflowId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor_id: 'admin' })
            })
            if (!res.ok) throw new Error('Failed to advance')
            await fetchWorkflows(true)
        } catch (error) {
            console.error("Advance failed:", error)
        } finally {
            setActionLoading(null)
        }
    }

    async function handleReject(workflowId: string, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setActionLoading(workflowId)
        try {
            await fetch(`http://localhost:8000/workflows/${workflowId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Rejected by admin' })
            })
            await fetchWorkflows(true)
        } catch (error) {
            console.error("Reject failed:", error)
        } finally {
            setActionLoading(null)
        }
    }

    async function handleUnblock(workflowId: string, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setActionLoading(workflowId)
        try {
            await fetch(`http://localhost:8000/workflows/${workflowId}/unblock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ override_reason: 'Admin override' })
            })
            await fetchWorkflows(true)
        } catch (error) {
            console.error("Unblock failed:", error)
        } finally {
            setActionLoading(null)
        }
    }

    async function handleReset(workflowId: string, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setActionLoading(workflowId)
        try {
            await fetch(`http://localhost:8000/workflows/${workflowId}/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            await fetchWorkflows(true)
        } catch (error) {
            console.error("Reset failed:", error)
        } finally {
            setActionLoading(null)
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
    const warningCount = workflows.filter(w => w.status === "warning" || w.status === "pending").length
    const failedCount = workflows.filter(w => w.status === "failed" || w.status === "blocked").length

    // Helper to check if workflow can be advanced
    const canAdvance = (workflow: Workflow) => {
        return ["pending", "warning"].includes(workflow.status) &&
            !["completed", "rejected", "expired"].includes(workflow.rawStatus || "")
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">Workflows</h1>
                    <div className="flex items-center gap-4">
                        {/* Auto-refresh toggle */}
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono transition-all",
                                autoRefresh
                                    ? "bg-status-active/10 text-status-active border border-status-active/20"
                                    : "bg-bg-active text-text-dim border border-border-subtle"
                            )}
                        >
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                autoRefresh ? "bg-status-active animate-pulse" : "bg-text-dim"
                            )} />
                            {autoRefresh ? "LIVE" : "PAUSED"}
                        </button>

                        {lastUpdated && (
                            <span className="text-[10px] text-text-dim font-mono">
                                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}

                        <button
                            onClick={() => fetchWorkflows(false)}
                            disabled={loading}
                            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ReloadIcon className={cn("w-3 h-3", loading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
                </div>
                <p className="text-text-secondary text-sm max-w-3xl">
                    Monitor compliance workflows and state machine transitions. Use actions to progress or unblock workflows.
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
                        <AnimatePresence>
                            {workflows.map((workflow, idx) => (
                                <motion.div
                                    key={workflow.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <Link
                                        href={`/workflows/${workflow.id}`}
                                        className="flex flex-col gap-3 p-4 hover:bg-bg-active/30 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Status Indicator */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center border",
                                                    workflow.status === "healthy" && "bg-status-active/10 border-status-active/30",
                                                    workflow.status === "warning" && "bg-status-warn/10 border-status-warn/30",
                                                    (workflow.status === "failed" || workflow.status === "blocked") && "bg-status-alert/10 border-status-alert/30",
                                                    workflow.status === "pending" && "bg-bg-active border-border-subtle"
                                                )}>
                                                    <ActivityLogIcon className={cn(
                                                        "w-5 h-5",
                                                        workflow.status === "healthy" && "text-status-active",
                                                        workflow.status === "warning" && "text-status-warn",
                                                        (workflow.status === "failed" || workflow.status === "blocked") && "text-status-alert",
                                                        workflow.status === "pending" && "text-text-dim"
                                                    )} />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-medium text-text-bright group-hover:text-accent-brand transition-colors">
                                                        {workflow.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                                                        <span className="font-mono text-[10px]">{workflow.id.slice(0, 8)}...</span>
                                                        {workflow.source && (
                                                            <span className="px-1.5 py-0.5 bg-bg-active rounded text-[10px]">
                                                                {workflow.source}
                                                            </span>
                                                        )}
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                            workflow.status === "healthy" && "bg-status-active/20 text-status-active",
                                                            workflow.status === "warning" && "bg-status-warn/20 text-status-warn",
                                                            workflow.status === "failed" && "bg-status-alert/20 text-status-alert",
                                                            workflow.status === "blocked" && "bg-status-alert/20 text-status-alert",
                                                            workflow.status === "pending" && "bg-bg-active text-text-dim"
                                                        )}>
                                                            {workflow.rawStatus || workflow.status}
                                                        </span>
                                                        <span className="text-text-dim">
                                                            Step {workflow.current_step || 0}/{workflow.total_steps || 4}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                                                    {/* Advance - show for pending, warning, awaiting_approval */}
                                                    {canAdvance(workflow) && (
                                                        <button
                                                            onClick={(e) => handleAdvance(workflow.id, e)}
                                                            disabled={actionLoading === workflow.id}
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                                                                "bg-status-active/10 text-status-active border border-status-active/30 hover:bg-status-active/20",
                                                                actionLoading === workflow.id && "opacity-50 cursor-wait"
                                                            )}
                                                        >
                                                            {actionLoading === workflow.id ? (
                                                                <ReloadIcon className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <PlayIcon className="w-3 h-3" />
                                                            )}
                                                            Advance
                                                        </button>
                                                    )}

                                                    {/* Reject - show for pending/warning */}
                                                    {canAdvance(workflow) && (
                                                        <button
                                                            onClick={(e) => handleReject(workflow.id, e)}
                                                            disabled={actionLoading === workflow.id}
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-all",
                                                                "bg-status-alert/10 text-status-alert border border-status-alert/30 hover:bg-status-alert/20",
                                                                actionLoading === workflow.id && "opacity-50"
                                                            )}
                                                        >
                                                            <Cross1Icon className="w-3 h-3" />
                                                        </button>
                                                    )}

                                                    {/* Unblock - show for blocked */}
                                                    {workflow.status === "blocked" && (
                                                        <button
                                                            onClick={(e) => handleUnblock(workflow.id, e)}
                                                            disabled={actionLoading === workflow.id}
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                                                                "bg-accent-brand/10 text-accent-brand border border-accent-brand/30 hover:bg-accent-brand/20",
                                                                actionLoading === workflow.id && "opacity-50"
                                                            )}
                                                        >
                                                            <LockOpen1Icon className="w-3 h-3" />
                                                            Unblock
                                                        </button>
                                                    )}

                                                    {/* Reset - show for failed, blocked, escalated */}
                                                    {(workflow.status === "failed" || workflow.status === "blocked" ||
                                                        workflow.rawStatus === "escalated" || workflow.rawStatus === "rejected") && (
                                                            <button
                                                                onClick={(e) => handleReset(workflow.id, e)}
                                                                disabled={actionLoading === workflow.id}
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all",
                                                                    "bg-bg-active text-text-secondary border border-border-subtle hover:text-text-primary",
                                                                    actionLoading === workflow.id && "opacity-50"
                                                                )}
                                                            >
                                                                <ResetIcon className="w-3 h-3" />
                                                                Reset
                                                            </button>
                                                        )}
                                                </div>

                                                <div className="text-right min-w-[80px]">
                                                    <div className="text-xs text-text-dim">Last Run</div>
                                                    <div className="text-sm font-mono text-text-primary">{workflow.lastRun}</div>
                                                </div>
                                                <div className="text-right min-w-[80px]">
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
                                        </div>

                                        {/* Workflow Timeline */}
                                        <div className="ml-14 mt-1">
                                            <WorkflowTimeline
                                                currentStep={workflow.current_step ?? (
                                                    workflow.status === "healthy" ? 4 :
                                                        workflow.status === "warning" ? 2 :
                                                            workflow.status === "failed" ? 1 : 0
                                                )}
                                            />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
