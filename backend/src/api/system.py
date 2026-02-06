"""
System Router - Health checks and system management.
"""
from fastapi import APIRouter
import time
import json
from datetime import datetime

from ..services.database import init_db, SessionLocal, AuditLog, FindingRecord, WorkflowRecord
from ..services.workflow import WorkflowStateMachine
from ..services.priority import event_queue

router = APIRouter(tags=["System"])


@router.get("/")
async def root():
    return {
        "service": "Orbitr Monitoring System",
        "version": "4.0.0",
        "status": "operational",
        "features": [
            "Multi-agent analysis",
            "Historical context injection",
            "LLM guardrails",
            "UltraContext integration",
            "Priority queue",
            "Persistent workflows (DB-backed)",
            "Dynamic rules engine",
            "Observability tracing"
        ]
    }


@router.get("/health")
async def health():
    queue_stats = event_queue.stats()
    pending_workflows = len(WorkflowStateMachine.get_pending_workflows())
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "queue": queue_stats,
        "pending_workflows": pending_workflows,
        "version": "4.0.0"
    }


@router.delete("/system/reset")
async def reset_system():
    """Reset the system by clearing all non-policy data including workflows."""
    db = SessionLocal()
    try:
        # Clear findings
        findings_deleted = db.query(FindingRecord).delete()
        # Clear audit logs
        audits_deleted = db.query(AuditLog).delete()
        # Clear workflows (now DB-backed)
        workflows_deleted = db.query(WorkflowRecord).delete()
        db.commit()
        
        return {
            "status": "reset_complete",
            "message": "All incidents, findings, and workflows cleared.",
            "deleted": {
                "findings": findings_deleted,
                "audit_logs": audits_deleted,
                "workflows": workflows_deleted
            },
            "timestamp": time.time()
        }
    finally:
        db.close()


@router.get("/system/context")
async def get_recent_context(limit: int = 20):
    """
    PART 6: Recent Context - Live system log feed.
    Returns rolling console-like feed of processed events, agent actions, findings.
    """
    db = SessionLocal()
    try:
        # Get recent audit logs
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
        
        # Get recent findings
        findings = db.query(FindingRecord).order_by(FindingRecord.timestamp.desc()).limit(limit).all()
        
        # Get recent workflows
        workflows = db.query(WorkflowRecord).order_by(WorkflowRecord.updated_at.desc()).limit(5).all()
        
        # Build unified timeline
        timeline = []
        
        for log in logs:
            timeline.append({
                "type": "event",
                "timestamp": log.timestamp,
                "icon": "📥",
                "message": f"[{log.event_type}] {log.severity} severity event processed",
                "detail": log.insight_text[:100] if log.insight_text else None,
                "severity": log.severity,
                "correlation_id": log.correlation_id
            })
        
        for f in findings:
            text = f.title or f.description or "Finding detected"
            timeline.append({
                "type": "finding",
                "timestamp": f.timestamp,
                "icon": "🔍",
                "message": f"[{f.agent_id}] {f.finding_type}: {text[:60]}...",
                "severity": f.severity,
                "correlation_id": f.audit_log_id  # Use audit_log_id as correlation
            })
        
        for w in workflows:
            metadata = json.loads(w.metadata_json) if w.metadata_json else {}
            status_icon = "⚠️" if w.status == "escalated" else "✅" if w.status == "completed" else "🔄"
            timeline.append({
                "type": "workflow",
                "timestamp": w.updated_at,
                "icon": status_icon,
                "message": f"[WORKFLOW] {w.workflow_type} → {w.status} (step {w.current_step})",
                "detail": metadata.get("blocked_reason"),
                "workflow_id": w.workflow_id
            })
        
        # Sort by timestamp descending
        timeline.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return {
            "count": len(timeline[:limit]),
            "context": timeline[:limit],
            "updated_at": time.time()
        }
    finally:
        db.close()
