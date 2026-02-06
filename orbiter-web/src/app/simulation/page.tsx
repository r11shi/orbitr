"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function SimulationPage() {
    const [active, setActive] = useState(false)

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center p-8">
            <div className="mb-8">
                <Badge variant="warning" className="mb-4">Sandbox Environment</Badge>
                <h1 className="text-3xl font-medium tracking-tight text-text-bright mb-4">System Simulation</h1>
                <p className="text-text-secondary">
                    Inject synthetic event patterns to test swarm response capabilities.
                    Simulated data is isolated from production audit logs.
                </p>
            </div>

            <div className="p-8 border border-border-subtle bg-bg-panel rounded-xl w-full max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">Simulation Engine</span>
                    <button
                        onClick={() => setActive(!active)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-status-active' : 'bg-bg-active'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <div className="pt-6 border-t border-border-subtle text-left space-y-4">
                    <div>
                        <span className="text-xs font-mono text-text-dim block mb-1">SCENARIO</span>
                        <select disabled={!active} className="w-full bg-bg-void border border-border-subtle rounded text-sm p-2 text-text-primary">
                            <option>Payment Gateway Latency</option>
                            <option>Unauthorized Access Burst</option>
                            <option>Compliance Violation (GDPR)</option>
                        </select>
                    </div>

                    {active && (
                        <div className="p-3 bg-bg-active/50 rounded border border-border-subtle">
                            <p className="text-xs text-status-active font-mono">
                                Injecting events... Swarm activating in 3s
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
