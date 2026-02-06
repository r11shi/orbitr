"""
Insight Synthesizer Agent - Optimized for Speed & Quality

Performance:
- Skip LLM for Low/Medium severity (rule-based)
- 15s timeout with graceful fallback
- Context injection for High/Critical
"""
from typing import Dict, Any
from ..models.state import WorkflowState
from ..services.ultracontext import context_assembler
from ..services.guardrails import validate_llm_response, check_context_ready, parse_llm_json
from ..services.observability import observability
from ..services.history import HistoricalContext
from ..services.llm import call_glm
from ..utils.event_helpers import get_event_type, get_event_severity, get_event_source, get_event_payload
import time
import json

AGENT_ID = "insight_synthesizer"


def generate_contextual_summary(event: Any, findings: list) -> Dict[str, Any]:
    """
    Generate meaningful rule-based analysis based on event type and findings.
    Provides unique, contextual insights without LLM.
    """
    severity = get_event_severity(event)
    event_type = get_event_type(event)
    source = get_event_source(event)
    payload = get_event_payload(event)
    
    summary = ""
    root_cause = None
    actions = []
    
    # === Event-specific analysis ===
    
    if event_type == "PullRequestMerged":
        if payload.get("reviewers_approved", 0) == 0:
            summary = f"Compliance Sentinel detected policy violation because PR #{payload.get('pr_number')} was merged without required code review in {payload.get('repository', 'unknown repo')}."
            root_cause = f"PR #{payload.get('pr_number')} was merged by {payload.get('username', 'unknown')} using admin bypass."
            actions = ["Review merge justification", "Audit changes for security issues", "Remind team about review policy"]
        else:
            summary = f"Standard pull request merged in {payload.get('repository', 'repository')} with {payload.get('reviewers_approved', 0)} approvals."
            actions = ["No action required - normal workflow"]
    
    elif event_type == "SecretDetected":
        summary = f"Security Watchdog detected credential exposure because sensitive credential ({payload.get('secret_type', 'unknown type')}) was found in repository {payload.get('repository', 'unknown')}."
        root_cause = f"Secret committed in file {payload.get('file_path', 'unknown')} by {payload.get('username', 'unknown')}."
        actions = ["Revoke exposed credential immediately", "Rotate affected secrets", "Scan for unauthorized access", "Add pre-commit hooks"]
    
    elif event_type == "DeploymentFailed":
        env = payload.get("environment", "unknown")
        summary = f"Deployment to {env} failed for project {payload.get('project', 'unknown')}."
        root_cause = payload.get("error_message", "Build or deployment configuration error")
        if env == "production":
            actions = ["Investigate build logs", "Consider rollback if needed", "Notify on-call engineer"]
        else:
            actions = ["Review build logs", "Fix failing step", "Re-trigger deployment"]
    
    elif event_type == "DeploymentSuccess":
        summary = f"Successful deployment to {payload.get('environment', 'unknown')} for {payload.get('project', 'unknown')}."
        actions = ["No action required - deployment successful"]
    
    elif event_type == "WorkflowViolation":
        summary = f"Workflow policy violation detected: {payload.get('violation_type', 'status mismatch')}."
        root_cause = f"Ticket {payload.get('ticket_id', 'unknown')} is in '{payload.get('current_status')}' but expected '{payload.get('expected_status')}'."
        actions = ["Update ticket status", "Review linked PR", "Sync project board"]
    
    elif event_type == "PipelineFailed":
        summary = f"CI/CD pipeline failed for {payload.get('repository', 'unknown')}: {payload.get('failure_reason', 'unknown error')}."
        root_cause = payload.get("failure_reason")
        actions = ["Review pipeline logs", "Fix failing tests/builds", "Re-run pipeline"]
    
    elif event_type == "PipelineCompleted":
        summary = f"CI/CD pipeline completed successfully for {payload.get('repository', 'unknown')} with {payload.get('tests_passed', 0)} tests passing."
        actions = ["No action required"]
    
    elif event_type == "ForcePushAttempt":
        summary = f"Force push attempt blocked on protected branch '{payload.get('branch', 'main')}'."
        root_cause = f"User {payload.get('username', 'unknown')} attempted to force push to protected branch."
        actions = ["Review user intent", "Document incident", "Verify branch protection settings"]
    
    elif event_type == "TicketUpdated":
        summary = f"Ticket {payload.get('ticket_id', 'unknown')} status changed from '{payload.get('old_status')}' to '{payload.get('new_status')}'."
        actions = ["No action required - normal workflow"]
    
    else:
        if findings:
            top_finding = findings[0]
            summary = f"{severity} severity {event_type} event: {top_finding.get('title', 'Issue detected')}. {len(findings)} finding(s) identified."
            root_cause = top_finding.get("description")
        else:
            summary = f"{severity} {event_type} event from {source}. No critical findings identified."
        
        if severity == "Critical":
            actions = ["Immediate investigation required", "Escalate to security team", "Document incident timeline"]
        elif severity == "High":
            actions = ["Review within 1 hour", "Assess business impact", "Document findings"]
        elif severity == "Medium":
            actions = ["Add to review queue", "Discuss in next standup"]
        else:
            actions = ["Log for audit purposes"]
    
    return {
        "summary": summary,
        "root_cause": root_cause,
        "actions": actions,
        "llm_used": False
    }


