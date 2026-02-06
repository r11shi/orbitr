"""
Chat Router - Orbiter AI conversation interface.
"""
from fastapi import APIRouter, Body
from typing import List
from datetime import datetime
import re
import json

from ..services.llm import call_llm
from ..services.database import SessionLocal, AuditLog

router = APIRouter(tags=["Chat"])


@router.post("/chat")
async def chat_interaction(message: str = Body(...), history: List[dict] = Body([])):
    """Chat with Orbiter AI - Context-aware with incident lookup."""
    
    # Check for incident ID in message (e.g., #INC-123 or INC-123)
    incident_context = None
    suggested_actions = []
    
    incident_match = re.search(r'#?INC-?(\w+)', message, re.IGNORECASE)
    if incident_match:
        incident_id = incident_match.group(0).replace("#", "")
        db = SessionLocal()
        try:
            log = db.query(AuditLog).filter(
                AuditLog.correlation_id.ilike(f"%{incident_id}%")
            ).first()
            
            if log:
                findings = json.loads(log.findings_json) if log.findings_json else []
                incident_context = f"""
INCIDENT CONTEXT (from database):
- ID: {log.correlation_id}
- Type: {log.event_type}
- Severity: {log.severity}
- Risk Score: {log.risk_score}
- Findings: {len(findings)} issues detected
- Summary: {log.insight_text or 'No summary available'}
"""
                suggested_actions = [
                    {"label": "View Incident Details", "href": f"/incidents/{log.correlation_id}"},
                    {"label": "Check Related Workflows", "href": "/workflows"}
                ]
        finally:
            db.close()
    
    # Build system prompt
    system_prompt = (
        "You are Orbiter, an advanced AI system monitor. "
        "You monitor security, compliance, and infrastructure for autonomous agent swarms. "
        "Your tone is professional, precise, and slightly robotic/cybernetic. "
        "Provide concise insights based on system status. "
        "When explaining findings, use the format: '[AgentName] detected [Issue] because [Evidence].'"
    )
    
    # Add incident context if found
    if incident_context:
        system_prompt += f"\n\n{incident_context}"
    
    conversation = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-5:]])
    prompt = f"{system_prompt}\n\nContext:\n{conversation}\nUser: {message}\nOrbiter:"
    
    response = await call_llm(prompt)
    
    result = {
        "role": "assistant",
        "content": response or "I am currently unable to process that query due to an uplink error.",
        "timestamp": datetime.now().isoformat()
    }
    
    # Add suggested actions if available
    if suggested_actions:
        result["suggested_actions"] = suggested_actions
    
    return result
