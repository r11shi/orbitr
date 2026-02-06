"""
Incidents Router - High-severity event management.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json

from ..services.database import SessionLocal, AuditLog

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("")
async def get_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100)
):
    """Get incidents (high-severity events with findings)."""
    db = SessionLocal()
    
    try:
        query = db.query(AuditLog).filter(
            AuditLog.severity.in_(['High', 'Critical'])
        ).order_by(AuditLog.timestamp.desc())
        
        if severity:
            query = query.filter(AuditLog.severity == severity)
        
        logs = query.limit(limit).all()
        
        incidents = []
        for log in logs:
            findings = json.loads(log.findings_json) if log.findings_json else []
            incidents.append({
                "id": log.correlation_id,
                "title": log.event_type,
                "severity": log.severity.lower(),
                "timestamp": log.timestamp.isoformat() if hasattr(log.timestamp, 'isoformat') else log.timestamp,
                "status": "resolved" if log.risk_score < 5 else "investigating" if log.risk_score < 8 else "active",
                "agents": [f.get("agent", "Unknown") for f in findings[:3]],
                "affectedWorkflows": [],
                "findings": len(findings),
                "rootCause": findings[0].get("finding", "") if findings else None
            })
        
        return {
            "count": len(incidents),
            "incidents": incidents
        }
    finally:
        db.close()


@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str):
    """Get detailed incident information."""
    db = SessionLocal()
    
    try:
        log = db.query(AuditLog).filter(AuditLog.correlation_id == incident_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        findings = json.loads(log.findings_json) if log.findings_json else []
        suggestions = json.loads(log.suggestion_json) if log.suggestion_json else []
        
        return {
            "id": log.correlation_id,
            "title": log.event_type,
            "severity": log.severity,
            "timestamp": log.timestamp.isoformat() if hasattr(log.timestamp, 'isoformat') else log.timestamp,
            "status": "resolved" if log.risk_score < 5 else "investigating",
            "risk_score": log.risk_score,
            "findings": findings,
            "root_cause": findings[0].get("finding", "") if findings else None,
            "recommendations": suggestions,
            "timeline": [
                {
                    "step": "Detection",
                    "timestamp": log.timestamp.isoformat() if hasattr(log.timestamp, 'isoformat') else log.timestamp,
                    "status": "completed"
                },
                {
                    "step": "Analysis",
                    "timestamp": log.timestamp.isoformat() if hasattr(log.timestamp, 'isoformat') else log.timestamp,
                    "status": "completed",
                    "duration_ms": log.processing_time_ms
                },
                {
                    "step": "Recommendations",
                    "status": "completed" if suggestions else "pending"
                }
            ]
        }
    finally:
        db.close()
