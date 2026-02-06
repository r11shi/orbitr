"use client"

import { useState, useEffect } from "react"
import { fetchInsights, fetchStats, fetchSystemHealth } from "@/lib/api"
import { SystemPulse } from "@/components/dashboard/system-pulse"
import { ActiveDeviations } from "@/components/dashboard/active-deviations"
import { InsightList } from "@/components/dashboard/insight-list"
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [pulseMetrics, setPulseMetrics] = useState<any[]>([])
  const [deviations, setDeviations] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])

  const refreshData = async () => {
    try {
      const stats = await fetchStats().catch(() => ({
        total_events: 0,
        risk_distribution: { high_risk: 0, medium_risk: 0, critical: 0 },
        avg_processing_time_ms: 0
      }));

      const health = await fetchSystemHealth().catch(() => ({ status: "offline" }));

      setPulseMetrics([
        {
          label: "System Status",
          value: health.status === "healthy" ? "Operational" : "Degraded",
          status: health.status === "healthy" ? "normal" : "critical",
          icon: health.status === "healthy" ? "✓" : "⚠"
        },
        {
          label: "Active Incidents",
          value: stats.risk_distribution.critical + stats.risk_distribution.high_risk,
          status: (stats.risk_distribution.critical > 0) ? "critical" : (stats.risk_distribution.high_risk > 0) ? "warning" : "normal",
          trend: stats.risk_distribution.critical > 0 ? "↑ Critical" : "Normal"
        },
        {
          label: "Mean Latency",
          value: `${Math.round(stats.avg_processing_time_ms)}ms`,
          status: stats.avg_processing_time_ms > 1000 ? "warning" : "normal",
          trend: stats.avg_processing_time_ms < 300 ? "↓ Good" : "↑ Increasing"
        },
        {
          label: "Processed Events",
          value: stats.total_events?.toLocaleString() || "0",
          status: "normal"
        }
      ]);

      const allInsights = await fetchInsights(50).catch(() => []);

      const parseDate = (ts: any) => {
        if (!ts) return new Date().toLocaleTimeString();
        if (typeof ts === 'number') {
          return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        const date = new Date(ts);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return "Now";
      };

      const mappedInsights = allInsights.map((log: any) => ({
        id: log.correlation_id || log.id,
        message: log.summary || log.message || "Event processed",
        agent: log.source || "System",
        timestamp: parseDate(log.timestamp),
        context: log.insight || log.root_cause
      }));
      setInsights(mappedInsights.slice(0, 10));

      const mappedDeviations = allInsights
        .filter((log: any) => log.severity === "High" || log.severity === "Critical")
        .map((log: any) => ({
          id: log.correlation_id || log.id,
          title: log.summary || "Event Detected",
          severity: log.severity as "High" | "Critical",
          time: parseDate(log.timestamp),
          agent: log.source || "System"
        }));
      setDeviations(mappedDeviations.slice(0, 5));

      setLoading(false);
    } catch (e) {
      console.error("[v0] Dashboard sync failed:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-status-active border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-text-dim">INITIALIZING SYSTEM...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-b from-bg-void to-bg-panel/20">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          {/* Header */}
          <header className="flex flex-col gap-2 border-b border-border-subtle pb-8">
            <h1 className="text-3xl font-medium tracking-tight text-text-bright">System Overview</h1>
            <p className="text-text-secondary text-sm max-w-2xl">
              Real-time observability of autonomous agent swarms. Monitoring security, compliance, and infrastructure events.
            </p>
          </header>

          {/* Key Metrics */}
          <section>
            <SystemPulse metrics={pulseMetrics} />
          </section>

          {/* Split View: Deviations + Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ActiveDeviations deviations={deviations} />
            </div>
            <div className="lg:col-span-2">
              <InsightList insights={insights} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
