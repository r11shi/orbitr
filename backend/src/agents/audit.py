"""
Audit Coordinator Agent - Final step that persists data.

Enhanced with:
- Context quality tracking
- Guardrail status recording
- LLM usage tracking
"""
from typing import Dict, Any
from ..models.state import WorkflowState
from ..services.database import save_audit_entry
from ..services.observability import observability, traceable
import time
import json

AGENT_ID = "audit_coordinator"


@traceable(name="audit_coordination", run_type="agent")
def audit_coordinator_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Final agent that calculates risk score and persists the audit log.
    
    Enhanced with:
    - Context quality score tracking
    - Guardrail validation status
    - LLM usage recording
    """
    start = time.time()
    event = state.get("event")
    findings = state.get("findings", [])
    context = state.get("context", {})
    
    # Calculate final risk score
    severity_weights = {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.2}
    
    total_risk = 0.0
    highest_severity = "Low"
    severity_order = ["Low", "Medium", "High", "Critical"]
    
    if findings:
        for f in findings:
            sev = f.get("severity", "Low")
            conf = f.get("confidence", 0.5)
            weight = severity_weights.get(sev, 0.2)
            finding_risk = weight * conf
            total_risk = max(total_risk, finding_risk)
            
            # Track highest severity
            if severity_order.index(sev) > severity_order.index(highest_severity):
                highest_severity = sev
    
    total_risk = round(min(1.0, total_risk), 2)
    
    # Calculate processing time
    start_time = state.get("start_time", time.time())
    processing_time_ms = round((time.time() - start_time) * 1000, 2)
    
    # Extract context quality info
    context_score = context.get("llm_context_score", 0)
    guardrails_applied = context.get("guardrails_applied", False)
    
    # Check if LLM was used (from audit log entries)
    audit_log_entries = state.get("audit_log", [])
    llm_used = any(
        entry.get("llm_used", False) 
        for entry in audit_log_entries
    )
    
    # Determine guardrail status from insight synthesizer
    guardrails_passed = True
    for entry in audit_log_entries:
        if entry.get("agent") == "insight_synthesizer":
            guardrails_passed = entry.get("guardrails_passed", True)
            break
    
    # Log decision
    observability.trace_agent_decision(
        agent_id=AGENT_ID,
        decision="risk_calculated",
        reasoning={
            "total_risk": total_risk,
            "highest_severity": highest_severity,
            "findings_count": len(findings),
            "context_score": context_score,
            "llm_used": llm_used
        }
    )
    
    # Persist to database
    try:
        save_audit_entry(
            event=event,
            findings=findings,
            insight=state.get("summary"),
            suggestions=state.get("recommended_actions", []),
            risk_score=total_risk,
            processing_time_ms=processing_time_ms,
            context_score=context_score,
            guardrails_passed=guardrails_passed,
            llm_used=llm_used
        )
        db_status = "saved"
        
        observability.trace_agent_decision(
            agent_id=AGENT_ID,
            decision="db_persisted",
            reasoning={"status": "success", "event_id": event.event_id}
        )
        
    except Exception as e:
        db_status = f"error: {str(e)}"
        observability.trace_agent_decision(
            agent_id=AGENT_ID,
            decision="db_error",
            reasoning={"error": str(e)}
        )
    
    return {
        "total_risk_score": total_risk,
        "highest_severity": highest_severity,
        "audit_log": [{
            "step": "Audit Coordination",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "risk_score": total_risk,
            "highest_severity": highest_severity,
            "findings_count": len(findings),
            "processing_time_ms": processing_time_ms,
            "db_status": db_status,
            "context_score": context_score,
            "guardrails_passed": guardrails_passed,
            "llm_used": llm_used,
            "message": f"Workflow complete. Risk: {total_risk}, Severity: {highest_severity}, Findings: {len(findings)}"
        }],
        "agents_completed": [AGENT_ID]
    }
