from typing import Dict, Any
from ..models.state import WorkflowState
from ..models.events import Severity
import time

AGENT_ID = "anomaly_detector"

def anomaly_detector_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Anomaly Detector - Statistical analysis for unusual patterns.
    Returns only updated fields.
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    payload = event.payload
    start = time.time()
    findings = []
    
    # Check for metric anomalies
    cpu = payload.get("cpu_usage", 0)
    memory = payload.get("memory_usage", 0)
    disk = payload.get("disk_usage", 0)
    
    # High CPU
    if cpu > 90:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Resource Anomaly",
            "title": "Critical CPU Usage",
            "description": f"CPU usage at {cpu}% exceeds critical threshold",
            "severity": Severity.CRITICAL.value if cpu > 95 else Severity.HIGH.value,
            "confidence": 0.90,
            "evidence": {"cpu_usage": cpu, "threshold": 90},
            "remediation": "Scale horizontally or investigate runaway processes."
        })
    
    # High Memory
    if memory > 85:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Resource Anomaly",
            "title": "High Memory Usage",
            "description": f"Memory usage at {memory}% exceeds threshold",
            "severity": Severity.HIGH.value if memory > 90 else Severity.MEDIUM.value,
            "confidence": 0.85,
            "evidence": {"memory_usage": memory, "threshold": 85},
            "remediation": "Check for memory leaks or increase instance size."
        })
    
    # High Disk
    if disk > 80:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Resource Anomaly",
            "title": "Disk Space Warning",
            "description": f"Disk usage at {disk}% approaching capacity",
            "severity": Severity.MEDIUM.value,
            "confidence": 0.80,
            "evidence": {"disk_usage": disk, "threshold": 80},
            "remediation": "Clean up logs or expand storage."
        })
    
    # Cost spike detection
    cost_impact = payload.get("cost_impact_daily", 0)
    if cost_impact > 500:
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Cost Anomaly",
            "title": "Significant Cost Impact",
            "description": f"Daily cost impact of ${cost_impact} detected",
            "severity": Severity.HIGH.value if cost_impact > 1000 else Severity.MEDIUM.value,
            "confidence": 0.88,
            "evidence": {"cost_impact_daily": cost_impact},
            "remediation": "Review scaling policies and resource allocation."
        })
    
    return {
        "findings": findings,
        "audit_log": [{
            "step": "Anomaly Detection",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "findings_count": len(findings),
            "message": f"Analyzed metrics, found {len(findings)} anomalies."
        }],
        "agents_completed": [AGENT_ID]
    }
