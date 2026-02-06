from typing import Dict, Any
from ..models.state import WorkflowState
from ..models.events import Severity
from ..utils.event_helpers import get_event_payload
import time

AGENT_ID = "cost_analyst"

def cost_analyst_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Cost Analyst - FinOps analysis for spending events.
    Returns only updated fields.
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    payload = get_event_payload(event)
    start = time.time()
    findings = []
    
    # Check for cost-related issues
    mismatch = payload.get("mismatch_amount", 0)
    cost_daily = payload.get("cost_impact_daily", 0)
    delta_instances = payload.get("delta_instances", 0)
    
    # Financial mismatch
    if mismatch > 500:
        monthly_projection = mismatch * 30
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Financial Alert",
            "title": "Reconciliation Mismatch",
            "description": f"${mismatch} discrepancy detected in financial reconciliation",
            "severity": Severity.CRITICAL.value if mismatch > 2000 else Severity.HIGH.value,
            "confidence": 0.92,
            "evidence": {
                "mismatch_amount": mismatch,
                "monthly_projection": monthly_projection
            },
            "remediation": "Escalate to Finance for manual review and reconciliation."
        })
    
    # Scaling cost impact
    if cost_daily > 500:
        monthly_cost = cost_daily * 30
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Cost Impact",
            "title": "Significant Daily Cost Increase",
            "description": f"${cost_daily}/day additional spend (${monthly_cost}/month projected)",
            "severity": Severity.HIGH.value if cost_daily > 1000 else Severity.MEDIUM.value,
            "confidence": 0.85,
            "evidence": {
                "cost_daily": cost_daily,
                "monthly_projection": monthly_cost,
                "delta_instances": delta_instances
            },
            "remediation": "Review auto-scaling thresholds and consider reserved capacity."
        })
    
    # Large instance delta
    if delta_instances > 5:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Scaling Alert",
            "title": "Large Instance Scale-Out",
            "description": f"Scaling event added {delta_instances} instances",
            "severity": Severity.MEDIUM.value,
            "confidence": 0.75,
            "evidence": {"delta_instances": delta_instances},
            "remediation": "Verify scaling is responding to genuine demand."
        })
    
    return {
        "findings": findings,
        "audit_log": [{
            "step": "Cost Analysis",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "findings_count": len(findings),
            "message": f"Analyzed costs, found {len(findings)} issues."
        }],
        "agents_completed": [AGENT_ID]
    }
