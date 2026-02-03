"""
Insight Synthesizer Agent - Z.AI GLM Coding Plan
Uses the CODING-SPECIFIC endpoint that works with Coding Plan subscription.
"""
from typing import Dict, Any
from ..models.state import WorkflowState
import time
import json
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

AGENT_ID = "insight_synthesizer"
GLM_API_KEY = os.getenv("GLM_API_KEY")

# CRITICAL: Use the CODING endpoint for Coding Plan subscriptions
# Regular endpoint: https://open.bigmodel.cn/api/paas/v4/chat/completions (DOESN'T WORK)
# Coding endpoint: https://api.z.ai/api/coding/paas/v4/chat/completions (WORKS!)
CODING_API_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"

def call_glm_coding(prompt: str) -> str:
    """
    Call GLM-4.7 using the CODING Plan endpoint (required for $3 subscription).
    """
    if not GLM_API_KEY:
        print("⚠️ GLM_API_KEY not found")
        return None

    print(f"🔑 API Key: {GLM_API_KEY[:8]}...{GLM_API_KEY[-4:]}")
    print(f"🚀 Calling GLM-4.7 via CODING endpoint...")
    
    headers = {
        "Authorization": f"Bearer {GLM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "glm-4.7",
        "messages": [
            {"role": "system", "content": "You are an expert IT security analyst."},
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(CODING_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                print(f"✅ Response: {len(content)} chars")
                return content
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

def insight_synthesizer_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Synthesizes findings into actionable insights.
    """
    start = time.time()
    event = state.get("event")
    findings = state.get("findings", [])
    
    # Build simple prompt
    findings_text = ""
    if findings:
        for i, f in enumerate(findings[:5], 1):
            findings_text += f"{i}. [{f.get('severity')}] {f.get('title')}\n"
    else:
        findings_text = "No findings."
    
    prompt = f"""Analyze this IT event and respond with JSON only:

Event: {event.event_type} from {event.source_system}
Severity: {event.severity.value if hasattr(event.severity, 'value') else event.severity}

Findings:
{findings_text}

JSON format:
{{"summary": "one sentence", "root_cause": "cause", "actions": ["action1", "action2"]}}"""

    llm_response = call_glm_coding(prompt)
    
    summary = "Analysis complete."
    root_cause = None
    actions = []
    
    if llm_response:
        try:
            cleaned = llm_response.replace("```json", "").replace("```", "").strip()
            start_idx = cleaned.find('{')
            end_idx = cleaned.rfind('}') + 1
            if start_idx >= 0:
                parsed = json.loads(cleaned[start_idx:end_idx])
                summary = parsed.get("summary", summary)
                root_cause = parsed.get("root_cause")
                actions = parsed.get("actions", [])
        except:
            summary = llm_response[:200]
            
    return {
        "summary": summary,
        "root_cause": root_cause,
        "recommended_actions": actions,
        "audit_log": [{
            "step": "Insight Synthesis",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "llm_used": llm_response is not None,
            "message": "GLM-4.7 Coding Plan analysis."
        }],
        "agents_completed": [AGENT_ID]
    }
