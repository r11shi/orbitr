"use client"

import { useState, useEffect } from "react"
import { fetchIncidents } from "@/lib/api"
import { Timeline, TimelineEvent } from "@/components/ui/timeline"
import { Badge } from "@/components/ui/badge"

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<any[]>([])
    const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadIncidents = async () => {
            const data = await fetchIncidents()
            setIncidents(data)
            if (data.length > 0) {
                setSelectedIncident(data[0].id)
            }
            setLoading(false)
        }
        loadIncidents()
    }, [])

    const selected = incidents.find(i => i.id === selectedIncident)

    const getSeverityBadgeVariant = (severity: string) => {
        switch (severity) {
            case "Critical":
                return "critical"
            case "High":
                return "warning"
            default:
                return "outline"
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "Critical":
                return "text-status-alert"
            case "High":
                return "text-status-warn"
            default:
                return "text-status-active"
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="font-mono text-xs text-text-dim animate-pulse">LOADING INCIDENTS...</span>
            </div>
        )
    }

    return (
        <div className="flex h-full bg-bg-void flex-1 overflow-hidden">
            {/* Incident List */}
            <div className="w-80 border-r border-border-subtle flex flex-col overflow-hidden bg-bg-panel">
                <div className="p-6 border-b border-border-subtle">
                    <h2 className="text-sm font-medium tracking-wide text-text-secondary uppercase">Active Incidents</h2>
                    <p className="text-xs text-text-dim mt-1">{incidents.length} incidents detected</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
                    {incidents.map((inc) => (
                        <div
                            key={inc.id}
                            className={`p-4 hover:bg-bg-active/50 cursor-pointer transition-colors ${selectedIncident === inc.id ? "bg-bg-active" : ""}`}
                            onClick={() => setSelectedIncident(inc.id)}
                        >
                            <div className="flex items-start justify-between mb-2 gap-2">
                                <span className="font-mono text-xs text-text-dim truncate">{inc.id}</span>
                                <span className={`font-mono text-xs whitespace-nowrap ${getSeverityColor(inc.severity)}`}>
                                    {inc.severity}
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">{inc.title}</h3>
                            <div className="flex items-center gap-1 text-xs text-text-dim">
                                <span className="font-mono">{inc.timestamp}</span>
                                <span>•</span>
                                <span>{inc.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="flex-1 overflow-auto">
                {!selected ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-dim">
                        <p className="text-sm">Select an incident to view details</p>
                    </div>
                ) : (
                    <div className="min-h-screen bg-gradient-to-b from-bg-void to-bg-panel/20">
                        <div className="max-w-4xl mx-auto p-8 space-y-8">
                            {/* Header */}
                            <div className="border-b border-border-subtle pb-8">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-medium text-text-bright mb-2">{selected.title}</h1>
                                        <div className="flex items-center gap-3 text-xs font-mono text-text-secondary flex-wrap">
                                            <span>{selected.id}</span>
                                            <span className="text-border-strong">•</span>
                                            <span>{selected.timestamp}</span>
                                            <span className="text-border-strong">•</span>
                                            <span className={getSeverityColor(selected.severity)}>{selected.severity.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="grid grid-cols-3 gap-8">
                                {/* Main Analysis */}
                                <div className="col-span-2 space-y-8">
                                    <section>
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 block">Analysis</h3>
                                        <p className="text-text-primary leading-relaxed">
                                            System detected {selected.title.toLowerCase()} affecting <strong>{selected.affected_service}</strong>.
                                            The incident triggered automated mitigation procedures by <strong>{selected.agent}</strong>.
                                            Investigation indicates potential configuration drift or resource constraint.
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 block">Response</h3>
                                        <p className="text-text-primary leading-relaxed">
                                            Automated response protocol {selected.status === "active" ? "is currently" : "was"} engaged.
                                            System stability maintained through load balancing and resource reallocation.
                                            Recommend reviewing service configurations and implementing additional monitoring.
                                        </p>
                                    </section>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                                        <h4 className="text-xs font-mono uppercase text-text-dim mb-3 block">Agent Involved</h4>
                                        <span className="inline-block bg-bg-active px-2 py-1 rounded text-xs font-mono text-text-secondary">
                                            {selected.agent}
                                        </span>
                                    </div>

                                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                                        <h4 className="text-xs font-mono uppercase text-text-dim mb-3 block">Status</h4>
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${getSeverityColor(selected.severity)}`}>
                                            {selected.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-4">
                                        <h4 className="text-xs font-mono uppercase text-text-dim mb-3 block">Service</h4>
                                        <span className="text-sm text-text-primary">{selected.affected_service}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
