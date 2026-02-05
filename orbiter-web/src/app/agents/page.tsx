import { Badge } from "@/components/ui/badge"

const AGENTS = [
    {
        name: "Security Watchdog",
        role: "Threat Detection",
        status: "active",
        description: "Monitors network traffic and access logs for improved security posture.",
        findings: 12,
        lastActive: "Just now"
    },
    {
        name: "Supervisor Agent",
        role: "Orchestration",
        status: "active",
        description: "Coordinates inter-agent communication and high-level decision making.",
        findings: 0,
        lastActive: "Just now"
    },
    {
        name: "Infrastructure Monitor",
        role: "System Health",
        status: "active",
        description: "Tracks pod health, latency, and resource utilization.",
        findings: 3,
        lastActive: "2 min ago"
    },
    {
        name: "Compliance Sentinel",
        role: "Policy Enforcement",
        status: "idle",
        description: "Verifies operations against ISO 27001 and internal implementation standards.",
        findings: 0,
        lastActive: "1h ago"
    }
]

export default function AgentsPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="mb-12">
                <h1 className="text-xl font-medium tracking-tight text-text-bright">Agent Swarm Directory</h1>
                <p className="text-text-secondary text-sm mt-1">Status and capabilities of autonomous system entities.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AGENTS.map((agent) => (
                    <div key={agent.name} className="group border border-border-subtle bg-bg-panel hover:border-border-strong rounded-lg p-6 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded bg-bg-active flex items-center justify-center text-lg font-mono text-text-primary">
                                {agent.name.charAt(0)}
                            </div>
                            <Badge variant={agent.status === 'active' ? 'active' : 'outline'}>
                                {agent.status}
                            </Badge>
                        </div>

                        <h3 className="font-medium text-text-bright mb-1 group-hover:text-accent-brand transition-colors">{agent.name}</h3>
                        <span className="text-xs font-mono text-text-dim block mb-4">{agent.role}</span>

                        <p className="text-sm text-text-secondary leading-relaxed mb-6 min-h-[3rem]">
                            {agent.description}
                        </p>

                        <div className="border-t border-border-subtle pt-4 flex items-center justify-between text-xs">
                            <span className="text-text-dim">Last active: {agent.lastActive}</span>
                            {agent.findings > 0 && (
                                <span className="text-text-primary">{agent.findings} findings</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
