"""
Workflow State Machine - Track Multi-Step Compliance Flows
Enables stateful tracking of compliance workflows across multiple events.
"""
from typing import Dict, Any, List, Optional
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import json
import uuid

class WorkflowStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    ESCALATED = "escalated"
    EXPIRED = "expired"

@dataclass
class ComplianceWorkflow:
    """
    Represents a multi-step compliance workflow.
    Examples: Change approval, access review, incident response.
    """
    workflow_id: str
    workflow_type: str  # "change_approval", "access_review", "incident_response"
    correlation_id: str
    status: WorkflowStatus
    created_at: float
    updated_at: float
    
    # Actors
    requester_id: Optional[str] = None
    approver_id: Optional[str] = None
    
    # State
    current_step: int = 0
    steps: List[Dict] = field(default_factory=list)
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            "workflow_id": self.workflow_id,
            "workflow_type": self.workflow_type,
            "correlation_id": self.correlation_id,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "requester_id": self.requester_id,
            "approver_id": self.approver_id,
            "current_step": self.current_step,
            "steps": self.steps,
            "metadata": self.metadata
        }

# Workflow Templates
WORKFLOW_TEMPLATES = {
    "change_approval": {
        "steps": [
            {"name": "request_submitted", "required_action": "submit", "auto": True},
            {"name": "risk_assessment", "required_action": "assess", "auto": True},
            {"name": "manager_approval", "required_action": "approve", "auto": False},
            {"name": "cab_review", "required_action": "review", "auto": False, "condition": "high_risk"},
            {"name": "implementation", "required_action": "implement", "auto": True},
            {"name": "verification", "required_action": "verify", "auto": True}
        ],
        "timeout_hours": 72,
        "escalation_hours": 24
    },
    "access_review": {
        "steps": [
            {"name": "access_requested", "required_action": "request", "auto": True},
            {"name": "identity_verification", "required_action": "verify", "auto": True},
            {"name": "manager_approval", "required_action": "approve", "auto": False},
            {"name": "security_review", "required_action": "review", "auto": False, "condition": "privileged"},
            {"name": "access_granted", "required_action": "grant", "auto": True}
        ],
        "timeout_hours": 48,
        "escalation_hours": 12
    },
    "incident_response": {
        "steps": [
            {"name": "incident_detected", "required_action": "detect", "auto": True},
            {"name": "triage", "required_action": "triage", "auto": True},
            {"name": "investigation", "required_action": "investigate", "auto": False},
            {"name": "containment", "required_action": "contain", "auto": False},
            {"name": "remediation", "required_action": "remediate", "auto": False},
            {"name": "post_mortem", "required_action": "review", "auto": False}
        ],
        "timeout_hours": 168,
        "escalation_hours": 4
    }
}

