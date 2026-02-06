"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

function ViewerContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get("id")
    const [loading, setLoading] = useState(true)
    const [insight, setInsight] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) {
            setError("No insight ID provided")
            setLoading(false)
            return
        }

        async function fetchInsight() {
            try {
                // Try to get from insights list
                const resp = await api.getInsights({ limit: 100 })
                const data = resp.data as any
                const found = data?.insights?.find((i: any) =>
                    i.correlation_id === id || i.id === id
                )

                if (found) {
                    setInsight(found)
                } else {
                    setError("Insight not found")
                }
            } catch (e) {
                setError("Failed to fetch insight")
            } finally {
                setLoading(false)
            }
        }

        fetchInsight()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (error || !insight) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-red-400 font-mono">
                {error || "Unknown error"}
            </div>
        )
    }

    const severityColors: Record<string, string> = {
        Critical: "text-red-500 bg-red-500/10 border-red-500/30",
        High: "text-orange-400 bg-orange-400/10 border-orange-400/30",
        Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
        Low: "text-green-400 bg-green-400/10 border-green-400/30"
    }
    const severityColor = severityColors[insight.severity] || "text-gray-400 bg-gray-400/10 border-gray-400/30"

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-8 font-mono">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <span className={cn(
                            "px-3 py-1 rounded border text-sm font-bold uppercase",
                            severityColor
                        )}>
                            {insight.severity}
                        </span>
                        <span className="text-gray-500 text-sm">
                            {new Date(insight.timestamp * 1000).toLocaleString()}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-cyan-400">
                        {insight.source || "System"} Event
                    </h1>
                </div>

                {/* Summary */}
                <div className="bg-[#12121a] border border-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Summary</h2>
                    <p className="text-lg text-gray-200">
                        {insight.summary || insight.message || "No summary available"}
                    </p>
                </div>

                {/* Reasoning */}
                {insight.reasoning && (
                    <div className="bg-[#12121a] border border-cyan-900/50 rounded-lg p-6 mb-6">
                        <h2 className="text-sm text-cyan-400 uppercase tracking-wider mb-2">
                            🧠 AI Reasoning
                        </h2>
                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {insight.reasoning}
                        </p>
                    </div>
                )}

                {/* Evidence/Payload */}
                {insight.payload && (
                    <div className="bg-[#12121a] border border-gray-800 rounded-lg p-6 mb-6">
                        <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                            Evidence
                        </h2>
                        <pre className="text-xs text-gray-400 overflow-x-auto">
                            {JSON.stringify(insight.payload, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Metadata */}
                <div className="bg-[#12121a] border border-gray-800 rounded-lg p-6">
                    <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">
                        Metadata
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">ID:</span>
                            <span className="ml-2 text-gray-300">{insight.correlation_id || insight.id}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Agent:</span>
                            <span className="ml-2 text-cyan-400">{insight.source}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Event Type:</span>
                            <span className="ml-2 text-gray-300">{insight.event_type || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Domain:</span>
                            <span className="ml-2 text-gray-300">{insight.domain || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Back link */}
                <div className="mt-8 text-center">
                    <a
                        href="/"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function ViewerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        }>
            <ViewerContent />
        </Suspense>
    )
}
