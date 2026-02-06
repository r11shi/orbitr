"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import api from "@/lib/api"
import { AgentStatus } from "@/types"
import { PlayIcon, StopIcon, ReloadIcon, RocketIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts"

// Terminal-style log entry
function LogEntry({ entry, index }: { entry: any, index: number }) {
  const severityColors: Record<string, string> = {
    Critical: "text-status-alert",
    High: "text-red-400",
    Medium: "text-yellow-400",
    Low: "text-text-secondary"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-start gap-3 py-2 px-3 hover:bg-bg-active/30 border-b border-border-subtle/30 last:border-0"
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
        entry.severity === "Critical" ? "bg-status-alert animate-pulse" :
        entry.severity === "High" ? "bg-red-500" :
        entry.severity === "Medium" ? "bg-yellow-500" : "bg-status-active"
      )} />
      <div className="flex-1 min-w-0 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-text-dim">[{entry.timestamp}]</span>
          <span className={cn("font-medium", severityColors[entry.severity] || "text-text-secondary")}>
            {entry.severity || "INFO"}
          </span>
          <span className="text-accent-brand">{entry.source}</span>
        </div>
        <p className="text-text-primary mt-0.5 truncate">{entry.message}</p>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [stats, setStats] = useState({
    events: 0,
    criticalEvents: 0,
    pendingWorkflows: 0,
    activeAgents: 0,
    systemStatus: "Operational"
  })
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [simRunning, setSimRunning] = useState(false)
  const [simLoading, setSimLoading] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true)

    try {
      // Fetch all data in parallel
      const [statsRes, healthRes, agentsRes, insightsRes, timeseriesRes, simRes, workflowsRes] = await Promise.all([
        api.getSummaryReport(24),
        api.getHealth(),
        api.getAgentStatus(),
        api.getInsights({ limit: 30 }),
        api.getTimeseries(6),
        api.getSimulationStatus(),
        api.getWorkflows()
      ])

      const statsData = statsRes.data as any || {}
      const healthData = healthRes.data as any || {}
      const agentData = agentsRes.data as { agents: AgentStatus[], summary: any } | undefined
      const insightsData = insightsRes.data as any || {}
      const tsData = timeseriesRes.data as any || {}
      const simData = simRes.data as any || {}
      const workflowData = workflowsRes.data as any || {}

      // Calculate stats
      const criticalEvents = (statsData.risk_distribution?.critical || 0) + (statsData.risk_distribution?.high_risk || 0)
      const activeAgentCount = agentData?.summary?.active || 0

      setStats({
        events: statsData.total_events || 0,
        criticalEvents,
        pendingWorkflows: workflowData.stats?.warning || 0,
        activeAgents: activeAgentCount || (agentData?.agents?.filter((a: any) => a.status === 'active').length || 0),
        systemStatus: healthData.status === "healthy" ? "Operational" : "Degraded"
      })

      // Set agents
      if (agentData?.agents) {
        setAgents(agentData.agents)
      }

      // Set logs (insights as terminal entries)
      const allLogs = (insightsData.insights || []).map((log: any) => ({
        id: log.correlation_id || log.id,
        timestamp: new Date(log.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        severity: log.severity,
        source: log.source || "System",
        message: log.summary || log.message || "Event processed"
      }))
      setLogs(allLogs)

      // Set chart data
      if (tsData.data) {
        setChartData(tsData.data)
      }

      // Set simulation status
      setSimRunning(simData.running || false)
      setLastUpdate(new Date())

    } catch (error) {
      console.error("Failed to refresh data:", error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      refreshData()
      const interval = setInterval(() => refreshData(true), 10000)
      return () => clearInterval(interval)
    }
  }, [mounted, refreshData])

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
      setTimeout(refreshData, 2000)
    } catch (error) {
      console.error("Simulation toggle failed:", error)
    } finally {
      setSimLoading(false)
    }
  }

  async function handleRunDemo() {
    setDemoRunning(true)
    try {
      await api.quickDemo()
      await api.runScenario("rogue_hotfix")
      await refreshData()
    } catch (error) {
      console.error("Demo failed:", error)
    } finally {
      setTimeout(() => setDemoRunning(false), 2000)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-brand border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-text-dim animate-pulse">INITIALIZING SYSTEM...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-text-bright">Command Center</h1>
          <p className="text-xs text-text-dim mt-1">Real-time monitoring & compliance dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono",
            stats.systemStatus === "Operational"
              ? "bg-status-active/10 text-status-active border border-status-active/20"
              : "bg-status-alert/10 text-status-alert border border-status-alert/20"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              stats.systemStatus === "Operational" ? "bg-status-active animate-pulse" : "bg-status-alert"
            )} />
            {stats.systemStatus.toUpperCase()}
          </div>

          {lastUpdate && (
            <span className="text-[10px] text-text-dim font-mono">
              {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}

          <button
            onClick={() => refreshData(false)}
            disabled={isRefreshing}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ReloadIcon className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>

          <button
            onClick={handleRunDemo}
            disabled={demoRunning}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              "bg-accent-brand/10 text-accent-brand border border-accent-brand/30 hover:bg-accent-brand/20",
              demoRunning && "opacity-50 cursor-not-allowed animate-pulse"
            )}
          >
            <RocketIcon className="w-3 h-3" />
            {demoRunning ? "Running..." : "Demo"}
          </button>

          <button
            onClick={handleSimulationToggle}
            disabled={simLoading}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              simRunning
                ? "bg-status-alert/10 text-status-alert border border-status-alert/30"
                : "bg-status-active/10 text-status-active border border-status-active/30",
              simLoading && "opacity-50"
            )}
          >
            {simRunning ? <StopIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
            {simRunning ? "Stop" : "Simulate"}
          </button>
        </div>
      </header>

      {/* Key Metrics Strip */}
      <section className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-bg-panel border border-border-subtle">
          <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Active Agents</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono text-status-active">{stats.activeAgents}</span>
            <span className="text-xs text-text-dim">/ {agents.length}</span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-bg-panel border border-border-subtle">
          <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Total Events (24h)</span>
          <div className="mt-1">
            <span className="text-2xl font-mono text-text-bright">{stats.events.toLocaleString()}</span>
          </div>
        </div>
        <div className={cn(
          "p-4 rounded-lg border",
          stats.criticalEvents > 0 ? "bg-status-alert/5 border-status-alert/30" : "bg-bg-panel border-border-subtle"
        )}>
          <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Critical Findings</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-mono",
              stats.criticalEvents > 0 ? "text-status-alert" : "text-text-bright"
            )}>
              {stats.criticalEvents}
            </span>
            {stats.criticalEvents > 0 && <span className="text-xs text-status-alert">⚠ Action required</span>}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-bg-panel border border-border-subtle">
          <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Pending Workflows</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-mono",
              stats.pendingWorkflows > 0 ? "text-yellow-400" : "text-text-bright"
            )}>
              {stats.pendingWorkflows}
            </span>
            {stats.pendingWorkflows > 0 && <span className="text-xs text-text-dim">awaiting approval</span>}
          </div>
        </div>
      </section>

      {/* Main Content: Terminal + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terminal-style Log Feed */}
        <section className="bg-bg-panel border border-border-subtle rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle bg-bg-active/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-mono text-text-secondary ml-2">Event Log</span>
            </div>
            <span className="text-[10px] font-mono text-text-dim">{logs.length} entries</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {logs.map((entry, idx) => (
                <LogEntry key={entry.id || idx} entry={entry} index={idx} />
              ))}
            </AnimatePresence>
            {logs.length === 0 && (
              <div className="p-8 text-center text-text-dim text-sm font-mono">
                <p>No events logged yet.</p>
                <p className="mt-2 text-xs">Click "Demo" to generate sample data.</p>
              </div>
            )}
          </div>
        </section>

        {/* Charts */}
        <section className="space-y-4">
          {/* Event Trend Chart */}
          <div className="bg-bg-panel border border-border-subtle rounded-lg p-4">
            <h3 className="text-xs font-mono text-text-secondary mb-4 uppercase tracking-wider">Event Trend (6h)</h3>
            <div className="h-[180px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent-brand))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent-brand))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--accent-brand))" fill="url(#eventGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-dim text-sm font-mono">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Critical Events Bar Chart */}
          <div className="bg-bg-panel border border-border-subtle rounded-lg p-4">
            <h3 className="text-xs font-mono text-text-secondary mb-4 uppercase tracking-wider">Critical Events by Hour</h3>
            <div className="h-[160px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
                    />
                    <Bar dataKey="critical" fill="hsl(var(--status-alert))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-dim text-sm font-mono">
                  No critical events
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Agent Status Bar */}
      <section className="bg-bg-panel border border-border-subtle rounded-lg p-4">
        <h3 className="text-xs font-mono text-text-secondary mb-3 uppercase tracking-wider">Agent Status</h3>
        <div className="flex flex-wrap gap-3">
          {agents.slice(0, 6).map((agent) => (
            <div 
              key={agent.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs border",
                agent.status === "active" || agent.status === "processing"
                  ? "bg-status-active/5 border-status-active/20 text-status-active"
                  : "bg-bg-active/30 border-border-subtle text-text-dim"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                agent.status === "processing" ? "bg-status-active animate-pulse" :
                agent.status === "active" ? "bg-status-active" : "bg-text-dim"
              )} />
              <span className="font-medium">{agent.name}</span>
              <span className="text-[10px] text-text-dim">{agent.lastActive}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
