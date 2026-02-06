import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
    {
        variants: {
            variant: {
                default: "bg-bg-active text-text-primary ring-border-subtle",
                active: "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20",
                warning: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
                critical: "bg-red-400/10 text-red-400 ring-red-400/20",
                outline: "text-text-secondary ring-border-subtle",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
