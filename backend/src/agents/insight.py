"""
Insight Synthesizer Agent - Optimized for Speed

Performance Improvements:
- Skip LLM for Low/Medium severity (use rule-based)
- Faster timeout (15s instead of 60s)
- Graceful fallback on timeout
- Context injection for accurate results
"""
from typing import Dict, Any
from ..models.state import WorkflowState
from ..services.ultracontext import context_assembler
from ..services.guardrails import validate_llm_response, check_context_ready, parse_llm_json
from ..services.observability import observability
from ..services.history import HistoricalContext
import time
import json
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

AGENT_ID = "insight_synthesizer"
GLM_API_KEY = os.getenv("GLM_API_KEY")

# Use the correct CODING endpoint for Z.AI
CODING_API_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"

# LLM timeout - reduced for faster response
LLM_TIMEOUT = 15.0  # seconds


def call_glm_fast(prompt: str, context: Dict = None) -> str:
    """
    Call GLM-4.7 with optimized timeout.
    Returns None on timeout for graceful degradation.
    """
    start_time = time.time()
    
    if not GLM_API_KEY:
        print("⚠️ GLM_API_KEY not found - using rule-based analysis")
        return None

    print(f"🚀 Calling GLM-4.7 (timeout: {LLM_TIMEOUT}s)...")
    
    headers = {
        "Authorization": f"Bearer {GLM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Build concise system prompt
    system_content = "You are an IT security analyst. Be concise."
    if context and context.get("applicable_policies"):
        # Only include top 3 policies for speed
        policies = context.get("applicable_policies", [])[:3]
        policy_names = ", ".join([p.get("name", "") for p in policies])
        system_content += f" Relevant policies: {policy_names}"
    
    payload = {
        "model": "glm-4.7",
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 200  # Limit response size for speed
    }
    
    try:
        with httpx.Client(timeout=LLM_TIMEOUT) as client:
            response = client.post(CODING_API_URL, headers=headers, json=payload)
            duration_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                print(f"✅ LLM Response: {len(content)} chars in {duration_ms:.0f}ms")
                
                observability.trace_llm_call(
                    name="glm_fast",
                    prompt=prompt[:200],
                    response=content[:200],
                    model="glm-4.7",
                    duration_ms=duration_ms
                )
                return content
            else:
                print(f"❌ API Error: {response.status_code}")
                return None
                
    except httpx.TimeoutException:
        print(f"⏱️ LLM Timeout after {LLM_TIMEOUT}s - using rule-based fallback")
        return None
    except Exception as e:
        print(f"❌ LLM Error: {e}")
        return None


def rule_based_analysis(event: Any, findings: list) -> Dict[str, Any]:
    """
    Fast rule-based analysis when LLM is unavailable or for low-severity events.
    """
    severity = event.severity.value if hasattr(event.severity, 'value') else str(event.severity)
    
    # Generate summary from findings
    if findings:
        top_finding = findings[0]
        summary = f"{severity} event: {top_finding.get('title', 'Issue detected')}. {len(findings)} finding(s) identified."
    else:
        summary = f"{severity} event from {event.source_system}. No critical findings."
    
    # Generate actions based on severity
    actions = []
    if severity == "Critical":
        actions = ["Immediate investigation required", "Notify security team"]
    elif severity == "High":
        actions = ["Review and assess within 1 hour", "Document incident"]
    elif severity == "Medium":
        actions = ["Add to monitoring queue", "Review in next standup"]
    else:
        actions = ["Log for audit purposes"]
    
    # Root cause from findings
    root_cause = None
    if findings:
        root_cause = findings[0].get("description", "See findings for details")
    
    return {
        "summary": summary,
        "root_cause": root_cause,
        "actions": actions,
        "llm_used": False
    }


def insight_synthesizer_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Synthesizes findings into actionable insights.
    
    Optimizations:
    - Skip LLM for Low/Medium severity
    - Fast timeout with graceful fallback
    - Context injection for High/Critical
    """
    start = time.time()
    event = state.get("event")
    findings = state.get("findings", [])
    
    severity = event.severity.value if hasattr(event.severity, 'value') else str(event.severity)
    
    # === OPTIMIZATION: Skip LLM for Low/Medium severity ===
    if severity in ["Low", "Medium"]:
        print(f"⚡ Fast path: {severity} severity - skipping LLM")
        result = rule_based_analysis(event, findings)
        
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
                "message": f"Fast rule-based analysis for {severity} severity"
            }],
            "agents_completed": [AGENT_ID],
            "context": {"llm_context_score": 0, "guardrails_applied": False}
        }
    
    # === For High/Critical: Use LLM with context ===
    print(f"🔍 {severity} severity - using LLM analysis")
    
    # Gather historical context (quick)
    historical_data = {}
    try:
        similar_events = HistoricalContext.get_similar_events(event.event_type, hours=24, limit=5)
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
    
    # Build concise prompt
    findings_text = ""
    for i, f in enumerate(findings[:3], 1):
        findings_text += f"{i}. {f.get('title')}\n"
    
    prompt = f"""Analyze this {severity} IT event. Respond in JSON only.

Event: {event.event_type} from {event.source_system}
Findings:
{findings_text or "None"}

JSON format: {{"summary": "one sentence", "root_cause": "cause or null", "actions": ["action1"]}}"""

    # Call LLM with timeout
    llm_response = call_glm_fast(prompt, context)
    
    # Parse response or use fallback
    if llm_response:
        parsed = parse_llm_json(llm_response)
        llm_used = True
    else:
        # Fallback to rule-based
        result = rule_based_analysis(event, findings)
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
    
    summary = final_response.get("summary", "Analysis complete.")
    root_cause = final_response.get("root_cause")
    actions = final_response.get("actions", [])
    
    return {
        "summary": summary,
        "root_cause": root_cause,
        "recommended_actions": actions,
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
