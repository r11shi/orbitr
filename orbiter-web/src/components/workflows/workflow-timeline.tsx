"use client"

import { cn } from "@/lib/utils"
import { LockClosedIcon } from "@radix-ui/react-icons"

interface WorkflowStep {
    id: string
    label: string
    status: "completed" | "current" | "pending"
    hasComplianceCheck?: boolean
}

interface WorkflowTimelineProps {
    steps?: WorkflowStep[]
    currentStep?: number
    className?: string
}

// Default SDLC workflow steps
const DEFAULT_STEPS: WorkflowStep[] = [
    { id: "request", label: "Request", status: "pending" },
    { id: "risk-check", label: "Risk Check", status: "pending", hasComplianceCheck: true },
    { id: "approval", label: "Approval", status: "pending" },
    { id: "deploy", label: "Deploy", status: "pending" }
]

export function WorkflowTimeline({
    steps = DEFAULT_STEPS,
    currentStep = 0,
    className
}: WorkflowTimelineProps) {
    // Calculate step statuses based on currentStep
    const stepsWithStatus = steps.map((step, index) => ({
        ...step,
        status: index < currentStep ? "completed" as const :
            index === currentStep ? "current" as const : "pending" as const
    }))

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {stepsWithStatus.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    {/* Step Node */}
                    <div className="relative flex flex-col items-center">
                        {/* Step Circle */}
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border-2 transition-all",
                            step.status === "completed" && "bg-status-active border-status-active text-bg-void",
                            step.status === "current" && "bg-status-warn/20 border-status-warn text-status-warn animate-pulse",
                            step.status === "pending" && "bg-bg-active border-border-subtle text-text-dim"
                        )}>
                            {step.status === "completed" ? "✓" : index + 1}
                        </div>

                        {/* Compliance Shield Badge */}
                        {step.hasComplianceCheck && (
                            <div className={cn(
                                "absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center",
                                step.status === "completed" ? "bg-status-active" : "bg-accent-brand/50"
                            )}>
                                <LockClosedIcon className="w-2 h-2 text-bg-void" />
                            </div>
                        )}

                        {/* Step Label */}
                        <span className={cn(
                            "text-[9px] font-mono mt-1 whitespace-nowrap",
                            step.status === "completed" && "text-status-active",
                            step.status === "current" && "text-status-warn font-medium",
                            step.status === "pending" && "text-text-dim"
                        )}>
                            {step.label}
                        </span>
                    </div>

                    {/* Connector Line */}
                    {index < stepsWithStatus.length - 1 && (
                        <div className={cn(
                            "w-6 h-0.5 mx-1",
                            index < currentStep ? "bg-status-active" : "bg-border-subtle"
                        )} />
                    )}
                </div>
            ))}
        </div>
    )
}
