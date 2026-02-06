"""
Agents Router - Agent status and findings.
"""
from fastapi import APIRouter, Query

from ..services.monitor import AgentMonitor
from ..services.database import get_findings_by_agent

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("/status")
async def get_agent_swarm_status():
    """Get real-time status of the agent swarm from database activity."""
    agents = AgentMonitor.get_agent_status(minutes=5)
    summary = AgentMonitor.get_agent_summary()
    
    return {
        "count": len(agents),
        "summary": summary,
        "agents": agents
    }


@router.get("/{agent_id}/findings")
async def get_agent_findings(agent_id: str, hours: int = Query(default=24, le=168)):
    """Get all findings produced by a specific agent."""
    findings = get_findings_by_agent(agent_id, hours=hours)
    return {
        "agent_id": agent_id,
        "hours_covered": hours,
        "finding_count": len(findings),
        "findings": findings
    }
