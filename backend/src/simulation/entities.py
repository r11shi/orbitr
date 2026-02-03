from dataclasses import dataclass, field
from typing import List, Dict, Optional
import random
import uuid
import time
from faker import Faker

fake = Faker()

@dataclass
class UserEntity:
    user_id: str
    username: str
    role: str # 'Admin', 'Dev', 'SRE', 'Finance'
    mfa_enabled: bool
    risk_score: float = 0.0 # 0.0 to 1.0 (Higher is riskier behavior)
    
    @staticmethod
    def generate(role: str = None) -> 'UserEntity':
        roles = ['Admin', 'Dev', 'SRE', 'Finance']
        chosen_role = role or random.choice(roles)
        # Admins usually have MFA, but generated risk might flip it
        risk = random.random()
        return UserEntity(
            user_id=f"usr_{uuid.uuid4().hex[:8]}",
            username=fake.user_name(),
            role=chosen_role,
            mfa_enabled=random.choice([True, True, True, False]) if risk < 0.8 else False,
            risk_score=risk
        )

@dataclass
class ServiceEntity:
    service_id: str
    name: str
    tier: str # 'Critical', 'Standard', 'Internal'
    baseline_cpu: float
    baseline_memory: float
    owner_team: str

    @staticmethod
    def generate() -> 'ServiceEntity':
        tiers = ['Critical', 'Standard', 'Internal']
        tier = random.choice(tiers)
        name = f"{fake.word()}-{random.choice(['api', 'worker', 'db', 'auth'])}"
        return ServiceEntity(
            service_id=f"svc_{uuid.uuid4().hex[:8]}",
            name=name,
            tier=tier,
            baseline_cpu=random.uniform(10, 40),
            baseline_memory=random.uniform(20, 50),
            owner_team=f"Team-{fake.word().capitalize()}"
        )

class WorldState:
    """
    Holds the persistent state of the simulated world.
    """
    def __init__(self, num_users=20, num_services=5):
        self.users: List[UserEntity] = [UserEntity.generate() for _ in range(num_users)]
        self.services: List[ServiceEntity] = [ServiceEntity.generate() for _ in range(num_services)]
        self.active_incidents = []
        
        # Ensure at least one 'risky' user
        self.users[0].mfa_enabled = False
        self.users[0].risk_score = 0.95
        self.users[0].username = "evil_hacker_99"

    def get_random_user(self) -> UserEntity:
        return random.choice(self.users)

    def get_random_service(self) -> ServiceEntity:
        return random.choice(self.services)
