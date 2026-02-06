"use client"

import { useParams } from "next/navigation"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeftIcon, ClockIcon, LightningBoltIcon, CheckCircledIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WorkflowDetailPage() {
    const params = useParams()
    const id = params.id as string

    return (
        <div className="w-full max-w-none px-6 md:px-8 py-6 space-y-8">
            <Link href="/workflows" className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors">
                <ArrowLeftIcon className="mr-2 w-4 h-4" />
                Back to Workflows
            </Link>

            <header className="flex items-center justify-between border-b border-border-subtle pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-text-bright">Deployment Pipeline</h1>
                        <span className="font-mono text-xs text-text-dim px-2 py-0.5 border border-border-subtle rounded">{id}</span>
                    </div>
                    <p className="text-text-secondary text-sm max-w-2xl">
                        End-to-end CI/CD monitoring with compliance checkpoints.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-text-dim font-mono">Current State</span>
                        <StatusBadge status="active" />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        Execution Timeline
                    </h2>

                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6">
                        <div className="relative border-l border-border-subtle ml-3 space-y-8 my-2">
                            {/* Step 1 */}
                            <div className="relative pl-8">
                                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-status-active ring-4 ring-bg-panel" />
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-text-bright">Source Code Validation</h3>
                                        <p className="text-xs text-text-secondary mt-1">Scanning for PII and secrets.</p>
                                    </div>
                                    <span className="text-xs font-mono text-text-dim">10:42:05</span>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-active border border-border-subtle text-text-dim">Compliance Sentinel</span>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative pl-8">
                                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-status-active ring-4 ring-bg-panel" />
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-text-bright">Build Process</h3>
                                        <p className="text-xs text-text-secondary mt-1">Docker container build and tag.</p>
                                    </div>
                                    <span className="text-xs font-mono text-text-dim">10:43:12</span>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="relative pl-8">
                                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-status-warn ring-4 ring-bg-panel animate-pulse" />
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-text-bright">Integration Tests</h3>
                                        <p className="text-xs text-status-warn mt-1 font-medium">Warning: 2 flaky tests detected (Retrying...)</p>
                                    </div>
                                    <span className="text-xs font-mono text-text-dim">Running...</span>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-active border border-border-subtle text-text-dim">Quality Guardian</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4">
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Success Rate</span>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-mono text-text-bright">98.5%</span>
                                <span className="text-xs text-status-active pb-1">↑ 1.2%</span>
                            </div>
                        </div>
                        <div className="h-px bg-border-subtle" />
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono">Avg Duration</span>
                            <div className="text-xl font-mono text-text-bright">4m 12s</div>
                        </div>
                    </div>

                    {/* Active Deviations */}
                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <LightningBoltIcon className="w-4 h-4 text-status-warn" />
                            Active Deviations
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 rounded bg-bg-active/30 border border-border-subtle text-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-status-warn font-medium text-xs">Latency Spike</span>
                                    <span className="text-[10px] text-text-dim font-mono">NOW</span>
                                </div>
                                <p className="text-xs text-text-secondary">Step 'Integration Tests' exceeding p95 threshold by 400ms.</p>
                            </div>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <CheckCircledIcon className="w-4 h-4" />
                            Rules Enabled
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <CheckCircledIcon className="w-3 h-3 text-status-active" />
                                <span>Require Code Owner Approval</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <CheckCircledIcon className="w-3 h-3 text-status-active" />
                                <span>No Critical Vulnerabilities</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <CheckCircledIcon className="w-3 h-3 text-status-active" />
                                <span>Immutable Artifacts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
