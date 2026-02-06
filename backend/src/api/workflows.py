"""
Workflows Router - Compliance workflow management with progression.
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Optional
from pydantic import BaseModel

from ..services.workflow import WorkflowStateMachine, WorkflowStatus, ComplianceWorkflow
from ..services.database import SessionLocal, WorkflowRecord
import json
from datetime import datetime

router = APIRouter(prefix="/workflows", tags=["Workflows"])


class WorkflowAdvanceRequest(BaseModel):
    action: str = "approve"
    actor_id: Optional[str] = None
    comment: Optional[str] = None


@router.get("")
async def get_workflows(status: Optional[str] = None):
    """Get compliance workflows."""
    workflows = WorkflowStateMachine.get_pending_workflows()
    
    if status:
        try:
            target_status = WorkflowStatus(status)
            workflows = [w for w in workflows if w.status == target_status]
        except ValueError:
            pass
    
    # Calculate stats
    healthy = sum(1 for w in workflows if w.status == WorkflowStatus.COMPLETED)
    warning = sum(1 for w in workflows if w.status in [WorkflowStatus.PENDING, WorkflowStatus.AWAITING_APPROVAL])
    failed = sum(1 for w in workflows if w.status in [WorkflowStatus.REJECTED, WorkflowStatus.ESCALATED, WorkflowStatus.EXPIRED])
    
    return {
        "count": len(workflows),
        "stats": {
            "healthy": healthy,
            "warning": warning,
            "failed": failed
        },
        "workflows": [w.to_dict() for w in workflows]
    }


@router.get("/{workflow_id}")
async def get_workflow_detail(workflow_id: str):
    """Get workflow details with step information."""
    workflow = WorkflowStateMachine.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    result = workflow.to_dict()
    
    # Add formatted steps for frontend
    steps = result.get("steps", [])
    formatted_steps = []
    current = result.get("current_step", 0)
    
    step_descriptions = {
        "request": "Workflow initiated - request submitted for processing",
        "risk_check": "Automated compliance and risk assessment",
        "approval": "Awaiting manager or supervisor approval",
        "deploy": "Deployment to production environment",
        "scan": "Running automated security scans",
        "analysis": "Security team reviewing scan results",
        "build": "Building deployment artifacts",
        "test": "Running automated test suite",
        "verify": "Identity and access verification",
        "grant": "Provisioning access to requested resources",
        "triage": "Assessing incident severity and impact",
        "investigate": "Investigating root cause",
        "resolve": "Implementing resolution and recovery"
    }
    
    step_agents = {
        "request": "System",
        "risk_check": "Compliance Sentinel",
        "approval": "Supervisor Agent",
        "deploy": "Infrastructure Monitor",
        "scan": "Security Watchdog",
        "analysis": "Security Watchdog",
        "build": "CI Pipeline",
        "test": "Quality Assurance",
        "verify": "Identity Service",
        "grant": "Access Controller",
        "triage": "Incident Manager",
        "investigate": "Security Watchdog",
        "resolve": "Incident Manager"
    }
    
    for i, step in enumerate(steps):
        step_name = step.get("name", f"Step {i+1}")
        formatted_steps.append({
            "name": step_name.replace("_", " ").title(),
            "description": step_descriptions.get(step_name, step.get("description", "Processing step")),
            "agent": step_agents.get(step_name, "System"),
            "status": "completed" if i < current else ("in_progress" if i == current else "pending"),
            "completed_at": step.get("completed_at"),
            "completed_by": step.get("completed_by")
        })
    
    result["steps"] = formatted_steps
    return result


@router.post("/{workflow_id}/advance")
async def advance_workflow(workflow_id: str, body: WorkflowAdvanceRequest):
    """Advance a workflow to the next step."""
    # Use direct progression instead of action matching
    result = force_advance_workflow(workflow_id, body.actor_id or "admin", body.comment)
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return result.to_dict()


@router.post("/{workflow_id}/approve")
async def approve_workflow(workflow_id: str, actor_id: Optional[str] = Body(None, embed=True)):
    """Quick approve a pending workflow step."""
    result = force_advance_workflow(workflow_id, actor_id or "admin", "Approved")
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {
        "success": True,
        "workflow": result.to_dict()
    }


@router.post("/{workflow_id}/reject")
async def reject_workflow(workflow_id: str, reason: str = Body("Rejected by admin", embed=True), actor_id: Optional[str] = Body(None, embed=True)):
    """Reject a workflow step."""
    db = SessionLocal()
    try:
        record = db.query(WorkflowRecord).filter(WorkflowRecord.workflow_id == workflow_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        record.status = WorkflowStatus.REJECTED.value
        metadata = json.loads(record.metadata_json) if record.metadata_json else {}
        metadata["rejected_reason"] = reason
        metadata["rejected_by"] = actor_id or "admin"
        record.metadata_json = json.dumps(metadata)
        record.updated_at = datetime.utcnow().timestamp()
        db.commit()
        
        return {
            "success": True,
            "workflow": WorkflowStateMachine._record_to_workflow(record).to_dict()
        }
    finally:
        db.close()


@router.post("/{workflow_id}/unblock")
async def unblock_workflow(workflow_id: str, override_reason: str = Body("Admin override", embed=True)):
    """Unblock a blocked workflow - admin override."""
    result = force_advance_workflow(workflow_id, "admin", f"Unblocked: {override_reason}")
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {
        "success": True,
        "workflow": result.to_dict()
    }


@router.post("/{workflow_id}/reset")
async def reset_workflow(workflow_id: str):
    """Reset a workflow to its initial state."""
    db = SessionLocal()
    try:
        record = db.query(WorkflowRecord).filter(WorkflowRecord.workflow_id == workflow_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Reset to step 0 and pending status
        record.current_step = 0
        record.status = WorkflowStatus.PENDING.value
        metadata = json.loads(record.metadata_json) if record.metadata_json else {}
        metadata["reset_at"] = datetime.utcnow().timestamp()
        record.metadata_json = json.dumps(metadata)
        record.updated_at = datetime.utcnow().timestamp()
        db.commit()
        
        return {
            "success": True,
            "workflow": WorkflowStateMachine._record_to_workflow(record).to_dict()
        }
    finally:
        db.close()


def force_advance_workflow(workflow_id: str, actor_id: str, comment: str = None) -> Optional[ComplianceWorkflow]:
    """Force a workflow to the next step regardless of required action."""
    db = SessionLocal()
    try:
        record = db.query(WorkflowRecord).filter(WorkflowRecord.workflow_id == workflow_id).first()
        if not record:
            return None
        
        steps = json.loads(record.steps_json)
        now = datetime.utcnow().timestamp()
        
        # Skip to next step
        if record.current_step < len(steps):
            steps[record.current_step]["completed_at"] = now
            steps[record.current_step]["completed_by"] = actor_id
            if comment:
                steps[record.current_step]["comment"] = comment
        
        new_step = record.current_step + 1
        
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
        record.approver_id = actor_id
        db.commit()
        
        return WorkflowStateMachine._record_to_workflow(record)
    finally:
        db.close()
