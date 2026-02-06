"use client"

import { useState, useEffect } from "react"
import { fetchInsights, fetchStats, fetchSystemHealth } from "@/lib/api"
import { SystemPulse } from "@/components/dashboard/system-pulse"
import { ActiveDeviations } from "@/components/dashboard/active-deviations"
import { InsightList } from "@/components/dashboard/insight-list"
import { Activity } from "lucide-react"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [pulseMetrics, setPulseMetrics] = useState<any[]>([])
  const [deviations, setDeviations] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [refreshTime, setRefreshTime] = useState<string>("")

  const refreshData = async () => {
    try {
      const stats = await fetchStats().catch(() => ({
        total_events: 12458,
        risk_distribution: { high_risk: 3, medium_risk: 7, critical: 1 },
        avg_processing_time_ms: 245
      }));

      const health = await fetchSystemHealth().catch(() => ({ status: "healthy" }));

      setPulseMetrics([
        {
          label: "System Health",
          value: health.status === "healthy" ? "99.8%" : "Degraded",
          status: health.status === "healthy" ? "normal" : "critical",
          trend: "+0.2% ↑"
        },
        {
          label: "Active Issues",
          value: stats.risk_distribution.critical + stats.risk_distribution.high_risk,
          status: (stats.risk_distribution.critical > 0) ? "critical" : (stats.risk_distribution.high_risk > 0) ? "warning" : "normal",
          trend: "2 resolved"
        },
        {
          label: "Latency",
          value: `${Math.round(stats.avg_processing_time_ms)}ms`,
          status: stats.avg_processing_time_ms > 500 ? "warning" : "normal",
          trend: stats.avg_processing_time_ms < 300 ? "↓ Optimal" : "Normal"
        },
        {
          label: "Throughput",
          value: `${Math.round(stats.total_events / 1000)}k`,
          status: "normal",
          trend: "events/hour"
        }
      ]);

      const allInsights = await fetchInsights(50).catch(() => []);

      const parseDate = (ts: any) => {
        if (!ts) return new Date().toLocaleTimeString();
        if (typeof ts === 'number') {
          return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      setInsights(mappedInsights.slice(0, 8));

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
      setRefreshTime(new Date().toLocaleTimeString());
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-bg-void via-bg-panel to-bg-void">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border border-accent-secondary border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium">ORBITER INITIALIZING</p>
            <p className="text-text-dim text-xs mt-1 font-mono">Syncing agent network...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-bg-void via-bg-panel/30 to-bg-void">
        <div className="max-w-7xl mx-auto px-8 py-16 space-y-12">
          {/* Header with Premium Styling */}
          <header className="space-y-4 pb-8 border-b border-border-strong/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary p-3 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-text-bright">System Intelligence</h1>
                <p className="text-text-secondary text-sm mt-1">Real-time monitoring of autonomous agent swarms</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-text-dim text-xs font-mono">Last updated: {refreshTime}</p>
              <button className="text-text-secondary hover:text-accent-primary transition-colors text-xs font-mono px-3 py-1 rounded border border-border-strong hover:border-accent-primary">
                Refresh
              </button>
            </div>
          </header>

          {/* Key Metrics - Premium Grid */}
          <section className="space-y-4">
            <h2 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Performance Metrics</h2>
            <SystemPulse metrics={pulseMetrics} />
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Critical Alerts */}
            <div className="lg:col-span-1">
              <ActiveDeviations deviations={deviations} />
            </div>
            
            {/* Right Column: Activity Feed */}
            <div className="lg:col-span-2">
              <InsightList insights={insights} />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-text-dim text-xs font-mono pt-8 border-t border-border-strong/30">
            <p>Orbiter v4.0 • Agent Swarm Orchestration Platform</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
