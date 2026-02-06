"use client"

interface ShellProps {
    children: React.ReactNode
}

// Minimal shell - just renders children directly
export function Shell({ children }: ShellProps) {
    return <>{children}</>
}
