"use client"

import { useState, useEffect } from "react"
import { fetchInsights, fetchStats, fetchSystemHealth } from "@/lib/api"
import { SystemPulse } from "@/components/dashboard/system-pulse"
import { ActiveDeviations } from "@/components/dashboard/active-deviations"
import { InsightList } from "@/components/dashboard/insight-list"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [pulseMetrics, setPulseMetrics] = useState<any[]>([])
  const [deviations, setDeviations] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])

  const refreshData = async () => {
    try {
      // 1. Fetch Metrics
      const stats = await fetchStats().catch(() => ({
        total_events: 0,
        risk_distribution: { high_risk: 0, medium_risk: 0 },
        avg_processing_time_ms: 0
      }));

      const health = await fetchSystemHealth().catch(() => ({ status: "offline" }));

      setPulseMetrics([
        {
          label: "System Status",
          value: health.status === "healthy" ? "Operational" : "Degraded",
          status: health.status === "healthy" ? "normal" : "critical"
        },
        {
          label: "Critical Incidents",
          value: stats.risk_distribution.high_risk + (stats.risk_distribution.critical || 0),
          status: (stats.risk_distribution.high_risk > 0) ? "critical" : "normal"
        },
        {
          label: "Mean Latency",
          value: `${Math.round(stats.avg_processing_time_ms)}ms`,
          status: stats.avg_processing_time_ms > 1000 ? "warning" : "normal"
        },
        {
          label: "Processed Events",
          value: stats.total_events?.toLocaleString() || "0",
          status: "normal"
        }
      ]);

      // 2. Fetch Insights / Deviations
      // Fetching enough to filter
      const allInsights = await fetchInsights(50).catch(() => []);

      // Helper to parse date
      const parseDate = (ts: any) => {
        if (!ts) return new Date().toLocaleTimeString();
        // If it's a number (Unix timestamp in seconds)
        if (typeof ts === 'number') {
          return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // If it's a string
        const date = new Date(ts);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return "Now";
      };

      // Transform for Feed
      const mappedInsights = allInsights.map((log: any) => ({
        id: log.correlation_id || log.id,
        message: log.summary || log.message || "Event processed",
        agent: log.source || "System",
        timestamp: parseDate(log.timestamp),
        context: log.insight || log.root_cause
      }));
      setInsights(mappedInsights.slice(0, 10)); // Show top 10

      // Filter for Deviations (High/Critical)
      const mappedDeviations = allInsights
        .filter((log: any) => log.severity === "High" || log.severity === "Critical")
        .map((log: any) => ({
          id: log.correlation_id || log.id,
          title: log.summary || "Security Event Detected",
          severity: log.severity as "High" | "Critical",
          time: parseDate(log.timestamp),
          agent: log.source || "Security Watchdog"
        }));
      setDeviations(mappedDeviations);

      setLoading(false);
    } catch (e) {
      console.error("Dashboard sync failed", e);
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
      <div className="flex items-center justify-center h-[50vh]">
        <span className="font-mono text-xs text-text-dim animate-pulse">ESTABLISHING UPLINK...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-16">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-medium tracking-tight text-text-bright">System Overview</h1>
        <p className="text-text-secondary text-sm max-w-2xl">
          Real-time observability of autonomous agent swarms. Monitoring security, compliance, and infrastructure anomalies.
        </p>
      </header>

      {/* Pulse */}
      <section>
        <SystemPulse metrics={pulseMetrics} />
      </section>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Deviations (More structural/alert focused) */}
        <div className="lg:col-span-5">
          <ActiveDeviations deviations={deviations} />
        </div>

        {/* Right: Narrative Feed (Context focused) */}
        <div className="lg:col-span-7">
          <InsightList insights={insights} />
        </div>
      </div>
    </div>
  )
}
