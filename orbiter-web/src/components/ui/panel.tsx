import * as React from "react"
import { cn } from "@/lib/utils"

const Panel = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "border border-border-subtle bg-bg-panel text-text-bright relative overflow-hidden",
            className
        )}
        {...props}
    />
))
Panel.displayName = "Panel"

const PanelHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex flex-col space-y-1.5 p-4 border-b border-border-subtle bg-bg-void/50",
            className
        )}
        {...props}
    />
))
PanelHeader.displayName = "PanelHeader"

const PanelTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-mono text-xs uppercase tracking-[0.2em] text-text-dim leading-none", className)}
        {...props}
    />
))
PanelTitle.displayName = "PanelTitle"

const PanelContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4", className)} {...props} />
))
PanelContent.displayName = "PanelContent"

export { Panel, PanelHeader, PanelTitle, PanelContent }
