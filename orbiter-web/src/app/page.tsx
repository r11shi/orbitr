"use client"

import { AgentRail } from "@/components/dashboard/agent-rail"
import { EventFeed } from "@/components/dashboard/event-feed"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { AgentStatus, OrbitrEvent } from "@/types"
import { useState, useEffect } from "react"
import { fetchInsights, fetchStats, fetchSystemHealth } from "@/lib/api"

// Static definition of our agents
const AGENT_REGISTRY: AgentStatus[] = [
  { id: "SEC-01", name: "Security Watchdog", status: "idle", lastActive: "-" },
  { id: "CMP-02", name: "Compliance Sentinel", status: "idle", lastActive: "-" },
  { id: "INS-03", name: "Insight Synthesizer", status: "idle", lastActive: "-" },
  { id: "AUD-04", name: "Audit Coordinator", status: "idle", lastActive: "-" },
]

export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentStatus[]>(AGENT_REGISTRY)
  const [events, setEvents] = useState<OrbitrEvent[]>([])
  const [stats, setStats] = useState({
    total: 0,
    high_risk: 0,
    processing_time: 0
  })
  const [systemOnline, setSystemOnline] = useState(false)

  // Polling Function
  const refreshData = async () => {
    try {
      const health = await fetchSystemHealth();
      setSystemOnline(health.status === "healthy");

      const statsData = await fetchStats();
      setStats({
        total: statsData.total_events || 0,
        high_risk: statsData.risk_distribution.high_risk || 0,
        processing_time: statsData.avg_processing_time_ms || 0
      });

      const insights = await fetchInsights(50);

      const mappedEvents: OrbitrEvent[] = insights.map((log: any) => ({
        id: log.correlation_id || `LOG-${log.id}`,
        timestamp: log.timestamp,
        source: log.domain || "SYSTEM",
        type: log.event_type,
        severity: log.severity,
        message: log.summary || "Event processed",
        agent: "Orbitr Core",
      }));
      setEvents(mappedEvents);

      if (insights.length > 0) {
        const latest = new Date(insights[0].timestamp).getTime();
        const now = new Date().getTime();
        const isActive = (now - latest) < 10000;

        setAgents(prev => prev.map(a => ({
          ...a,
          status: isActive ? (Math.random() > 0.5 ? "active" : "processing") : "idle",
          lastActive: isActive ? "Just now" : "Idle"
        })));
      }

    } catch (e) {
      console.error("Polling failed", e);
      setSystemOnline(false);
    }
  }

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-void text-text-bright grid-bg">
      {/* LEFT RAIL: AGENTS */}
      <div className="w-80 h-full border-r border-border-subtle flex flex-col z-20 bg-bg-void/95 backdrop-blur">
        {/* Brand Header */}
        <div className="h-14 border-b border-border-subtle flex items-center px-6">
          <div className="h-4 w-4 bg-white rounded-sm mr-3" />
          <span className="font-mono font-bold tracking-tight text-lg">ORBITR</span>
          <span className="ml-auto text-[10px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">V3.0</span>
        </div>

        <AgentRail agents={agents} />

        {/* Bottom Status */}
        <div className="mt-auto p-4 border-t border-border-subtle">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
            <div className={`h-1.5 w-1.5 rounded-full ${systemOnline ? "bg-status-active animate-pulse" : "bg-status-alert"}`} />
            <span>{systemOnline ? "SYSTEM ONLINE" : "CONNECTION LOST"}</span>
          </div>
        </div>
      </div>

      {/* MAIN STAGE */}
      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-hidden">

        {/* ROW 1: METRICS */}
        <div className="h-32 grid grid-cols-4 border-b border-border-subtle divide-x divide-border-subtle bg-bg-void/50 shrink-0">
          <StatCard
            title="Total Events (24h)"
            value={stats.total.toLocaleString()}
            trend="up"
            trendValue="--"
            chartData={[{ val: 30 }, { val: 45 }, { val: 40 }, { val: 70 }, { val: 60 }, { val: 80 }]}
          />
          <StatCard
            title="Critical Incidents"
            value={stats.high_risk}
            status={stats.high_risk > 0 ? "critical" : "normal"}
            scanline={stats.high_risk > 0}
            chartData={[{ val: 10 }, { val: 5 }, { val: 8 }, { val: 2 }, { val: 12 }, { val: 20 }]}
          />
          <StatCard
            title="Processing Latency"
            value={Math.round(stats.processing_time)}
            unit="MS"
            status="normal"
            chartData={[{ val: 120 }, { val: 110 }, { val: 130 }, { val: 90 }, { val: 85 }, { val: 95 }]}
          />
          <StatCard
            title="Active Workflows"
            value="--"
            unit="FLOWS"
            showChart={false}
          />
        </div>

        {/* ROW 2: CHART (Middle Layer) */}
        <div className="h-64 border-b border-border-subtle shrink-0">
          <ActivityChart />
        </div>

        {/* ROW 3: FEED (Bottom Layer) */}
        <div className="flex-1 min-h-0 bg-bg-void/30">
          <EventFeed events={events} />
        </div>
      </div>
    </div>
  )
}
