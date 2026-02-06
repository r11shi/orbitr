"use client"

import { useState } from "react"
import { ExclamationTriangleIcon, Cross1Icon, LightningBoltIcon, CheckCircledIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Deviation {
    id: string
    title: string
    severity: "Low" | "Medium" | "High" | "Critical"
    time: string
    agent: string
    description?: string
    rootCause?: string
    actions?: string[]
}

interface ActiveDeviationsProps {
    deviations: Deviation[]
}

export function ActiveDeviations({ deviations }: ActiveDeviationsProps) {
    const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null)

    if (deviations.length === 0) {
        return (
            <div className="p-6 border border-border-subtle border-dashed rounded-lg text-center bg-bg-panel/30">
                <div className="flex flex-col items-center gap-2">
                    <CheckCircledIcon className="w-8 h-8 text-status-active/50" />
                    <span className="text-text-dim text-sm">No active deviations</span>
                    <span className="text-text-dim/50 text-xs">System running nominally</span>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-text-secondary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-alert animate-pulse" />
                    Active Deviations
                </h3>
                <div className="border border-border-subtle rounded-lg divide-y divide-border-subtle bg-bg-panel max-h-[500px] overflow-y-auto">
                    {deviations.map((dev, index) => (
                        <motion.div
                            key={dev.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedDeviation(dev)}
                            className={cn(
                                "p-4 flex items-start gap-3 transition-all cursor-pointer group",
                                "hover:bg-gradient-to-r hover:from-bg-active/50 hover:to-transparent",
                                "border-l-2 border-transparent hover:border-l-accent-brand"
                            )}
                        >
                            <div className={cn(
                                "mt-1 w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125",
                                dev.severity === "Critical" ? "bg-status-alert animate-pulse shadow-lg shadow-status-alert/50" :
                                    dev.severity === "High" ? "bg-red-500" :
                                        dev.severity === "Medium" ? "bg-status-warn" : "bg-status-idle"
                            )} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <span className="text-sm font-medium text-text-bright group-hover:text-accent-brand transition-colors leading-snug line-clamp-2">
                                        {dev.title}
                                    </span>
                                    <span className="text-xs font-mono text-text-dim whitespace-nowrap shrink-0">{dev.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                    <span className="font-mono bg-bg-active px-1.5 py-0.5 rounded text-[10px]">{dev.agent}</span>
                                    <span className={cn(
                                        "text-[11px] font-medium",
                                        dev.severity === "Critical" ? "text-status-alert" :
                                            dev.severity === "High" ? "text-red-500" :
                                                dev.severity === "Medium" ? "text-status-warn" : "text-text-dim"
                                    )}>
                                        {dev.severity}
                                    </span>
                                </div>
                            </div>

                            <ExclamationTriangleIcon className={cn(
                                "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                                dev.severity === "Critical" ? "text-status-alert" : "text-text-dim"
                            )} />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedDeviation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedDeviation(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bg-panel border border-border-subtle rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
                        >
                            {/* Header */}
                            <div className={cn(
                                "p-5 border-b border-border-subtle",
                                selectedDeviation.severity === "Critical"
                                    ? "bg-gradient-to-r from-status-alert/10 to-transparent"
                                    : "bg-bg-active/30"
                            )}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            selectedDeviation.severity === "Critical"
                                                ? "bg-status-alert/20"
                                                : "bg-bg-active"
                                        )}>
                                            <LightningBoltIcon className={cn(
                                                "w-5 h-5",
                                                selectedDeviation.severity === "Critical"
                                                    ? "text-status-alert"
                                                    : "text-status-warn"
                                            )} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-text-bright leading-tight">
                                                {selectedDeviation.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono text-text-dim">{selectedDeviation.id}</span>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                                    selectedDeviation.severity === "Critical"
                                                        ? "bg-status-alert/20 text-status-alert"
                                                        : selectedDeviation.severity === "High"
                                                            ? "bg-red-500/20 text-red-500"
                                                            : "bg-status-warn/20 text-status-warn"
                                                )}>
                                                    {selectedDeviation.severity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDeviation(null)}
                                        className="p-2 hover:bg-bg-active rounded-lg transition-colors"
                                    >
                                        <Cross1Icon className="w-4 h-4 text-text-dim" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1">
                                            Detected By
                                        </span>
                                        <span className="text-sm font-medium text-text-bright">{selectedDeviation.agent}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-1">
                                            Detected At
                                        </span>
                                        <span className="text-sm font-medium text-text-bright">{selectedDeviation.time}</span>
                                    </div>
                                </div>

                                {selectedDeviation.description && (
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-2">
                                            Description
                                        </span>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            {selectedDeviation.description}
                                        </p>
                                    </div>
                                )}

                                {selectedDeviation.rootCause && (
                                    <div className="p-3 rounded-lg bg-accent-brand/5 border border-accent-brand/20">
                                        <span className="text-[10px] uppercase tracking-wider text-accent-brand font-mono block mb-2">
                                            Root Cause Analysis
                                        </span>
                                        <p className="text-sm text-text-primary">
                                            {selectedDeviation.rootCause}
                                        </p>
                                    </div>
                                )}

                                {selectedDeviation.actions && selectedDeviation.actions.length > 0 && (
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-text-dim font-mono block mb-2">
                                            Recommended Actions
                                        </span>
                                        <ul className="space-y-2">
                                            {selectedDeviation.actions.map((action, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                                    <span className="w-5 h-5 rounded bg-bg-active flex items-center justify-center text-[10px] font-mono text-text-dim shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 border-t border-border-subtle bg-bg-active/20 flex items-center justify-between">
                                <span className="text-xs text-text-dim">
                                    Click outside or press ESC to close
                                </span>
                                <button
                                    onClick={() => setSelectedDeviation(null)}
                                    className="px-4 py-2 text-xs font-medium bg-accent-brand/10 text-accent-brand rounded-lg hover:bg-accent-brand/20 transition-colors"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
