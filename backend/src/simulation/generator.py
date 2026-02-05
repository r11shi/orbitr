"""
SDLC Event Generator - Realistic CI/CD Pipeline Monitoring

Generates events from modern SDLC tools:
- GitHub: PR merges, commits, secret detection
- Vercel: Deployments, build failures
- Jira: Ticket status, workflow violations
- CI/CD: Pipeline failures, test results
"""
import random
import time
import uuid
from typing import Dict, Any, List
from .entities import WorldState

# Realistic project/service names
PROJECTS = ["frontend-app", "backend-api", "auth-service", "billing-service", "analytics-pipeline"]
ENVIRONMENTS = ["production", "staging", "development", "preview"]
BRANCHES = ["main", "develop", "feature/user-auth", "hotfix/security-patch", "release/v2.1"]


class ScenarioGenerator:
    """
    Generates realistic SDLC monitoring events.
    """
    def __init__(self, world: WorldState):
        self.world = world
        self.event_counter = 0

    def generate_random_event(self) -> Dict[str, Any]:
        """
        Generate events with realistic distribution.
        ~60% normal operations, ~40% issues requiring attention.
        """
        self.event_counter += 1
        roll = random.random()
        
        if roll < 0.15:
            # High severity - security/compliance
            return random.choice([
                self.github_secret_detected,
                self.github_pr_merged_without_review,
                self.vercel_deployment_failed_production,
            ])()
        elif roll < 0.30:
            # Medium severity - process violations
            return random.choice([
                self.jira_ticket_status_mismatch,
                self.github_force_push_protected,
                self.cicd_pipeline_failed,
            ])()
        elif roll < 0.50:
            # Low-Medium - operational issues
            return random.choice([
                self.vercel_build_timeout,
                self.cicd_test_failure,
                self.github_pr_large_diff,
            ])()
        else:
            # Normal operations
            return random.choice([
                self.github_pr_merged_normal,
                self.vercel_deployment_success,
                self.jira_ticket_updated,
                self.cicd_pipeline_success,
            ])()

    def _base_event(self, event_type: str, source: str, severity: str, 
                    domain: str, payload: dict) -> Dict[str, Any]:
        """Create a properly formatted event."""
        correlation_id = f"corr_{int(time.time())}_{self.event_counter}"
        return {
            "event_id": str(uuid.uuid4()),
            "correlation_id": correlation_id,
            "timestamp": time.time(),
            "event_type": event_type,
            "source_system": source,
            "severity": severity,
            "domain": domain,
            "payload": payload,
            "tags": []
        }

    # ========== GitHub Events ==========
    
    def github_pr_merged_normal(self) -> Dict[str, Any]:
        """Normal PR merge with proper review."""
        user = self.world.get_random_user()
        project = random.choice(PROJECTS)
        return self._base_event(
            event_type="PullRequestMerged",
            source="GitHub",
            severity="Low",
            domain="DevOps",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "repository": f"org/{project}",
                "pr_number": random.randint(100, 999),
                "title": f"feat: Add user authentication flow",
                "branch": random.choice(BRANCHES),
                "target_branch": "main",
                "files_changed": random.randint(2, 15),
                "additions": random.randint(50, 500),
                "deletions": random.randint(10, 100),
                "reviewers_approved": random.randint(1, 3),
                "ci_passed": True,
                "merge_method": "squash"
            }
        )
    
    def github_pr_merged_without_review(self) -> Dict[str, Any]:
        """PR merged without required review - compliance violation."""
        user = self.world.get_random_user()
        project = random.choice(PROJECTS)
        return self._base_event(
            event_type="PullRequestMerged",
            source="GitHub",
            severity="High",
            domain="Compliance",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "repository": f"org/{project}",
                "pr_number": random.randint(100, 999),
                "title": f"hotfix: Quick production fix",
                "branch": "hotfix/urgent-fix",
                "target_branch": "main",
                "files_changed": random.randint(1, 5),
                "additions": random.randint(10, 50),
                "deletions": random.randint(0, 20),
                "reviewers_approved": 0,
                "review_bypassed": True,
                "bypass_reason": "Admin override",
                "ci_passed": True,
                "merge_method": "merge"
            }
        )
    
    def github_secret_detected(self) -> Dict[str, Any]:
        """Secret detected in commit - critical security issue."""
        user = self.world.get_random_user()
        project = random.choice(PROJECTS)
        secret_types = ["AWS_ACCESS_KEY", "GITHUB_TOKEN", "DATABASE_PASSWORD", "API_KEY", "JWT_SECRET"]
        return self._base_event(
            event_type="SecretDetected",
            source="GitHub-SecretScanning",
            severity="Critical",
            domain="Security",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "repository": f"org/{project}",
                "commit_sha": f"{uuid.uuid4().hex[:8]}",
                "file_path": random.choice(["config/settings.py", ".env", "src/config.js", "docker-compose.yml"]),
                "secret_type": random.choice(secret_types),
                "branch": random.choice(BRANCHES),
                "detected_at": time.time(),
                "auto_revoked": False
            }
        )
    
    def github_force_push_protected(self) -> Dict[str, Any]:
        """Force push attempt to protected branch."""
        user = self.world.get_random_user()
        project = random.choice(PROJECTS)
        return self._base_event(
            event_type="ForcePushAttempt",
            source="GitHub",
            severity="Medium",
            domain="Security",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "repository": f"org/{project}",
                "branch": "main",
                "blocked": True,
                "reason": "Protected branch - force push not allowed"
            }
        )
    
    def github_pr_large_diff(self) -> Dict[str, Any]:
        """Large PR that may be hard to review."""
        user = self.world.get_random_user()
        project = random.choice(PROJECTS)
        return self._base_event(
            event_type="PullRequestOpened",
            source="GitHub",
            severity="Low",
            domain="DevOps",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "repository": f"org/{project}",
                "pr_number": random.randint(100, 999),
                "title": "refactor: Major codebase restructure",
                "branch": "feature/major-refactor",
                "target_branch": "develop",
                "files_changed": random.randint(50, 200),
                "additions": random.randint(2000, 10000),
                "deletions": random.randint(1000, 5000),
                "warning": "Large PR - consider splitting"
            }
        )

    # ========== Vercel Events ==========
    
    def vercel_deployment_success(self) -> Dict[str, Any]:
        """Successful deployment."""
        project = random.choice(PROJECTS[:2])  # Frontend projects
        env = random.choice(ENVIRONMENTS)
        return self._base_event(
            event_type="DeploymentSuccess",
            source="Vercel",
            severity="Low",
            domain="DevOps",
            payload={
                "project": project,
                "environment": env,
                "deployment_id": f"dpl_{uuid.uuid4().hex[:12]}",
                "url": f"https://{project}-{env[:4]}.vercel.app",
                "build_time_seconds": random.randint(30, 180),
                "git_branch": random.choice(BRANCHES),
                "git_commit": uuid.uuid4().hex[:8]
            }
        )
    
    def vercel_deployment_failed_production(self) -> Dict[str, Any]:
        """Production deployment failed - high priority."""
        project = random.choice(PROJECTS[:2])
        error_types = [
            "Build failed: Module not found 'missing-dep'",
            "Environment variable NEXT_PUBLIC_API_URL is not set",
            "TypeScript compilation error in src/pages/index.tsx",
            "Memory limit exceeded during build"
        ]
        return self._base_event(
            event_type="DeploymentFailed",
            source="Vercel",
            severity="High",
            domain="DevOps",
            payload={
                "project": project,
                "environment": "production",
                "deployment_id": f"dpl_{uuid.uuid4().hex[:12]}",
                "error_message": random.choice(error_types),
                "build_duration_seconds": random.randint(60, 300),
                "git_branch": "main",
                "git_commit": uuid.uuid4().hex[:8],
                "rollback_available": True
            }
        )
    
    def vercel_build_timeout(self) -> Dict[str, Any]:
        """Build timeout event."""
        project = random.choice(PROJECTS[:2])
        return self._base_event(
            event_type="BuildTimeout",
            source="Vercel",
            severity="Medium",
            domain="DevOps",
            payload={
                "project": project,
                "environment": random.choice(ENVIRONMENTS),
                "deployment_id": f"dpl_{uuid.uuid4().hex[:12]}",
                "timeout_seconds": 900,
                "git_branch": random.choice(BRANCHES)
            }
        )

    # ========== Jira Events ==========
    
    def jira_ticket_updated(self) -> Dict[str, Any]:
        """Normal ticket update."""
        user = self.world.get_random_user()
        statuses = ["To Do", "In Progress", "In Review", "Done"]
        return self._base_event(
            event_type="TicketUpdated",
            source="Jira",
            severity="Low",
            domain="ProjectManagement",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "ticket_id": f"PROJ-{random.randint(100, 9999)}",
                "title": "Implement user authentication",
                "old_status": random.choice(statuses[:-1]),
                "new_status": random.choice(statuses[1:]),
                "assignee": user.username,
                "sprint": f"Sprint {random.randint(1, 20)}"
            }
        )
    
    def jira_ticket_status_mismatch(self) -> Dict[str, Any]:
        """Ticket in wrong status - PR merged but ticket not updated."""
        user = self.world.get_random_user()
        return self._base_event(
            event_type="WorkflowViolation",
            source="Jira-Integration",
            severity="Medium",
            domain="Compliance",
            payload={
                "user_id": user.user_id,
                "username": user.username,
                "ticket_id": f"PROJ-{random.randint(100, 9999)}",
                "title": "User authentication feature",
                "current_status": "To Do",
                "expected_status": "Done",
                "violation_type": "PR merged but ticket not moved",
                "linked_pr": f"org/frontend-app#{random.randint(100, 999)}",
                "pr_merged_at": time.time() - random.randint(3600, 86400)
            }
        )

    # ========== CI/CD Events ==========
    
    def cicd_pipeline_success(self) -> Dict[str, Any]:
        """Successful pipeline run."""
        project = random.choice(PROJECTS)
        return self._base_event(
            event_type="PipelineCompleted",
            source="GitHub-Actions",
            severity="Low",
            domain="DevOps",
            payload={
                "repository": f"org/{project}",
                "workflow_name": random.choice(["CI", "Build and Test", "Deploy"]),
                "run_id": random.randint(1000000, 9999999),
                "status": "success",
                "duration_seconds": random.randint(60, 600),
                "branch": random.choice(BRANCHES),
                "tests_passed": random.randint(50, 500),
                "tests_failed": 0,
                "coverage_percent": round(random.uniform(75, 95), 1)
            }
        )
    
    def cicd_pipeline_failed(self) -> Dict[str, Any]:
        """Pipeline failure."""
        project = random.choice(PROJECTS)
        failure_reasons = [
            "Test suite failed: 3 tests failing",
            "Lint errors detected",
            "Docker build failed",
            "Deployment authorization failed"
        ]
        return self._base_event(
            event_type="PipelineFailed",
            source="GitHub-Actions",
            severity="Medium",
            domain="DevOps",
            payload={
                "repository": f"org/{project}",
                "workflow_name": random.choice(["CI", "Build and Test", "Deploy"]),
                "run_id": random.randint(1000000, 9999999),
                "status": "failure",
                "failure_reason": random.choice(failure_reasons),
                "duration_seconds": random.randint(30, 300),
                "branch": random.choice(BRANCHES),
                "tests_passed": random.randint(40, 100),
                "tests_failed": random.randint(1, 10)
            }
        )
    
    def cicd_test_failure(self) -> Dict[str, Any]:
        """Test failure in CI."""
        project = random.choice(PROJECTS)
        return self._base_event(
            event_type="TestFailure",
            source="GitHub-Actions",
            severity="Low",
            domain="DevOps",
            payload={
                "repository": f"org/{project}",
                "workflow_name": "Test Suite",
                "run_id": random.randint(1000000, 9999999),
                "branch": random.choice(BRANCHES),
                "failed_tests": [
                    "test_user_authentication",
                    "test_api_rate_limiting"
                ][:random.randint(1, 2)],
                "total_tests": random.randint(100, 500),
                "coverage_percent": round(random.uniform(60, 85), 1)
            }
        )
