"""
Observability Service - Debug and trace agent decisions.

Provides:
1. LangSmith integration (when API key available)
2. Local tracing fallback
3. Prompt/response logging
4. Agent decision audit trail
"""
import os
import time
import json
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

# LangSmith configuration
LANGCHAIN_TRACING_V2 = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY", "")
LANGCHAIN_PROJECT = os.getenv("LANGCHAIN_PROJECT", "orbitr-production")

# Local logging configuration  
ENABLE_LOCAL_TRACING = os.getenv("ENABLE_LOCAL_TRACING", "true").lower() == "true"


@dataclass
class TraceSpan:
    """A single traced operation."""
    span_id: str
    name: str
    run_type: str  # "llm", "chain", "tool", "agent"
    start_time: float
    end_time: Optional[float] = None
    inputs: Dict[str, Any] = field(default_factory=dict)
    outputs: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    parent_id: Optional[str] = None
    
    @property
    def duration_ms(self) -> float:
        if self.end_time:
            return (self.end_time - self.start_time) * 1000
        return 0.0
    
    def to_dict(self) -> Dict:
        return {
            "span_id": self.span_id,
            "name": self.name,
            "run_type": self.run_type,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_ms": self.duration_ms,
            "inputs": self._redact_sensitive(self.inputs),
            "outputs": self._redact_sensitive(self.outputs),
            "metadata": self.metadata,
            "error": self.error,
            "parent_id": self.parent_id
        }
    
    def _redact_sensitive(self, data: Dict) -> Dict:
        """Redact sensitive fields like API keys."""
        if not isinstance(data, dict):
            return data
        
        sensitive_keys = {"api_key", "apikey", "token", "secret", "password", "authorization"}
        redacted = {}
        
        for key, value in data.items():
            if key.lower() in sensitive_keys:
                redacted[key] = "[REDACTED]"
            elif isinstance(value, dict):
                redacted[key] = self._redact_sensitive(value)
            elif isinstance(value, str) and len(value) > 500:
                redacted[key] = value[:500] + "...[TRUNCATED]"
            else:
                redacted[key] = value
        
        return redacted


class LocalTracer:
    """Local tracing implementation for when LangSmith is not available."""
    
    _traces: Dict[str, List[TraceSpan]] = {}
    _current_run_id: Optional[str] = None
    
    @classmethod
    def start_run(cls, run_id: str, name: str = "workflow") -> str:
        """Start a new trace run (e.g., for a workflow execution)."""
        cls._current_run_id = run_id
        cls._traces[run_id] = []
        return run_id
    
    @classmethod
    def start_span(
        cls, 
        name: str, 
        run_type: str, 
        inputs: Dict = None,
        parent_id: str = None
    ) -> TraceSpan:
        """Start a new span within the current run."""
        span = TraceSpan(
            span_id=f"span_{os.urandom(8).hex()}",
            name=name,
            run_type=run_type,
            start_time=time.time(),
            inputs=inputs or {},
            parent_id=parent_id
        )
        
        if cls._current_run_id:
            cls._traces.setdefault(cls._current_run_id, []).append(span)
        
        return span
    
    @classmethod
    def end_span(cls, span: TraceSpan, outputs: Dict = None, error: str = None):
        """End a span with outputs or error."""
        span.end_time = time.time()
        span.outputs = outputs or {}
        span.error = error
    
    @classmethod
    def get_traces(cls, run_id: str) -> List[Dict]:
        """Get all traces for a run."""
        spans = cls._traces.get(run_id, [])
        return [s.to_dict() for s in spans]
    
    @classmethod
    def clear_run(cls, run_id: str):
        """Clear traces for a run (memory management)."""
        cls._traces.pop(run_id, None)


