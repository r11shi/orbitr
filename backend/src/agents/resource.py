from typing import Dict, Any
from ..models.state import WorkflowState
from ..models.events import Severity
from ..utils.event_helpers import get_event_payload
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
    
    payload = get_event_payload(event)
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
    
    # Check Metric Data (CPU/Memory) from Simulation
    metric = payload.get("metric")
    val = payload.get("value", 0)
    
    if metric == "cpu_utilization":
        if val > 90:
            findings.append({
                "agent_id": AGENT_ID,
                "finding_type": "Resource Exhaustion",
                "title": "Critical CPU Usage",
                "description": f"CPU utilization is at {val}% (Threshold: 90%)",
                "severity": Severity.CRITICAL.value,
                "confidence": 0.98,
                "evidence": {"cpu": val},
                "remediation": "Check for runaway processes or scale up instance type."
            })
        elif val > 75:
             findings.append({
                "agent_id": AGENT_ID,
                "finding_type": "Performance Warning",
                "title": "High CPU Usage",
                "description": f"CPU utilization is at {val}%",
                "severity": Severity.MEDIUM.value,
                "confidence": 0.85,
                "evidence": {"cpu": val},
                "remediation": "Monitor for sustained load."
            })
            
    mem_pct = payload.get("memory_pct", 0)
    if mem_pct > 85:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Resource Exhaustion",
            "title": "High Memory Usage",
            "description": f"Memory usage is at {mem_pct}%",
            "severity": Severity.HIGH.value,
            "confidence": 0.90,
            "evidence": {"memory": mem_pct},
            "remediation": "Check for memory leaks or increase RAM."
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
