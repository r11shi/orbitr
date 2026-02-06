export type Severity = "Low" | "Medium" | "High" | "Critical";

export interface AgentStatus {
    id: string;
    name: string;
    status: "active" | "idle" | "processing" | "offline";
    lastActive: string;
    task?: string;
}

export interface OrbitrEvent {
    id: string;
    timestamp: string;
    source: string;
    type: string;
    severity: Severity;
    message: string;
    agent?: string;
    meta?: Record<string, string>;
}

export type WorkflowStatus = "healthy" | "degraded" | "failed" | "monitoring" | "idle";

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    status: WorkflowStatus;
    riskScore: number;
    lastRun: string;
    avgDuration: string;
    activeAgents: string[];
}
