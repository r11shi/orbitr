"use client"

import { useState } from "react"
import { Timeline, TimelineEvent } from "@/components/ui/timeline"
import { Badge } from "@/components/ui/badge"

const MOCK_INCIDENTS = [
    {
        id: "INC-9942",
        title: "Unexpected Latency Spike in Payment Service",
        severity: "High",
        timestamp: "10:32 AM",
        agents: ["Security Watchdog", "Infrastructure Monitor"],
        status: "Active"
    },
    {
        id: "INC-9941",
        title: "Unauthorized Access Attempt Blocked",
        severity: "Medium",
        timestamp: "09:15 AM",
        agents: ["Security Watchdog"],
        status: "Resolved"
    },
    {
        id: "INC-9940",
        title: "Compliance Policy Update Detected",
        severity: "Low",
        timestamp: "Yesterday",
        agents: ["Compliance Sentinel"],
        status: "Resolved"
    }
]

export default function IncidentsPage() {
    const [selectedIncident, setSelectedIncident] = useState<string | null>(null)

    return (
        <div className="flex h-full">
            {/* Incident List */}
            <div className="w-1/3 border-r border-border-subtle flex flex-col">
                <div className="p-4 border-b border-border-subtle">
                    <h2 className="text-sm font-medium tracking-wide text-text-secondary uppercase">Recent Incidents</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {MOCK_INCIDENTS.map((inc) => (
                        <div
                            key={inc.id}
                            className="p-4 border-b border-border-subtle hover:bg-bg-active/30 cursor-pointer transition-colors"
                            onClick={() => setSelectedIncident(inc.id)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs text-text-dim">{inc.id}</span>
                                <span className="font-mono text-xs text-text-dim">{inc.timestamp}</span>
                            </div>
                            <h3 className="text-sm font-medium text-text-primary mb-3">{inc.title}</h3>
                            <div className="flex gap-2">
                                <Badge variant={inc.severity === 'High' ? 'critical' : inc.severity === 'Medium' ? 'warning' : 'outline'}>
                                    {inc.severity}
                                </Badge>
                                {inc.agents.map(a => (
                                    <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View (Placeholder for MVP) */}
            <div className="flex-1 p-8 bg-bg-void">
                {!selectedIncident ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-dim">
                        <div className="w-12 h-12 rounded bg-bg-active mb-4" />
                        <p>Select an incident to view narrative analysis.</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8 pb-8 border-b border-border-subtle">
                            <h1 className="text-2xl font-semibold text-text-bright mb-2">
                                {MOCK_INCIDENTS.find(i => i.id === selectedIncident)?.title}
                            </h1>
                            <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
                                <span>ID: {selectedIncident}</span>
                                <span>•</span>
                                <span>STARTED 10:32 AM</span>
                                <span>•</span>
                                <span className="text-status-active">ANALYSIS COMPLETE</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="md:col-span-2 space-y-8">
                                <section>
                                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Narrative Analysis</h3>
                                    <p className="text-text-primary leading-relaxed">
                                        At 10:32 AM, the <strong>Infrastructure Monitor</strong> detected a 450ms latency spike in the payment-service pod `payment-v4-8f92`.
                                        Correlation with <strong>Security Watchdog</strong> logs identified a concurrent increase in failed authentication requests from IP block 192.168.x.x.
                                    </p>
                                    <p className="text-text-primary leading-relaxed mt-4">
                                        The <strong>Supervisor Agent</strong> inferred a potential DDoS or Brute Force attempt and triggered automatic rate-limiting protocols. System stability was restored within 45 seconds.
                                    </p>
                                </section>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Timeline</h3>
                                <Timeline events={[
                                    { id: "1", timestamp: "10:32:05", label: "Latency Spike Detected", source: "Infrastructure Monitor", severity: "warning" },
                                    { id: "2", timestamp: "10:32:08", label: "Auth Failure Spike", source: "Security Watchdog", severity: "critical" },
                                    { id: "3", timestamp: "10:32:15", label: "Cross-Reference Finding", source: "Supervisor Agent", details: "Correlation confidence: 98%" },
                                    { id: "4", timestamp: "10:32:45", label: "Mitigation Applied", source: "System", details: "Rate limiting enabled on /auth endpoint." }
                                ]} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
