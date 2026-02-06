"""
Infrastructure Monitor Agent - Comprehensive infrastructure health monitoring.
Monitors: CPU, Memory, Disk, Network, Service Health, Container/Pod status.
"""
from typing import Dict, Any, List
from ..models.state import WorkflowState
from ..models.events import Severity
from ..utils.event_helpers import get_event_payload
import time

AGENT_ID = "infrastructure_monitor"

# Threshold configurations (could be loaded from config in production)
THRESHOLDS = {
    "cpu_critical": 95,
    "cpu_high": 85,
    "cpu_warning": 75,
    "memory_critical": 95,
    "memory_high": 90,
    "memory_warning": 80,
    "disk_critical": 95,
    "disk_high": 85,
    "disk_warning": 75,
    "latency_critical_ms": 1000,
    "latency_high_ms": 500,
    "error_rate_critical": 5.0,
    "error_rate_high": 2.0,
}

def infrastructure_monitor_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Comprehensive Infrastructure Monitor - checks all infrastructure metrics.
    Provides detailed health assessments and recommendations.
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    payload = get_event_payload(event)
    start = time.time()
    findings = []
    
    service_name = payload.get("service_name", payload.get("service_id", "Unknown Service"))
    
    # === CPU Analysis ===
    cpu = payload.get("cpu_usage", 0)
    if cpu > 0:
        if cpu >= THRESHOLDS["cpu_critical"]:
            findings.append(_create_finding(
                "CPU Critical",
                f"CPU usage at {cpu}% on {service_name}",
                Severity.CRITICAL,
                0.95,
                {"cpu_usage": cpu, "threshold": THRESHOLDS["cpu_critical"]},
                "Immediate scaling required. Check for runaway processes or DDoS."
            ))
        elif cpu >= THRESHOLDS["cpu_high"]:
            findings.append(_create_finding(
                "CPU High",
                f"CPU usage at {cpu}% approaching critical on {service_name}",
                Severity.HIGH,
                0.85,
                {"cpu_usage": cpu, "threshold": THRESHOLDS["cpu_high"]},
                "Consider horizontal scaling or load balancing."
            ))
        elif cpu >= THRESHOLDS["cpu_warning"]:
            findings.append(_create_finding(
                "CPU Warning",
                f"CPU usage at {cpu}% on {service_name}",
                Severity.MEDIUM,
                0.70,
                {"cpu_usage": cpu, "threshold": THRESHOLDS["cpu_warning"]},
                "Monitor trend. Pre-scale if load is increasing."
            ))
    
    # === Memory Analysis ===
    memory = payload.get("memory_usage", 0)
    if memory > 0:
        if memory >= THRESHOLDS["memory_critical"]:
            findings.append(_create_finding(
                "Memory Critical",
                f"Memory at {memory}% - OOM risk on {service_name}",
                Severity.CRITICAL,
                0.95,
                {"memory_usage": memory, "threshold": THRESHOLDS["memory_critical"]},
                "Restart service or scale immediately. Check for memory leaks."
            ))
        elif memory >= THRESHOLDS["memory_high"]:
            findings.append(_create_finding(
                "Memory High",
                f"Memory at {memory}% on {service_name}",
                Severity.HIGH,
                0.85,
                {"memory_usage": memory, "threshold": THRESHOLDS["memory_high"]},
                "Analyze heap dumps. Consider increasing instance memory."
            ))
    
    # === Disk Analysis ===
    disk = payload.get("disk_usage", 0)
    if disk > 0:
        if disk >= THRESHOLDS["disk_critical"]:
            findings.append(_create_finding(
                "Disk Critical",
                f"Disk at {disk}% - service may fail on {service_name}",
                Severity.CRITICAL,
                0.95,
                {"disk_usage": disk, "threshold": THRESHOLDS["disk_critical"]},
                "Clear logs, expand volume, or add storage immediately."
            ))
        elif disk >= THRESHOLDS["disk_high"]:
            findings.append(_create_finding(
                "Disk Space Low",
                f"Disk at {disk}% on {service_name}",
                Severity.HIGH,
                0.80,
                {"disk_usage": disk, "threshold": THRESHOLDS["disk_high"]},
                "Schedule log rotation and cleanup old artifacts."
            ))
    
    # === Service Health ===
    status = payload.get("status", "").lower()
    if status in ["unhealthy", "degraded", "critical", "down", "failing"]:
        sev = Severity.CRITICAL if status in ["critical", "down"] else Severity.HIGH
        findings.append(_create_finding(
            "Service Unhealthy",
            f"Service {service_name} reported status: {status.upper()}",
            sev,
            0.95,
            {"status": status, "service": service_name},
            f"Check service logs. Run health diagnostics. Consider failover."
        ))
    
    # === Latency Analysis ===
    latency = payload.get("latency_ms", payload.get("response_time_ms", 0))
    if latency > 0:
        if latency >= THRESHOLDS["latency_critical_ms"]:
            findings.append(_create_finding(
                "Latency Critical",
                f"Response time {latency}ms exceeds SLA on {service_name}",
                Severity.CRITICAL,
                0.90,
                {"latency_ms": latency, "threshold": THRESHOLDS["latency_critical_ms"]},
                "Check database connections, network issues, or service dependencies."
            ))
        elif latency >= THRESHOLDS["latency_high_ms"]:
            findings.append(_create_finding(
                "High Latency",
                f"Response time {latency}ms on {service_name}",
                Severity.MEDIUM,
                0.75,
                {"latency_ms": latency, "threshold": THRESHOLDS["latency_high_ms"]},
                "Investigate slow database queries or external API calls."
            ))
    
    # === Error Rate ===
    error_rate = payload.get("error_rate", payload.get("error_percentage", 0))
    if error_rate > 0:
        if error_rate >= THRESHOLDS["error_rate_critical"]:
            findings.append(_create_finding(
                "Error Rate Critical",
                f"{error_rate}% error rate on {service_name}",
                Severity.CRITICAL,
                0.92,
                {"error_rate": error_rate, "threshold": THRESHOLDS["error_rate_critical"]},
                "Immediate investigation required. Check recent deployments."
            ))
        elif error_rate >= THRESHOLDS["error_rate_high"]:
            findings.append(_create_finding(
                "Elevated Error Rate",
                f"{error_rate}% error rate on {service_name}",
                Severity.HIGH,
                0.80,
                {"error_rate": error_rate, "threshold": THRESHOLDS["error_rate_high"]},
                "Review error logs and recent changes."
            ))
    
    # === Instance Count / Scaling ===
    instance_count = payload.get("instance_count", 0)
    delta_instances = payload.get("delta_instances", 0)
    
    if delta_instances > 5:
        findings.append(_create_finding(
            "Large Scale Event",
            f"Scaled by {delta_instances} instances (now {instance_count})",
            Severity.MEDIUM,
            0.70,
            {"delta": delta_instances, "total": instance_count},
            "Verify scaling trigger was legitimate. Check cost impact."
        ))
    
    if instance_count > 100:
        findings.append(_create_finding(
            "High Instance Count",
            f"Running {instance_count} instances for {service_name}",
            Severity.LOW,
            0.60,
            {"instance_count": instance_count},
            "Review if scale is appropriate. Consider reserved capacity."
        ))
    
    # === Summary ===
    health_status = "Healthy"
    if any(f["severity"] == "Critical" for f in findings):
        health_status = "Critical"
    elif any(f["severity"] == "High" for f in findings):
        health_status = "Degraded"
    elif any(f["severity"] == "Medium" for f in findings):
        health_status = "Warning"
    
    return {
        "findings": findings,
        "audit_log": [{
            "step": "Infrastructure Monitoring",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "service": service_name,
            "health_status": health_status,
            "findings_count": len(findings),
            "message": f"Infrastructure check: {health_status} ({len(findings)} issues)"
        }],
        "agents_completed": [AGENT_ID]
    }


def _create_finding(title: str, description: str, severity: Severity, 
                   confidence: float, evidence: Dict, remediation: str) -> Dict:
    """Helper to create a properly formatted finding."""
    return {
        "agent_id": AGENT_ID,
        "finding_type": "Infrastructure Alert",
        "title": title,
        "description": description,
        "severity": severity.value,
        "confidence": confidence,
        "evidence": evidence,
        "remediation": remediation
    }
