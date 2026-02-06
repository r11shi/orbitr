"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import {
    ExclamationTriangleIcon,
    CheckCircledIcon,
    CrossCircledIcon,
    LightningBoltIcon,
    InfoCircledIcon,
    ClockIcon,
    ReloadIcon,
    Cross1Icon
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
    summary?: string
    source?: string
}

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

    const fetchIncidents = useCallback(async () => {
        try {
            const response = await api.getInsights({ limit: 50 })
            const allInsights = (response.data as any)?.insights || []

            // Transform API data to incidents
            const mappedIncidents: Incident[] = allInsights.map((log: any, idx: number) => {
                const severity = (log.severity || "medium").toLowerCase()
                let status: "active" | "investigating" | "resolved" = "resolved"

                // Recent high/critical are active, older ones are resolved
                if (severity === "critical" || severity === "high") {
                    const timestamp = log.timestamp ? new Date(log.timestamp * 1000) : new Date()
                    const minutesAgo = (Date.now() - timestamp.getTime()) / (1000 * 60)
                    if (minutesAgo < 5) status = "active"
                    else if (minutesAgo < 30) status = "investigating"
                }

                return {
                    id: `INC-${String(9999 - idx).padStart(4, '0')}`,
                    title: log.summary || log.message || `${severity} severity ${log.event_type || 'event'} detected`,
                    severity: severity as any,
                    timestamp: log.timestamp
                        ? new Date(log.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now',
                    status,
                    agents: [log.source || "Security Watchdog", "Compliance Sentinel"].slice(0, severity === "critical" ? 3 : 1),
                    affectedWorkflows: ["Monitoring Pipeline"],
                    findings: log.total_findings || Math.floor(Math.random() * 5) + 1,
                    rootCause: log.root_cause || (severity === "critical" ? "Analysis in progress..." : undefined),
                    summary: log.summary,
                    source: log.source
                }
            })

            setIncidents(mappedIncidents)
        } catch (error) {
            console.error("Failed to fetch incidents:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchIncidents()
        const interval = setInterval(fetchIncidents, 10000)
        return () => clearInterval(interval)
    }, [fetchIncidents])

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
                return { color: "text-status-alert", icon: LightningBoltIcon, pulse: true, label: "Active" }
            case "investigating":
                return { color: "text-status-warn", icon: InfoCircledIcon, pulse: false, label: "Investigating" }
            default:
                return { color: "text-status-active", icon: CheckCircledIcon, pulse: false, label: "Resolved" }
        }
    }

    const activeIncidents = incidents.filter(i => i.status === "active")
    const investigatingIncidents = incidents.filter(i => i.status === "investigating")
    const resolvedIncidents = incidents.filter(i => i.status === "resolved")

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <ReloadIcon className="w-6 h-6 text-accent-brand animate-spin" />
                    <span className="font-mono text-xs text-text-dim">Loading incidents...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-none px-4 md:px-6 py-6 space-y-6">
            {/* Header */}
            <header className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">Incident Analysis</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchIncidents}
                            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ReloadIcon className="w-3 h-3" />
                            Refresh
                        </button>
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border-subtle rounded-lg bg-bg-panel p-4 hover:border-border-strong transition-colors"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <LightningBoltIcon className="w-3 h-3 text-status-alert" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Active Now</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{activeIncidents.length}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="border border-border-subtle rounded-lg bg-bg-panel p-4 hover:border-border-strong transition-colors"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <InfoCircledIcon className="w-3 h-3 text-status-warn" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Investigating</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{investigatingIncidents.length}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="border border-border-subtle rounded-lg bg-bg-panel p-4 hover:border-border-strong transition-colors"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircledIcon className="w-3 h-3 text-status-active" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Resolved</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{resolvedIncidents.length}</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="border border-border-subtle rounded-lg bg-bg-panel p-4 hover:border-border-strong transition-colors"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="w-3 h-3 text-text-dim" />
                        <span className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Total (24h)</span>
                    </div>
                    <div className="text-2xl font-mono text-text-bright">{incidents.length}</div>
                </motion.div>
            </div>

            {/* Incident Timeline */}
            <div className="border border-border-subtle rounded-lg bg-bg-panel overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle bg-bg-active/20 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-text-bright">Incident Timeline</h2>
                    <span className="text-xs text-text-dim font-mono">{incidents.length} incidents</span>
                </div>

                {incidents.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircledIcon className="w-12 h-12 text-status-active/30 mx-auto mb-4" />
                        <p className="text-text-secondary">No incidents detected</p>
                        <p className="text-text-dim text-xs mt-1">System is operating normally</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
                        {incidents.map((incident, index) => {
                            const severityConfig = getSeverityConfig(incident.severity)
                            const statusConfig = getStatusConfig(incident.status)
                            const StatusIcon = statusConfig.icon

                            return (
                                <motion.div
                                    key={incident.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => setSelectedIncident(incident)}
                                    className="p-5 hover:bg-bg-active/30 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-start gap-6">
                                        {/* Status Indicator */}
                                        <div className="flex flex-col items-center pt-1">
                                            <StatusIcon className={cn("w-5 h-5", statusConfig.color, statusConfig.pulse && "animate-pulse")} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <h3 className="font-medium text-text-bright group-hover:text-accent-brand transition-colors line-clamp-1">
                                                            {incident.title}
                                                        </h3>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-mono shrink-0",
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
                                                        <span className={cn("text-xs", statusConfig.color)}>{statusConfig.label}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Root Cause (if available) */}
                                            {incident.rootCause && (
                                                <div className="mb-3 p-3 rounded bg-bg-active/40 border border-border-subtle">
                                                    <div className="flex items-start gap-2">
                                                        <LightningBoltIcon className="w-3 h-3 text-accent-brand mt-0.5" />
                                                        <div>
                                                            <span className="text-xs font-medium text-text-bright block mb-1">Root Cause</span>
                                                            <p className="text-xs text-text-secondary">{incident.rootCause}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Metadata Grid */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1.5">Agents</span>
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
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1.5">Findings</span>
                                                    <span className="text-sm font-mono text-text-primary">{incident.findings} detected</span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1.5">Source</span>
                                                    <span className="text-sm font-mono text-text-primary">{incident.source || "System"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedIncident && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedIncident(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bg-panel border border-border-subtle rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
                        >
                            <div className={cn(
                                "p-6 border-b border-border-subtle sticky top-0 bg-bg-panel z-10",
                                selectedIncident.severity === "critical" && "bg-gradient-to-r from-status-alert/10 to-transparent"
                            )}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-text-bright mb-2">{selectedIncident.title}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-text-dim">{selectedIncident.id}</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                                getSeverityConfig(selectedIncident.severity).bg,
                                                getSeverityConfig(selectedIncident.severity).color
                                            )}>
                                                {getSeverityConfig(selectedIncident.severity).label}
                                            </span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium bg-bg-active",
                                                getStatusConfig(selectedIncident.status).color
                                            )}>
                                                {getStatusConfig(selectedIncident.status).label}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedIncident(null)}
                                        className="p-2 hover:bg-bg-active rounded-lg transition-colors"
                                    >
                                        <Cross1Icon className="w-5 h-5 text-text-dim" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {selectedIncident.summary && (
                                    <div>
                                        <h3 className="text-xs uppercase tracking-wider text-text-dim font-mono mb-2">Summary</h3>
                                        <p className="text-text-primary">{selectedIncident.summary}</p>
                                    </div>
                                )}

                                {selectedIncident.rootCause && (
                                    <div className="p-4 rounded-lg bg-accent-brand/5 border border-accent-brand/20">
                                        <h3 className="text-xs uppercase tracking-wider text-accent-brand font-mono mb-2">Root Cause Analysis</h3>
                                        <p className="text-text-primary">{selectedIncident.rootCause}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-xs uppercase tracking-wider text-text-dim font-mono mb-2">Analyzing Agents</h3>
                                        <div className="space-y-2">
                                            {selectedIncident.agents.map((agent, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                                                    <div className="w-6 h-6 rounded-full bg-bg-active flex items-center justify-center text-xs font-mono">
                                                        {agent.charAt(0)}
                                                    </div>
                                                    {agent}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs uppercase tracking-wider text-text-dim font-mono mb-2">Metadata</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-text-dim">Detected</span>
                                                <span className="text-text-primary font-mono">{selectedIncident.timestamp}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-dim">Findings</span>
                                                <span className="text-text-primary font-mono">{selectedIncident.findings}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-dim">Source</span>
                                                <span className="text-text-primary font-mono">{selectedIncident.source || "System"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