def insight_synthesizer_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Synthesizes findings into actionable insights.
    
    Strategy:
    - Low/Medium: Fast rule-based analysis (instant)
    - High/Critical: LLM with context (15s timeout)
    """
    start = time.time()
    event = state.get("event")
    findings = state.get("findings", [])
    
    severity = get_event_severity(event)
    event_type = get_event_type(event)
    
    # === Low/Medium: Use rule-based analysis ===
    if severity in ["Low", "Medium"]:
        print(f"[INSIGHT] Fast path: {severity} severity - using rules")
        result = generate_contextual_summary(event, findings)
        
        return {
            "summary": result["summary"],
            "root_cause": result["root_cause"],
            "recommended_actions": result["actions"],
            "audit_log": [{
                "step": "Insight Synthesis",
                "agent": AGENT_ID,
                "timestamp": time.time(),
                "duration_ms": round((time.time() - start) * 1000, 2),
                "llm_used": False,
                "mode": "rule_based",
                "message": f"Rule-based analysis for {severity} severity"
            }],
            "agents_completed": [AGENT_ID],
            "context": {"llm_context_score": 0, "guardrails_applied": False}
        }
    
    # === High/Critical: Use LLM with context ===
    print(f"[INSIGHT] {severity} severity - invoking LLM analysis")
    
    # Gather historical context
    historical_data = {}
    try:
        similar_events = HistoricalContext.get_similar_events(event_type, hours=24, limit=5)
        historical_data["similar_events"] = similar_events
    except Exception:
        pass
    
    # Build context
    context = context_assembler.build_context_for_event(event, historical_data)
    
    # Check context quality
    context_check = check_context_ready(context)
    context_score = context_check.get("score", 0)
    
    observability.trace_guardrail_check(
        check_type="context_sufficiency",
        passed=context_check["sufficient"],
        details=context_check
    )
    
    # Build prompt with event details
    payload = get_event_payload(event)
    source = get_event_source(event)
    payload_summary = ", ".join([f"{k}={v}" for k, v in (payload or {}).items()][:5])
    findings_text = "\n".join([f"- {f.get('title')}: {f.get('description', '')[:50]}" for f in findings[:3]])
    
    prompt = f"""Analyze this {severity} IT event and provide actionable insights.

Event Type: {event_type}
Source: {source}
Key Details: {payload_summary}

Findings:
{findings_text or "No specific findings yet."}

Respond in JSON: {{"summary": "one sentence analysis", "root_cause": "root cause or null", "actions": ["action 1", "action 2"]}}"""

    # Call LLM using proper message format
    messages = [{"role": "user", "content": prompt}]
    system_prompt = "You are an IT operations analyst. Provide brief, actionable insights in JSON format."
    
    if context and context.get("applicable_policies"):
        policies = context.get("applicable_policies", [])[:3]
        policy_names = ", ".join([p.get("name", "") for p in policies])
        system_prompt += f" Consider policies: {policy_names}"
    
    llm_response = call_glm(messages, system_prompt, temperature=0.3, max_tokens=300)
    
    # Parse or fallback
    if llm_response:
        parsed = parse_llm_json(llm_response)
        llm_used = True
    else:
        result = generate_contextual_summary(event, findings)
        parsed = {
            "summary": result["summary"],
            "root_cause": result["root_cause"],
            "actions": result["actions"]
        }
        llm_used = False
    
    # Validate with guardrails
    guardrail_result = validate_llm_response(
        response=parsed,
        context=context,
        strict=True
    )
    
    observability.trace_guardrail_check(
        check_type="response_validation",
        passed=guardrail_result.valid,
        details={"warnings": guardrail_result.warnings}
    )
    
    final_response = guardrail_result.modified_response
    
    return {
        "summary": final_response.get("summary", "Analysis complete."),
        "root_cause": final_response.get("root_cause"),
        "recommended_actions": final_response.get("actions", []),
        "audit_log": [{
            "step": "Insight Synthesis",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "duration_ms": round((time.time() - start) * 1000, 2),
            "llm_used": llm_used,
            "context_score": context_score,
            "guardrails_passed": guardrail_result.valid,
            "mode": "llm" if llm_used else "fallback",
            "message": f"{'LLM' if llm_used else 'Rule-based'} analysis complete"
        }],
        "agents_completed": [AGENT_ID],
        "context": {
            "llm_context_score": context_score,
            "guardrails_applied": True
        }
    }
