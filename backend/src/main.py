"""
Orbitr API - Modular Architecture
Version 4.0 - Thin Entry Point

This file ONLY contains:
- FastAPI App initialization
- CORS Middleware configuration
- Router includes
- Startup/Shutdown events
- Socket.IO integration

All business logic lives in api/ routers and services/.
"""
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import time

from .services.database import init_db
from .services.observability import setup_langsmith

# Import all routers
from .api.system import router as system_router
from .api.agents import router as agents_router
from .api.chat import router as chat_router
from .api.incidents import router as incidents_router
from .api.workflows import router as workflows_router
from .api.simulation import router as simulation_router
from .api.analytics import router as analytics_router
from .api.policies import router as policies_router

# Event ingestion (kept here for now as it's the core pipeline)
from .models.events import StandardizedEvent
from .services.priority import event_queue, prioritize_event
from .services.workflow import WorkflowStateMachine, detect_workflow_trigger
from .services.observability import LocalTracer


# Initialize app
app = FastAPI(
    title="Orbitr API",
    description="Intelligent Compliance & Workflow Monitoring System - Modular Architecture",
    version="4.0.0",
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


# Include all routers
app.include_router(system_router)
app.include_router(agents_router)
app.include_router(chat_router)
app.include_router(incidents_router)
app.include_router(workflows_router)
app.include_router(simulation_router)
app.include_router(analytics_router)
app.include_router(policies_router)


# Startup event
@app.on_event("startup")
async def startup():
    init_db()
    setup_langsmith()
    print("[START] Orbitr API v4.0 Started (Modular Architecture)")
    print("   - Routers: system, agents, chat, incidents, workflows, simulation, analytics, policies")
    print("   - Database: orbitr.db initialized")
    print("   - Guardrails: active")


# Core event ingestion endpoint (kept in main.py as it's the heart of the system)
@app.post("/events")
async def ingest_event(event: StandardizedEvent, background_tasks: BackgroundTasks):
    """
    Primary ingestion endpoint. Processes event through the agent pipeline.
    """
    start_time = time.time()
    
    run_id = f"run_{event.event_id[:8]}"
    LocalTracer.start_run(run_id, f"event_{event.event_type}")
    
    priority = prioritize_event(event.model_dump())
    
    workflow_type = detect_workflow_trigger(event.model_dump())
    workflow = None
    if workflow_type:
        workflow = WorkflowStateMachine.create_workflow(
            workflow_type=workflow_type,
            correlation_id=event.correlation_id,
            requester_id=getattr(event, 'actor_id', None),
            metadata={"event_type": event.event_type, "severity": event.severity.value}
        )
    
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
    
    # Lazy import to speed up startup
    from .graph.workflow import graph
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
    
    if workflow:
        response["workflow"] = {
            "workflow_id": workflow.workflow_id,
            "type": workflow.workflow_type,
            "status": workflow.status.value,
            "current_step": workflow.current_step
        }
    
    return response


# Observability endpoint (kept for debugging)
@app.get("/observability/trace/{trace_id}")
async def get_trace(trace_id: str):
    """Get observability trace for a workflow run."""
    from .services.observability import observability
    from fastapi import HTTPException
    
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
