"use client"

import { useState, useEffect } from "react"
import { fetchWorkflows } from "@/lib/api"
import { ChevronRightIcon } from "@radix-ui/react-icons"

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWorkflows = async () => {
      const data = await fetchWorkflows()
      setWorkflows(data)
      setLoading(false)
    }
    loadWorkflows()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-status-active"
      case "processing":
        return "text-status-warn"
      case "idle":
        return "text-text-dim"
      default:
        return "text-text-secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "●"
      case "processing":
        return "◐"
      case "idle":
        return "○"
      default:
        return "◎"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="font-mono text-xs text-text-dim animate-pulse">LOADING WORKFLOWS...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-b from-bg-void to-bg-panel/20">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
          {/* Header */}
          <header className="flex flex-col gap-2 border-b border-border-subtle pb-8">
            <h1 className="text-3xl font-medium tracking-tight text-text-bright">Workflows</h1>
            <p className="text-text-secondary text-sm">
              Automated agent workflows executing across your infrastructure.
            </p>
          </header>

          {/* Workflows Table */}
          <div className="border border-border-subtle rounded-lg overflow-hidden bg-bg-panel">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-active/50">
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-dim">Workflow</th>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-dim">Status</th>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-dim">Agent</th>
                  <th className="text-center px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-dim">Events</th>
                  <th className="text-center px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-dim">Errors</th>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-dim">Last Run</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <tr key={workflow.id} className="border-b border-border-subtle hover:bg-bg-active/30 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-medium text-text-bright group-hover:text-accent-brand">
                      {workflow.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-mono text-xs ${getStatusColor(workflow.status)}`}>
                        <span className="mr-2">{getStatusIcon(workflow.status)}</span>
                        {workflow.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-text-secondary bg-bg-active px-2 py-1 rounded">
                        {workflow.agent}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-sm text-text-bright">
                      {workflow.events}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-mono text-sm ${workflow.errors > 0 ? "text-status-warn" : "text-status-active"}`}>
                        {workflow.errors}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text-dim">
                      {workflow.last_run}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRightIcon className="w-4 h-4 text-text-dim group-hover:text-text-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {workflows.length === 0 && (
            <div className="flex items-center justify-center py-12 border border-border-subtle rounded-lg">
              <span className="text-text-dim text-sm">No workflows found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
