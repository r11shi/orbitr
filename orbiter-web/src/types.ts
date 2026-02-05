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
