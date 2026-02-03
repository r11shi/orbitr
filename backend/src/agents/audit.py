"""
Audit Coordinator Agent - Final step that persists data.
"""
from typing import Dict, Any
from ..models.state import WorkflowState
from ..services.database import save_audit_entry
import time
import json

AGENT_ID = "audit_coordinator"

def audit_coordinator_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Final agent that calculates risk score and persists the audit log.
    Returns only updated fields.
    """
    start = time.time()
    event = state.get("event")
    findings = state.get("findings", [])
    
    # Calculate final risk score
    severity_weights = {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.2}
    
    total_risk = 0.0
    if findings:
        for f in findings:
            sev = f.get("severity", "Low")
            conf = f.get("confidence", 0.5)
            weight = severity_weights.get(sev, 0.2)
            total_risk = max(total_risk, weight * conf)
    
    total_risk = round(min(1.0, total_risk), 2)
    
    # Calculate processing time
    start_time = state.get("start_time", time.time())
    processing_time_ms = round((time.time() - start_time) * 1000, 2)
    
    # Persist to database
    try:
        save_audit_entry(
            event=event,
            findings=findings,
            insight=state.get("summary"),
            suggestions=state.get("recommended_actions", []),
            risk_score=total_risk,
            processing_time_ms=processing_time_ms
        )
        db_status = "saved"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "total_risk_score": total_risk,
        "audit_log": [{
            "step": "Audit Coordination",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "risk_score": total_risk,
            "findings_count": len(findings),
            "processing_time_ms": processing_time_ms,
            "db_status": db_status,
            "message": f"Workflow complete. Risk: {total_risk}, Findings: {len(findings)}"
        }],
        "agents_completed": [AGENT_ID]
    }
