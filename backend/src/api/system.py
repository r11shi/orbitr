"""
System Router - Health checks and system management.
"""
from fastapi import APIRouter
import time

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

