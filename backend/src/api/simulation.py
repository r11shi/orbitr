"""
Simulation Router - Workflow simulation and demo scenarios.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
import random
import asyncio
import uuid

router = APIRouter(prefix="/simulation", tags=["Simulation"])

# Simulation state (module-level)
simulation_state = {
    "running": False,
    "started_at": None,
    "events_generated": 0,
    "workflows_created": 0
}

# Scripted scenarios for deterministic demo
SCRIPTED_SCENARIOS = {
    "rogue_hotfix": {
        "name": "Rogue Hotfix",
        "description": "Direct commit to main without PR review - compliance violation",
        "events": [
            {
                "event_type": "github_push",
                "severity": "Medium",
                "domain": "Compliance",
                "delay_seconds": 0,
                "payload": {
                    "branch": "main",
                    "author": "dev_hotfix_user",
                    "message": "HOTFIX: Emergency patch for production bug",
                    "files_changed": 3,
                    "bypass_pr": True
                }
            },
            {
                "event_type": "deployment_request",
                "severity": "High",
                "domain": "Compliance",
                "delay_seconds": 2,
                "payload": {
                    "environment": "production",
                    "source": "direct_push",
                    "requires_approval": True,
                    "bypassed_review": True
                }
            },
            {
                "event_type": "compliance_violation",
                "severity": "Critical",
                "domain": "Compliance",
                "delay_seconds": 3,
                "payload": {
                    "policy_id": "POL-001",
                    "policy_name": "Branch Protection Required",
                    "violation": "Direct commit to protected branch without PR review",
                    "evidence": "Commit SHA abc123 pushed directly to main",
                    "remediation": "Revert commit and submit via PR with required reviews"
                }
            }
        ]
    },
    "secret_exposure": {
        "name": "Secret Exposure",
        "description": "API key detected in committed code",
        "events": [
            {
                "event_type": "security_scan",
                "severity": "Critical",
                "domain": "Security",
                "delay_seconds": 0,
                "payload": {
                    "scan_type": "secret_detection",
                    "finding": "AWS API Key exposed",
                    "file": "config/settings.py",
                    "line": 42
                }
            }
        ]
    }
}


@router.post("/start")
async def start_simulation(background_tasks: BackgroundTasks):
    """Start workflow simulation for continuous monitoring."""
    global simulation_state
    
    if simulation_state["running"]:
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    simulation_state["running"] = True
    simulation_state["started_at"] = datetime.now().isoformat()
    simulation_state["events_generated"] = 0
    simulation_state["workflows_created"] = 0
    
    background_tasks.add_task(run_simulation)
    
    return {
        "status": "started",
        "message": "Workflow simulation started.",
        **simulation_state
    }


@router.post("/stop")
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


@router.get("/status")
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


@router.get("/scenarios")
async def list_scenarios():
    """List available scripted scenarios."""
    return {
        "count": len(SCRIPTED_SCENARIOS),
        "scenarios": [
            {
                "id": k,
                "name": v["name"],
                "description": v["description"],
                "event_count": len(v["events"])
            }
            for k, v in SCRIPTED_SCENARIOS.items()
        ]
    }


@router.post("/scenario/{scenario_name}")
async def run_scenario(scenario_name: str, background_tasks: BackgroundTasks):
    """
    Run a specific scripted scenario for deterministic demo.
    This is the key endpoint for the 5-minute demo.
    """
    if scenario_name not in SCRIPTED_SCENARIOS:
        raise HTTPException(
            status_code=404, 
            detail=f"Scenario '{scenario_name}' not found. Available: {list(SCRIPTED_SCENARIOS.keys())}"
        )
    
    scenario = SCRIPTED_SCENARIOS[scenario_name]
    correlation_id = f"demo_{uuid.uuid4().hex[:8]}"
    
    background_tasks.add_task(execute_scenario, scenario, correlation_id)
    
    return {
        "status": "scenario_started",
        "scenario": scenario_name,
        "correlation_id": correlation_id,
        "events_to_generate": len(scenario["events"]),
        "message": f"Running '{scenario['name']}' scenario..."
    }


async def execute_scenario(scenario: dict, correlation_id: str):
    """
    Execute a scripted scenario with timed events.
    CRITICAL: This shows complete workflow lifecycle:
    - Workflow created → Steps advance → Policy violation → Blocked
    """
    from ..models.events import StandardizedEvent, Severity, Domain
    from ..graph.workflow import graph
    from ..services.workflow import WorkflowStateMachine, WorkflowStatus
    from ..services.database import SessionLocal, AuditLog, FindingRecord, WorkflowRecord
    import json
    
    workflow_id = None
    
    for i, event_def in enumerate(scenario["events"]):
        # Wait for specified delay
        if event_def.get("delay_seconds", 0) > 0:
            await asyncio.sleep(event_def["delay_seconds"])
        
        # Build event
        event = StandardizedEvent(
            event_id=f"{correlation_id}_evt_{i}",
            correlation_id=correlation_id,
            event_type=event_def["event_type"],
            severity=Severity(event_def["severity"]),
            timestamp=datetime.now().timestamp(),
            domain=Domain(event_def["domain"]),
            source_system="scripted_demo",
            actor_id=event_def.get("payload", {}).get("author", "demo_user"),
            resource_id=f"demo_resource_{i}",
            payload=event_def.get("payload", {})
        )
        
        # Process through pipeline
        try:
            initial_state = {
                "event": event,
                "findings": [],
                "total_risk_score": 0.0,
                "highest_severity": event_def["severity"],
                "summary": None,
                "root_cause": None,
                "recommended_actions": [],
                "agents_to_run": [],
                "agents_completed": [],
                "audit_log": [],
                "start_time": datetime.now().timestamp(),
                "context": {
                    "scenario": scenario["name"],
                    "correlation_id": correlation_id,
                    "scripted": True
                }
            }
            
            result = graph.invoke(initial_state)
            print(f"[SCENARIO] Event {i+1}/{len(scenario['events'])}: {event_def['event_type']} processed")
            
            # ========== WORKFLOW LIFECYCLE ==========
            
            # Event 1: Create workflow (REQUEST stage)
            if i == 0 and workflow_id is None:
                workflow = WorkflowStateMachine.create_workflow(
                    workflow_type="change_approval",
                    correlation_id=correlation_id,
                    requester_id=event.actor_id,
                    metadata={
                        "scenario": scenario["name"],
                        "trigger_event": event_def["event_type"]
                    }
                )
                workflow_id = workflow.workflow_id
                print(f"[WORKFLOW] Created: {workflow_id} - Step 0: request_submitted")
                
                # Auto-advance to step 1 (submit)
                await asyncio.sleep(0.5)
                WorkflowStateMachine.advance_workflow(workflow_id, "submit", "system")
                print(f"[WORKFLOW] Advanced to Step 1: risk_assessment")
            
            # Event 2: Advance workflow (RISK_CHECK stage)
            elif i == 1 and workflow_id:
                WorkflowStateMachine.advance_workflow(workflow_id, "assess", "compliance_sentinel")
                print(f"[WORKFLOW] Advanced to Step 2: manager_approval (awaiting)")
            
            # Event 3: Policy violation - BLOCK the workflow
            elif i == 2 and workflow_id:
                # Block workflow due to policy violation
                db = SessionLocal()
                try:
                    record = db.query(WorkflowRecord).filter(
                        WorkflowRecord.workflow_id == workflow_id
                    ).first()
                    if record:
                        record.status = WorkflowStatus.ESCALATED.value
                        record.updated_at = datetime.now().timestamp()
                        # Add violation to metadata
                        metadata = json.loads(record.metadata_json) if record.metadata_json else {}
                        metadata["blocked_reason"] = "Policy violation detected"
                        metadata["policy_id"] = event_def.get("payload", {}).get("policy_id", "POL-001")
                        metadata["violation"] = event_def.get("payload", {}).get("violation", "Compliance breach")
                        record.metadata_json = json.dumps(metadata)
                        db.commit()
                        print(f"[WORKFLOW] BLOCKED due to policy violation!")
                finally:
                    db.close()
            
            # ========== REAL AGENT ACTIVITY ==========
            # Update agent activity in FindingRecord to show they're working
            db = SessionLocal()
            try:
                agents_involved = ["compliance_sentinel", "security_watchdog", "supervisor"]
                for agent_id in agents_involved:
                    finding = FindingRecord(
                        id=f"{correlation_id}_{agent_id}_{i}",
                        audit_log_id=event.event_id,
                        agent_id=agent_id,
                        finding_type="Analysis",
                        title=f"Processed {event_def['event_type']}",
                        description=f"Agent {agent_id} analyzed {event_def['event_type']} event",
                        severity=event_def["severity"],
                        confidence=0.85,
                        timestamp=datetime.now().timestamp()
                    )
                    db.merge(finding)
                db.commit()
            except Exception as e:
                print(f"[DB] Finding save error: {e}")
            finally:
                db.close()
            
        except Exception as e:
            print(f"[SCENARIO ERROR] Event {i+1}: {e}")
            import traceback
            traceback.print_exc()



async def run_simulation():
    """Background task to generate simulation events."""
    # Lazy imports to speed up startup
    from ..models.events import StandardizedEvent, Severity, Domain
    from ..graph.workflow import graph
    from ..services.workflow import WorkflowStateMachine, detect_workflow_trigger
    
    event_types = [
        "deployment_request", "access_request", "security_alert",
        "compliance_check", "resource_anomaly", "api_rate_limit"
    ]
    
    while simulation_state["running"]:
        try:
            event = StandardizedEvent(
                event_id=f"sim_{random.randint(1000, 9999)}",
                event_type=random.choice(event_types),
                severity=random.choice(list(Severity)),
                timestamp=datetime.now().timestamp(),
                domain=random.choice(list(Domain)),
                source_system="simulation",
                actor_id=f"user_{random.randint(1, 10)}",
                resource_id=f"res_{random.randint(100, 999)}",
                payload={"simulated": True}
            )
            
            # Build proper initial state (same structure as execute_scenario)
            initial_state = {
                "event": event,
                "findings": [],
                "total_risk_score": 0.0,
                "highest_severity": event.severity.value,
                "summary": None,
                "root_cause": None,
                "recommended_actions": [],
                "agents_to_run": [],
                "agents_completed": [],
                "audit_log": [],
                "start_time": datetime.now().timestamp(),
                "context": {
                    "simulated": True,
                    "correlation_id": event.event_id,
                }
            }
            
            result = graph.invoke(initial_state)
            simulation_state["events_generated"] += 1
            
            workflow_type = detect_workflow_trigger(event.model_dump())
            if workflow_type and random.random() > 0.7:
                WorkflowStateMachine.create_workflow(
                    workflow_type=workflow_type,
                    correlation_id=event.event_id,
                    requester_id=event.actor_id
                )
                simulation_state["workflows_created"] += 1
            
            await asyncio.sleep(random.uniform(5, 15))
            
        except Exception as e:
            print(f"Simulation error: {e}")
            import traceback
            traceback.print_exc()
            await asyncio.sleep(5)
