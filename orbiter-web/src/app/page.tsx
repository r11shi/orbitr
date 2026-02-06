"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

function HomeContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Always fetch insights list
        const [insightsRes, agentsRes] = await Promise.all([
          api.getInsights({ limit: 50 }),
          api.getAgentStatus()
        ])

        const insightsData = insightsRes.data as any
        const agentsData = agentsRes.data as any

        setInsights(insightsData?.insights || [])
        setAgents(agentsData?.agents || [])

        // If ID provided, find specific insight
        if (id) {
          const found = insightsData?.insights?.find((i: any) =>
            i.correlation_id === id || i.id === id
          )
          if (found) {
            setInsight(found)
          } else {
            setError("Insight not found")
          }
        }
      } catch (e) {
        setError("Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
          <span className="text-cyan-500 font-mono text-sm animate-pulse">INITIALIZING ORBITER...</span>
        </div>
      </div>
    )
  }

  // If viewing specific insight
  if (id && insight) {
    return <InsightDetail insight={insight} />
  }

  // Main feed view
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-6 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">ORBITER</h1>
              <p className="text-gray-500 text-sm">Multi-Agent Command Center</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-green-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {agents.filter(a => a.status === 'active').length} Agents Active
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-4 border-b border-gray-800 pb-4">
            <a href="/" className="text-cyan-400 font-bold border-b-2 border-cyan-400 pb-2">
              Live Feed
            </a>
            <a href="/dashboard" className="text-gray-400 hover:text-cyan-400 transition-colors">
              Dashboard
            </a>
            <a href="/workflows" className="text-gray-400 hover:text-cyan-400 transition-colors">
              Workflows
            </a>
            <a href="/analytics" className="text-gray-400 hover:text-cyan-400 transition-colors">
              Analytics
            </a>
            <a href="/reports" className="text-gray-400 hover:text-cyan-400 transition-colors">
              Reports
            </a>
          </nav>
        </header>

        {/* Agent Strip */}
        <section className="mb-6 flex flex-wrap gap-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                "px-3 py-1 rounded text-xs border",
                agent.status === "active"
                  ? "border-cyan-800 text-cyan-400 bg-cyan-900/20"
                  : "border-gray-800 text-gray-500 bg-gray-900/20"
              )}
            >
              {agent.name}
            </div>
          ))}
        </section>

        {/* Live Feed */}
        <section className="bg-[#12121a] border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-[#0d0d14]">
            <span className="text-sm text-gray-400">Live Activity Feed</span>
            <span className="text-xs text-gray-600">{insights.length} events</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {insights.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No events yet.</p>
                <p className="text-xs mt-2">Run the CLI: python cli.py → demo</p>
              </div>
            ) : (
              insights.map((log, idx) => (
                <a
                  key={log.correlation_id || idx}
                  href={`/?id=${log.correlation_id || log.id}`}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group"
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    log.severity === "Critical" ? "bg-red-500 animate-pulse" :
                      log.severity === "High" ? "bg-orange-500" :
                        log.severity === "Medium" ? "bg-yellow-500" : "bg-green-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600">
                        {new Date(log.timestamp * 1000).toLocaleTimeString()}
                      </span>
                      <span className={cn(
                        "font-medium",
                        log.severity === "Critical" ? "text-red-400" :
                          log.severity === "High" ? "text-orange-400" : "text-gray-400"
                      )}>
                        {log.severity}
                      </span>
                      <span className="text-cyan-500">[{log.source}]</span>
                    </div>
                    <p className="text-gray-300 text-sm truncate group-hover:text-white transition-colors">
                      {log.summary || log.message}
                      <span className="ml-2 text-gray-600 opacity-0 group-hover:opacity-100">→</span>
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 text-center text-gray-600 text-xs">
          Run <code className="text-cyan-600">python cli.py</code> for full command interface
        </footer>
      </div>
    </div>
  )
}

function InsightDetail({ insight }: { insight: any }) {
  const severityColor = {
    Critical: "text-red-500 bg-red-500/10 border-red-500/30",
    High: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    Low: "text-green-400 bg-green-400/10 border-green-400/30"
  }[insight.severity as string] || "text-gray-400 bg-gray-400/10 border-gray-400/30"

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
            ← Back to Feed
          </a>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