class ObservabilityService:
    """
    Unified observability service.
    Uses LangSmith when available, falls back to local tracing.
    """
    
    def __init__(self):
        self.use_langsmith = LANGCHAIN_TRACING_V2 and LANGCHAIN_API_KEY
        self.use_local = ENABLE_LOCAL_TRACING
        
        if self.use_langsmith:
            print("[TRACE] LangSmith tracing enabled")
        elif self.use_local:
            print("[TRACE] Local tracing enabled (set LANGCHAIN_API_KEY for LangSmith)")
    
    def trace_llm_call(
        self,
        name: str,
        prompt: str,
        response: Optional[str],
        model: str,
        duration_ms: float,
        error: Optional[str] = None,
        metadata: Dict = None
    ):
        """Record an LLM call."""
        if self.use_langsmith:
            # LangSmith integration would go here
            # For now, we rely on LangChain's automatic tracing
            pass
        
        if self.use_local:
            span = LocalTracer.start_span(
                name=name,
                run_type="llm",
                inputs={"prompt": prompt[:1000], "model": model}
            )
            LocalTracer.end_span(
                span,
                outputs={
                    "response": response[:500] if response else None,
                    "duration_ms": duration_ms
                },
                error=error
            )
            
            # Also log to console for debugging
            if error:
                print(f"[LLM-ERR] {name}: {error}")
            else:
                print(f"[LLM] {name}: {model} - {duration_ms:.0f}ms")
    
    def trace_agent_decision(
        self,
        agent_id: str,
        decision: str,
        reasoning: Dict[str, Any],
        inputs: Dict = None,
        outputs: Dict = None
    ):
        """Record an agent's decision point."""
        if self.use_local:
            span = LocalTracer.start_span(
                name=f"{agent_id}:{decision}",
                run_type="agent",
                inputs=inputs or {}
            )
            LocalTracer.end_span(span, outputs={
                "decision": decision,
                "reasoning": reasoning,
                **(outputs or {})
            })
            
            print(f"[AGENT] {agent_id} -> {decision}")
    
    def trace_guardrail_check(
        self,
        check_type: str,
        passed: bool,
        details: Dict = None
    ):
        """Record a guardrail validation."""
        if self.use_local:
            span = LocalTracer.start_span(
                name=f"guardrail:{check_type}",
                run_type="tool",
                inputs={"check_type": check_type}
            )
            LocalTracer.end_span(span, outputs={
                "passed": passed,
                "details": details or {}
            })
            
            status = "PASS" if passed else "CHECK"
            print(f"[GUARD] {check_type}: {status}")
    
    def get_workflow_trace(self, run_id: str) -> Dict:
        """Get full trace for a workflow run."""
        if self.use_local:
            return {
                "run_id": run_id,
                "traces": LocalTracer.get_traces(run_id),
                "timestamp": datetime.utcnow().isoformat()
            }
        return {"run_id": run_id, "traces": [], "note": "Tracing not enabled"}


# Singleton instance
observability = ObservabilityService()


def traceable(name: str = None, run_type: str = "chain"):
    """
    Decorator to trace function execution.
    
    Usage:
        @traceable(name="my_function", run_type="tool")
        def my_function(arg1, arg2):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            span_name = name or func.__name__
            start_time = time.time()
            
            # Start span
            span = LocalTracer.start_span(
                name=span_name,
                run_type=run_type,
                inputs={"args_count": len(args), "kwargs_keys": list(kwargs.keys())}
            )
            
            try:
                result = func(*args, **kwargs)
                
                # End span with success
                LocalTracer.end_span(span, outputs={
                    "success": True,
                    "result_type": type(result).__name__,
                    "duration_ms": (time.time() - start_time) * 1000
                })
                
                return result
                
            except Exception as e:
                # End span with error
                LocalTracer.end_span(span, error=str(e))
                raise
        
        return wrapper
    return decorator


# LangSmith-compatible environment setup
def setup_langsmith():
    """
    Configure environment for LangSmith tracing.
    Call this at application startup if you have a LangSmith API key.
    """
    if LANGCHAIN_API_KEY:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = LANGCHAIN_PROJECT
        print(f"[TRACE] LangSmith configured for project: {LANGCHAIN_PROJECT}")
        return True
    else:
        print("[WARN] LangSmith not configured - set LANGCHAIN_API_KEY")
        return False
