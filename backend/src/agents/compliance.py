from typing import Dict, Any
from ..models.state import WorkflowState
from ..models.events import Severity
from ..utils.event_helpers import get_event_payload, get_event_type, get_event_severity
import time

AGENT_ID = "compliance_sentinel"


class EventWrapper:
    """Wrapper to make dict events accessible like objects for compliance rules."""
    def __init__(self, event):
        self._event = event
        self._is_dict = isinstance(event, dict)
    
    def __getattr__(self, name):
        if self._is_dict:
            return self._event.get(name)
        return getattr(self._event, name, None)


# Policy Rules Engine
COMPLIANCE_RULES = [
    {
        "id": "POL-001",
        "name": "Working Hours Enforcement",
        "description": "Actions outside 6AM-10PM require approval",
        "check": lambda e, p: time.localtime(e.timestamp or time.time()).tm_hour < 6 or time.localtime(e.timestamp or time.time()).tm_hour > 22,
        "severity": Severity.MEDIUM,
        "confidence": 0.75,
        "frameworks": ["SOC2-CC6.1", "ISO27001-A.12.1"],
        "remediation": "Schedule during approved windows or obtain CAB approval."
    },
    {
        "id": "POL-002",
        "name": "Change Ticket Required",
        "description": "High/Critical events must reference a change ticket",
        "check": lambda e, p: str(e.severity) in ["High", "Critical", "Severity.HIGH", "Severity.CRITICAL"] and not any(k in p for k in ["change_id", "ticket_id", "jira_id"]),
        "severity": Severity.HIGH,
        "confidence": 0.88,
        "frameworks": ["SOC2-CC8.1", "ITIL"],
        "remediation": "Create or link to an approved RFC before proceeding."
    },
    {
        "id": "POL-003",
        "name": "MFA Required for Privileged Access",
        "description": "Sudo/privileged actions require MFA",
        "check": lambda e, p: (p.get("privileged", False) or "sudo" in str(p.get("action", "")).lower()) and not p.get("mfa_present", True),
        "severity": Severity.CRITICAL,
        "confidence": 0.95,
        "frameworks": ["ISO27001-A.9.4", "NIST-IA-2", "SOC2-CC6.1"],
        "remediation": "Enforce MFA for all privileged operations."
    },
    {
        "id": "POL-004",
        "name": "Production Access Logging",
        "description": "Production access must be logged with justification",
        "check": lambda e, p: any(kw in str(p.get("target", p.get("host", ""))).lower() for kw in ["prod", "production"]) and not p.get("justification"),
        "severity": Severity.MEDIUM,
        "confidence": 0.80,
        "frameworks": ["ISO27001-A.12.4", "SOC2-CC7.2"],
        "remediation": "Document business justification for production access."
    },
    {
        "id": "POL-005",
        "name": "Financial Threshold Exceeded",
        "description": "Transactions over $1000 require dual approval",
        "check": lambda e, p: p.get("mismatch_amount", 0) > 1000,
        "severity": Severity.HIGH,
        "confidence": 0.92,
        "frameworks": ["SOX-404", "PCI-DSS-10.2"],
        "remediation": "Escalate to Finance Controller for manual reconciliation."
    }
]

def compliance_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Compliance Agent - checks events against policy rules.
    Returns only updated fields.
    """
    event = state.get("event")
    if not event:
        return {"agents_completed": [AGENT_ID]}
    
    # Wrap event for consistent access
    wrapped_event = EventWrapper(event)
    payload = get_event_payload(event)
    event_type = get_event_type(event)
    start = time.time()
    findings = []
    
    for rule in COMPLIANCE_RULES:
        try:
            if rule["check"](wrapped_event, payload):
                findings.append({
                    "agent_id": AGENT_ID,
                    "finding_type": "Policy Violation",
                    "title": f"[{rule['id']}] {rule['name']}",
                    "description": rule["description"],
                    "severity": rule["severity"].value,
                    "confidence": rule["confidence"],
                    "evidence": {
                        "policy_id": rule["id"],
                        "frameworks": rule["frameworks"],
                        "event_type": event_type
                    },
                    "remediation": rule["remediation"]
                })
        except Exception as e:
            pass  # Graceful degradation
    
    return {
        "findings": findings,
        "audit_log": [{
            "step": "Compliance Analysis",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "rules_checked": len(COMPLIANCE_RULES),
            "findings_count": len(findings),
            "message": f"Checked {len(COMPLIANCE_RULES)} policies, found {len(findings)} violations."
        }],
        "agents_completed": [AGENT_ID]
    }
