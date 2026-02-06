"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    FileTextIcon,
    CheckCircledIcon,
    CrossCircledIcon,
    ExclamationTriangleIcon,
    LockClosedIcon,
    MagnifyingGlassIcon
} from "@radix-ui/react-icons"

interface Policy {
    id: string
    name: string
    description: string
    category: "Security" | "Compliance" | "Operational"
    enforcement: "Strict" | "Advisory"
    status: "active" | "inactive" | "triggered"
    lastCheck: string
    confidence: number
}

export default function PoliciesPage() {
    const [policies] = useState<Policy[]>([
        {
            id: "POL-SEC-001",
            name: "PII Data Encryption",
            description: "All Personally Identifiable Information must be encrypted at rest and in transit using AES-256.",
            category: "Security",
            enforcement: "Strict",
            status: "active",
            lastCheck: "10m ago",
            confidence: 99.9
        },
        {
            id: "POL-COM-002",
            name: "GDPR Data Retention",
            description: "User data must not be retained beyond 90 days of account deletion.",
            category: "Compliance",
            enforcement: "Strict",
            status: "triggered",
            lastCheck: "2m ago",
            confidence: 88.5
        },
        {
            id: "POL-OPS-003",
            name: "API Rate Limiting",
            description: "Public API endpoints must strictly enforce 100 req/min/IP limits.",
            category: "Operational",
            enforcement: "Strict",
            status: "active",
            lastCheck: "5m ago",
            confidence: 100
        },
        {
            id: "POL-SEC-004",
            name: "Cloud Resource Geo-Lock",
            description: "Resources must only be provisioned in approved regions (us-east-1, eu-west-1).",
            category: "Security",
            enforcement: "Advisory",
            status: "inactive",
            lastCheck: "1h ago",
            confidence: 0
        },
        {
            id: "POL-OPS-005",
            name: "Db Connection Pooling",
            description: "Database clients must implement connection pooling with max_conn < 50.",
            category: "Operational",
            enforcement: "Advisory",
            status: "active",
            lastCheck: "15m ago",
            confidence: 95.0
        }
    ])

    return (
        <div className="w-full max-w-none px-4 md:px-6 py-6 space-y-8">
            {/* Header */}
            <header className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-medium tracking-tight text-text-bright">Policy Governance</h1>
                    <div className="flex items-center gap-2">
                        <div className="bg-bg-panel border border-border-subtle rounded-md px-3 py-1.5 flex items-center gap-2">
                            <MagnifyingGlassIcon className="w-4 h-4 text-text-dim" />
                            <input type="text" placeholder="Search policies..." className="bg-transparent border-none text-xs text-text-primary focus:outline-none w-48" />
                        </div>
                    </div>
                </div>
                <p className="text-text-secondary text-sm max-w-3xl">
                    Codified ruleset enforcing security, compliance, and operational standards across the autonomous system.
                </p>
            </header>

            {/* Content Split: Rules List & Active Evaluations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Policy Rulebook (Document Style) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                        <h2 className="text-sm font-semibold text-text-bright flex items-center gap-2">
                            <CheckCircledIcon className="w-4 h-4 text-accent-brand" />
                            Active Rulebook
                        </h2>
                        <span className="text-xs text-text-secondary font-mono">v3.2.0 • {policies.length} Rules</span>
                    </div>

                    <div className="space-y-4">
                        {policies.map((policy) => (
                            <div
                                key={policy.id}
                                className={cn(
                                    "p-5 rounded-lg border bg-bg-panel transition-all hover:border-border-strong group",
                                    policy.status === "triggered" ? "border-status-alert/50 shadow-sm" : "border-border-subtle"
                                )}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded flex items-center justify-center",
                                            policy.status === "triggered" ? "bg-status-alert/10 text-status-alert" : "bg-bg-active text-text-secondary"
                                        )}>
                                            {policy.category === "Security" && <LockClosedIcon className="w-4 h-4" />}
                                            {policy.category === "Compliance" && <FileTextIcon className="w-4 h-4" />}
                                            {policy.category === "Operational" && <ExclamationTriangleIcon className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-text-bright group-hover:text-accent-brand transition-colors">
                                                {policy.name}
                                            </h3>
                                            <span className="text-[10px] text-text-dim font-mono">{policy.id}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {policy.status === "triggered" && (
                                            <span className="text-[10px] bg-status-alert/10 text-status-alert px-2 py-0.5 rounded border border-status-alert/20 uppercase tracking-wide font-medium">
                                                Violation Detected
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide",
                                            policy.enforcement === "Strict"
                                                ? "bg-bg-void border-text-dim/20 text-text-dim"
                                                : "bg-bg-void/50 border-transparent text-text-dim/50"
                                        )}>
                                            {policy.enforcement}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-text-secondary leading-relaxed pl-11">
                                    {policy.description}
                                </p>

                                <div className="mt-4 pt-3 border-t border-border-subtle/50 pl-11 flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-text-dim font-mono tracking-wider text-[10px] uppercase">Last Evaluation</span>
                                        <span className="text-text-primary font-mono">{policy.lastCheck}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-text-dim font-mono tracking-wider text-[10px] uppercase">Confidence</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-16 h-1.5 bg-bg-active rounded-full overflow-hidden">
                                                <div className="h-full bg-status-active rounded-full" style={{ width: `${policy.confidence}%` }} />
                                            </div>
                                            <span className="text-text-primary font-mono">{policy.confidence}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Live Evaluation Status */}
                <div className="space-y-6">
                    <div className="border border-border-subtle rounded-lg bg-bg-panel overflow-hidden">
                        <div className="p-4 border-b border-border-subtle bg-bg-active/10">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Coverage Overview</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-y-6">
                            <div>
                                <div className="text-3xl font-mono text-text-bright mb-1">92%</div>
                                <div className="text-xs text-text-secondary">Policies Passing</div>
                            </div>
                            <div>
                                <div className="text-3xl font-mono text-status-alert mb-1">1</div>
                                <div className="text-xs text-text-secondary">Active Violation</div>
                            </div>
                            <div className="col-span-2 pt-4 border-t border-border-subtle">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-text-secondary">Security</span>
                                    <span className="text-text-bright font-mono">100%</span>
                                </div>
                                <div className="w-full h-1 bg-bg-active rounded-full mb-3">
                                    <div className="w-full h-full bg-status-active rounded-full" />
                                </div>

                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-text-secondary">Compliance</span>
                                    <span className="text-text-bright font-mono">50%</span>
                                </div>
                                <div className="w-full h-1 bg-bg-active rounded-full mb-3">
                                    <div className="w-1/2 h-full bg-status-warn rounded-full" />
                                </div>

                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-text-secondary">Operational</span>
                                    <span className="text-text-bright font-mono">100%</span>
                                </div>
                                <div className="w-full h-1 bg-bg-active rounded-full">
                                    <div className="w-full h-full bg-status-active rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agent Tip */}
                    <div className="p-4 rounded-lg bg-accent-brand/5 border border-accent-brand/10">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-accent-brand/10 rounded flex items-center justify-center shrink-0">
                                <CheckCircledIcon className="w-4 h-4 text-accent-brand" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-text-bright mb-1">Compliance Sentinel</h4>
                                <p className="text-xs text-text-secondary leading-normal">
                                    Continuously auditing infrastructure state against active policies. Violations are automatically flagged.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
