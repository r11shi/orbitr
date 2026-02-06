"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { SystemPulse } from "@/components/dashboard/system-pulse"
import { ActiveDeviations } from "@/components/dashboard/active-deviations"
import { InsightList } from "@/components/dashboard/insight-list"
import { AgentStatusRail } from "@/components/dashboard/agent-status-rail"
import { AgentStatus } from "@/types"
import { PlayIcon, StopIcon, ReloadIcon, RocketIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [pulseMetrics, setPulseMetrics] = useState<any[]>([])
  const [deviations, setDeviations] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [agents, setAgents] = useState<AgentStatus[]>([])

  // Simulation state
  const [simRunning, setSimRunning] = useState(false)
  const [simLoading, setSimLoading] = useState(false)

  // Demo scenario state
  const [demoRunning, setDemoRunning] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch Metrics
      const statsResponse = await api.getSummaryReport(24)
      const stats = (statsResponse.data as any) || {
        total_events: 0,
        risk_distribution: { high_risk: 0, medium_risk: 0, low_risk: 0, critical: 0 },
        avg_processing_time_ms: 0
      }

      const healthResponse = await api.getHealth()
      const health = (healthResponse.data as any) || { status: "offline" }

      setPulseMetrics([
        {
          label: "System Status",
          value: health.status === "healthy" ? "Operational" : "Degraded",
          status: health.status === "healthy" ? "normal" : "critical"
        },
        {
          label: "Critical Incidents",
          value: stats.risk_distribution?.high_risk + (stats.risk_distribution?.critical || 0) || 0,
          status: (stats.risk_distribution?.high_risk > 0) ? "critical" : "normal"
        },
        {
          label: "Mean Latency",
          // Safeguard: if avg_processing_time_ms is suspiciously large (>1 hour), show N/A
          value: (stats.avg_processing_time_ms && stats.avg_processing_time_ms < 3600000)
            ? `${Math.round(stats.avg_processing_time_ms)}ms`
            : "N/A",
          status: (stats.avg_processing_time_ms > 1000 && stats.avg_processing_time_ms < 3600000) ? "warning" : "normal"
        },
        {
          label: "Processed Events",
          value: stats.total_events?.toLocaleString() || "0",
          status: "normal"
        }
      ]);

      // 2. Fetch Agents (Real Data)
      try {
        const agentsResponse = await api.getAgentStatus()
        const agentData = agentsResponse.data as { agents: AgentStatus[] } | undefined
        if (agentData && agentData.agents) {
          setAgents(agentData.agents)
        }
      } catch (err) {
        console.error("Failed to fetch agents", err)
      }

      // 3. Fetch Insights / Deviations
      const insightsResponse = await api.getInsights({ limit: 50 })
      const allInsights = (insightsResponse.data as any)?.insights || []

      // Helper to parse date
      const parseDate = (ts: any) => {
        if (!ts) return "Now";
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

      // 4. Fetch simulation status
      try {
        const simResponse = await api.getSimulationStatus()
        const simData = simResponse.data as any
        if (simData) {
          setSimRunning(simData.running || false)
        }
      } catch (err) {
        // Ignore simulation status errors
      }

      setLoading(false);
    } catch (e) {
      console.error("Dashboard sync failed", e);
      setLoading(false);
    }
  }, [])

  useEffect(() => {
    refreshData();
    // Poll every 15 seconds instead of 5 seconds for reduced server load
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  async function handleSimulationToggle() {
    setSimLoading(true)
    try {
      if (simRunning) {
        await api.stopSimulation()
        setSimRunning(false)
      } else {
        await api.startSimulation()
        setSimRunning(true)
      }
      // Refresh after a short delay to get new data
      setTimeout(refreshData, 1000)
    } catch (error) {
      console.error("Simulation toggle failed:", error)
    } finally {
      setSimLoading(false)
    }
  }

  async function handleRunDemo() {
    setDemoRunning(true)
    try {
      await api.runScenario("rogue_hotfix")
      // Wait for scenario to process then refresh
      setTimeout(refreshData, 6000)
    } catch (error) {
      console.error("Demo scenario failed:", error)
    } finally {
      setTimeout(() => setDemoRunning(false), 6000)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <span className="font-mono text-xs text-text-dim animate-pulse">ESTABLISHING UPLINK...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium tracking-tight text-text-bright">System Overview</h1>
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              <ReloadIcon className="w-3 h-3" />
              Refresh
            </button>

            {/* Run Demo Scenario */}
            <button
              onClick={handleRunDemo}
              disabled={demoRunning}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                "bg-accent-brand/10 text-accent-brand border border-accent-brand/30 hover:bg-accent-brand/20",
                demoRunning && "opacity-50 cursor-not-allowed animate-pulse"
              )}
            >
              <RocketIcon className="w-3 h-3" />
              {demoRunning ? "Running Demo..." : "Run Demo"}
            </button>

            {/* Simulation Toggle */}
            <button
              onClick={handleSimulationToggle}
              disabled={simLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                simRunning
                  ? "bg-status-alert/10 text-status-alert border border-status-alert/30 hover:bg-status-alert/20"
                  : "bg-status-active/10 text-status-active border border-status-active/30 hover:bg-status-active/20",
                simLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {simRunning ? (
                <>
                  <StopIcon className="w-3 h-3" />
                  {simLoading ? "Stopping..." : "Stop Simulation"}
                </>
              ) : (
                <>
                  <PlayIcon className="w-3 h-3" />
                  {simLoading ? "Starting..." : "Start Simulation"}
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-text-secondary text-sm max-w-3xl">
          Real-time observability of autonomous agent swarms. Monitoring security, compliance, and infrastructure anomalies.
        </p>
      </header>

      {/* Agent Swarm Status */}
      <section>
        <AgentStatusRail agents={agents} />
      </section>

      {/* Pulse */}
      <section>
        <SystemPulse metrics={pulseMetrics} />
      </section>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
