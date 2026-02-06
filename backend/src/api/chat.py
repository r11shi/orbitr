"""
Chat Router - Orbiter AI conversation interface with navigation support.
Uses ZhipuAI GLM-4.6 for intelligent responses.
"""
from fastapi import APIRouter, Body
from typing import List, Optional
from datetime import datetime
import re
import json

from ..services.database import SessionLocal, AuditLog, FindingRecord, WorkflowRecord
from ..services.llm import call_glm

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
                block_info = f" BLOCKED: {metadata.get('blocked_reason')}" if metadata.get('blocked_reason') else ""
                wf_summary.append(
                    f"  [{w.workflow_id[:8]}] {w.workflow_type} | {w.status} | Step {w.current_step}{block_info}"
                )
            context_parts.append("WORKFLOWS:\n" + "\n".join(wf_summary))
        
        if recent_logs:
            inc_summary = [
                f"  [{l.correlation_id[:8] if l.correlation_id else 'N/A'}] {l.event_type} | {l.severity}"
                for l in recent_logs
            ]
            context_parts.append("INCIDENTS:\n" + "\n".join(inc_summary))
        
        if findings:
            finding_summary = [
                f"  [{f.agent_id}] {f.finding_type}: {f.title[:40] if f.title else 'Finding'}..."
                for f in findings[:5]
            ]
            context_parts.append("FINDINGS:\n" + "\n".join(finding_summary))
        
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
WORKFLOW {workflow.workflow_id[:8]}:
  Type: {workflow.workflow_type}
  Status: {workflow.status}
  Step: {workflow.current_step}/{len(steps)}
  Requester: {workflow.requester_id or 'N/A'}
  Blocked: {metadata.get('blocked_reason', 'No')}
  Policy: {metadata.get('policy_id', 'N/A')}
"""
    finally:
        db.close()


@router.post("/chat")
async def chat_interaction(message: str = Body(...), history: List[dict] = Body([])):
    """Chat with Orbiter AI - Context-aware system brain with navigation."""
    
    message_lower = message.lower()
    additional_context = ""
    suggested_actions = []
    navigation = None
    
    # Detect intent and gather relevant context
    if any(word in message_lower for word in ["workflow", "blocked", "stuck", "pending"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Workflows", "href": "/workflows"})
        if any(word in message_lower for word in ["show", "go", "take", "open", "see"]):
            navigation = "/workflows"
    
    elif any(word in message_lower for word in ["incident", "violation", "critical", "alert"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Incidents", "href": "/incidents"})
        if any(word in message_lower for word in ["show", "go", "take", "open", "see"]):
            navigation = "/incidents"
    
    elif any(word in message_lower for word in ["happening", "status", "now", "current"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Dashboard", "href": "/"})
    
    elif any(word in message_lower for word in ["policy", "compliance", "rule"]):
        additional_context = get_system_context()
        suggested_actions.append({"label": "View Policies", "href": "/policies"})
        if any(word in message_lower for word in ["show", "go", "take", "open", "see"]):
            navigation = "/policies"
    
    elif any(word in message_lower for word in ["analytics", "report", "data"]):
        suggested_actions.append({"label": "View Analytics", "href": "/analytics"})
        if any(word in message_lower for word in ["show", "go", "take", "open", "see"]):
            navigation = "/analytics"
    
    # Check for specific IDs
    id_match = re.search(r'([a-f0-9]{8})', message, re.IGNORECASE)
    if id_match:
        workflow_details = get_workflow_details(id_match.group(1))
        additional_context = workflow_details
    
    # Build system prompt
    system_prompt = """You are Orbiter, an advanced AI system monitor for SDLC compliance.
EXPLAIN system behavior using REAL DATA from context.

RULES:
1. NEVER invent data - only use information in context
2. Format findings: '[Agent] detected [Issue] because [Evidence]'
3. Be concise and technical
4. If workflow blocked, explain WHY

Tone: professional, precise, technical."""
    
    if additional_context:
        system_prompt += f"\n\nSYSTEM STATE:\n{additional_context}"
    
    # Build messages for LLM
    messages = []
    for h in history[-3:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})
    
    # Call LLM
    response = call_glm(messages, system_prompt, temperature=0.4, max_tokens=300)
    
    # Fallback if empty
    if not response or len(response.strip()) < 5:
        if "workflow" in message_lower:
            response = "I see you're asking about workflows. The system has active compliance workflows being tracked. Check Workflows page for details."
        elif "incident" in message_lower:
            response = "Regarding incidents: the system monitors security and compliance events continuously. Check Incidents page for full details."
        elif "policy" in message_lower:
            response = "Policies govern our compliance rules. View the Policies page to see all active enforcement rules."
        else:
            response = "I'm analyzing the system state. Check the dashboard for real-time information."
    
    result = {
        "role": "assistant",
        "content": response,
        "timestamp": datetime.now().isoformat()
    }
    
    if suggested_actions:
        result["suggested_actions"] = suggested_actions
    
    if navigation:
        result["action"] = {"navigate": navigation}
    
    return result
