from typing import Dict, Any
from ..models.state import WorkflowState
import time

AGENT_ID = "normalizer"

def normalizer_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    Initializes the workflow state with proper defaults.
    Returns only the fields that need to be set.
    """
    event = state.get("event")
    
    # Handle event as dict or object
    if event:
        event_type = event.get("event_type") if isinstance(event, dict) else getattr(event, "event_type", "Unknown")
        source_system = event.get("source_system") if isinstance(event, dict) else getattr(event, "source_system", "Unknown")
    else:
        event_type = "Unknown"
        source_system = "Unknown"
    
    return {
        "start_time": time.time(),
        "audit_log": [{
            "step": "Normalization",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "message": f"Event normalized: {event_type} from {source_system}"
        }],
        "agents_completed": [AGENT_ID]
    }
