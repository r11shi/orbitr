"""
Workflows Router - Compliance workflow management.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from ..services.workflow import WorkflowStateMachine, WorkflowStatus

router = APIRouter(prefix="/workflows", tags=["Workflows"])


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
    
    return {
        "count": len(workflows),
        "workflows": [w.to_dict() for w in workflows]
    }


@router.get("/{workflow_id}")
async def get_workflow_detail(workflow_id: str):
    """Get workflow details."""
    workflow = WorkflowStateMachine.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow.to_dict()


@router.post("/{workflow_id}/advance")
async def advance_workflow(workflow_id: str, action: str, actor_id: Optional[str] = None):
    """Advance a workflow to the next step."""
    workflow = WorkflowStateMachine.advance_workflow(workflow_id, action, actor_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow.to_dict()
