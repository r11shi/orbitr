from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
import time

from .models.events import StandardizedEvent, Severity, Domain
from .graph.workflow import graph
from .services.database import init_db, SessionLocal, AuditLog
from .services.priority import event_queue, prioritize_event
from .services.workflow import WorkflowStateMachine, detect_workflow_trigger, WorkflowStatus

# Initialize app
app = FastAPI(
    title="Orbitr API",
    description="Intelligent Compliance & Workflow Monitoring System - Production Grade",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    print("🚀 Orbitr API Started - Database Initialized")


@app.get("/")
async def root():
    return {
        "service": "Orbitr Monitoring System",
        "version": "2.1.0",
        "status": "operational",
        "features": [
            "Multi-agent analysis",
            "Historical context",
            "Priority queue",
            "Workflow state machine",
            "Dynamic rules engine"
        ]
    }


@app.get("/health")
async def health():
    queue_stats = event_queue.stats()
    pending_workflows = len(WorkflowStateMachine.get_pending_workflows())
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "queue": queue_stats,
        "pending_workflows": pending_workflows
    }


@app.post("/events")
async def ingest_event(event: StandardizedEvent, background_tasks: BackgroundTasks):
    """
    Primary ingestion endpoint. Processes event through the agent pipeline.
    Critical events are prioritized automatically.
    """
    start_time = time.time()
    
    # Calculate priority
    event_dict = event.model_dump()
    priority = prioritize_event(event_dict)
    
    # Check for workflow triggers
    workflow_type = detect_workflow_trigger(event_dict)
    workflow = None
    if workflow_type:
        workflow = WorkflowStateMachine.create_workflow(
            workflow_type=workflow_type,
            correlation_id=event.correlation_id,
            requester_id=getattr(event, 'actor_id', None),
            metadata={"event_type": event.event_type, "severity": event.severity.value}
        )
    
    # Initialize state
    initial_state = {
        "event": event,
        "findings": [],
        "total_risk_score": 0.0,
        "highest_severity": "Low",
        "summary": None,
        "root_cause": None,
        "recommended_actions": [],
        "agents_to_run": [],
        "agents_completed": [],
        "audit_log": [],
        "start_time": start_time,
        "context": {
            "priority": priority,
            "workflow_id": workflow.workflow_id if workflow else None
        }
    }
    
    # Run the pipeline
    result = graph.invoke(initial_state)
    
    processing_time = (time.time() - start_time) * 1000
    
    response = {
        "status": "processed",
        "event_id": event.event_id,
        "correlation_id": event.correlation_id,
        "priority": priority,
        "processing_time_ms": round(processing_time, 2),
        "analysis": {
            "risk_score": round(result.get("total_risk_score", 0), 2),
            "highest_severity": result.get("highest_severity", "Low"),
            "findings_count": len(result.get("findings", [])),
            "findings": result.get("findings", []),
            "summary": result.get("summary"),
            "root_cause": result.get("root_cause"),
            "recommended_actions": result.get("recommended_actions", [])
        },
        "agents_invoked": result.get("agents_completed", []),
        "audit_trail": result.get("audit_log", [])
    }
    
    # Add workflow info if created
    if workflow:
        response["workflow"] = {
            "workflow_id": workflow.workflow_id,
            "type": workflow.workflow_type,
            "status": workflow.status.value,
            "current_step": workflow.current_step
        }
    
    return response


@app.get("/insights")
async def get_insights(
    limit: int = Query(default=10, le=100),
    severity: Optional[str] = None
):
    """Get recent analysis insights for dashboard display."""
    db = SessionLocal()
    try:
        query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
        if severity:
            query = query.filter(AuditLog.severity == severity)
        logs = query.limit(limit).all()
        
        return {
            "count": len(logs),
            "insights": [
                {
                    "id": log.id,
                    "correlation_id": log.correlation_id,
                    "event_type": log.event_type,
                    "severity": log.severity,
                    "risk_score": log.risk_score,
                    "timestamp": log.timestamp,
                    "processing_time_ms": log.processing_time_ms,
                    "summary": log.insight_text
                }
                for log in logs
            ]
        }
    finally:
        db.close()


@app.get("/reports/summary")
async def get_summary_report():
    """Get aggregated metrics for charts/dashboards."""
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).all()
        
        severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
        event_type_counts = {}
        total_processing_time = 0
        total_events = len(logs)
        
        for log in logs:
            sev = log.severity or "Low"
            if sev in severity_counts:
                severity_counts[sev] += 1
            
            et = log.event_type or "Unknown"
            event_type_counts[et] = event_type_counts.get(et, 0) + 1
            total_processing_time += log.processing_time_ms or 0
        
        avg_processing = total_processing_time / total_events if total_events > 0 else 0
        
        return {
            "total_events": total_events,
            "by_severity": severity_counts,
            "by_event_type": event_type_counts,
            "risk_distribution": {
                "high_risk": severity_counts["Critical"] + severity_counts["High"],
                "medium_risk": severity_counts["Medium"],
                "low_risk": severity_counts["Low"]
            },
            "performance": {
                "avg_processing_time_ms": round(avg_processing, 2)
            }
        }
    finally:
        db.close()


@app.get("/audit/{correlation_id}")
async def get_audit_detail(correlation_id: str):
    """Get full audit details for a specific event."""
    db = SessionLocal()
    try:
        log = db.query(AuditLog).filter(AuditLog.correlation_id == correlation_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Audit log not found")
        
        import json
        return {
            "id": log.id,
            "correlation_id": log.correlation_id,
            "event_type": log.event_type,
            "severity": log.severity,
            "source_system": log.source_system,
            "timestamp": log.timestamp,
            "risk_score": log.risk_score,
            "processing_time_ms": log.processing_time_ms,
            "findings": json.loads(log.findings_json) if log.findings_json else [],
            "insight": log.insight_text,
            "suggestions": json.loads(log.suggestion_json) if log.suggestion_json else []
        }
    finally:
        db.close()


@app.get("/queue/stats")
async def get_queue_stats():
    """Get priority queue statistics."""
    return {
        "stats": event_queue.stats(),
        "by_priority": event_queue.get_by_priority()
    }


@app.get("/workflows")
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


@app.get("/workflows/{workflow_id}")
async def get_workflow_detail(workflow_id: str):
    """Get workflow details."""
    workflow = WorkflowStateMachine.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow.to_dict()


@app.post("/workflows/{workflow_id}/advance")
async def advance_workflow(workflow_id: str, action: str, actor_id: Optional[str] = None):
    """Advance a workflow to the next step."""
    workflow = WorkflowStateMachine.advance_workflow(workflow_id, action, actor_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow.to_dict()
