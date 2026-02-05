import { Badge } from "@/components/ui/badge"
import { WorkflowGraph } from "@/components/workflows/workflow-graph"

export default function WorkflowsPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">Active Workflows</h1>
                    <p className="text-text-secondary text-sm mt-1">Autonomous processes currently managed by the swarm.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* Workflow Card 1 */}
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-status-active animate-pulse" />
                            <h3 className="font-medium text-text-bright">Security Triangulation Protocol</h3>
                            <Badge variant="outline">v3.1.0</Badge>
                        </div>
                        <span className="font-mono text-xs text-text-dim">Last run: 2m ago</span>
                    </div>

                    <WorkflowGraph />

                    <div className="flex gap-8 text-xs text-text-secondary border-t border-border-subtle pt-4">
                        <div>
                            <span className="block font-mono text-text-dim mb-1">AGENTS</span>
                            <span>Security Watchdog, Supervisor</span>
                        </div>
                        <div>
                            <span className="block font-mono text-text-dim mb-1">SUCCESS RATE</span>
                            <span className="text-status-active">99.8%</span>
                        </div>
                        <div>
                            <span className="block font-mono text-text-dim mb-1">DEVIATIONS (24H)</span>
                            <span>0</span>
                        </div>
                    </div>
                </div>

                {/* Workflow Card 2 */}
                <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-6 opacity-75">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-status-idle" />
                            <h3 className="font-medium text-text-primary">Compliance Audit Daily</h3>
                            <Badge variant="outline">v1.2.0</Badge>
                        </div>
                        <span className="font-mono text-xs text-text-dim">Last run: 8h ago</span>
                    </div>
                    <div className="h-12 border border-border-subtle border-dashed rounded flex items-center justify-center text-xs text-text-dim">
                        Idle
                    </div>
                </div>
            </div>
        </div>
    )
}