class WorkflowStateMachine:
    """
    Manages compliance workflow state transitions.
    UPDATED: Uses database persistence instead of in-memory storage.
    """
    
    @classmethod
    def create_workflow(cls, workflow_type: str, correlation_id: str, 
                       requester_id: str = None, metadata: Dict = None) -> ComplianceWorkflow:
        """Create a new compliance workflow and persist to DB."""
        from .database import SessionLocal, WorkflowRecord
        
        template = WORKFLOW_TEMPLATES.get(workflow_type)
        if not template:
            raise ValueError(f"Unknown workflow type: {workflow_type}")
        
        now = datetime.utcnow().timestamp()
        workflow_id = str(uuid.uuid4())
        steps = template["steps"].copy()
        
        # Create DB record
        db = SessionLocal()
        try:
            record = WorkflowRecord(
                workflow_id=workflow_id,
                workflow_type=workflow_type,
                correlation_id=correlation_id,
                status=WorkflowStatus.PENDING.value,
                created_at=now,
                updated_at=now,
                requester_id=requester_id,
                current_step=0,
                steps_json=json.dumps(steps),
                metadata_json=json.dumps(metadata or {})
            )
            db.add(record)
            db.commit()
        finally:
            db.close()
        
        # Return dataclass for compatibility
        return ComplianceWorkflow(
            workflow_id=workflow_id,
            workflow_type=workflow_type,
            correlation_id=correlation_id,
            status=WorkflowStatus.PENDING,
            created_at=now,
            updated_at=now,
            requester_id=requester_id,
            steps=steps,
            metadata=metadata or {}
        )
    
    @classmethod
    def advance_workflow(cls, workflow_id: str, action: str, 
                        actor_id: str = None) -> Optional[ComplianceWorkflow]:
        """Advance workflow to next step if action matches."""
        from .database import SessionLocal, WorkflowRecord
        
        db = SessionLocal()
        try:
            record = db.query(WorkflowRecord).filter(WorkflowRecord.workflow_id == workflow_id).first()
            if not record:
                return None
            
            steps = json.loads(record.steps_json)
            current_step = steps[record.current_step]
            
            if current_step["required_action"] != action:
                return cls._record_to_workflow(record)  # Wrong action
            
            # Record step completion
            steps[record.current_step]["completed_at"] = datetime.utcnow().timestamp()
            steps[record.current_step]["completed_by"] = actor_id
            
            # Move to next step
            new_step = record.current_step + 1
            now = datetime.utcnow().timestamp()
            
            # Determine new status
            if new_step >= len(steps):
                new_status = WorkflowStatus.COMPLETED.value
            else:
                next_step = steps[new_step]
                if next_step.get("auto"):
                    new_status = WorkflowStatus.IN_PROGRESS.value
                else:
                    new_status = WorkflowStatus.AWAITING_APPROVAL.value
            
            # Update record
            record.current_step = new_step
            record.updated_at = now
            record.status = new_status
            record.steps_json = json.dumps(steps)
            if actor_id:
                record.approver_id = actor_id
            db.commit()
            
            return cls._record_to_workflow(record)
        finally:
            db.close()
    
    @classmethod
    def get_workflow(cls, workflow_id: str) -> Optional[ComplianceWorkflow]:
        """Get workflow by ID."""
        from .database import SessionLocal, WorkflowRecord
        
        db = SessionLocal()
        try:
            record = db.query(WorkflowRecord).filter(WorkflowRecord.workflow_id == workflow_id).first()
            return cls._record_to_workflow(record) if record else None
        finally:
            db.close()
    
    @classmethod
    def get_pending_workflows(cls) -> List[ComplianceWorkflow]:
        """Get all non-completed workflows."""
        from .database import SessionLocal, WorkflowRecord
        
        db = SessionLocal()
        try:
            records = db.query(WorkflowRecord).filter(
                ~WorkflowRecord.status.in_([WorkflowStatus.COMPLETED.value, WorkflowStatus.REJECTED.value])
            ).all()
            return [cls._record_to_workflow(r) for r in records]
        finally:
            db.close()
    
    @classmethod
    def get_workflows_by_correlation(cls, correlation_id: str) -> List[ComplianceWorkflow]:
        """Get workflows by correlation ID."""
        from .database import SessionLocal, WorkflowRecord
        
        db = SessionLocal()
        try:
            records = db.query(WorkflowRecord).filter(WorkflowRecord.correlation_id == correlation_id).all()
            return [cls._record_to_workflow(r) for r in records]
        finally:
            db.close()
    
    @classmethod
    def _record_to_workflow(cls, record) -> ComplianceWorkflow:
        """Convert DB record to dataclass."""
        return ComplianceWorkflow(
            workflow_id=record.workflow_id,
            workflow_type=record.workflow_type,
            correlation_id=record.correlation_id,
            status=WorkflowStatus(record.status),
            created_at=record.created_at,
            updated_at=record.updated_at,
            requester_id=record.requester_id,
            approver_id=record.approver_id,
            current_step=record.current_step,
            steps=json.loads(record.steps_json),
            metadata=json.loads(record.metadata_json) if record.metadata_json else {}
        )


def detect_workflow_trigger(event: Dict) -> Optional[str]:
    """
    Detect if an event should trigger a compliance workflow.
    Returns workflow type or None.
    """
    event_type = event.get("event_type", "").lower()
    payload = event.get("payload", {})
    severity = event.get("severity", "Medium")
    
    # Change management trigger
    if any(kw in event_type for kw in ["deployment", "change", "release"]):
        return "change_approval"
    
    # Access review trigger
    if any(kw in event_type for kw in ["access", "permission", "role"]):
        if payload.get("privileged") or severity in ["High", "Critical"]:
            return "access_review"
    
    # Incident response trigger
    if severity == "Critical" or any(kw in event_type for kw in ["breach", "incident", "attack"]):
        return "incident_response"
    
    return None
