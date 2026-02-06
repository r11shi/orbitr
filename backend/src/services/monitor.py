"""
Agent Monitor Service - Real-time Agent Status from Database Activity

Provides dynamic agent status by querying recent FindingRecord entries.
Agents are considered "Active" if they produced findings in the last 5 minutes.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any
from .database import SessionLocal, FindingRecord, AuditLog
from sqlalchemy import func


# Agent definitions with their database IDs
AGENT_DEFINITIONS = [
    {"id": "compliance_sentinel", "name": "Compliance Sentinel", "description": "Policy rule checker"},
    {"id": "security_watchdog", "name": "Security Watchdog", "description": "Threat pattern detector"},
    {"id": "insight_synthesizer", "name": "Insight Synthesizer", "description": "LLM-powered analysis"},
    {"id": "supervisor", "name": "Supervisor Agent", "description": "Finding correlator"},
    {"id": "resource_auditor", "name": "Resource Auditor", "description": "Infrastructure monitor"},
    {"id": "pattern_detective", "name": "Pattern Detective", "description": "Anomaly correlator"},
]


class AgentMonitor:
    """
    Monitors agent activity based on database records.
    """
    
    @classmethod
    def get_agent_status(cls, minutes: int = 5) -> List[Dict[str, Any]]:
        """
        Get real-time status of all agents based on recent activity.
        
        Returns list of agent statuses with:
        - id, name, status (active/processing/idle/offline)
        - lastActive: human-readable time since last finding
        - task: description of last activity
        """
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow() - timedelta(minutes=minutes)
            cutoff_ts = cutoff.timestamp()
            
            # Get recent findings grouped by agent
            recent_activity = db.query(
                FindingRecord.agent_id,
                func.max(FindingRecord.timestamp).label("last_activity"),
                func.count(FindingRecord.id).label("finding_count")
            ).filter(
                FindingRecord.timestamp > cutoff_ts
            ).group_by(
                FindingRecord.agent_id
            ).all()
            
            # Build activity map
            activity_map = {
                r.agent_id: {
                    "last_activity": r.last_activity,
                    "finding_count": r.finding_count
                }
                for r in recent_activity
            }
            
            # Build agent status list
            agents = []
            for agent_def in AGENT_DEFINITIONS:
                agent_id = agent_def["id"]
                activity = activity_map.get(agent_id)
                
                if activity:
                    # Calculate time since last activity
                    last_ts = activity["last_activity"]
                    seconds_ago = datetime.utcnow().timestamp() - last_ts
                    
                    if seconds_ago < 30:
                        status = "processing"
                        last_active = "Just now"
                    elif seconds_ago < 120:
                        status = "active"
                        last_active = f"{int(seconds_ago)}s ago"
                    else:
                        status = "idle"
                        last_active = f"{int(seconds_ago / 60)}m ago"
                    
                    task = f"Processed {activity['finding_count']} findings"
                else:
                    status = "idle"
                    last_active = "No recent activity"
                    task = "Waiting for events"
                
                agents.append({
                    "id": agent_id,
                    "name": agent_def["name"],
                    "status": status,
                    "lastActive": last_active,
                    "task": task
                })
            
            return agents
            
        finally:
            db.close()
    
    @classmethod
    def get_agent_summary(cls) -> Dict[str, int]:
        """Get count of agents by status."""
        agents = cls.get_agent_status()
        summary = {"active": 0, "processing": 0, "idle": 0, "offline": 0}
        for agent in agents:
            status = agent.get("status", "idle")
            summary[status] = summary.get(status, 0) + 1
        return summary
