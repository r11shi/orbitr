"""
Chat Router - Orbiter AI conversation interface.
CRITICAL: Chat is the SYSTEM BRAIN - it queries DB and explains everything.
"""
from fastapi import APIRouter, Body
from typing import List
from datetime import datetime
import re
import json

from ..services.llm import call_llm
from ..services.database import SessionLocal, AuditLog, FindingRecord, WorkflowRecord

router = APIRouter(tags=["Chat"])


def get_system_context() -> str:
    """Get current system state for context."""
    db = SessionLocal()
    try:
        # Get recent incidents
        recent_logs = db.query(AuditLog).filter(
            AuditLog.severity.in_(['High', 'Critical'])
        ).order_by(AuditLog.timestamp.desc()).limit(5).all()
        
        # Get active workflows
        workflows = db.query(WorkflowRecord).order_by(
            WorkflowRecord.updated_at.desc()
        ).limit(5).all()
        
        # Get recent findings
        findings = db.query(FindingRecord).order_by(
            FindingRecord.timestamp.desc()
        ).limit(10).all()
        
        context_parts = []
        
        if workflows:
            wf_summary = []
            for w in workflows:
                metadata = json.loads(w.metadata_json) if w.metadata_json else {}
                wf_summary.append(
                    f"  - [{w.workflow_id[:8]}] {w.workflow_type} | Status: {w.status} | Step: {w.current_step}"
                    + (f" | BLOCKED: {metadata.get('blocked_reason')}" if metadata.get('blocked_reason') else "")
                )
            context_parts.append("ACTIVE WORKFLOWS:\n" + "\n".join(wf_summary))
        
        if recent_logs:
            inc_summary = [
                f"  - [{l.correlation_id[:8]}] {l.event_type} | Severity: {l.severity} | Risk: {l.risk_score}"
                for l in recent_logs
            ]
            context_parts.append("RECENT INCIDENTS:\n" + "\n".join(inc_summary))
        
        if findings:
            finding_summary = [
                f"  - [{f.agent_id}] {f.finding_type}: {f.finding[:50]}..."
                for f in findings[:5]
            ]
            context_parts.append("RECENT FINDINGS:\n" + "\n".join(finding_summary))
        
        return "\n\n".join(context_parts) if context_parts else "No recent activity."
    finally:
        db.close()


def get_workflow_details(workflow_id: str) -> str:
    """Get details about a specific workflow."""
    db = SessionLocal()
    try:
        workflow = db.query(WorkflowRecord).filter(
            WorkflowRecord.workflow_id.ilike(f"%{workflow_id}%")
        ).first()
        
        if not workflow:
            return f"No workflow found matching '{workflow_id}'"
        
        metadata = json.loads(workflow.metadata_json) if workflow.metadata_json else {}
        steps = json.loads(workflow.steps_json) if workflow.steps_json else []
        
        return f"""
WORKFLOW DETAILS:
- ID: {workflow.workflow_id}
- Type: {workflow.workflow_type}
- Status: {workflow.status}
- Current Step: {workflow.current_step} / {len(steps)}
- Requester: {workflow.requester_id}
- Created: {datetime.fromtimestamp(workflow.created_at).strftime('%H:%M:%S')}
- Blocked Reason: {metadata.get('blocked_reason', 'N/A')}
- Policy Violation: {metadata.get('policy_id', 'N/A')}
"""
    finally:
        db.close()


@router.post("/chat")
async def chat_interaction(message: str = Body(...), history: List[dict] = Body([])):
    """Chat with Orbiter AI - Context-aware system brain."""
    
    additional_context = ""
    suggested_actions = []
    
    message_lower = message.lower()
    
    # Detect intent and gather relevant context
    if any(word in message_lower for word in ["workflow", "blocked", "stuck", "pending"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Workflows", "href": "/workflows"})
    
    elif any(word in message_lower for word in ["incident", "violation", "critical", "alert"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Incidents", "href": "/incidents"})
    
    elif any(word in message_lower for word in ["happening", "status", "now", "current"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Dashboard", "href": "/"})
    
    elif any(word in message_lower for word in ["policy", "compliance", "rule"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Policies", "href": "/policies"})
    
    # Check for specific IDs
    id_match = re.search(r'([a-f0-9]{8})', message, re.IGNORECASE)
    if id_match:
        workflow_details = get_workflow_details(id_match.group(1))
        additional_context = workflow_details
    
    # Build system prompt
    system_prompt = """You are Orbiter, an advanced AI system monitor for SDLC compliance.
Your role is to EXPLAIN system behavior using REAL DATA from the database.

RULES:
1. NEVER invent data - only use information provided in context
2. When explaining findings, use format: '[AgentName] detected [Issue] because [Evidence]'
3. Be concise but precise
4. If a workflow is blocked, explain WHY (check metadata)
5. Suggest relevant actions the user can take

Your tone: professional, precise, slightly cybernetic."""
    
    # Add context
    if additional_context:
        system_prompt += f"\n\nCURRENT SYSTEM STATE:\n{additional_context}"
    
    conversation = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-5:]])
    prompt = f"{system_prompt}\n\nRecent conversation:\n{conversation}\nUser: {message}\nOrbiter:"
    
    response = await call_llm(prompt)
    
    result = {
        "role": "assistant",
        "content": response or "System uplink temporarily unavailable. Please retry.",
        "timestamp": datetime.now().isoformat()
    }
    
    if suggested_actions:
        result["suggested_actions"] = suggested_actions
    
    return result

