import os
from typing import Optional
import httpx
from dotenv import load_dotenv
import asyncio

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Fallback models in order of preference
MODELS = [
    "anthropic/claude-3.5-sonnet:beta",
    "deepseek/deepseek-chat",
    "meta-llama/llama-3.1-8b-instruct:free"
]

# Circuit breaker state
_circuit_state = {"failures": 0, "last_failure": 0, "open": False}
CIRCUIT_THRESHOLD = 3
CIRCUIT_TIMEOUT = 60  # seconds

async def call_llm(
    prompt: str, 
    model: Optional[str] = None,
    json_mode: bool = False,
    timeout: float = 30.0
) -> Optional[str]:
    """
    Robust LLM call with circuit breaker, retries, and fallback.
    """
    import time
    
    # Check circuit breaker
    if _circuit_state["open"]:
        if time.time() - _circuit_state["last_failure"] > CIRCUIT_TIMEOUT:
            _circuit_state["open"] = False
            _circuit_state["failures"] = 0
        else:
            return None  # Circuit is open, fail fast
    
    if not OPENROUTER_API_KEY:
        # Return a simple fallback response
        return _generate_fallback_response(prompt)

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://orbitr.dev",
        "X-Title": "Orbitr Monitoring System"
    }

    # Try each model in order
    models_to_try = [model] if model else MODELS
    
    for current_model in models_to_try:
        payload = {
            "model": current_model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1000,
            "temperature": 0.3  # Lower for more consistent outputs
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    _circuit_state["failures"] = 0  # Reset on success
                    return data["choices"][0]["message"]["content"]
                    
                # Rate limited or credit issue - try next model
                if response.status_code in [429, 402]:
                    continue
                    
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            _circuit_state["failures"] += 1
            if _circuit_state["failures"] >= CIRCUIT_THRESHOLD:
                _circuit_state["open"] = True
                _circuit_state["last_failure"] = time.time()
            continue
        except Exception as e:
            continue
    
    # All models failed - return fallback
    return _generate_fallback_response(prompt)

def _generate_fallback_response(prompt: str) -> str:
    """Generate a basic analysis when LLM is unavailable."""
    return '{"summary": "Analysis completed with rule-based evaluation. LLM synthesis unavailable.", "root_cause": null, "recommended_actions": ["Review findings manually", "Check LLM API connectivity"]}'
