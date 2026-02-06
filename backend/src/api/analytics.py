"""
Analytics Router - Metrics, reports, and insights.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
import uuid
from datetime import datetime

from ..services.database import SessionLocal, AuditLog, get_summary_stats, get_events_by_actor
from ..services.workflow import WorkflowStateMachine

router = APIRouter(tags=["Analytics"])

# Reports store
reports_store = []


@router.get("/insights")
async def get_insights(
    limit: int = Query(default=10, le=100),
    severity: Optional[str] = None,
    actor_id: Optional[str] = None
):
    """Get recent analysis insights for dashboard display."""
    db = SessionLocal()
    try:
        query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
        
        if severity:
            query = query.filter(AuditLog.severity == severity)
        
        if actor_id:
            query = query.filter(AuditLog.actor_id == actor_id)
        
        logs = query.limit(limit).all()
        
        return {
            "count": len(logs),
            "insights": [
                {
                    "id": log.id,
                    "correlation_id": log.correlation_id,
                    "event_type": log.event_type,
                    "severity": log.severity,
                    "domain": getattr(log, 'domain', None),
                    "risk_score": log.risk_score,
                    "timestamp": log.timestamp,
                    "processing_time_ms": log.processing_time_ms,
                    "actor_id": getattr(log, 'actor_id', None),
                    "source": getattr(log, 'source_system', None) or "System",
                    "summary": log.insight_text,
                    "reasoning": log.insight_text,  # For detail view
                    "context_score": getattr(log, 'context_score', 0),
                    "guardrails_passed": getattr(log, 'guardrails_passed', True),
                    "llm_used": getattr(log, 'llm_used', False)
                }
                for log in logs
            ]
        }
    finally:
        db.close()


@router.get("/reports/summary")
async def get_summary_report(hours: int = Query(default=24, le=168)):
    """Get aggregated metrics using efficient queries."""
    stats = get_summary_stats(hours=hours)
    
    return {
        **stats,
        "risk_distribution": {
            "high_risk": stats["by_severity"].get("Critical", 0) + stats["by_severity"].get("High", 0),
            "medium_risk": stats["by_severity"].get("Medium", 0),
            "low_risk": stats["by_severity"].get("Low", 0)
        },
        "performance": {
            "avg_processing_time_ms": stats["avg_processing_time_ms"]
        }
    }


@router.get("/audit/{correlation_id}")
async def get_audit_detail(correlation_id: str):
    """Get full audit details for a specific event."""
    db = SessionLocal()
    try:
        log = db.query(AuditLog).filter(AuditLog.correlation_id == correlation_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Audit log not found")
        
        return {
            "id": log.id,
            "correlation_id": log.correlation_id,
            "event_type": log.event_type,
            "severity": log.severity,
            "domain": getattr(log, 'domain', None),
            "source_system": log.source_system,
            "timestamp": log.timestamp,
            "actor_id": getattr(log, 'actor_id', None),
            "resource_id": getattr(log, 'resource_id', None),
            "risk_score": log.risk_score,
            "processing_time_ms": log.processing_time_ms,
            "findings": json.loads(log.findings_json) if log.findings_json else [],
            "insight": log.insight_text,
            "suggestions": json.loads(log.suggestion_json) if log.suggestion_json else [],
            "context_score": getattr(log, 'context_score', 0),
            "guardrails_passed": getattr(log, 'guardrails_passed', True),
            "llm_used": getattr(log, 'llm_used', False)
        }
    finally:
        db.close()


@router.get("/actors/{actor_id}/events")
async def get_actor_events(actor_id: str, hours: int = Query(default=24, le=168)):
    """Get all events by a specific actor."""
    events = get_events_by_actor(actor_id, hours=hours)
    return {
        "actor_id": actor_id,
        "hours_covered": hours,
        "event_count": len(events),
        "events": events
    }


@router.get("/analytics")
async def get_analytics(hours: int = Query(default=24, le=720)):
    """Get comprehensive analytics data."""
    stats = get_summary_stats(hours=hours)
    
    return {
        "summary": stats,
        "active_workflows": len(WorkflowStateMachine.get_pending_workflows()),
        "simulation_active": False  # Will be updated when simulation is checked
    }


@router.get("/analytics/timeseries")
async def get_timeseries(hours: int = Query(default=6, le=24)):
    """Get hourly event counts for charts."""
    db = SessionLocal()
    try:
        from datetime import timedelta
        now = datetime.utcnow()
        
        data_points = []
        for i in range(hours - 1, -1, -1):
            hour_start = now - timedelta(hours=i+1)
            hour_end = now - timedelta(hours=i)
            
            # Count events in this hour
            hour_events = db.query(AuditLog).filter(
                AuditLog.timestamp >= hour_start.timestamp(),
                AuditLog.timestamp < hour_end.timestamp()
            ).all()
            
            total = len(hour_events)
            critical = sum(1 for e in hour_events if e.severity in ["Critical", "High"])
            
            data_points.append({
                "time": hour_end.strftime("%I %p").lstrip("0").lower(),
                "hour": hour_end.strftime("%H:00"),
                "events": total,
                "critical": critical
            })
        
        return {
            "hours": hours,
            "data": data_points,
            "total_events": sum(d["events"] for d in data_points),
            "total_critical": sum(d["critical"] for d in data_points)
        }
    finally:
        db.close()


@router.get("/analytics/workflow-health")
async def get_workflow_health():
    """Get workflow health distribution."""
    workflows = WorkflowStateMachine.get_pending_workflows()
    
    status_counts = {}
    for w in workflows:
        status_counts[w.status.value] = status_counts.get(w.status.value, 0) + 1
    
    total = len(workflows)
    
    return {
        "total": total,
        "by_status": status_counts,
        "healthy_count": status_counts.get("completed", 0) + status_counts.get("approved", 0),
        "warning_count": status_counts.get("awaiting_approval", 0) + status_counts.get("in_progress", 0),
        "critical_count": status_counts.get("escalated", 0) + status_counts.get("expired", 0)
    }


@router.get("/reports")
async def get_reports():
    """Get all generated reports."""
    return {
        "count": len(reports_store),
        "reports": reports_store
    }


@router.post("/reports/generate")
async def generate_report(type: str):
    """Generate a new report."""
    report = {
        "id": f"RPT-{uuid.uuid4().hex[:8].upper()}",
        "title": f"{type.replace('_', ' ').title()} Report",
        "type": type.title(),
        "date": datetime.now().isoformat(),
        "status": "Generated"
    }
    reports_store.append(report)
    return report
