"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DownloadIcon, CalendarIcon } from "@radix-ui/react-icons"

export default function CompliancePage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null)

    const reports = [
        {
            id: "comp_001",
            title: "Q4 2024 Security Audit",
            status: "completed",
            score: 98,
            framework: "ISO 27001",
            issued: "2024-12-15",
            findings: 0,
        },
        {
            id: "comp_002",
            title: "GDPR Data Protection Review",
            status: "completed",
            score: 95,
            framework: "GDPR",
            issued: "2024-12-10",
            findings: 2,
        },
        {
            id: "comp_003",
            title: "SOC 2 Type II Attestation",
            status: "in-progress",
            score: 92,
            framework: "SOC 2",
            issued: "2024-12-01",
            findings: 3,
        },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-status-active"
            case "in-progress":
                return "text-status-warn"
            default:
                return "text-text-dim"
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 95) return "text-status-active"
        if (score >= 90) return "text-status-warn"
        return "text-status-alert"
    }

    return (
        <div className="flex-1 overflow-auto">
            <div className="min-h-screen bg-gradient-to-b from-bg-void to-bg-panel/20">
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                    {/* Header */}
                    <header className="flex flex-col gap-2 border-b border-border-subtle pb-8">
                        <h1 className="text-3xl font-medium tracking-tight text-text-bright">Compliance Reports</h1>
                        <p className="text-text-secondary text-sm">
                            Automated compliance monitoring and audit reports across regulatory frameworks.
                        </p>
                    </header>

                    {/* Reports Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                                className={`border border-border-subtle rounded-lg p-6 cursor-pointer transition-all ${
                                    selectedReport === report.id ? "bg-bg-active" : "bg-bg-panel hover:bg-bg-active/30"
                                }`}
                            >
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    {/* Title */}
                                    <div className="col-span-2">
                                        <h3 className="font-medium text-text-bright mb-1">{report.title}</h3>
                                        <span className="text-xs font-mono text-text-dim">{report.framework}</span>
                                    </div>

                                    {/* Score */}
                                    <div className="text-center">
                                        <span className={`text-2xl font-mono font-medium ${getScoreColor(report.score)}`}>
                                            {report.score}%
                                        </span>
                                        <span className="text-xs text-text-dim block mt-1">Score</span>
                                    </div>

                                    {/* Status */}
                                    <div className="text-center">
                                        <span className={`text-xs font-mono uppercase ${getStatusColor(report.status)}`}>
                                            {report.status === "completed" ? "✓" : "⧗"} {report.status}
                                        </span>
                                        <span className="text-xs text-text-dim block mt-2 font-mono">{report.issued}</span>
                                    </div>

                                    {/* Action */}
                                    <div className="text-right">
                                        <button className="p-2 hover:bg-border-subtle rounded transition-colors">
                                            <DownloadIcon className="w-4 h-4 text-text-dim hover:text-text-primary" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {selectedReport === report.id && (
                                    <div className="mt-6 pt-6 border-t border-border-subtle space-y-4">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <span className="text-xs font-mono text-text-dim uppercase block mb-2">Key Findings</span>
                                                <p className="text-sm text-text-secondary">
                                                    {report.findings === 0
                                                        ? "No critical findings detected. System maintains compliance posture."
                                                        : `${report.findings} items require attention. Review agent recommendations.`}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-mono text-text-dim uppercase block mb-2">Last Verified</span>
                                                <p className="text-sm text-text-secondary">
                                                    Automated verification ran {Math.floor(Math.random() * 24)} hours ago
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border-subtle flex gap-3">
                                            <button className="text-xs font-mono px-3 py-2 rounded border border-border-subtle hover:bg-bg-active transition-colors text-text-secondary hover:text-text-primary">
                                                View Details
                                            </button>
                                            <button className="text-xs font-mono px-3 py-2 rounded border border-border-subtle hover:bg-bg-active transition-colors text-text-secondary hover:text-text-primary">
                                                Share Report
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
