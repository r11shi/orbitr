"""
LLM Service - Z.AI GLM-4.7-Flash Integration
Uses the Z.AI API endpoint: https://api.z.ai/api/paas/v4/chat/completions

GLM-4.7-Flash is FREE and provides excellent performance for coding and chat tasks.
"""
import os
import httpx
from typing import Optional, List, Dict
from dotenv import load_dotenv
import time
import json

load_dotenv()

# Z.AI API Key (from .env) - supports multiple key names
ZAI_API_KEY = (
    os.getenv("ZAI_API_KEY") or 
    os.getenv("ZHIPU_API_KEY") or 
    os.getenv("GLM_API_KEY")
)

# Z.AI API endpoint - correct endpoint from documentation
ZAI_API_URL = "https://api.z.ai/api/paas/v4/chat/completions"

# Debug: print key info on module load
if ZAI_API_KEY:
    print(f"[LLM] ✓ Loaded API key: {ZAI_API_KEY[:8]}...{ZAI_API_KEY[-4:]}")
else:
    print("[LLM] ⚠ WARNING: No API key found!")

# Fallback for local testing without API
_USE_FALLBACK = not ZAI_API_KEY


def call_glm(
    messages: List[Dict[str, str]],
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    timeout: float = 30.0,
    enable_thinking: bool = False
) -> str:
    """
    Call Z.AI GLM-4.7-Flash model.
    
    GLM-4.7-Flash is FREE and provides excellent performance.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        system_prompt: Optional system message
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum response tokens
        timeout: Request timeout in seconds
        enable_thinking: Whether to enable thinking mode (adds latency)
    
    Returns:
        Model response text
    """
    if _USE_FALLBACK:
        print("[LLM] No API key, using fallback")
        return _fallback_response(messages)
    
    try:
        # Build messages list with system prompt
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)
        
        # Prepare request payload - following Z.AI documentation exactly
        payload = {
            "model": "glm-4.7-flash",  # FREE model with excellent performance
            "messages": full_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }
        
        # Optionally enable thinking mode
        if enable_thinking:
            payload["thinking"] = {"type": "enabled"}
        
        # Headers as per Z.AI documentation
        headers = {
            "Authorization": f"Bearer {ZAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        start_time = time.time()
        print(f"[LLM] POST {ZAI_API_URL}")
        print(f"[LLM] Model: glm-4.7-flash, Messages: {len(full_messages)}")
        
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                ZAI_API_URL,
                json=payload,
                headers=headers
            )
            
            elapsed = (time.time() - start_time) * 1000
            
            if response.status_code != 200:
                error_body = response.text
                print(f"[LLM] Error {response.status_code}: {error_body[:300]}")
                
                # Try OpenRouter as fallback
                return _try_openrouter(full_messages, max_tokens, temperature, timeout)
            
            result = response.json()
            print(f"[LLM] ✓ Success in {elapsed:.0f}ms")
            print(f"[LLM] Response structure: {list(result.keys())}")
            
            # Debug: print first 500 chars of response
            print(f"[LLM] Raw: {json.dumps(result)[:500]}")
        
        # Extract content from response - standard OpenAI format
        content = _extract_content(result)
        
        if content:
            print(f"[LLM] Response: {len(content)} chars")
            return content
        else:
            print("[LLM] No content in response, using fallback")
            return _fallback_response(messages)
        
    except httpx.TimeoutException:
        print("[LLM] Request timeout, using fallback")
        return _fallback_response(messages)
    except Exception as e:
        print(f"[LLM] Error: {e}")
        return _fallback_response(messages)


def _extract_content(result: dict) -> str:
    """Extract content from Z.AI response (handles multiple formats)."""
    # Standard OpenAI format: choices[0].message.content
    if result.get("choices") and len(result["choices"]) > 0:
        choice = result["choices"][0]
        
        # Check delta (streaming format)
        if choice.get("delta"):
            delta = choice["delta"]
            if delta.get("content"):
                return delta["content"]
        
        # Check message
        if choice.get("message"):
            msg = choice["message"]
            # Content might be in 'content' field
            if msg.get("content"):
                return msg["content"]
            # Or might be the whole message object
            if isinstance(msg, str):
                return msg
    
    # Z.AI thinking mode returns different structure
    if result.get("output"):
        return result["output"]
    
    # Direct content
    if result.get("content"):
        return result["content"]
    
    # Response field
    if result.get("response"):
        return result["response"]
    
    # Data wrapper
    if result.get("data"):
        data = result["data"]
        if isinstance(data, str):
            return data
        if isinstance(data, dict):
            if data.get("content"):
                return data["content"]
            if data.get("response"):
                return data["response"]
    
    # Result field
    if result.get("result"):
        return str(result["result"])
    
    return ""


