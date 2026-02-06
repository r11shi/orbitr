from typing import Dict, Any
from ..models.state import WorkflowState
from ..models.events import Severity, Domain
from ..utils.event_helpers import get_event_type, get_event_severity, get_event_domain
import time

AGENT_ID = "supervisor"

def supervisor_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Supervisor Agent - Intelligent routing to expert agents.
    Uses domain classification, severity, and event type to route.
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    start = time.time()
    
    # Determine which agents to invoke
    agents_to_run = []
    
    # Get event attributes safely (handles both dict and object)
    domain_str = get_event_domain(event)
    event_type = get_event_type(event).lower()
    severity_str = get_event_severity(event)
    
    # Convert to enum for comparison
    try:
        domain = Domain(domain_str) if domain_str else Domain.INFRASTRUCTURE
    except ValueError:
        domain = Domain.INFRASTRUCTURE
    
    try:
        severity = Severity(severity_str) if severity_str else Severity.MEDIUM
    except ValueError:
        severity = Severity.MEDIUM
    
    # === Security Events ===
    if domain == Domain.SECURITY or any(kw in event_type for kw in ["access", "auth", "login", "security", "ssh", "permission"]):
        agents_to_run.append("security_watchdog")
        agents_to_run.append("compliance_sentinel")  # Security + Compliance go together
    
    # === Financial Events ===
    if domain == Domain.FINANCIAL or any(kw in event_type for kw in ["financial", "cost", "billing", "payment", "reconciliation"]):
        agents_to_run.append("cost_analyst")
        agents_to_run.append("compliance_sentinel")  # Financial needs compliance
    
    # === Infrastructure Events ===
    if domain == Domain.INFRASTRUCTURE or any(kw in event_type for kw in ["metric", "system", "cpu", "memory", "disk", "health", "scaling", "resource"]):
        agents_to_run.append("infrastructure_monitor")
        agents_to_run.append("resource_watcher")  # Activate Resource Monitor
        agents_to_run.append("anomaly_detector")
    
    # === Cost/Scaling Events ===
    if any(kw in event_type for kw in ["cost", "scale", "autoscal"]):
        agents_to_run.append("cost_analyst")
        agents_to_run.append("infrastructure_monitor")
    
    # === High Severity: Always full analysis ===
    if severity in [Severity.HIGH, Severity.CRITICAL]:
        if "security_watchdog" not in agents_to_run:
            agents_to_run.append("security_watchdog")
        if "compliance_sentinel" not in agents_to_run:
            agents_to_run.append("compliance_sentinel")
    
    # === Default: At least basic coverage ===
    if not agents_to_run:
        agents_to_run = ["security_watchdog", "compliance_sentinel", "anomaly_detector"]
    
    # Remove duplicates, preserve order
    seen = set()
    agents_to_run = [x for x in agents_to_run if not (x in seen or seen.add(x))]
    
    return {
        "agents_to_run": agents_to_run,
        "audit_log": [{
            "step": "Routing",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "domain": domain.value if hasattr(domain, 'value') else str(domain),
            "severity": severity.value if hasattr(severity, 'value') else str(severity),
            "routed_to": agents_to_run,
            "message": f"Routed to {len(agents_to_run)} agents: {', '.join(agents_to_run)}"
        }],
        "agents_completed": [AGENT_ID]
    }
