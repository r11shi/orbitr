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


@router.post("/quick-demo")
async def quick_demo():
    """
    Instantly populate dashboard with demo data for testing.
    Creates events, findings, and workflows immediately - no background task.
    """
    from ..services.database import SessionLocal, AuditLog, FindingRecord, WorkflowRecord
    from ..services.workflow import WorkflowStateMachine
    import json
    import time
    
    db = SessionLocal()
    created = {"events": 0, "findings": 0, "workflows": 0}
    
    try:
        now = time.time()
        
        # Clear existing demo data to prevention duplication
        try:
            db.query(AuditLog).filter(AuditLog.correlation_id.like("demo_%")).delete(synchronize_session=False)
            db.query(FindingRecord).filter(FindingRecord.audit_log_id.like("demo_%")).delete(synchronize_session=False)
            db.query(WorkflowRecord).filter(WorkflowRecord.correlation_id.like("demo_%")).delete(synchronize_session=False)
            db.commit()
        except Exception:
            db.rollback()

        # Create sample audit logs (events)
        sample_events = [
            {"event_type": "MetricUpdate", "severity": "Low", "summary": "CPU utilization normal (42%)", "source": "resource_watcher", "payload": {"metric": "cpu", "value": 42}},
            {"event_type": "MetricUpdate", "severity": "Warning", "summary": "Memory usage warning (85%)", "source": "resource_watcher", "payload": {"metric": "memory", "value": 85}},
            {"event_type": "PullRequestMerged", "severity": "Critical", "summary": "PR merged without code review - policy violation", "source": "github"},
            {"event_type": "SecretDetected", "severity": "Critical", "summary": "AWS API key detected in config.py", "source": "security_scanner"},
            {"event_type": "DeploymentFailed", "severity": "High", "summary": "Production deployment failed - rollback initiated", "source": "vercel"},
            {"event_type": "ComplianceViolation", "severity": "High", "summary": "Direct commit to main branch detected", "source": "compliance_sentinel"},
            {"event_type": "TicketUpdated", "severity": "Medium", "summary": "JIRA-1234 moved to Done without deployment", "source": "jira"},
            {"event_type": "PipelineCompleted", "severity": "Low", "summary": "CI pipeline completed - 48 tests passed", "source": "github"},
        ]
        
        for i, evt in enumerate(sample_events):
            log = AuditLog(
                correlation_id=f"demo_{uuid.uuid4().hex[:8]}",
                event_type=evt["event_type"],
                severity=evt["severity"],
                timestamp=now - (i * 300),  # Spread over last 30 mins
                source_system=evt["source"],
                summary=evt["summary"],
                insight_text=evt["summary"],
                metadata_json=json.dumps({"demo": True})
            )
            db.merge(log)
            created["events"] += 1
        
        # Create sample findings
        sample_findings = [
            {"agent": "compliance_sentinel", "type": "PolicyViolation", "title": "Branch protection bypassed", "severity": "Critical"},
            {"agent": "security_watchdog", "type": "SecretExposure", "title": "Hardcoded AWS credentials", "severity": "Critical"},
            {"agent": "security_watchdog", "type": "VulnerabilityDetected", "title": "Outdated dependency with CVE", "severity": "High"},
            {"agent": "compliance_sentinel", "type": "ComplianceGap", "title": "Missing ticket reference", "severity": "High"},
            {"agent": "insight_synthesizer", "type": "PatternDetected", "title": "Unusual deployment pattern", "severity": "Medium"},
        ]
        
        for i, finding in enumerate(sample_findings):
            record = FindingRecord(
                id=str(uuid.uuid4()),
                audit_log_id=f"demo_finding_{i}",
                agent_id=finding["agent"],
                finding_type=finding["type"],
                title=finding["title"],
                description=f"Demo finding: {finding['title']}",
                severity=finding["severity"],
                confidence=0.92,
                timestamp=now - (i * 200)
            )
            db.merge(record)
            created["findings"] += 1
        
        db.commit()
        
        # Create diverse workflows with different types and statuses
        workflow_configs = [
            {"type": "security_review", "requester": "security_bot", "metadata": {"finding": "Secret exposure detected", "severity": "Critical"}},
            {"type": "deployment_approval", "requester": "ci_pipeline", "metadata": {"env": "production", "service": "api-gateway"}},
            {"type": "access_request", "requester": "new_developer", "metadata": {"resource": "prod-database", "level": "read-only"}},
            {"type": "incident_response", "requester": "alertmanager", "metadata": {"alert": "High CPU usage", "severity": "High"}},
        ]
        
        for wf_config in workflow_configs:
            wf = WorkflowStateMachine.create_workflow(
                workflow_type=wf_config["type"],
                correlation_id=f"demo_{uuid.uuid4().hex[:8]}",
                requester_id=wf_config["requester"],
                metadata=wf_config["metadata"]
            )
            if wf:
                created["workflows"] += 1
        
        return {
            "status": "success",
            "message": "Demo data created successfully",
            "created": created
        }
        
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


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
    
    resource_metrics = {"cpu": 30, "memory": 40}
    
    while simulation_state["running"]:
        try:
            # 1. GENERATE RESOURCE STREAM (Every tick)
            # Simulate CPU/Mem fluctuation
            resource_metrics["cpu"] = max(10, min(99, resource_metrics["cpu"] + random.randint(-5, 8)))
            resource_metrics["memory"] = max(20, min(95, resource_metrics["memory"] + random.randint(-2, 4)))
            
            # Create a dedicated metric event
            metric_event = StandardizedEvent(
                event_id=f"metric_{int(datetime.now().timestamp())}",
                event_type="ResourceMetric",
                severity=Severity.MEDIUM if resource_metrics["cpu"] > 80 else Severity.LOW,
                timestamp=datetime.now().timestamp(),
                domain=Domain.INFRASTRUCTURE,
                source_system="node_monitor",
                actor_id="system",
                resource_id="prod-app-server-01",
                payload={
                    "metric": "cpu_utilization", 
                    "value": resource_metrics["cpu"],
                    "memory_pct": resource_metrics["memory"],
                    "threshold": 80
                }
            )
            
            # Process metric through graph (Will go to resource_watcher)
            metric_state = {
                "event": metric_event,
                "findings": [],
                "total_risk_score": 0.0,
                "highest_severity": metric_event.severity,
                "summary": None,
                "root_cause": None,
                "recommended_actions": [],
                "agents_to_run": [],
                "agents_completed": [],
                "audit_log": [],
                "start_time": datetime.now().timestamp(),
                "context": {"type": "metric_stream"}
            }
            # Fire and forget metrics to avoid blocking logic
            asyncio.create_task(process_metric(metric_state))

            # 2. GENERATE RANDOM EVENTS (Scenario logic)
            if random.random() < 0.3:  # 30% chance for random event
                event = StandardizedEvent(
                    event_id=f"sim_{random.randint(1000, 9999)}",
                    event_type=random.choice(event_types),
                    severity=random.choice(list(Severity)),
                    timestamp=datetime.now().timestamp(),
                    domain=random.choice(list(Domain)),
                    source_system="simulation",
                    actor_id="sim_user",
                    resource_id=f"res_{random.randint(1, 10)}",
                    payload={"description": "Simulated randomness"}
                )
                
                initial_state = {
                    "event": event,
                    "findings": [],
                    "total_risk_score": 0.0,
                    "highest_severity": event.severity,
                    "summary": None,
                    "root_cause": None,
                    "recommended_actions": [],
                    "agents_to_run": [],
                    "agents_completed": [],
                    "audit_log": [],
                    "start_time": datetime.now().timestamp(),
                    "context": {"scenario": "random_simulation"}
                }
            
                result = await graph.ainvoke(initial_state)

                # Trigger workflows based on events
                workflow_trigger = detect_workflow_trigger(event)
                if workflow_trigger:
                    WorkflowStateMachine.create_workflow(
                        workflow_type=workflow_trigger,
                        correlation_id=event.event_id,
                        requester_id=event.actor_id,
                        metadata={"trigger": event.event_type}
                    )
            
            await asyncio.sleep(2)  # 2 second tick
            
        except Exception as e:
            print(f"[SIM ERROR] {e}")
            await asyncio.sleep(5)

async def process_metric(state):
    """Helper to process metrics without blocking."""
    from ..graph.workflow import graph
    try:
        await graph.ainvoke(state)
    except Exception:
        pass
