"use client"

import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
    { time: "00:00", requests: 120, latency: 20 },
    { time: "04:00", requests: 150, latency: 25 },
    { time: "08:00", requests: 400, latency: 45 },
    { time: "12:00", requests: 900, latency: 80 },
    { time: "16:00", requests: 850, latency: 70 },
    { time: "20:00", requests: 300, latency: 30 },
    { time: "23:59", requests: 180, latency: 22 },
]

export function ActivityChart() {
    return (
        <Panel className="h-full border-l border-border-subtle bg-bg-void/50 flex flex-col">
            <PanelHeader className="border-b-0 pb-0">
                <PanelTitle>System Throughput (24h)</PanelTitle>
            </PanelHeader>
            <PanelContent className="flex-1 min-h-[200px] w-full px-0 pb-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00FF94" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F1F1F" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', color: '#EDEDED', fontSize: '12px', fontFamily: 'var(--font-geist-mono)' }}
                            itemStyle={{ color: '#00FF94' }}
                            cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="requests"
                            stroke="#00FF94"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRequests)"
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </PanelContent>
        </Panel>
    )
}
