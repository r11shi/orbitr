"""
Dynamic Compliance Rules Engine
Load rules from config/database for runtime flexibility.
"""
from typing import Dict, Any, List, Callable, Optional
from dataclasses import dataclass, field
from pathlib import Path
import json
import yaml
import time

@dataclass
class ComplianceRuleDefinition:
    """Rule definition loaded from config."""
    id: str
    name: str
    description: str
    severity: str
    confidence: float
    frameworks: List[str]
    remediation: str
    enabled: bool = True
    
    # Condition expression (evaluated at runtime)
    conditions: Dict[str, Any] = field(default_factory=dict)

class DynamicRulesEngine:
    """
    Load and evaluate compliance rules from external configuration.
    Enables rule updates without code deployment.
    """
    
    def __init__(self):
        self._rules: List[ComplianceRuleDefinition] = []
        self._built_in_rules = self._load_built_in_rules()
    
    def _load_built_in_rules(self) -> List[ComplianceRuleDefinition]:
        """Default rules shipped with the system."""
        return [
            ComplianceRuleDefinition(
                id="BUILTIN-001",
                name="Working Hours Enforcement",
                description="Actions outside 6AM-10PM require approval",
                severity="Medium",
                confidence=0.75,
                frameworks=["SOC2-CC6.1", "ISO27001-A.12.1"],
                remediation="Schedule during approved windows or obtain CAB approval.",
                conditions={"time_check": {"outside_hours": [6, 22]}}
            ),
            ComplianceRuleDefinition(
                id="BUILTIN-002",
                name="Change Ticket Required",
                description="High/Critical events must have change ticket",
                severity="High",
                confidence=0.88,
                frameworks=["SOC2-CC8.1", "ITIL"],
                remediation="Link to approved RFC before proceeding.",
                conditions={"severity_in": ["High", "Critical"], "missing_fields": ["change_id", "ticket_id"]}
            ),
            ComplianceRuleDefinition(
                id="BUILTIN-003",
                name="MFA Required for Privileged Access",
                description="Sudo/privileged actions require MFA",
                severity="Critical",
                confidence=0.95,
                frameworks=["ISO27001-A.9.4", "NIST-IA-2"],
                remediation="Enable MFA for all privileged operations.",
                conditions={"payload_contains": ["sudo", "privilege"], "payload_field_false": "mfa_present"}
            ),
            ComplianceRuleDefinition(
                id="BUILTIN-004",
                name="Production Access Logging",
                description="Production access must be logged with justification",
                severity="Medium",
                confidence=0.80,
                frameworks=["ISO27001-A.12.4", "SOC2-CC7.2"],
                remediation="Document business justification.",
                conditions={"payload_contains": ["prod", "production"], "missing_fields": ["justification"]}
            ),
            ComplianceRuleDefinition(
                id="BUILTIN-005",
                name="Financial Threshold Exceeded",
                description="Transactions over $1000 require dual approval",
                severity="High",
                confidence=0.92,
                frameworks=["SOX-404", "PCI-DSS-10.2"],
                remediation="Escalate to Finance Controller.",
                conditions={"payload_field_gt": {"mismatch_amount": 1000}}
            ),
            ComplianceRuleDefinition(
                id="BUILTIN-006",
                name="Segregation of Duties Violation",
                description="Same person cannot request and approve",
                severity="High",
                confidence=0.95,
                frameworks=["SOX-302", "ISO27001-A.6.1"],
                remediation="Implement proper approval chain.",
                conditions={"payload_fields_equal": ["requester_id", "approver_id"]}
            ),
            ComplianceRuleDefinition(
                id="BUILTIN-007",
                name="Sensitive Data Access",
                description="PII/sensitive data access requires pre-approval",
                severity="Critical",
                confidence=0.90,
                frameworks=["GDPR-Art32", "PCI-DSS-3.4"],
                remediation="Obtain data access approval.",
                conditions={"payload_contains": ["pii", "ssn", "credit_card"]}
            )
        ]
    
    def load_rules_from_file(self, filepath: str) -> int:
        """Load additional rules from YAML/JSON file."""
        path = Path(filepath)
        if not path.exists():
            return 0
        
        content = path.read_text()
        if filepath.endswith('.yaml') or filepath.endswith('.yml'):
            data = yaml.safe_load(content)
        else:
            data = json.loads(content)
        
        rules = data.get("rules", [])
        for rule_data in rules:
            self._rules.append(ComplianceRuleDefinition(**rule_data))
        
        return len(rules)
    
    def get_all_rules(self) -> List[ComplianceRuleDefinition]:
        """Get all active rules (built-in + custom)."""
        return [r for r in self._built_in_rules + self._rules if r.enabled]
    
    def evaluate_rule(self, rule: ComplianceRuleDefinition, event: Any, payload: Dict) -> bool:
        """Evaluate a rule's conditions against an event."""
        conditions = rule.conditions
        
        # Time check
        if "time_check" in conditions:
            tc = conditions["time_check"]
            if "outside_hours" in tc:
                start, end = tc["outside_hours"]
                hour = time.localtime(event.timestamp).tm_hour
                if hour < start or hour > end:
                    return True
        
        # Severity check
        if "severity_in" in conditions:
            if hasattr(event, 'severity') and event.severity.value in conditions["severity_in"]:
                # Check other conditions too
                if "missing_fields" in conditions:
                    if not any(f in payload for f in conditions["missing_fields"]):
                        return True
        
        # Payload contains check
        if "payload_contains" in conditions:
            payload_str = str(payload).lower()
            if any(kw in payload_str for kw in conditions["payload_contains"]):
                # Additional field checks
                if "payload_field_false" in conditions:
                    field = conditions["payload_field_false"]
                    if not payload.get(field, True):
                        return True
                elif "missing_fields" not in conditions:
                    return True
        
        # Field comparison
        if "payload_field_gt" in conditions:
            for field, threshold in conditions["payload_field_gt"].items():
                if payload.get(field, 0) > threshold:
                    return True
        
        # Fields equal check
        if "payload_fields_equal" in conditions:
            fields = conditions["payload_fields_equal"]
            if len(fields) >= 2:
                val1 = payload.get(fields[0])
                val2 = payload.get(fields[1])
                if val1 and val2 and val1 == val2:
                    return True
        
        return False

# Singleton instance
rules_engine = DynamicRulesEngine()
