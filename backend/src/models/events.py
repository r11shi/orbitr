from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum
import uuid
import time

class Severity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Domain(str, Enum):
    SECURITY = "Security"
    COMPLIANCE = "Compliance"
    FINANCIAL = "Financial"
    INFRASTRUCTURE = "Infrastructure"
    UNKNOWN = "Unknown"

class StandardizedEvent(BaseModel):
    """
    Production-grade event schema with rich context for intelligent routing.
    """
    # Identifiers
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = Field(default_factory=time.time)
    
    # Classification (Core)
    event_type: str
    source_system: str
    severity: Severity = Severity.MEDIUM
    domain: Domain = Domain.UNKNOWN
    
    # Context (Who/What)
    actor_id: Optional[str] = None  # User or Service Account
    resource_id: Optional[str] = None  # Target Resource
    
    # Payload
    payload: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    tags: List[str] = []
    
    # Pre-computed signals (can be set by ingestion layer)
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    
    @validator('domain', pre=True, always=True)
    def infer_domain(cls, v, values):
        if v != Domain.UNKNOWN:
            return v
        event_type = values.get('event_type', '').lower()
        if any(k in event_type for k in ['access', 'auth', 'login', 'ssh']):
            return Domain.SECURITY
        if any(k in event_type for k in ['financial', 'billing', 'transaction', 'cost']):
            return Domain.FINANCIAL
        if any(k in event_type for k in ['metric', 'cpu', 'memory', 'disk']):
            return Domain.INFRASTRUCTURE
        if any(k in event_type for k in ['policy', 'compliance', 'audit']):
            return Domain.COMPLIANCE
        return Domain.UNKNOWN


class AgentFinding(BaseModel):
    """
    Standardized output from any expert agent.
    """
    agent_id: str
    finding_type: str  # e.g., "Policy Violation", "Anomaly", "Threat"
    title: str
    description: str
    severity: Severity
    confidence: float = Field(ge=0.0, le=1.0)  # How sure is the agent?
    evidence: Dict[str, Any] = {}
    remediation: Optional[str] = None
    
    
class AnalysisResult(BaseModel):
    """
    The complete output of the agentic analysis pipeline.
    """
    event_id: str
    correlation_id: str
    timestamp: float
    
    # Aggregated Findings
    findings: List[AgentFinding] = []
    total_risk_score: float = 0.0  # Computed from all findings
    
    # LLM Synthesis
    summary: Optional[str] = None
    root_cause: Optional[str] = None
    recommended_actions: List[str] = []
    
    # Metadata
    agents_invoked: List[str] = []
    processing_time_ms: float = 0.0