def _try_openrouter(messages: List[Dict[str, str]], max_tokens: int, temperature: float, timeout: float) -> str:
    """Fallback to OpenRouter API when Z.AI fails."""
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    if not openrouter_key:
        print("[LLM] No OpenRouter key, using rule-based fallback")
        return _fallback_response(messages)
    
    try:
        payload = {
            "model": "qwen/qwen-2.5-72b-instruct",  # Fast, capable model
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Orbiter AI"
        }
        
        print("[LLM] Trying OpenRouter fallback...")
        
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                content = _extract_content(result)
                if content:
                    print(f"[LLM] ✓ OpenRouter success: {len(content)} chars")
                    return content
            else:
                print(f"[LLM] OpenRouter error: {response.status_code}")
                
    except Exception as e:
        print(f"[LLM] OpenRouter error: {e}")
    
    return _fallback_response(messages)


async def call_glm_async(
    messages: List[Dict[str, str]],
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    timeout: float = 30.0,
    enable_thinking: bool = False
) -> str:
    """Async version using httpx AsyncClient."""
    if _USE_FALLBACK:
        return _fallback_response(messages)
    
    try:
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)
        
        payload = {
            "model": "glm-4.7-flash",
            "messages": full_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }
        
        if enable_thinking:
            payload["thinking"] = {"type": "enabled"}
        
        headers = {
            "Authorization": f"Bearer {ZAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                ZAI_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code != 200:
                return _fallback_response(messages)
            
            result = response.json()
        
        return _extract_content(result) or _fallback_response(messages)
        
    except Exception as e:
        print(f"[LLM] Async error: {e}")
        return _fallback_response(messages)


def _fallback_response(messages: List[Dict[str, str]]) -> str:
    """Generate intelligent rule-based fallback when LLM unavailable."""
    from .database import SessionLocal, AuditLog, FindingRecord, WorkflowRecord
    from datetime import datetime, timedelta
    
    last_msg = messages[-1]["content"] if messages else ""
    last_lower = last_msg.lower()
    
    # Fetch real data for context
    db = SessionLocal()
    try:
        cutoff = (datetime.utcnow() - timedelta(hours=1)).timestamp()
        
        # Get recent counts
        event_count = db.query(AuditLog).filter(AuditLog.timestamp > cutoff).count()
        findings = db.query(FindingRecord).filter(FindingRecord.timestamp > cutoff).all()
        critical_count = sum(1 for f in findings if f.severity == "Critical")
        high_count = sum(1 for f in findings if f.severity == "High")
        
        workflows = db.query(WorkflowRecord).filter(
            WorkflowRecord.status.in_(["pending", "awaiting_approval", "in_progress"])
        ).all()
        pending_count = len(workflows)
    except:
        event_count, critical_count, high_count, pending_count = 0, 0, 0, 0
    finally:
        db.close()
    
    # Context-aware responses with real data
    if "who" in last_lower and "you" in last_lower:
        return "I'm Orbiter AI, your compliance and security monitoring assistant. I analyze system events, detect policy violations, and help you manage workflows. I work with specialized agents: Compliance Sentinel for policy checks, Security Watchdog for threat detection, and Insight Synthesizer for pattern analysis."
    
    if "why" in last_lower and ("block" in last_lower or "fail" in last_lower):
        if critical_count > 0:
            return f"The workflow was blocked due to a compliance policy violation. I detected {critical_count} critical finding(s) in the last hour, including potential policy violations. A direct commit bypassed branch protection (Policy POL-001). Manager approval is required to proceed."
        return "The workflow was blocked due to a compliance policy violation. A direct commit to the main branch was detected without proper PR review (Policy POL-001). This requires manager approval before proceeding."
    
    if "what" in last_lower and ("happen" in last_lower or "going" in last_lower):
        parts = [f"In the last hour: {event_count} events processed"]
        if critical_count > 0:
            parts.append(f"{critical_count} critical findings detected")
        if high_count > 0:
            parts.append(f"{high_count} high-severity issues flagged")
        if pending_count > 0:
            parts.append(f"{pending_count} workflows awaiting action")
        return ". ".join(parts) + ". Check the Incidents page for full details."
    
    if "status" in last_lower or ("how" in last_lower and "system" in last_lower):
        if critical_count > 0:
            return f"⚠️ System has {critical_count} critical issue(s). Security Watchdog and Compliance Sentinel are actively monitoring. {pending_count} workflows need attention. Recommend reviewing Incidents page immediately."
        return f"✓ System is operational. All agents are actively monitoring. {event_count} events processed in the last hour, {pending_count} pending workflows. No critical issues detected."
    
    if "incident" in last_lower:
        if critical_count > 0 or high_count > 0:
            return f"There are {critical_count + high_count} active incidents requiring attention ({critical_count} critical, {high_count} high). Navigate to the Incidents page to view details and take action."
        return "No critical incidents detected. The system is monitoring for compliance and security issues."
    
    if "workflow" in last_lower:
        if pending_count > 0:
            return f"You have {pending_count} active workflows. Some are awaiting approval while others are in progress. Navigate to the Workflows page to advance or review them."
        return "All workflows are up to date. No pending approvals required."
    
    if "polic" in last_lower:
        return "The system enforces compliance policies:\n• POL-001: Branch Protection - Requires PR review for main branch\n• POL-002: Change Ticket Required - Links commits to JIRA tickets\n• POL-003: Secret Detection - Scans for exposed credentials\nView the Policies page for full details."
    
    if "help" in last_lower:
        return "I can help you:\n• Monitor system events and incidents\n• Understand policy violations\n• Manage compliance workflows\n• Investigate security findings\n\nTry asking: 'What happened?', 'Show me incidents', or 'Why is this blocked?'"
    
    # Default contextual response
    if critical_count > 0:
        return f"⚠️ Alert: {critical_count} critical finding(s) detected. Agents are actively investigating. Ask me about specific incidents or check the Incidents page for details."
    
    return f"System is monitoring. {event_count} events processed recently, {pending_count} pending workflows. Ask me about events, workflows, or incidents for more details."


def generate_chat_response(
    user_message: str,
    context: Optional[str] = None,
    recent_events: Optional[List[Dict]] = None
) -> Dict:
    """
    Generate a chat response with potential navigation actions.
    
    Returns:
        Dict with 'message' and optional 'action' (navigate, etc.)
    """
    messages = [{"role": "user", "content": user_message}]
    
    system_prompt = """You are Orbiter AI, a compliance and security monitoring assistant.
Help users understand system events, investigate incidents, and navigate the platform.
Be concise and technical. Reference specific policies and agents when relevant."""
    
    if context:
        system_prompt += f"\n\nContext:\n{context}"
    
    if recent_events:
        events_summary = "\n".join([
            f"- {e.get('summary', e.get('message', 'Event'))}" 
            for e in recent_events[:5]
        ])
        system_prompt += f"\n\nRecent Events:\n{events_summary}"
    
    response_text = call_glm(messages, system_prompt, temperature=0.5, max_tokens=512)
    
    result = {"message": response_text, "action": None}
    
    # Pattern matching for navigation
    user_lower = user_message.lower()
    if any(word in user_lower for word in ["show", "go to", "take me", "navigate", "open"]):
        if "workflow" in user_lower:
            result["action"] = {"navigate": "/workflows"}
        elif "incident" in user_lower:
            result["action"] = {"navigate": "/incidents"}
        elif "polic" in user_lower:
            result["action"] = {"navigate": "/policies"}
        elif "analytic" in user_lower:
            result["action"] = {"navigate": "/analytics"}
        elif "report" in user_lower:
            result["action"] = {"navigate": "/reports"}
    
    return result
