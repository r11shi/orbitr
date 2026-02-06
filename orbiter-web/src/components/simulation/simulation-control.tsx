"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { PlayIcon, StopIcon, ActivityLogIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

export function SimulationControl() {
    const [status, setStatus] = useState({
        running: false,
        events_generated: 0,
        workflows_created: 0,
        started_at: null,
        uptime_seconds: 0
    })
    const [loading, setLoading] = useState(false)

    // Fetch status on mount and periodically (reduced from 3s to 10s)
    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 10000) // Every 10 seconds
        return () => clearInterval(interval)
    }, [])

    async function fetchStatus() {
        const response = await api.getSimulationStatus()
        if (response.data) {
            const data = response.data as any
            setStatus({
                running: data.running || false,
                events_generated: data.events_generated || 0,
                workflows_created: data.workflows_created || 0,
                started_at: data.started_at || null,
                uptime_seconds: data.uptime_seconds || 0
            })
        }
    }

    async function handleStart() {
        setLoading(true)
        const response = await api.startSimulation()
        if (response.data) {
            const data = response.data as any
            setStatus({
                running: true,
                events_generated: data.events_generated || 0,
                workflows_created: data.workflows_created || 0,
                started_at: data.started_at || null,
                uptime_seconds: 0
            })
        }
        setLoading(false)
    }

    async function handleStop() {
        setLoading(true)
        const response = await api.stopSimulation()
        if (response.data) {
            const data = response.data as any
            setStatus({
                running: false,
                events_generated: data.events_generated || 0,
                workflows_created: data.workflows_created || 0,
                started_at: null,
                uptime_seconds: 0
            })
        }
        setLoading(false)
    }

    return (
        <div className="border border-border-subtle rounded-lg bg-bg-panel p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-text-bright flex items-center gap-2 mb-1">
                        <ActivityLogIcon className="w-4 h-4 text-accent-brand" />
                        Workflow Simulation
                    </h3>
                    <p className="text-xs text-text-secondary">
                        {status.running
                            ? "System is actively generating events and monitoring workflows"
                            : "Simulation stopped. Start to begin continuous monitoring"}
                    </p>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium",
                    status.running
                        ? "bg-status-active/10 text-status-active border border-status-active/20"
                        : "bg-bg-active text-text-dim border border-border-subtle"
                )}>
                    {status.running && <span className="w-1.5 h-1.5 rounded-full bg-status-active animate-pulse" />}
                    {status.running ? "RUNNING" : "STOPPED"}
                </div>
            </div>

            {/* Stats Grid */}
            {status.running && (
                <div className="grid grid-cols-3 gap-4 mb-4 p-4 rounded bg-bg-active/30">
                    <div>
                        <span className="text-xs text-text-dim block mb-1">Events Generated</span>
                        <span className="text-lg font-mono text-text-bright">{status.events_generated}</span>
                    </div>
                    <div>
                        <span className="text-xs text-text-dim block mb-1">Workflows Created</span>
                        <span className="text-lg font-mono text-text-bright">{status.workflows_created}</span>
                    </div>
                    <div>
                        <span className="text-xs text-text-dim block mb-1">Uptime</span>
                        <span className="text-lg font-mono text-text-bright">
                            {Math.floor(status.uptime_seconds / 60)}m {Math.floor(status.uptime_seconds % 60)}s
                        </span>
                    </div>
                </div>
            )}

            {/* Control Button */}
            <div className="flex gap-3">
                {!status.running ? (
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-brand hover:bg-accent-brand/80 text-bg-void rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                        <PlayIcon className="w-4 h-4" />
                        {loading ? "Starting..." : "Start Simulation"}
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-status-alert/10 hover:bg-status-alert/20 text-status-alert border border-status-alert/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                        <StopIcon className="w-4 h-4" />
                        {loading ? "Stopping..." : "Stop Simulation"}
                    </button>
                )}
            </div>

            {/* Info Notice */}
            <div className="mt-4 p-3 rounded bg-bg-void/50 border border-border-subtle/50">
                <p className="text-xs text-text-secondary leading-relaxed">
                    <span className="text-text-bright font-medium">How it works:</span> The simulation generates random events
                    (deployments, access requests, security alerts) which are analyzed by agents and may trigger compliance workflows.
                    This provides realistic data for testing the monitoring system.
                </p>
            </div>
        </div>
    )
}
