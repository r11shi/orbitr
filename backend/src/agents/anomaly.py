"""
Anomaly Detector Agent - Statistical analysis with historical baselines.

Enhanced with:
- Historical baseline comparison
- Trend detection
- Observability tracing
"""
from typing import Dict, Any
from ..models.state import WorkflowState
from ..models.events import Severity
from ..services.history import HistoricalContext
from ..services.observability import observability, traceable
import time

AGENT_ID = "anomaly_detector"


@traceable(name="anomaly_detection", run_type="agent")
def anomaly_detector_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Anomaly Detector - Statistical analysis with historical context.
    
    Enhanced with:
    - Historical baseline comparison
    - Pattern deviation detection
    - Multi-factor anomaly scoring
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    payload = event.payload
    start = time.time()
    findings = []
    
    # === Current Metrics ===
    cpu = payload.get("cpu_usage", 0)
    memory = payload.get("memory_usage", 0)
    disk = payload.get("disk_usage", 0)
    cost_impact = payload.get("cost_impact_daily", 0)
    
    # === Get Historical Baseline ===
    historical_baseline = {}
    try:
        similar_events = HistoricalContext.get_similar_events(
            event.event_type,
            hours=24,
            limit=20
        )
        
        if similar_events:
            # Calculate average risk score from similar events
            avg_risk = sum(e.get("risk_score", 0) for e in similar_events) / len(similar_events)
            high_severity_count = sum(1 for e in similar_events if e.get("severity") in ["High", "Critical"])
            
            historical_baseline = {
                "event_count_24h": len(similar_events),
                "avg_risk_score": avg_risk,
                "high_severity_count": high_severity_count
            }
            
            observability.trace_agent_decision(
                agent_id=AGENT_ID,
                decision="baseline_established",
                reasoning=historical_baseline
            )
    except Exception as e:
        print(f"[WARN] Anomaly baseline error: {e}")
    
    # === Threshold-Based Detection (with historical context) ===
    
    # High CPU
    if cpu > 90:
        # Check if this is unusual compared to history
        is_new_pattern = historical_baseline.get("high_severity_count", 0) < 2
        confidence_boost = 0.1 if is_new_pattern else 0  # Higher confidence if new
        
        findings.append({
            "agent_id": AGENT_ID,
            "finding_type": "Resource Anomaly",
            "title": "Critical CPU Usage",
            "description": f"CPU usage at {cpu}% exceeds critical threshold",
            "severity": Severity.CRITICAL.value if cpu > 95 else Severity.HIGH.value,
            "confidence": min(0.90 + confidence_boost, 1.0),
            "evidence": {
                "cpu_usage": cpu, 
                "threshold": 90,
                "is_new_pattern": is_new_pattern,
                "historical_events_24h": historical_baseline.get("event_count_24h", 0)
            },
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
    
    # === Frequency-Based Anomaly Detection ===
    try:
        frequency_check = HistoricalContext.detect_frequency_anomaly(
            event.event_type,
            window_hours=1,
            threshold=5
        )
        
        if frequency_check.get("is_anomaly"):
            findings.append({
                "agent_id": AGENT_ID,
                "finding_type": "Frequency Anomaly",
                "title": "Event Rate Spike",
                "description": f"{frequency_check['count_in_window']} similar events in the last hour - {frequency_check['anomaly_score']:.1f}x normal",
                "severity": Severity.MEDIUM.value if frequency_check["anomaly_score"] < 1.5 else Severity.HIGH.value,
                "confidence": min(0.70 + frequency_check["anomaly_score"] * 0.1, 0.95),
                "evidence": {
                    "count_in_window": frequency_check["count_in_window"],
                    "threshold": frequency_check["threshold"],
                    "anomaly_score": frequency_check["anomaly_score"]
                },
                "remediation": "Investigate for potential misconfiguration, attack, or cascading failure."
            })
            
            observability.trace_agent_decision(
                agent_id=AGENT_ID,
                decision="frequency_anomaly",
                reasoning=frequency_check
            )
    except Exception as e:
        print(f"[WARN] Frequency check error: {e}")
    
    # === Historical Deviation Detection ===
    if historical_baseline:
        current_severity_weight = {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.2}
        event_severity = event.severity.value if hasattr(event.severity, 'value') else str(event.severity)
        current_weight = current_severity_weight.get(event_severity, 0.2)
        
        avg_historical_risk = historical_baseline.get("avg_risk_score", 0)
        
        # If current severity is significantly higher than historical average
        if current_weight > avg_historical_risk + 0.3:
            findings.append({
                "agent_id": AGENT_ID,
                "finding_type": "Pattern Deviation",
                "title": "Severity Escalation",
                "description": f"Event severity ({event_severity}) is higher than historical pattern (avg risk: {avg_historical_risk:.2f})",
                "severity": Severity.MEDIUM.value,
                "confidence": 0.70,
                "evidence": {
                    "current_severity": event_severity,
                    "historical_avg_risk": avg_historical_risk,
                    "deviation": current_weight - avg_historical_risk
                },
                "remediation": "Review if conditions have changed. May indicate escalating issue."
            })
    
    # Log decisions
    for finding in findings:
        observability.trace_agent_decision(
            agent_id=AGENT_ID,
            decision=f"anomaly_{finding['finding_type'].lower().replace(' ', '_')}",
            reasoning=finding["evidence"]
        )
    
    return {
        "findings": findings,
        "audit_log": [{
            "step": "Anomaly Detection",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "findings_count": len(findings),
            "historical_baseline_available": bool(historical_baseline),
            "events_in_baseline": historical_baseline.get("event_count_24h", 0),
            "message": f"Analyzed metrics with historical baseline, found {len(findings)} anomalies."
        }],
        "agents_completed": [AGENT_ID]
    }
