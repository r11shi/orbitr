from typing import Dict, Any
from ..models.state import WorkflowState
from ..models.events import Severity
import time

AGENT_ID = "resource_watcher"

def resource_watcher_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Resource Watcher - Infrastructure health monitoring.
    Returns only updated fields.
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    payload = event.payload
    start = time.time()
    findings = []
    
    # Check service status
    status = payload.get("status", "").lower()
    if status in ["unhealthy", "degraded", "critical", "down"]:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Health Alert",
            "title": "Service Health Issue",
            "description": f"Service reported status: {status}",
            "severity": Severity.CRITICAL.value if status in ["critical", "down"] else Severity.HIGH.value,
            "confidence": 0.95,
            "evidence": {"status": status, "service": payload.get("service_name", "Unknown")},
            "remediation": "Investigate service logs and consider restart."
        })
    
    # Check instance count
    instance_count = payload.get("instance_count", 0)
    if instance_count > 50:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Capacity Alert",
            "title": "High Instance Count",
            "description": f"Service running {instance_count} instances",
            "severity": Severity.MEDIUM.value,
            "confidence": 0.70,
            "evidence": {"instance_count": instance_count},
            "remediation": "Review if scale is appropriate for current load."
        })
    
    return {
        "findings": findings,
        "audit_log": [{
            "step": "Resource Watch",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "findings_count": len(findings),
            "message": f"Checked resources, found {len(findings)} issues."
        }],
        "agents_completed": [AGENT_ID]
    }
