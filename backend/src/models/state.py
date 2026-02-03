from typing import TypedDict, List, Optional, Dict, Any, Annotated
from operator import add
from .events import StandardizedEvent

def merge_dicts(left: Dict, right: Dict) -> Dict:
    """Merge two dicts, right overwrites left."""
    return {**left, **right}

def keep_first(left: Any, right: Any) -> Any:
    """Keep the first value (ignore subsequent writes)."""
    return left if left is not None else right

def take_max(left: float, right: float) -> float:
    """Take the maximum of two floats."""
    return max(left or 0, right or 0)

def merge_lists(left: List, right: List) -> List:
    """Merge two lists by extending."""
    return (left or []) + (right or [])

class WorkflowState(TypedDict):
    """
    The state of an Orbitr workflow run.
    Uses Annotated types for proper concurrent merge handling.
    """
    # Input Event (immutable - keep first value)
    event: Annotated[Optional[StandardizedEvent], keep_first]
    
    # Agent Findings (accumulate from all agents)
    findings: Annotated[List[Dict[str, Any]], merge_lists]
    
    # Computed Scores (take max)
    total_risk_score: Annotated[float, take_max]
    highest_severity: Annotated[str, keep_first]
    
    # LLM Synthesis (keep first non-None)
    summary: Annotated[Optional[str], keep_first]
    root_cause: Annotated[Optional[str], keep_first]
    recommended_actions: Annotated[List[str], merge_lists]
    
    # Orchestration (accumulate)
    agents_to_run: Annotated[List[str], merge_lists]
    agents_completed: Annotated[List[str], merge_lists]
    
    # Audit & Timing (accumulate logs)
    audit_log: Annotated[List[Dict[str, Any]], merge_lists]
    start_time: Annotated[float, keep_first]
    
    # Shared Context (merge dicts)
    context: Annotated[Dict[str, Any], merge_dicts]
