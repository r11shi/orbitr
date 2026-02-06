"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { OrbiterChat } from "@/components/chat/orbiter-chat"

interface ShellProps {
    children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
    const [isChatOpen, setIsChatOpen] = useState(false)

    return (
        <div className="flex h-screen w-full bg-bg-void text-text-primary font-sans overflow-hidden">
            <Sidebar onChatToggle={() => setIsChatOpen(!isChatOpen)} />
            <main className="flex-1 flex flex-col min-w-0 overflow-auto relative">
                <div className="flex-1 p-6 lg:p-8">
                    {children}
                </div>
            </main>
            <OrbiterChat
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
            />
        </div>
    )
}
