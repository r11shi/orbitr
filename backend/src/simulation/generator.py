import random
import time
import uuid
from typing import Dict, Any
from .entities import WorldState, UserEntity, ServiceEntity

class ScenarioGenerator:
    """
    Generates realistic IT events with proper schema alignment.
    """
    def __init__(self, world: WorldState):
        self.world = world

    def generate_random_event(self) -> Dict[str, Any]:
        """
        Randomly choose between normal traffic and incident scenarios.
        """
        roll = random.random()
        if roll < 0.15:
            return self.scenario_shadow_it()
        elif roll < 0.25:
            return self.scenario_cost_spike()
        elif roll < 0.35:
            return self.scenario_financial_issue()
        else:
            return self.event_normal_traffic()

    def _base_event(self, event_type: str, source: str, severity: str, payload: dict) -> Dict[str, Any]:
        """Create a properly formatted event."""
        return {
            "event_id": str(uuid.uuid4()),
            "correlation_id": str(uuid.uuid4()),
            "timestamp": time.time(),
            "event_type": event_type,
            "source_system": source,
            "severity": severity,
            "payload": payload,
            "tags": []
        }

    def event_normal_traffic(self) -> Dict[str, Any]:
        """Normal system metrics - should trigger minimal findings."""
        service = self.world.get_random_service()
        return self._base_event(
            event_type="SystemMetric",
            source="CloudWatch",
            severity="Low",
            payload={
                "service_id": service.service_id,
                "service_name": service.name,
                "cpu_usage": round(service.baseline_cpu + random.uniform(-5, 10), 2),
                "memory_usage": round(service.baseline_memory + random.uniform(-5, 10), 2),
                "disk_usage": round(random.uniform(40, 60), 2),
                "status": "Healthy"
            }
        )

    def scenario_shadow_it(self) -> Dict[str, Any]:
        """
        High-risk scenario: Unauthorized privileged access.
        Should trigger: Security + Compliance agents.
        """
        risky_users = [u for u in self.world.users if not u.mfa_enabled or u.risk_score > 0.7]
        user = random.choice(risky_users) if risky_users else self.world.users[0]
        
        return self._base_event(
            event_type="AccessControl",
            source="SSH-Gateway",
            severity="Critical",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "action": random.choice(["sudo /bin/bash", "sudo rm -rf /var/log", "sudo cat /etc/shadow"]),
                "target": random.choice(["prod-db-01", "billing-api", "auth-service"]),
                "host": "prod-db-01",
                "mfa_present": user.mfa_enabled,
                "location": random.choice(["192.168.1.100", "Unknown-IP", "VPN-Exit-Node"]),
                "privileged": True
            }
        )

    def scenario_cost_spike(self) -> Dict[str, Any]:
        """
        FinOps scenario: Unexpected auto-scaling.
        Should trigger: Cost + Anomaly agents.
        """
        service = self.world.get_random_service()
        delta = random.randint(3, 10)
        
        return self._base_event(
            event_type="CostEvent",
            source="AWS-AutoScaling",
            severity="Medium",
            payload={
                "service_id": service.service_id,
                "service_name": service.name,
                "event": "ScalingEvent",
                "delta_instances": delta,
                "instance_count": 10 + delta,
                "cost_impact_daily": random.randint(800, 2500),
                "cpu_usage": 95 + random.uniform(0, 5),  # High CPU triggered scaling
                "memory_usage": 88 + random.uniform(0, 7)
            }
        )

    def scenario_financial_issue(self) -> Dict[str, Any]:
        """
        Financial compliance scenario: Reconciliation mismatch.
        Should trigger: Compliance + Anomaly + Cost agents.
        """
        mismatch = round(random.uniform(1500, 8000), 2)
        
        return self._base_event(
            event_type="FinancialReconciliation",
            source="StripeConnector",
            severity="High",
            payload={
                "reconciler_id": f"RECON-{random.randint(100, 999)}",
                "mismatch_amount": mismatch,
                "currency": "USD",
                "affected_accounts": [f"ACC-{random.randint(1000, 9999)}" for _ in range(random.randint(1, 5))],
                "settlement_period": "2024-01-15 to 2024-01-16"
            }
        )
