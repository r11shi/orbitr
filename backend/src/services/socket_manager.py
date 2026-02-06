"""
Real-time Socket.IO Manager for Orbitr

Provides real-time event streaming to connected frontend clients.
Events are emitted for:
- New insights/deviations
- Simulation status changes
- Agent activity updates
- System health changes
"""
import socketio
from typing import Any, Dict
from datetime import datetime


# Create async Socket.IO server with proper ASGI mode
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=False
)

# Create the ASGI app for Socket.IO
socket_asgi_app = socketio.ASGIApp(
    sio,
    socketio_path='socket.io'
)

# Track connected clients
connected_clients: Dict[str, Dict[str, Any]] = {}


@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    connected_clients[sid] = {
        "connected_at": datetime.now().isoformat(),
        "subscriptions": ["all"]
    }
    print(f"[SOCKET] Client connected: {sid}")
    
    # Send welcome message with current status
    await sio.emit('connected', {
        'status': 'connected',
        'client_id': sid,
        'message': 'Connected to Orbitr real-time stream'
    }, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    if sid in connected_clients:
        del connected_clients[sid]
    print(f"[SOCKET] Client disconnected: {sid}")


@sio.event
async def subscribe(sid, data):
    """Allow clients to subscribe to specific event types."""
    if sid in connected_clients:
        channels = data.get('channels', ['all'])
        connected_clients[sid]['subscriptions'] = channels
        await sio.emit('subscribed', {'channels': channels}, room=sid)


# Emit functions for different event types
async def emit_insight(insight: Dict[str, Any]):
    """Emit a new insight to all connected clients."""
    if len(connected_clients) > 0:
        await sio.emit('new_insight', {
            'type': 'insight',
            'timestamp': datetime.now().isoformat(),
            'data': insight
        })


async def emit_deviation(deviation: Dict[str, Any]):
    """Emit a new deviation (high/critical event) to all clients."""
    if len(connected_clients) > 0:
        await sio.emit('new_deviation', {
            'type': 'deviation',
            'timestamp': datetime.now().isoformat(),
            'data': deviation
        })


async def emit_simulation_status(status: Dict[str, Any]):
    """Emit simulation status change."""
    if len(connected_clients) > 0:
        await sio.emit('simulation_status', {
            'type': 'simulation',
            'timestamp': datetime.now().isoformat(),
            'data': status
        })


async def emit_agent_activity(agent_name: str, activity: Dict[str, Any]):
    """Emit agent activity update."""
    if len(connected_clients) > 0:
        await sio.emit('agent_activity', {
            'type': 'agent',
            'agent': agent_name,
            'timestamp': datetime.now().isoformat(),
            'data': activity
        })


async def emit_system_health(health: Dict[str, Any]):
    """Emit system health update."""
    if len(connected_clients) > 0:
        await sio.emit('system_health', {
            'type': 'health',
            'timestamp': datetime.now().isoformat(),
            'data': health
        })


async def emit_event_processed(event_data: Dict[str, Any]):
    """Emit when an event has been fully processed."""
    if len(connected_clients) > 0:
        await sio.emit('event_processed', {
            'type': 'processed',
            'timestamp': datetime.now().isoformat(),
            'data': event_data
        })


def get_connection_stats() -> Dict[str, Any]:
    """Get current connection statistics."""
    return {
        'connected_clients': len(connected_clients),
        'clients': list(connected_clients.keys())
    }
