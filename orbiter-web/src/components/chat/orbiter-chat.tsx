"use client"

import * as React from "react"
import { PaperPlaneIcon, Cross1Icon, ChatBubbleIcon, ReloadIcon, Link2Icon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

interface Message {
    id: string
    role: "user" | "system"
    content: string
    timestamp: string
    thinking?: boolean
    links?: { label: string; href: string }[]
}

interface OrbiterChatProps {
    isOpen: boolean
    onToggle: () => void
}

export function OrbiterChat({ isOpen, onToggle }: OrbiterChatProps) {
    const [message, setMessage] = React.useState("")
    // Fix hydration: Initial state has empty timestamp, populated on mount
    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: "1",
            role: "system",
            content: "Orbiter Online. How can I assist with workflow monitoring?",
            timestamp: "NOW", // Static initial value
            links: [
                { label: "View Dashboard", href: "/" },
                { label: "Check Policies", href: "/policies" }
            ]
        }
    ])
    const [thinking, setThinking] = React.useState<string | null>(null)
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    // Hydration fix for timestamp
    React.useEffect(() => {
        setMessages(prev => prev.map(m =>
            m.timestamp === "NOW"
                ? { ...m, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                : m
        ))
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [messages, thinking, isOpen])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!message.trim()) return

        const userMessage = message.trim()
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setMessages(prev => [...prev, newUserMsg])
        setMessage("")
        setThinking("Processing query...")

        try {
            // Import API dynamically to avoid circular deps if any, or just use global
            const { api } = await import("@/lib/api")

            // Call Real API
            const response = await api.chat(userMessage, messages.map(m => ({
                role: m.role,
                content: m.content
            })))

            if (response.data) {
                const data = response.data as {
                    content: string
                    role: string
                    timestamp: string
                    suggested_actions?: { label: string; href: string }[]
                }
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "system",
                    content: data.content,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    links: data.suggested_actions // Map suggested_actions to links
                }
                setMessages(prev => [...prev, botMsg])
            } else {
                throw new Error("No response from agent")
            }
        } catch (error) {
            console.error("Chat error:", error)
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "system",
                content: "Error: Unable to reach Orbiter backend. Please check connection.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])
        } finally {
            setThinking(null)
        }
    }

    const quickActions = [
        "System Status",
        "Show Incidents",
        "Check Policies"
    ]

    return (
        <>
            {/* Toggle Button (Visible when closed) */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed bottom-6 right-6 w-12 h-12 bg-text-bright text-bg-void rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center z-50 border border-border-subtle"
                >
                    <ChatBubbleIcon className="w-5 h-5" />
                </button>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px] transition-opacity"
                    onClick={onToggle}
                />
            )}

            {/* Chat Panel */}
            <div className={cn(
                "fixed top-4 right-4 bottom-4 w-[400px] bg-bg-panel border border-border-subtle rounded-xl shadow-2xl transform transition-transform duration-300 z-50 flex flex-col overflow-hidden",
                isOpen ? "translate-x-0" : "translate-x-[110%]"
            )}>
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-border-subtle bg-bg-active/30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-status-active/20 to-status-active/5 flex items-center justify-center border border-status-active/20">
                            <span className="w-2 h-2 rounded-full bg-status-active animate-pulse shadow-[0_0_8px_rgba(5,150,105,0.5)]" />
                        </div>
                        <div>
                            <span className="font-medium text-sm text-text-bright tracking-tight">Orbiter Intelligence</span>
                            <span className="text-[10px] text-text-secondary block font-mono">v3.1 Connected</span>
                        </div>
                    </div>
                    <button
                        onClick={onToggle}
                        className="p-2 text-text-dim hover:text-text-primary hover:bg-bg-active rounded-md transition-colors"
                    >
                        <Cross1Icon className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col animate-fade-in",
                                msg.role === "user" ? "items-end" : "items-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm",
                                    msg.role === "user"
                                        ? "bg-text-bright text-bg-void rounded-br-sm"
                                        : "bg-bg-active border border-border-subtle text-text-primary rounded-bl-sm"
                                )}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>

                                {/* Links */}
                                {msg.links && msg.links.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border-strong/10 flex flex-wrap gap-2">
                                        {msg.links.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.href}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-brand hover:underline p-1 px-2 rounded bg-bg-void/50 hover:bg-bg-void transition-colors"
                                            >
                                                <Link2Icon className="w-3 h-3" />
                                                {link.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-text-dim mt-1.5 px-1 font-mono opacity-60">
                                {msg.timestamp}
                            </span>
                        </div>
                    ))}

                    {/* Thinking State */}
                    {thinking && (
                        <div className="flex items-center gap-3 animate-fade-in px-1">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-bg-active border border-border-subtle">
                                <ReloadIcon className="w-3 h-3 text-text-secondary animate-spin" />
                            </div>
                            <span className="text-xs text-text-secondary font-mono animate-pulse">{thinking}</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length <= 2 && !thinking && (
                    <div className="px-4 pb-2 flex flex-wrap gap-2">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setMessage(action)
                                    // slight delay for effect
                                    setTimeout(() => {
                                        const event = { preventDefault: () => { } } as React.FormEvent
                                        handleSend(event)
                                    }, 100)
                                }}
                                className="text-xs px-3 py-1.5 bg-bg-active border border-border-subtle rounded-full text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-bg-active/80 transition-all font-medium"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-border-subtle bg-bg-panel">
                    <form onSubmit={handleSend} className="relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask me anything..."
                            disabled={!!thinking}
                            className="w-full bg-bg-active/50 border border-border-subtle rounded-xl pl-4 pr-12 py-3 text-sm text-text-bright focus:outline-none focus:border-text-dim focus:ring-1 focus:ring-border-subtle placeholder:text-text-dim disabled:opacity-50 transition-all shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || !!thinking}
                            className="absolute right-2 top-2 p-2 text-text-dim hover:text-text-bright disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-bg-active"
                        >
                            <PaperPlaneIcon className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
