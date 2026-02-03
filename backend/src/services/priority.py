"""
Priority Queue Service - Fast-tracks Critical Events
Ensures high-severity events are processed with priority.
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import IntEnum
import heapq
import time
import asyncio
from queue import PriorityQueue
import threading

class Priority(IntEnum):
    """Lower number = higher priority."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

@dataclass(order=True)
class PrioritizedEvent:
    """Wrapper for priority queue ordering."""
    priority: int
    timestamp: float = field(compare=False)
    event: Dict = field(compare=False)
    
    @classmethod
    def from_event(cls, event: Dict) -> 'PrioritizedEvent':
        severity = event.get("severity", "Medium")
        priority_map = {
            "Critical": Priority.CRITICAL,
            "High": Priority.HIGH,
            "Medium": Priority.MEDIUM,
            "Low": Priority.LOW
        }
        return cls(
            priority=priority_map.get(severity, Priority.MEDIUM),
            timestamp=time.time(),
            event=event
        )

class EventPriorityQueue:
    """
    Thread-safe priority queue for event processing.
    Critical events are processed before lower priority ones.
    """
    
    def __init__(self, max_size: int = 10000):
        self._queue: List[PrioritizedEvent] = []
        self._lock = threading.Lock()
        self._max_size = max_size
        self._stats = {
            "enqueued": 0,
            "processed": 0,
            "dropped": 0
        }
    
    def enqueue(self, event: Dict) -> bool:
        """Add event to queue. Returns False if queue is full."""
        with self._lock:
            if len(self._queue) >= self._max_size:
                # Drop lowest priority if full and new event is higher priority
                new_item = PrioritizedEvent.from_event(event)
                if self._queue and new_item.priority < self._queue[-1].priority:
                    heapq.heapreplace(self._queue, new_item)
                    self._stats["dropped"] += 1
                    return True
                self._stats["dropped"] += 1
                return False
            
            heapq.heappush(self._queue, PrioritizedEvent.from_event(event))
            self._stats["enqueued"] += 1
            return True
    
    def dequeue(self) -> Optional[Dict]:
        """Get highest priority event."""
        with self._lock:
            if not self._queue:
                return None
            item = heapq.heappop(self._queue)
            self._stats["processed"] += 1
            return item.event
    
    def peek(self) -> Optional[Dict]:
        """View highest priority event without removing."""
        with self._lock:
            if not self._queue:
                return None
            return self._queue[0].event
    
    def size(self) -> int:
        with self._lock:
            return len(self._queue)
    
    def stats(self) -> Dict:
        with self._lock:
            return {
                **self._stats,
                "current_size": len(self._queue),
                "max_size": self._max_size
            }
    
    def get_by_priority(self) -> Dict[str, int]:
        """Get count of events by priority level."""
        with self._lock:
            counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
            priority_names = {1: "Critical", 2: "High", 3: "Medium", 4: "Low"}
            for item in self._queue:
                name = priority_names.get(item.priority, "Medium")
                counts[name] += 1
            return counts

# Singleton instance
event_queue = EventPriorityQueue()

def prioritize_event(event: Dict) -> int:
    """
    Calculate dynamic priority based on multiple factors.
    Returns priority score (1-4, lower is higher priority).
    """
    base_priority = {
        "Critical": 1,
        "High": 2,
        "Medium": 3,
        "Low": 4
    }.get(event.get("severity", "Medium"), 3)
    
    # Boost priority for certain event types
    event_type = event.get("event_type", "").lower()
    if any(kw in event_type for kw in ["security", "breach", "unauthorized"]):
        base_priority = max(1, base_priority - 1)
    
    # Boost for production events
    payload = event.get("payload", {})
    if any(kw in str(payload).lower() for kw in ["prod", "production", "live"]):
        base_priority = max(1, base_priority - 1)
    
    return base_priority
