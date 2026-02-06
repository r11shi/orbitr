"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeftIcon, ClockIcon, LightningBoltIcon, CheckCircledIcon, ReloadIcon, PlayIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

interface WorkflowStep {
    name: string
    status: "completed" | "in_progress" | "pending" | "failed"
    description: string
    agent?: string
    timestamp?: string
}

interface WorkflowData {
    workflow_id: string
    workflow_type: string
    status: string
    current_step: number
    steps: WorkflowStep[]
    metadata: Record<string, any>
    requester_id?: string
    created_at?: string
    updated_at?: string
}

export default function WorkflowDetailPage() {
    const params = useParams()
    const id = params.id as string
    const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const fetchWorkflow = useCallback(async () => {
        try {
            const response = await api.getWorkflowDetail(id)
            if (response.data) {
                setWorkflow(response.data as WorkflowData)
            }
        } catch (error) {
            console.error("Failed to fetch workflow:", error)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchWorkflow()
        const interval = setInterval(fetchWorkflow, 5000)
        return () => clearInterval(interval)
    }, [fetchWorkflow])

    const handleAdvance = async () => {
        setActionLoading(true)
        try {
            await api.advanceWorkflow(id, "approve")
            await fetchWorkflow()
        } catch (error) {
            console.error("Failed to advance:", error)
        } finally {
            setActionLoading(false)
        }
    }

    // Default steps for display
    const defaultSteps: WorkflowStep[] = [
        { name: "Request Submitted", status: "completed", description: "Workflow initiated by user", agent: "System" },
        { name: "Risk Assessment", status: "completed", description: "Automated compliance check", agent: "Compliance Sentinel" },
        { name: "Approval Required", status: "in_progress", description: "Waiting for manager approval", agent: "Supervisor" },
        { name: "Deployment", status: "pending", description: "Deploy to production", agent: "Infrastructure Monitor" }
    ]

    const steps = workflow?.steps?.length ? workflow.steps : defaultSteps
    const currentStep = workflow?.current_step || 2
    const workflowStatus = workflow?.status || "pending"
    const workflowType = workflow?.workflow_type || "Change Approval"
    const metadata = workflow?.metadata || {}

    const getStepStatus = (index: number): "completed" | "in_progress" | "pending" | "failed" => {
        if (workflowStatus === "failed" || workflowStatus === "escalated") {
            if (index < currentStep) return "completed"
            if (index === currentStep) return "failed"
            return "pending"
        }
        if (index < currentStep) return "completed"
        if (index === currentStep) return "in_progress"
        return "pending"
    }

    const statusColor = {
        completed: "bg-status-active",
        in_progress: "bg-status-warn animate-pulse",
        pending: "bg-bg-active",
        failed: "bg-status-alert"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent-brand border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-xs text-text-dim">Loading workflow...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-none px-6 md:px-8 py-6 space-y-8">
            <Link href="/workflows" className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors">
                <ArrowLeftIcon className="mr-2 w-4 h-4" />
                Back to Workflows
            </Link>

            <header className="flex items-center justify-between border-b border-border-subtle pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-text-bright capitalize">
                            {workflowType.replace(/_/g, " ")}
                        </h1>
                        <span className="font-mono text-xs text-text-dim px-2 py-0.5 border border-border-subtle rounded">
                            {id.slice(0, 8)}...
                        </span>
                    </div>
                    <p className="text-text-secondary text-sm max-w-2xl">
                        {metadata.reason || "Compliance workflow monitoring with automated policy enforcement."}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {workflowStatus === "pending" && (
                        <button
                            onClick={handleAdvance}
                            disabled={actionLoading}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                "bg-accent-brand text-bg-void hover:bg-accent-brand/90",
                                actionLoading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <PlayIcon className="w-4 h-4" />
                            Approve & Advance
                        </button>
                    )}
                    <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-text-dim font-mono">Current State</span>
                        <StatusBadge status={workflowStatus === "completed" ? "active" : workflowStatus === "failed" ? "critical" : "warning"} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        Workflow Progress
                    </h2>

                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6">
                        <div className="relative border-l border-border-subtle ml-3 space-y-8 my-2">
                            {steps.map((step, index) => {
                                const stepStatus = getStepStatus(index)
                                return (
                                    <div key={index} className="relative pl-8">
                                        <span className={cn(
                                            "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-bg-panel",
                                            statusColor[stepStatus]
                                        )} />
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-sm font-medium text-text-bright">{step.name}</h3>
                                                <p className={cn(
                                                    "text-xs mt-1",
                                                    stepStatus === "failed" ? "text-status-alert font-medium" : "text-text-secondary"
                                                )}>
                                                    {step.description}
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono text-text-dim">
                                                {stepStatus === "in_progress" ? "In Progress..." :
                                                    stepStatus === "completed" ? "✓ Done" :
                                                        stepStatus === "failed" ? "✗ Failed" : "Pending"}
                                            </span>
                                        </div>
                                        {step.agent && (
                                            <div className="mt-2 flex gap-2">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-active border border-border-subtle text-text-dim">
                                                    {step.agent}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Workflow Info */}
                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4">
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Progress</span>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-mono text-text-bright">
                                    {Math.round((currentStep / steps.length) * 100)}%
                                </span>
                                <span className="text-xs text-text-dim pb-1">
                                    Step {currentStep} of {steps.length}
                                </span>
                            </div>
                            <div className="mt-2 h-1 bg-bg-active rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent-brand transition-all"
                                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="h-px bg-border-subtle" />
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Requester</span>
                            <div className="text-sm font-mono text-text-bright">{workflow?.requester_id || "System"}</div>
                        </div>
                    </div>

                    {/* Policy Violations */}
                    {metadata.policy_id && (
                        <div className="border border-status-alert/30 rounded-lg bg-status-alert/5 p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-status-alert flex items-center gap-2">
                                <LightningBoltIcon className="w-4 h-4" />
                                Policy Violation
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 rounded bg-bg-panel border border-border-subtle text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-status-alert font-medium text-xs">{metadata.policy_id}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary">{metadata.blocked_reason || "Policy violation detected - requires approval"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Policies */}
                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <CheckCircledIcon className="w-4 h-4" />
                            Active Policies
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <CheckCircledIcon className="w-3 h-3 text-status-active" />
                                <span>POL-001: Branch Protection</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <CheckCircledIcon className="w-3 h-3 text-status-active" />
                                <span>POL-002: Change Ticket Required</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <CheckCircledIcon className="w-3 h-3 text-status-active" />
                                <span>POL-003: Secret Detection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
