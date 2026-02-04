from typing import Dict, Any, List
from ..models.state import WorkflowState
from ..models.events import Severity
from ..services.history import HistoricalContext
from ..services.observability import observability, traceable
import time
import re

AGENT_ID = "security_watchdog"

# Detection Rules
DETECTION_RULES = [
    {
        "name": "AWS Key Exposure",
        "pattern": r'AKIA[0-9A-Z]{16}',
        "severity": Severity.CRITICAL,
        "confidence": 0.95,
        "remediation": "Immediately rotate the exposed AWS access key."
    },
    {
        "name": "Privileged Command Without MFA",
        "check": lambda p: "sudo" in str(p.get("action", "")).lower() and not p.get("mfa_present", True),
        "severity": Severity.CRITICAL,
        "confidence": 0.92,
        "remediation": "Enforce MFA for all privileged operations."
    },
    {
        "name": "Production Database Access",
        "check": lambda p: any(kw in str(p.get("target", p.get("host", ""))).lower() for kw in ["prod-db", "db-prod", "production"]),
        "severity": Severity.HIGH,
        "confidence": 0.80,
        "remediation": "Verify access is through approved jump host."
    },
    {
        "name": "Unknown IP Location",
        "check": lambda p: p.get("location", "").lower() in ["unknown", "unknown-ip", "tor", "vpn-exit"],
        "severity": Severity.HIGH,
        "confidence": 0.85,
        "remediation": "Verify user identity and investigate source IP."
    }
]


@traceable(name="security_analysis", run_type="agent")
def security_watchdog_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Security Agent - pattern matching, behavioral analysis, and historical context.
    
    Enhanced with:
    - Historical pattern detection (repeat offenders)
    - Frequency anomaly detection
    - Observability tracing
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    payload = event.payload
    start = time.time()
    findings = []
    
    actor_id = payload.get('user_id') or payload.get('username', 'Unknown')
    
    # === Rule-Based Detection ===
    for rule in DETECTION_RULES:
        triggered = False
        evidence = {"actor": actor_id}
        
        # Pattern-based detection (regex)
        if "pattern" in rule:
            for key, value in payload.items():
                if isinstance(value, str) and re.search(rule["pattern"], value):
                    triggered = True
                    evidence["matched_field"] = key
                    break
        
        # Lambda-based detection
        elif "check" in rule:
            try:
                if rule["check"](payload):
                    triggered = True
            except:
                pass
        
        if triggered:
            findings.append({
                "agent_id": AGENT_ID,
                "finding_type": "Security Threat",
                "title": rule["name"],
                "description": f"Detected: {rule['name']} in event from {event.source_system}",
                "severity": rule["severity"].value,
                "confidence": rule["confidence"],
                "evidence": evidence,
                "remediation": rule.get("remediation")
            })
            
            # Trace the detection
            observability.trace_agent_decision(
                agent_id=AGENT_ID,
                decision="threat_detected",
                reasoning={"rule": rule["name"], "evidence": evidence}
            )
    
    # === Historical Context Enhancement ===
    historical_findings = []
    
    try:
        # Check for repeat offender
        if actor_id and actor_id != "Unknown":
            actor_history = HistoricalContext.get_actor_risk_history(actor_id, days=7)
            
            if actor_history.get("is_repeat_offender"):
                historical_findings.append({
                    "agent_id": AGENT_ID,
                    "finding_type": "Behavioral Pattern",
                    "title": "Repeat Security Offender",
                    "description": f"Actor {actor_id} has {actor_history['high_severity_count']} high-severity events in past 7 days",
                    "severity": Severity.HIGH.value,
                    "confidence": 0.90,
                    "evidence": {
                        "actor": actor_id,
                        "historical_events": actor_history["events_count"],
                        "high_severity_count": actor_history["high_severity_count"],
                        "avg_risk_score": actor_history["risk_score"]
                    },
                    "remediation": "Investigate actor's access patterns. Consider temporary privilege revocation."
                })
                
                observability.trace_agent_decision(
                    agent_id=AGENT_ID,
                    decision="repeat_offender_flagged",
                    reasoning=actor_history
                )
        
        # Check for frequency anomaly (potential brute force or attack)
        frequency_check = HistoricalContext.detect_frequency_anomaly(
            event.event_type,
            window_hours=1,
            threshold=10  # More than 10 similar events in 1 hour = suspicious
        )
        
        if frequency_check.get("is_anomaly"):
            historical_findings.append({
                "agent_id": AGENT_ID,
                "finding_type": "Frequency Anomaly",
                "title": "Unusual Event Frequency",
                "description": f"{frequency_check['count_in_window']} {event.event_type} events in past hour (threshold: {frequency_check['threshold']})",
                "severity": Severity.MEDIUM.value,
                "confidence": 0.75,
                "evidence": {
                    "count": frequency_check["count_in_window"],
                    "threshold": frequency_check["threshold"],
                    "anomaly_score": frequency_check["anomaly_score"]
                },
                "remediation": "Investigate for potential attack or misconfiguration."
            })
            
            observability.trace_agent_decision(
                agent_id=AGENT_ID,
                decision="frequency_anomaly_detected",
                reasoning=frequency_check
            )
    
    except Exception as e:
        print(f"⚠️ Security historical context error: {e}")
    
    # Combine all findings
    all_findings = findings + historical_findings
    
    return {
        "findings": all_findings,
        "audit_log": [{
            "step": "Security Analysis",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "findings_count": len(all_findings),
            "rule_findings": len(findings),
            "historical_findings": len(historical_findings),
            "actor": actor_id,
            "message": f"Detected {len(findings)} threats + {len(historical_findings)} behavioral patterns."
        }],
        "agents_completed": [AGENT_ID]
    }
