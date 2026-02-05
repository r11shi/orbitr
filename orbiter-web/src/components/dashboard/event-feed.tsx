"use client"

import { OrbitrEvent } from "@/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface EventFeedProps {
    events: OrbitrEvent[]
}

export function EventFeed({ events }: EventFeedProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-bg-void">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border-subtle bg-bg-panel/50 backdrop-blur-sm sticky top-0 z-10 text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-2">Source</div>
                <div className="col-span-5">Event</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Trace</div>
            </div>

            {/* Rows */}
            <div className="overflow-y-auto flex-1 custom-scrollbar pb-20">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-dim font-mono text-sm opacity-50">
                        <span>// NO SIGNAL DETECTED</span>
                        <span className="text-xs mt-2">Waiting for mission events...</span>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="flex flex-col border-b border-border-subtle">
                            <div
                                onClick={() => toggleExpand(event.id)}
                                className={cn(
                                    "grid grid-cols-12 gap-4 px-4 py-3 hover:bg-zinc-900/50 transition-colors cursor-pointer group items-center",
                                    expandedId === event.id && "bg-zinc-900/80"
                                )}
                            >
                                {/* Timestamp */}
                                <div className="col-span-2 font-mono text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                    <span className="text-status-active/50 mr-1">{expandedId === event.id ? '▼' : '►'}</span>
                                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                                </div>

                                {/* Source */}
                                <div className="col-span-2 font-mono text-xs text-text-bright">
                                    {event.source}
                                </div>

                                {/* Message */}
                                <div className="col-span-5 text-sm text-text-dim group-hover:text-text-bright transition-colors truncate">
                                    <span className="font-mono text-xs text-status-active mr-2">
                                        {event.agent ? `[${event.agent}]` : '>'}
                                    </span>
                                    {event.message}
                                </div>

                                {/* Status */}
                                <div className="col-span-2">
                                    <Badge
                                        variant={
                                            event.severity === "Critical" ? "alert" :
                                                event.severity === "High" ? "warn" :
                                                    event.severity === "Medium" ? "idle" : "neon"
                                        }
                                        className="h-5"
                                    >
                                        {event.severity}
                                    </Badge>
                                </div>

                                {/* Trace ID */}
                                <div className="col-span-1 text-right">
                                    <span className="font-mono text-[10px] text-zinc-700 group-hover:text-status-active">
                                        {event.id.slice(-4)}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {expandedId === event.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden bg-bg-panel/30"
                                    >
                                        <div className="p-4 pl-12 grid grid-cols-2 gap-8 border-t border-border-subtle border-dashed">
                                            <div>
                                                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Analysis Logic</h4>
                                                <div className="space-y-4">
                                                    <div className="flex items-start">
                                                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-status-active shadow-[0_0_5px_#00FF94] mr-3 shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-zinc-300 font-mono">Agent Activated</p>
                                                            <p className="text-[10px] text-zinc-500">{event.agent || "Core System"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-600 mr-3 shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-zinc-300 font-mono">Context Retrieval</p>
                                                            <p className="text-[10px] text-zinc-500">Comparing against 24h history for correlation ID {event.id}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start">
                                                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-600 mr-3 shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-zinc-300 font-mono">Risk Scoring</p>
                                                            <p className="text-[10px] text-zinc-500">Calculated Severity: <span className="text-white">{event.severity}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Raw Event Data</h4>
                                                <pre className="font-mono text-[10px] text-zinc-400 bg-black/50 p-3 rounded border border-border-subtle overflow-x-auto">
                                                    {JSON.stringify({
                                                        id: event.id,
                                                        type: event.type,
                                                        source: event.source,
                                                        timestamp: event.timestamp
                                                    }, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
