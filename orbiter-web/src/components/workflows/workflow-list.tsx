import { Workflow } from "@/types"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

interface WorkflowListProps {
    workflows: Workflow[]
}

export function WorkflowList({ workflows }: WorkflowListProps) {
    if (workflows.length === 0) {
        return (
            <div className="p-12 text-center border border-border-subtle border-dashed rounded-lg">
                <p className="text-text-dim font-mono text-sm">NO WORKFLOWS DETECTED</p>
            </div>
        )
    }

    return (
        <div className="border border-border-subtle rounded-lg overflow-hidden bg-bg-panel">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border-subtle bg-bg-active/30">
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim font-normal">Workflow Name</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim font-normal w-32">Status</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim font-normal w-24 text-right">Risk Score</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim font-normal w-48">Active Agents</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim font-normal w-32 text-right">Avg Duration</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim font-normal w-32 text-right">Last Run</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {workflows.map((workflow) => (
                            <tr
                                key={workflow.id}
                                className="group hover:bg-bg-active/50 transition-colors cursor-pointer"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-text-bright group-hover:text-accent-brand transition-colors">
                                            {workflow.name}
                                        </span>
                                        {workflow.description && (
                                            <span className="text-xs text-text-secondary truncate max-w-[300px]">
                                                {workflow.description}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={workflow.status} />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={cn(
                                        "font-mono",
                                        workflow.riskScore > 75 ? "text-status-alert" :
                                            workflow.riskScore > 50 ? "text-status-warn" :
                                                "text-text-dim"
                                    )}>
                                        {workflow.riskScore}/100
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex -space-x-1 overflow-hidden">
                                        {workflow.activeAgents.map((agent, i) => (
                                            <div
                                                key={i}
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-bg-void border border-border-subtle text-[10px] font-mono text-text-secondary"
                                                title={agent}
                                            >
                                                {agent.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-text-dim text-xs">
                                    {workflow.avgDuration}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-text-dim text-xs">
                                    {workflow.lastRun}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    )
}
