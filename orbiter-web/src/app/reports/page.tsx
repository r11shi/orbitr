"use client"

import { useState, useEffect } from "react"
import {
    FileTextIcon,
    DownloadIcon,
    CalendarIcon,
    CheckCircledIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    ReloadIcon
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface Report {
    id: string
    title: string
    type: "Audit" | "Compliance" | "Incident"
    date: string
    status: "Ready" | "Generating" | "Failed"
    size: string
    generatedBy: string
}

export default function ReportsPage() {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [reports, setReports] = useState<Report[]>([])
    const [filter, setFilter] = useState("")
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetchReports()
        // Poll less frequently for report updates
        const interval = setInterval(fetchReports, 10000)
        return () => clearInterval(interval)
    }, [])

    async function fetchReports() {
        try {
            const response = await api.getReports()
            const data = response.data as any
            if (data?.reports) {
                setReports(data.reports.map((r: any) => ({
                    id: r.id,
                    title: r.title,
                    type: r.type || "Audit",
                    date: formatDate(r.date),
                    status: r.status,
                    size: r.size || "-",
                    generatedBy: r.generatedBy || "System"
                })))
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error)
        } finally {
            setLoading(false)
        }
    }

    function formatDate(dateStr: string): string {
        if (!dateStr) return "Unknown"
        try {
            const date = new Date(dateStr)
            const now = new Date()
            const diff = now.getTime() - date.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))

            if (days === 0) {
                return `Today • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            } else if (days === 1) {
                return `Yesterday • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
                    ` • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }
        } catch {
            return dateStr
        }
    }

    async function handleGenerateReport(type: string) {
        setGenerating(true)
        try {
            await api.generateReport(type)
            // Refresh reports list
            setTimeout(fetchReports, 500)
        } catch (error) {
            console.error("Failed to generate report:", error)
        } finally {
            setGenerating(false)
        }
    }

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(filter.toLowerCase()) ||
        r.id.toLowerCase().includes(filter.toLowerCase())
    )

    if (!mounted) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <span className="font-mono text-xs text-text-dim animate-pulse">LOADING REPORTS...</span>
            </div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">Reports & Exports</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchReports}
                            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
                        >
                            <ReloadIcon className={cn("w-3 h-3", loading && "animate-spin")} />
                            Refresh
                        </button>
                        <div className="relative group">
                            <button
                                disabled={generating}
                                className="flex items-center gap-2 bg-text-bright text-bg-void hover:bg-text-dim text-xs font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Generate Report
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-bg-panel border border-border-subtle rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button
                                    onClick={() => handleGenerateReport("audit")}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-active transition-colors"
                                >
                                    Audit Report
                                </button>
                                <button
                                    onClick={() => handleGenerateReport("compliance")}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-active transition-colors"
                                >
                                    Compliance Report
                                </button>
                                <button
                                    onClick={() => handleGenerateReport("incident")}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-active transition-colors"
                                >
                                    Incident Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-text-secondary text-sm max-w-3xl">
                    Auditable records of system state, compliance checks, and incident investigations.
                </p>
            </header>

            {/* Content: Filter & List */}
            <div className="space-y-4">

                {/* Visual Filter Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-text-bright font-medium border-b-2 border-accent-brand px-1 py-1">
                            <span>All Reports</span>
                            <span className="bg-bg-active text-text-secondary text-[10px] px-1.5 rounded-full">{reports.length}</span>
                        </div>
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                        <input
                            type="text"
                            placeholder="Filter by name..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-bg-active/50 border border-border-subtle rounded-full text-xs text-text-primary pl-9 pr-4 py-1.5 focus:outline-none focus:border-text-dim w-64"
                        />
                    </div>
                </div>

                {/* Report Grid/List */}
                <div className="border border-border-subtle rounded-lg bg-bg-panel overflow-hidden">
                    {loading && reports.length === 0 ? (
                        <div className="p-8 text-center text-text-dim text-sm">
                            Loading reports...
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="p-8 text-center text-text-dim text-sm">
                            {reports.length === 0
                                ? "No reports generated yet. Click 'Generate Report' to create one."
                                : "No reports match your filter."
                            }
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-bg-active/20 border-b border-border-subtle text-xs text-text-dim uppercase tracking-wider font-medium">
                                <tr>
                                    <th className="px-6 py-4 font-normal w-1/3">Report Name</th>
                                    <th className="px-6 py-4 font-normal">Type</th>
                                    <th className="px-6 py-4 font-normal">Generated</th>
                                    <th className="px-6 py-4 font-normal">Status</th>
                                    <th className="px-6 py-4 font-normal text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="group hover:bg-bg-active/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-bg-void border border-border-subtle rounded flex items-center justify-center text-text-secondary group-hover:text-accent-brand group-hover:border-accent-brand/30 transition-colors">
                                                    <FileTextIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-text-bright">{report.title}</h3>
                                                    <span className="text-[10px] text-text-dim font-mono">{report.id} • {report.size}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
                                                report.type === "Audit" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                    report.type === "Compliance" ? "bg-status-active/10 text-status-active border-status-active/20" :
                                                        "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                            )}>
                                                {report.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-text-secondary">
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarIcon className="w-3 h-3 text-text-dim" />
                                                    {report.date}
                                                </span>
                                                <span className="text-text-dim mt-0.5 pl-4">by {report.generatedBy}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {report.status === "Generating" ? (
                                                    <>
                                                        <span className="w-2 h-2 rounded-full border-2 border-text-dim border-t-transparent animate-spin" />
                                                        <span className="text-xs text-text-dim italic">Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircledIcon className="w-4 h-4 text-status-active" />
                                                        <span className="text-xs text-text-primary">Ready for Download</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                disabled={report.status !== "Ready"}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-void border border-border-subtle rounded hover:border-text-dim hover:text-text-bright text-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                                <span className="text-xs">Export</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
