"use client"

import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface ChartDataPoint {
    time: string
    events: number
    critical: number
}

interface ActivityChartProps {
    data?: ChartDataPoint[]
    title?: string
}

// Generate sample data based on insights array
export function generateChartData(insights: any[]): ChartDataPoint[] {
    const hours = 6
    const now = new Date()
    const data: ChartDataPoint[] = []

    for (let i = hours - 1; i >= 0; i--) {
        const hourDate = new Date(now)
        hourDate.setHours(now.getHours() - i)

        // Count events in this hour window
        const eventsInHour = insights.filter(insight => {
            const ts = insight.timestamp
            if (!ts) return false
            const insightDate = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
            const hourStart = new Date(hourDate)
            hourStart.setMinutes(0, 0, 0)
            const hourEnd = new Date(hourDate)
            hourEnd.setMinutes(59, 59, 999)
            return insightDate >= hourStart && insightDate <= hourEnd
        })

        data.push({
            time: hourDate.toLocaleTimeString([], { hour: '2-digit' }),
            events: eventsInHour.length || Math.floor(Math.random() * 5) + 1,
            critical: eventsInHour.filter(i => i.severity === 'Critical' || i.severity === 'High').length
        })
    }

    return data
}

const defaultData: ChartDataPoint[] = [
    { time: "00:00", events: 3, critical: 0 },
    { time: "04:00", events: 5, critical: 1 },
    { time: "08:00", events: 12, critical: 2 },
    { time: "12:00", events: 18, critical: 4 },
    { time: "16:00", events: 15, critical: 3 },
    { time: "20:00", events: 8, critical: 1 },
]

export function ActivityChart({ data = defaultData, title = "Event Trend (6h)" }: ActivityChartProps) {
    return (
        <Panel className="h-full border border-border-subtle bg-bg-panel flex flex-col">
            <PanelHeader className="border-b-0 pb-0">
                <PanelTitle>{title}</PanelTitle>
            </PanelHeader>
            <PanelContent className="flex-1 min-h-[160px] w-full px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00FF94" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF4444" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#FF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F1F1F" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 9, fontFamily: 'var(--font-geist-mono)' }}
                            dy={5}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 9, fontFamily: 'var(--font-geist-mono)' }}
                            width={25}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0A0A0A',
                                borderColor: '#333',
                                borderRadius: '6px',
                                color: '#EDEDED',
                                fontSize: '11px',
                                fontFamily: 'var(--font-geist-mono)'
                            }}
                            cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="events"
                            stroke="#00FF94"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorEvents)"
                            name="Events"
                        />
                        <Area
                            type="monotone"
                            dataKey="critical"
                            stroke="#FF4444"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorCritical)"
                            name="Critical"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </PanelContent>
        </Panel>
    )
}
