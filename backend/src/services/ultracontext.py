"""
UltraContext Integration - Context API for AI Agents
https://ultracontext.ai/

Provides versioned context storage for:
- Compliance policies
- Historical event patterns
- Agent reasoning traces
"""
import os
import httpx
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()

ULTRACONTEXT_API_KEY = os.getenv("ULTRACONTEXT_API_KEY")
ULTRACONTEXT_BASE_URL = "https://api.ultracontext.ai"


@dataclass
class UltraContextClient:
    """
    Python client for UltraContext REST API.
    Manages versioned context for AI agent workflows.
    """
    api_key: str = field(default_factory=lambda: ULTRACONTEXT_API_KEY or "")
    base_url: str = ULTRACONTEXT_BASE_URL
    
    def __post_init__(self):
        if not self.api_key:
            print("⚠️ ULTRACONTEXT_API_KEY not set - using local fallback")
    
    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def create_context(self, metadata: Optional[Dict] = None) -> Optional[Dict]:
        """Create a new context container."""
        if not self.api_key:
            return {"id": f"local_{os.urandom(8).hex()}", "local": True}
        
        try:
            with httpx.Client(timeout=10.0) as client:
                payload = {}
                if metadata:
                    payload["metadata"] = metadata
                response = client.post(
                    f"{self.base_url}/contexts",
                    headers=self._headers(),
                    json=payload
                )
                if response.status_code == 200:
                    return response.json()
                print(f"❌ UltraContext create error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ UltraContext connection error: {e}")
            return None
    
    def append(self, context_id: str, messages: List[Dict] | Dict) -> bool:
        """Append messages to a context."""
        if not self.api_key or context_id.startswith("local_"):
            return True  # Local fallback
        
        if isinstance(messages, dict):
            messages = [messages]
        
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    f"{self.base_url}/contexts/{context_id}/messages",
                    headers=self._headers(),
                    json={"messages": messages}
                )
                return response.status_code == 200
        except Exception as e:
            print(f"❌ UltraContext append error: {e}")
            return False
    
    def get_context(self, context_id: str, version: Optional[int] = None, history: bool = False) -> Optional[Dict]:
        """Retrieve a context with optional version/history."""
        if not self.api_key or context_id.startswith("local_"):
            return {"data": [], "version": 0, "local": True}
        
        try:
            params = {}
            if version is not None:
                params["version"] = version
            if history:
                params["history"] = "true"
            
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{self.base_url}/contexts/{context_id}",
                    headers=self._headers(),
                    params=params
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            print(f"❌ UltraContext get error: {e}")
            return None
    
    def update(self, context_id: str, updates: List[Dict] | Dict) -> bool:
        """Update messages in a context (creates new version)."""
        if not self.api_key or context_id.startswith("local_"):
            return True
        
        if isinstance(updates, dict):
            updates = [updates]
        
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.patch(
                    f"{self.base_url}/contexts/{context_id}/messages",
                    headers=self._headers(),
                    json={"updates": updates}
                )
                return response.status_code == 200
        except Exception as e:
            print(f"❌ UltraContext update error: {e}")
            return False


# Singleton instance
ultracontext = UltraContextClient()


