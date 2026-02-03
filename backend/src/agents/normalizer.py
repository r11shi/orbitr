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
    
    return {
        "start_time": time.time(),
        "audit_log": [{
            "step": "Normalization",
            "agent": AGENT_ID,
            "timestamp": time.time(),
            "message": f"Event normalized: {event.event_type if event else 'Unknown'} from {event.source_system if event else 'Unknown'}"
        }],
        "agents_completed": [AGENT_ID]
    }
