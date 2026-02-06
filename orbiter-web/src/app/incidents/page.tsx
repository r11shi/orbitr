"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    ExclamationTriangleIcon,
    CheckCircledIcon,
    CrossCircledIcon,
    LightningBoltIcon,
    InfoCircledIcon,
    ClockIcon,
    PersonIcon
} from "@radix-ui/react-icons"

interface Incident {
    id: string
    title: string
    severity: "critical" | "high" | "medium" | "low"
    timestamp: string
    status: "active" | "investigating" | "resolved"
    agents: string[]
    affectedWorkflows: string[]
    findings: number
    rootCause?: string
}

export default function IncidentsPage() {
    const [incidents] = useState<Incident[]>([
        {
            id: "INC-9942",
            title: "Unexpected Latency Spike in Payment Service",
            severity: "critical",
            timestamp: "10:32 AM",
            status: "active",
            agents: ["Security Watchdog", "Infrastructure Monitor", "Pattern Detective"],
            affectedWorkflows: ["Payment Processing Pipeline"],
            findings: 8,
            rootCause: "Database connection pool exhaustion detected"
        },
        {
            id: "INC-9941",
            title: "Unauthorized Access Attempt Blocked",
            severity: "high",
            timestamp: "09:15 AM",
            status: "resolved",
            agents: ["Security Watchdog"],
            affectedWorkflows: ["API Gateway Health Check"],
            findings: 3
        },
        {
            id: "INC-9940",
            title: "Compliance Policy Update Detected",
            severity: "low",
            timestamp: "Yesterday",
            status: "resolved",
            agents: ["Compliance Sentinel"],
            affectedWorkflows: ["Audit Log Archival"],
            findings: 1
        },
        {
            id: "INC-9939",
            title: "Memory Leak Pattern in Worker Nodes",
            severity: "medium",
            timestamp: "2 days ago",
            status: "investigating",
            agents: ["Pattern Detective", "Resource Auditor"],
            affectedWorkflows: ["Data Sync & Backup", "Deployment Automation"],
            findings: 12,
            rootCause: "Gradual memory accumulation in background task handler"
        },
        {
            id: "INC-9938",
            title: "Rate Limit Threshold Exceeded",
            severity: "medium",
            timestamp: "3 days ago",
            status: "resolved",
            agents: ["Security Watchdog"],
            affectedWorkflows: ["API Gateway Health Check"],
            findings: 2
        }
    ])

    const getSeverityConfig = (severity: string) => {
        switch (severity) {
            case "critical":
                return {
                    color: "text-status-alert",
                    bg: "bg-status-alert/10",
                    border: "border-status-alert/20",
                    dot: "bg-status-alert",
                    label: "Critical"
                }
            case "high":
                return {
                    color: "text-red-500",
                    bg: "bg-red-500/10",
                    border: "border-red-500/20",
                    dot: "bg-red-500",
                    label: "High"
                }
            case "medium":
                return {
                    color: "text-status-warn",
                    bg: "bg-status-warn/10",
                    border: "border-status-warn/20",
                    dot: "bg-status-warn",
                    label: "Medium"
                }
            default:
                return {
                    color: "text-status-idle",
                    bg: "bg-status-idle/10",
                    border: "border-status-idle/20",
                    dot: "bg-status-idle",
                    label: "Low"
                }
        }
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "active":
                return { color: "text-status-alert", icon: LightningBoltIcon, pulse: true }
            case "investigating":
                return { color: "text-status-warn", icon: InfoCircledIcon, pulse: false }
            default:
                return { color: "text-status-active", icon: CheckCircledIcon, pulse: false }
        }
    }

    const activeIncidents = incidents.filter(i => i.status === "active")
    const investigatingIncidents = incidents.filter(i => i.status === "investigating")
    const resolvedIncidents = incidents.filter(i => i.status === "resolved")

    return (
        <div className="w-full max-w-none px-4 md:px-6 py-6 space-y-6">
            {/* Header */}
            <header className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">Incident Analysis</h1>
                    <div className="flex items-center gap-4">
                        {activeIncidents.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-alert/10 border border-status-alert/20">
                                <span className="w-2 h-2 rounded-full bg-status-alert animate-pulse" />
                                <span className="text-xs font-mono text-status-alert">{activeIncidents.length} Active</span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-text-secondary text-sm max-w-3xl">
                    Real-time incident detection with automated root cause analysis and agent-driven investigation.
                </p>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <LightningBoltIcon className="w-3 h-3 text-status-alert" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Active Now</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{activeIncidents.length}</div>
                </div>
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <InfoCircledIcon className="w-3 h-3 text-status-warn" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Investigating</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{investigatingIncidents.length}</div>
                </div>
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircledIcon className="w-3 h-3 text-status-active" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Resolved</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{resolvedIncidents.length}</div>
                </div>
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="w-3 h-3 text-text-dim" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Avg Resolution</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">2.4h</div>
                </div>
            </div>

            {/* Incident Timeline */}
            <div className="border border-border-subtle rounded-lg bg-bg-panel overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle bg-bg-active/20">
                    <h2 className="text-sm font-semibold text-text-bright">Incident Timeline</h2>
                </div>

                <div className="divide-y divide-border-subtle">
                    {incidents.map((incident) => {
                        const severityConfig = getSeverityConfig(incident.severity)
                        const statusConfig = getStatusConfig(incident.status)
                        const StatusIcon = statusConfig.icon

                        return (
                            <Link
                                key={incident.id}
                                href={`/incidents/${incident.id}`}
                                className="block p-5 hover:bg-bg-active/30 transition-colors group"
                            >
                                <div className="flex items-start gap-6">
                                    {/* Status Indicator */}
                                    <div className="flex flex-col items-center pt-1">
                                        <StatusIcon className={cn("w-5 h-5", statusConfig.color, statusConfig.pulse && "animate-pulse")} />
                                        <div className={cn("w-px h-full mt-2 bg-border-subtle", statusConfig.pulse && "opacity-50")} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <h3 className="font-medium text-text-bright group-hover:text-accent-brand transition-colors">
                                                        {incident.title}
                                                    </h3>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-mono",
                                                        severityConfig.color,
                                                        severityConfig.bg,
                                                        severityConfig.border
                                                    )}>
                                                        <span className={cn("inline-block w-1 h-1 rounded-full mr-1.5", severityConfig.dot)} />
                                                        {severityConfig.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-text-secondary">
                                                    <span className="font-mono">{incident.id}</span>
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {incident.timestamp}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Root Cause (if available) */}
                                        {incident.rootCause && (
                                            <div className="mb-3 p-3 rounded bg-bg-active/40 border border-border-subtle">
                                                <div className="flex items-start gap-2">
                                                    <LightningBoltIcon className="w-3 h-3 text-accent-brand mt-0.5" />
                                                    <div>
                                                        <span className="text-xs font-medium text-text-bright block mb-1">Root Cause Identified</span>
                                                        <p className="text-xs text-text-secondary">{incident.rootCause}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Metadata Grid */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1.5">Analyzing Agents</span>
                                                <div className="flex -space-x-1">
                                                    {incident.agents.slice(0, 3).map((agent, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-7 h-7 rounded-full bg-bg-void border-2 border-bg-panel flex items-center justify-center text-[10px] font-mono text-text-secondary"
                                                            title={agent}
                                                        >
                                                            {agent.charAt(0)}
                                                        </div>
                                                    ))}
                                                    {incident.agents.length > 3 && (
                                                        <div className="w-7 h-7 rounded-full bg-bg-active border-2 border-bg-panel flex items-center justify-center text-[10px] font-mono text-text-dim">
                                                            +{incident.agents.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1.5">Findings</span>
                                                <span className="text-sm font-mono text-text-primary">{incident.findings} detected</span>
                                            </div>

                                            <div>
                                                <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1.5">Affected Workflows</span>
                                                <span className="text-sm font-mono text-text-primary">{incident.affectedWorkflows.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
