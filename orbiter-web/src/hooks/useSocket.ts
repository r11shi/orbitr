"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

// Event types from the server
export interface InsightEvent {
    type: 'insight'
    timestamp: string
    data: {
        id: string
        correlation_id: string
        summary: string
        severity: string
        risk_score: number
        agents: string[]
        timestamp: number
    }
}

export interface DeviationEvent {
    type: 'deviation'
    timestamp: string
    data: {
        id: string
        title: string
        severity: 'High' | 'Critical'
        root_cause?: string
        recommended_actions?: string[]
        agent: string
        timestamp: number
    }
}

export interface SimulationStatusEvent {
    type: 'simulation'
    timestamp: string
    data: {
        running: boolean
        events_generated?: number
    }
}

export interface AgentActivityEvent {
    type: 'agent'
    agent: string
    timestamp: string
    data: {
        status: string
        action: string
    }
}

export interface EventProcessedEvent {
    type: 'processed'
    timestamp: string
    data: {
        event_id: string
        correlation_id: string
        processing_time_ms: number
        analysis: {
            risk_score: number
            highest_severity: string
            findings_count: number
            summary?: string
        }
        agents_invoked: string[]
    }
}

type SocketEvent = InsightEvent | DeviationEvent | SimulationStatusEvent | AgentActivityEvent | EventProcessedEvent

interface UseSocketReturn {
    isConnected: boolean
    lastEvent: SocketEvent | null
    insights: InsightEvent['data'][]
    deviations: DeviationEvent['data'][]
    simulationStatus: { running: boolean } | null
    eventCount: number
    connect: () => void
    disconnect: () => void
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function useSocket(): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null)
    const [insights, setInsights] = useState<InsightEvent['data'][]>([])
    const [deviations, setDeviations] = useState<DeviationEvent['data'][]>([])
    const [simulationStatus, setSimulationStatus] = useState<{ running: boolean } | null>(null)
    const [eventCount, setEventCount] = useState(0)

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return

        console.log('[Socket] Connecting to', SOCKET_URL)

        socketRef.current = io(SOCKET_URL, {
            path: '/socket.io/',
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 10000,
            autoConnect: true,
        })

        socketRef.current.on('connect', () => {
            console.log('[Socket] Connected!')
            setIsConnected(true)
        })

        socketRef.current.on('disconnect', () => {
            console.log('[Socket] Disconnected')
            setIsConnected(false)
        })

        socketRef.current.on('connect_error', (error) => {
            console.log('[Socket] Connection error:', error.message)
            setIsConnected(false)
        })

        // Handle new insights
        socketRef.current.on('new_insight', (event: InsightEvent) => {
            console.log('[Socket] New insight:', event.data.summary)
            setLastEvent(event)
            setInsights(prev => [event.data, ...prev].slice(0, 50))
            setEventCount(prev => prev + 1)
        })

        // Handle new deviations
        socketRef.current.on('new_deviation', (event: DeviationEvent) => {
            console.log('[Socket] New deviation:', event.data.title)
            setLastEvent(event)
            setDeviations(prev => [event.data, ...prev].slice(0, 20))
            setEventCount(prev => prev + 1)
        })

        // Handle simulation status
        socketRef.current.on('simulation_status', (event: SimulationStatusEvent) => {
            console.log('[Socket] Simulation status:', event.data.running)
            setLastEvent(event)
            setSimulationStatus(event.data)
        })

        // Handle agent activity
        socketRef.current.on('agent_activity', (event: AgentActivityEvent) => {
            console.log('[Socket] Agent activity:', event.agent, event.data.action)
            setLastEvent(event)
        })

        // Handle event processed
        socketRef.current.on('event_processed', (event: EventProcessedEvent) => {
            console.log('[Socket] Event processed:', event.data.event_id)
            setLastEvent(event)
            setEventCount(prev => prev + 1)
        })

        // Handle connection confirmation
        socketRef.current.on('connected', (data) => {
            console.log('[Socket] Server confirmed connection:', data.message)
        })
    }, [])

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
            setIsConnected(false)
        }
    }, [])

    useEffect(() => {
        connect()
        return () => {
            disconnect()
        }
    }, [connect, disconnect])

    return {
        isConnected,
        lastEvent,
        insights,
        deviations,
        simulationStatus,
        eventCount,
        connect,
        disconnect
    }
}
