from typing import Dict, Any, List
from ..models.state import WorkflowState
from ..models.events import Severity
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

def security_watchdog_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Security Agent - pattern matching and behavioral analysis.
    Returns only updated fields.
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    payload = event.payload
    start = time.time()
    findings = []
    
    actor_id = payload.get('user_id') or payload.get('username', 'Unknown')
    
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
    
    return {
        "findings": findings,
        "audit_log": [{
            "step": "Security Analysis",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "findings_count": len(findings),
            "message": f"Detected {len(findings)} security threats."
        }],
        "agents_completed": [AGENT_ID]
    }
