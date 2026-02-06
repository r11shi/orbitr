"use client"

import { useParams } from "next/navigation"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeftIcon, LightningBoltIcon, ReaderIcon, Link2Icon } from "@radix-ui/react-icons"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function IncidentDetailPage() {
    const params = useParams()
    const id = params.id as string

    return (
        <div className="w-full max-w-none px-6 md:px-8 py-6 space-y-8">
            <Link href="/incidents" className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors">
                <ArrowLeftIcon className="mr-2 w-4 h-4" />
                Back to Incidents
            </Link>

            <header className="flex items-center justify-between border-b border-border-subtle pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-2 h-2 rounded-full bg-status-alert animate-pulse" />
                        <h1 className="text-2xl font-semibold tracking-tight text-text-bright">Unexpected Latency Spike in Payment Service</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-secondary font-mono">
                        <span>{id}</span>
                        <span>•</span>
                        <span>STARTED 10:32 AM</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-text-dim font-mono">Severity</span>
                        <span className="text-status-alert font-bold tracking-wide">CRITICAL</span>
                    </div>
                    <div className="h-8 w-px bg-border-subtle" />
                    <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-text-dim font-mono">Status</span>
                        <StatusBadge status="active" />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Narrative */}
                    <section>
                        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                            <ReaderIcon className="w-4 h-4" />
                            Use Case Narrative
                        </h2>
                        <div className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed">
                            <p>
                                At <strong>10:32:05 AM</strong>, the Infrastructure Monitor agent detected a p99 latency spike reaching 4500ms in the `payment-v4` pod cluster.
                                This exceeds the SLA threshold of 500ms by 800%.
                            </p>
                            <p className="mt-4">
                                Concurrent correlation by the <strong>Pattern Detective</strong> identified a massive surge in requests from a single IP block (192.168.x.x) targeting the `/checkout/validate` endpoint.
                                The <strong>Security Watchdog</strong> flagged this as a potential Rate-Limiting Bypass attack.
                            </p>
                        </div>
                    </section>

                    {/* Agent Decision Trace */}
                    <section>
                        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                            <Link2Icon className="w-4 h-4" />
                            Agent Decision Trace
                        </h2>
                        <div className="border border-border-subtle rounded-lg bg-bg-panel overflow-hidden">
                            <div className="p-4 border-b border-border-subtle bg-bg-active/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-status-active">Supervisor Agent</span>
                                    <span className="text-xs text-text-dim">reasoning chain</span>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-text-dim" />
                                        <div className="w-px h-full bg-border-subtle my-1" />
                                    </div>
                                    <div className="pb-4">
                                        <h4 className="text-xs font-bold text-text-bright uppercase">Hypothesis Formation</h4>
                                        <p className="text-sm text-text-secondary mt-1">
                                            High latency + High Request Count from single source suggestions DDoS or Brute Force.
                                            Probability: <span className="text-status-active font-mono">92%</span>.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-text-dim" />
                                        <div className="w-px h-full bg-border-subtle my-1" />
                                    </div>
                                    <div className="pb-4">
                                        <h4 className="text-xs font-bold text-text-bright uppercase">Action Selection</h4>
                                        <p className="text-sm text-text-secondary mt-1">
                                            Selected mitigation strategy: <strong>IP Block + Rate Limit Adjustment</strong>.
                                            Reason: Lowest impact on legitimate users.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-status-active" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-text-bright uppercase">Execution</h4>
                                        <p className="text-sm text-text-secondary mt-1">
                                            Applied WAF rule ID-4421. Monitoring for stability...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Root Cause */}
                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <LightningBoltIcon className="w-4 h-4 text-status-alert" />
                            Root Cause Analysis
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Unoptimised database query in payment validation logic combined with malicious load spike caused connection pool exhaustion.
                        </p>
                        <div className="pt-2">
                            <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1">Impacted Resources</span>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs px-2 py-1 bg-bg-active rounded border border-border-subtle font-mono text-text-primary">rds-payment-writer</span>
                                <span className="text-xs px-2 py-1 bg-bg-active rounded border border-border-subtle font-mono text-text-primary">k8s-payment-v4</span>
                            </div>
                        </div>
                    </div>

                    {/* Contributing Agents */}
                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary">Contributing Agents</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-bg-active flex items-center justify-center text-[10px] font-mono border border-border-subtle text-text-secondary">SW</div>
                                <div>
                                    <div className="text-sm font-medium text-text-bright">Security Watchdog</div>
                                    <div className="text-[10px] text-text-dim">Threat Detection</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-bg-active flex items-center justify-center text-[10px] font-mono border border-border-subtle text-text-secondary">IM</div>
                                <div>
                                    <div className="text-sm font-medium text-text-bright">Infrastructure Monitor</div>
                                    <div className="text-[10px] text-text-dim">Metric Analysis</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-bg-active flex items-center justify-center text-[10px] font-mono border border-border-subtle text-text-secondary">SA</div>
                                <div>
                                    <div className="text-sm font-medium text-text-bright">Supervisor Agent</div>
                                    <div className="text-[10px] text-text-dim">Orchestration</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
