"""
Orbitr API - Enhanced with observability and efficient queries.

Version 3.0 Improvements:
- UltraContext integration for context management
- LLM guardrails for safe AI responses
- Observability endpoints for debugging
- Efficient database queries
"""
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
import time

from .models.events import StandardizedEvent, Severity, Domain
from .graph.workflow import graph
from .services.database import init_db, SessionLocal, AuditLog, get_summary_stats, get_events_by_actor, get_findings_by_agent
from .services.priority import event_queue, prioritize_event
from .services.workflow import WorkflowStateMachine, detect_workflow_trigger, WorkflowStatus
from .services.observability import observability, LocalTracer, setup_langsmith

# Initialize app
app = FastAPI(
    title="Orbitr API",
    description="Intelligent Compliance & Workflow Monitoring System - Enhanced with Context Injection & Guardrails",
    version="3.0.0",
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


# Initialize services on startup
@app.on_event("startup")
async def startup():
    init_db()
    setup_langsmith()  # Configure LangSmith if API key available
    print("🚀 Orbitr API v3.0 Started")
    print("   ✓ Enhanced database schema")
    print("   ✓ Context injection enabled")
    print("   ✓ LLM guardrails active")
    print("   ✓ Observability tracing on")


@app.get("/")
async def root():
    return {
        "service": "Orbitr Monitoring System",
        "version": "3.0.0",
        "status": "operational",
        "features": [
            "Multi-agent analysis",
            "Historical context injection",
            "LLM guardrails",
            "UltraContext integration",
            "Priority queue",
            "Workflow state machine",
            "Dynamic rules engine",
            "Observability tracing"
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
        "pending_workflows": pending_workflows,
        "version": "3.0.0"
    }


@app.post("/events")
async def ingest_event(event: StandardizedEvent, background_tasks: BackgroundTasks):
    """
    Primary ingestion endpoint. Processes event through the agent pipeline.
    
    Enhanced with:
    - Context injection (policies, historical data)
    - LLM guardrails (prevent hallucinations)
    - Observability tracing
    """
    start_time = time.time()
    
    # Start observability trace
    run_id = f"run_{event.event_id[:8]}"
    LocalTracer.start_run(run_id, f"event_{event.event_type}")
    
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
            "workflow_id": workflow.workflow_id if workflow else None,
            "trace_id": run_id
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
        "audit_trail": result.get("audit_log", []),
        "observability": {
            "trace_id": run_id,
            "context_score": result.get("context", {}).get("llm_context_score", 0),
            "guardrails_applied": result.get("context", {}).get("guardrails_applied", False),
            "llm_used": any(log.get("llm_used", False) for log in result.get("audit_log", []))
        }
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
                    "summary": log.insight_text,
                    "context_score": getattr(log, 'context_score', 0),
                    "guardrails_passed": getattr(log, 'guardrails_passed', True),
                    "llm_used": getattr(log, 'llm_used', False)
                }
                for log in logs
            ]
        }
    finally:
        db.close()


@app.get("/reports/summary")
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


@app.get("/actors/{actor_id}/events")
async def get_actor_events(actor_id: str, hours: int = Query(default=24, le=168)):
    """Get all events by a specific actor (NEW endpoint)."""
    events = get_events_by_actor(actor_id, hours=hours)
    return {
        "actor_id": actor_id,
        "hours_covered": hours,
        "event_count": len(events),
        "events": events
    }


@app.get("/agents/{agent_id}/findings")
async def get_agent_findings(agent_id: str, hours: int = Query(default=24, le=168)):
    """Get all findings produced by a specific agent (NEW endpoint)."""
    findings = get_findings_by_agent(agent_id, hours=hours)
    return {
        "agent_id": agent_id,
        "hours_covered": hours,
        "finding_count": len(findings),
        "findings": findings
    }


@app.get("/observability/trace/{trace_id}")
async def get_trace(trace_id: str):
    """Get observability trace for a workflow run (NEW endpoint)."""
    trace = observability.get_workflow_trace(trace_id)
    if not trace.get("traces"):
        raise HTTPException(status_code=404, detail="Trace not found or expired")
    return trace


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


# === System Status Endpoints ===

@app.get("/system/context-providers")
async def get_context_providers():
    """Get status of context injection providers (NEW endpoint)."""
    import os
    
    return {
        "ultracontext": {
            "enabled": bool(os.getenv("ULTRACONTEXT_API_KEY")),
            "status": "active" if os.getenv("ULTRACONTEXT_API_KEY") else "fallback_mode"
        },
        "langsmith": {
            "enabled": bool(os.getenv("LANGCHAIN_API_KEY")),
            "project": os.getenv("LANGCHAIN_PROJECT", "orbitr-production")
        },
        "glm_api": {
            "enabled": bool(os.getenv("GLM_API_KEY")),
            "endpoint": "https://api.z.ai/api/coding/paas/v4/chat/completions"
        },
        "guardrails": {
            "enabled": True,
            "strict_mode": True
        }
    }
