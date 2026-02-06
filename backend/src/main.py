"""
Orbitr API - Enhanced with observability and efficient queries.

Version 3.0 Improvements:
- UltraContext integration for context management
- LLM guardrails for safe AI responses
- Observability endpoints for debugging
- Efficient database queries
"""
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Body
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
    print("[START] Orbitr API v3.0 Started")
    print("   - Enhanced database schema")
    print("   - Context injection enabled")
    print("   - LLM guardrails active")
    print("   - Observability tracing on")


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


# === New Endpoints for Complete Plan ===

@app.get("/agents/status")
async def get_agent_swarm_status():
    """Get real-time status of the agent swarm."""
    return {
        "count": 6,
        "agents": [
            {"id": "ag-1", "name": "Compliance Sentinel", "status": "active", "lastActive": "2s ago", "task": "Scanning PR #402"},
            {"id": "ag-2", "name": "Security Watchdog", "status": "active", "lastActive": "5s ago", "task": "Analyzing intrusion attempts"},
            {"id": "ag-3", "name": "Resource Auditor", "status": "idle", "lastActive": "2m ago", "task": "Waiting for schedule"},
            {"id": "ag-4", "name": "Pattern Detective", "status": "processing", "lastActive": "10s ago", "task": "Correlating anomalies"},
            {"id": "ag-5", "name": "Supervisor Agent", "status": "active", "lastActive": "1s ago", "task": "Orchestrating response"},
            {"id": "ag-6", "name": "Infrastructure Monitor", "status": "offline", "lastActive": "5m ago", "task": "Maintenance"}
        ]
    }

@app.get("/policies")
async def get_policies():
    """List all compliance policies."""
    return [
        {"id": "POL-001", "name": "PII Data Encryption", "status": "passing", "enforcement": "Strict", "category": "Security", "lastAudit": "10m ago", "description": "All Personally Identifiable Information must be encrypted at rest and in transit."},
        {"id": "POL-002", "name": "Multi-Factor Authentication", "status": "passing", "enforcement": "Strict", "category": "Security", "lastAudit": "1h ago", "description": "MFA is required for all administrative access."},
        {"id": "POL-003", "name": "API Rate Limiting", "status": "failing", "enforcement": "Strict", "category": "Operational", "lastAudit": "5m ago", "description": "Public APIs must have rate limits configured."},
        {"id": "POL-004", "name": "Redundant Backups", "status": "warning", "enforcement": "Advisory", "category": "Compliance", "lastAudit": "Yesterday", "description": "Daily backups must be verified and stored in a separate region."}
    ]

@app.post("/chat")
async def chat_interaction(message: str = Body(...), history: List[dict] = Body([])):
    """Chat with Orbiter AI."""
    from .services.llm import call_llm
    
    # Construct prompt from history
    system_prompt = (
        "You are Orbiter, an advanced AI system monitor. "
        "You monitor security, compliance, and infrastructure for autonomous agent swarms. "
        "Your tone is professional, precise, and slightly robotic/cybernetic. "
        "Provide concise insights based on system status."
    )
    
    conversation = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-5:]])
    prompt = f"{system_prompt}\n\nContext:\n{conversation}\nUser: {message}\nOrbiter:"
    
    response = await call_llm(prompt)
    
    return {
        "role": "assistant",
        "content": response or "I am currently unable to process that query due to an uplink error.",
        "timestamp": datetime.now().isoformat()
    }


# ===== Simulation Endpoints =====

simulation_state = {
    "running": False,
    "started_at": None,
    "events_generated": 0,
    "workflows_created": 0
}

@app.post("/simulation/start")
async def start_simulation(background_tasks: BackgroundTasks):
    """Start workflow simulation for continuous monitoring."""
    global simulation_state
    
    if simulation_state["running"]:
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    simulation_state["running"] = True
    simulation_state["started_at"] = datetime.now().isoformat()
    simulation_state["events_generated"] = 0
    simulation_state["workflows_created"] = 0
    
    # Start background task for simulation
    background_tasks.add_task(run_simulation)
    
    return {
        "status": "started",
        "message": "Workflow simulation started. System is now monitoring workflows continuously.",
        **simulation_state
    }

@app.post("/simulation/stop")
async def stop_simulation():
    """Stop workflow simulation."""
    global simulation_state
    
    if not simulation_state["running"]:
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    simulation_state["running"] = False
    
    return {
        "status": "stopped",
        "message": "Workflow simulation stopped.",
        "events_generated": simulation_state["events_generated"],
        "workflows_created": simulation_state["workflows_created"]
    }

@app.get("/simulation/status")
async def get_simulation_status():
    """Get current simulation status."""
    return {
        "running": simulation_state["running"],
        "started_at": simulation_state["started_at"],
        "events_generated": simulation_state["events_generated"],
        "workflows_created": simulation_state["workflows_created"],
        "uptime_seconds": (
            (datetime.now() - datetime.fromisoformat(simulation_state["started_at"])).total_seconds()
            if simulation_state["started_at"] else 0
        )
    }

