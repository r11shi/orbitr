"""
Event Helper - Utilities for handling events as dict or object.
"""
from typing import Any, Dict, Optional

def get_event_attr(event: Any, attr: str, default: Any = None) -> Any:
    """Get attribute from event whether it's a dict or an object."""
    if event is None:
        return default
    if isinstance(event, dict):
        return event.get(attr, default)
    return getattr(event, attr, default)


def get_event_type(event: Any) -> str:
    """Get event_type from event."""
    return get_event_attr(event, "event_type", "unknown")


def get_event_severity(event: Any) -> str:
    """Get severity from event, handling enum values."""
    severity = get_event_attr(event, "severity", "Medium")
    if hasattr(severity, 'value'):
        return severity.value
    return str(severity)


def get_event_domain(event: Any) -> str:
    """Get domain from event."""
    domain = get_event_attr(event, "domain", "infrastructure")
    if hasattr(domain, 'value'):
        return domain.value
    return str(domain)


def get_event_payload(event: Any) -> Dict:
    """Get payload from event."""
    return get_event_attr(event, "payload", {}) or {}


def get_event_source(event: Any) -> str:
    """Get source_system from event."""
    return get_event_attr(event, "source_system", "unknown")


def get_event_actor(event: Any) -> str:
    """Get actor_id from event."""
    return get_event_attr(event, "actor_id", "unknown")


def get_event_id(event: Any) -> str:
    """Get event_id from event."""
    return get_event_attr(event, "event_id", "unknown")
