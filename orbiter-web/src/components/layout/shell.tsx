import { Sidebar } from "./sidebar"

interface ShellProps {
    children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
    return (
        <div className="flex h-screen w-full bg-bg-void text-text-primary font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-auto">
                {children}
            </main>
        </div>
    )
}