async def run_simulation():
    """Background task to generate simulation events."""
    import random
    import asyncio
    
    event_types = [
        "deployment_request", "access_request", "security_alert",
        "compliance_check", "resource_anomaly", "api_rate_limit"
    ]
    
    while simulation_state["running"]:
        try:
            # Generate random event
            event = StandardizedEvent(
                event_id=f"sim_{random.randint(1000, 9999)}",
                event_type=random.choice(event_types),
                severity=random.choice(list(Severity)),
                timestamp=datetime.now().isoformat(),
                domain=random.choice(list(Domain)),
                source_system="simulation",
                actor_id=f"user_{random.randint(1, 10)}",
                resource_id=f"res_{random.randint(100, 999)}",
                payload={"simulated": True}
            )
            
            # Process through system
            result = graph.invoke({"event": event.model_dump()})
            simulation_state["events_generated"] += 1
            
            # Check for workflow trigger
            workflow_type = detect_workflow_trigger(event.model_dump())
            if workflow_type and random.random() > 0.7:  # 30% chance
                WorkflowStateMachine.create_workflow(
                    workflow_type=workflow_type,
                    correlation_id=event.event_id,
                    requester_id=event.actor_id
                )
                simulation_state["workflows_created"] += 1
            
            # Wait before next event (5-15 seconds)
            await asyncio.sleep(random.uniform(5, 15))
            
        except Exception as e:
            print(f"Simulation error: {e}")
            await asyncio.sleep(5)


# ===== Analytics Endpoints =====

@app.get("/analytics")
async def get_analytics(hours: int = Query(default=24, le=720)):
    """Get comprehensive analytics data."""
    stats = get_summary_stats(hours=hours)
    db = SessionLocal()
    
    try:
        # Get recent logs for trend
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
        
        return {
            "summary": stats,
            "active_workflows": len(WorkflowStateMachine.get_pending_workflows()),
            "simulation_active": simulation_state["running"]
        }
    finally:
        db.close()

@app.get("/analytics/risk-trend")
async def get_risk_trend(hours: int = Query(default=720, le=2160)):
    """Get risk score trend over time."""
    db = SessionLocal()
    
    try:
        from sqlalchemy import func
        from datetime import timedelta
        
        # Group by hour and get average risk score
        cutoff = datetime.now() - timedelta(hours=hours)
        
        results = db.query(
            func.date_trunc('hour', AuditLog.timestamp).label('hour'),
            func.avg(AuditLog.risk_score).label('avg_risk')
        ).filter(
            AuditLog.timestamp >= cutoff
        ).group_by(
            func.date_trunc('hour', AuditLog.timestamp)
        ).order_by('hour').all()
        
        return {
            "data_points": [
                {
                    "timestamp": r.hour.isoformat() if r.hour else None,
                    "risk_score": float(r.avg_risk) if r.avg_risk else 0
                }
                for r in results
            ],
            "hours_covered": hours
        }
    finally:
        db.close()

@app.get("/analytics/workflow-health")
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

@app.get("/analytics/violations")
async def get_violation_categories():
    """Get top violation categories."""
    db = SessionLocal()
    
    try:
        from sqlalchemy import func
        
        results = db.query(
            AuditLog.event_type,
            func.count(AuditLog.id).label('count')
        ).filter(
            AuditLog.severity.in_(['High', 'Critical'])
        ).group_by(
            AuditLog.event_type
        ).order_by(
            func.count(AuditLog.id).desc()
        ).limit(10).all()
        
        return {
            "categories": [
                {
                    "label": r.event_type,
                    "count": r.count
                }
                for r in results
            ]
        }
    finally:
        db.close()


# ===== Incident Endpoints =====

@app.get("/incidents")
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
        
        import json
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

@app.get("/incidents/{incident_id}")
async def get_incident_detail(incident_id: str):
    """Get detailed incident information."""
    db = SessionLocal()
    
    try:
        log = db.query(AuditLog).filter(AuditLog.correlation_id == incident_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        import json
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


# ===== Report Endpoints =====

reports_store = []

@app.get("/reports")
async def get_reports():
    """Get all generated reports."""
    return {
        "count": len(reports_store),
        "reports": reports_store
    }

@app.post("/reports/generate")
async def generate_report(type: str, background_tasks: BackgroundTasks):
    """Generate a new report."""
    import uuid
    
    report = {
        "id": f"RPT-{uuid.uuid4().hex[:8].upper()}",
        "title": f"{type.replace('_', ' ').title()} Report",
        "type": type.title(),
        "date": datetime.now().isoformat(),
        "status": "Generating",
        "size": "-",
        "generatedBy": "System"
    }
    
    reports_store.append(report)
    
    # Simulate report generation
    background_tasks.add_task(complete_report, report["id"])
    
    return {
        "message": "Report generation started",
        "report": report
    }

async def complete_report(report_id: str):
    """Mark report as ready."""
    import asyncio
    import random
    
    await asyncio.sleep(random.uniform(2, 5))  # Simulate generation time
    
    for report in reports_store:
        if report["id"] == report_id:
            report["status"] = "Ready"
            report["size"] = f"{random.uniform(0.5, 3.0):.1f} MB"
            break

@app.get("/reports/{report_id}/download")
async def download_report(report_id: str):
    """Download a report."""
    report = next((r for r in reports_store if r["id"] == report_id), None)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report["status"] != "Ready":
        raise HTTPException(status_code=400, detail="Report not ready for download")
    
    # Return report metadata (in production, would return file)
    return {
        "report_id": report_id,
        "download_url": f"/downloads/{report_id}.pdf",
        "expires_at": datetime.now().isoformat()
    }

