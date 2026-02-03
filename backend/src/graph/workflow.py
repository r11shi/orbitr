"""
LangGraph Workflow - Agent Orchestration Pipeline.
Enterprise-grade with all agents including Infrastructure Monitor.
"""
from langgraph.graph import StateGraph, END
from ..models.state import WorkflowState

# Import agent functions
from ..agents.normalizer import normalizer_agent
from ..agents.supervisor import supervisor_agent
from ..agents.security import security_watchdog_agent
from ..agents.compliance import compliance_agent
from ..agents.anomaly import anomaly_detector_agent
from ..agents.cost import cost_analyst_agent
from ..agents.resource import resource_watcher_agent
from ..agents.infrastructure import infrastructure_monitor_agent
from ..agents.insight import insight_synthesizer_agent
from ..agents.audit import audit_coordinator_agent

# Agent registry for dynamic routing
AGENT_REGISTRY = {
    "security_watchdog": security_watchdog_agent,
    "compliance_sentinel": compliance_agent,
    "anomaly_detector": anomaly_detector_agent,
    "cost_analyst": cost_analyst_agent,
    "resource_watcher": resource_watcher_agent,
    "infrastructure_monitor": infrastructure_monitor_agent,
}

def run_expert_agents(state: WorkflowState) -> dict:
    """
    Runs all expert agents selected by supervisor sequentially.
    Merges their findings into a single result.
    """
    agents_to_run = state.get("agents_to_run", [])
    
    all_findings = []
    all_logs = []
    all_completed = []
    
    for agent_name in agents_to_run:
        agent_fn = AGENT_REGISTRY.get(agent_name)
        if agent_fn:
            try:
                result = agent_fn(state)
                all_findings.extend(result.get("findings", []))
                all_logs.extend(result.get("audit_log", []))
                all_completed.extend(result.get("agents_completed", []))
            except Exception as e:
                all_logs.append({
                    "step": "Agent Error",
                    "agent": agent_name,
                    "error": str(e)
                })
    
    return {
        "findings": all_findings,
        "audit_log": all_logs,
        "agents_completed": all_completed
    }

# Build the graph
builder = StateGraph(WorkflowState)

# Add nodes
builder.add_node("normalizer", normalizer_agent)
builder.add_node("supervisor", supervisor_agent)
builder.add_node("experts", run_expert_agents)
builder.add_node("insight", insight_synthesizer_agent)
builder.add_node("audit", audit_coordinator_agent)

# Define flow: linear sequential
builder.set_entry_point("normalizer")
builder.add_edge("normalizer", "supervisor")
builder.add_edge("supervisor", "experts")
builder.add_edge("experts", "insight")
builder.add_edge("insight", "audit")
builder.add_edge("audit", END)

# Compile
graph = builder.compile()