class ContextAssembler:
    """
    Assembles rich context for LLM calls.
    Combines: policies, historical data, agent traces.
    """
    
    def __init__(self):
        self.uc = ultracontext
        self._policy_cache: Dict[str, List[Dict]] = {}
        self._load_default_policies()
    
    def _load_default_policies(self):
        """Load compliance policies from local definitions."""
        self._policy_cache = {
            "Security": [
                {
                    "id": "SEC-001",
                    "name": "MFA Required for Privileged Access",
                    "description": "All sudo/admin operations require multi-factor authentication",
                    "frameworks": ["ISO27001-A.9.4", "NIST-IA-2", "SOC2-CC6.1"],
                    "remediation": "Enable MFA for all privileged operations"
                },
                {
                    "id": "SEC-002",
                    "name": "Production Access Logging",
                    "description": "All production environment access must be logged with justification",
                    "frameworks": ["ISO27001-A.12.4", "SOC2-CC7.2"],
                    "remediation": "Document business justification for production access"
                },
                {
                    "id": "SEC-003",
                    "name": "AWS Key Exposure Prevention",
                    "description": "AWS access keys must never be exposed in logs or payloads",
                    "frameworks": ["CIS-AWS-1.4", "SOC2-CC6.7"],
                    "remediation": "Rotate exposed key immediately and scan for usage"
                }
            ],
            "Financial": [
                {
                    "id": "FIN-001",
                    "name": "Transaction Threshold Approval",
                    "description": "Transactions over $1000 require dual approval",
                    "frameworks": ["SOX-404", "PCI-DSS-10.2"],
                    "remediation": "Escalate to Finance Controller for approval"
                },
                {
                    "id": "FIN-002",
                    "name": "Segregation of Duties",
                    "description": "Same person cannot request and approve transactions",
                    "frameworks": ["SOX-302", "ISO27001-A.6.1"],
                    "remediation": "Implement proper approval chain with different approvers"
                }
            ],
            "Compliance": [
                {
                    "id": "COMP-001",
                    "name": "Working Hours Enforcement",
                    "description": "System changes outside 6AM-10PM require CAB approval",
                    "frameworks": ["SOC2-CC6.1", "ISO27001-A.12.1"],
                    "remediation": "Schedule during approved windows or obtain CAB approval"
                },
                {
                    "id": "COMP-002",
                    "name": "Change Ticket Required",
                    "description": "High/Critical severity events must reference a change ticket",
                    "frameworks": ["SOC2-CC8.1", "ITIL"],
                    "remediation": "Create or link to an approved RFC before proceeding"
                }
            ],
            "Infrastructure": [
                {
                    "id": "INFRA-001",
                    "name": "Resource Utilization Thresholds",
                    "description": "CPU/Memory > 90% requires immediate action",
                    "frameworks": ["SRE-SLO", "ITIL-Capacity"],
                    "remediation": "Scale horizontally or investigate resource hogs"
                },
                {
                    "id": "INFRA-002",
                    "name": "Disk Space Management",
                    "description": "Disk usage > 85% requires cleanup or expansion",
                    "frameworks": ["SRE-SLO", "ITIL-Capacity"],
                    "remediation": "Clear logs, expand volume, or add storage"
                }
            ]
        }
    
    def get_policies_for_domain(self, domain: str) -> List[Dict]:
        """Get applicable policies for a domain."""
        # Normalize domain name
        domain_key = domain.replace("Domain.", "").title()
        policies = self._policy_cache.get(domain_key, [])
        
        # Always include general compliance policies
        if domain_key != "Compliance":
            policies = policies + self._policy_cache.get("Compliance", [])
        
        return policies
    
    def get_approved_remediations(self, domain: str) -> List[str]:
        """Get list of approved remediation actions for a domain."""
        policies = self.get_policies_for_domain(domain)
        return [p["remediation"] for p in policies if "remediation" in p]
    
    def build_context_for_event(self, event: Any, historical_data: Dict = None) -> Dict:
        """
        Build complete context for LLM reasoning.
        
        Returns:
            Dict containing:
            - applicable_policies: List of relevant policies
            - approved_remediations: List of valid actions
            - historical_context: Past similar events
            - actor_profile: Risk history of actor
        """
        from ..models.events import Domain
        
        # Get domain string
        domain = event.domain.value if hasattr(event.domain, 'value') else str(event.domain)
        
        context = {
            "applicable_policies": self.get_policies_for_domain(domain),
            "approved_remediations": self.get_approved_remediations(domain),
            "historical_context": None,
            "actor_profile": None,
            "event_domain": domain,
            "event_type": event.event_type,
            "severity": event.severity.value if hasattr(event.severity, 'value') else str(event.severity)
        }
        
        # Add historical data if provided
        if historical_data:
            context["historical_context"] = historical_data.get("similar_events", [])
            context["actor_profile"] = historical_data.get("actor_risk", {})
            context["frequency_anomaly"] = historical_data.get("frequency_anomaly", {})
        
        return context
    
    def format_policies_for_prompt(self, policies: List[Dict]) -> str:
        """Format policies as text for LLM prompt."""
        if not policies:
            return "No specific policies loaded."
        
        lines = []
        for p in policies:
            frameworks = ", ".join(p.get("frameworks", []))
            lines.append(f"- [{p['id']}] {p['name']}: {p['description']} (Frameworks: {frameworks})")
        
        return "\n".join(lines)
    
    def format_remediations_for_prompt(self, remediations: List[str]) -> str:
        """Format approved remediations for LLM prompt."""
        if not remediations:
            return "No pre-approved remediations."
        
        return "\n".join([f"- {r}" for r in remediations])


# Singleton instance
context_assembler = ContextAssembler()
