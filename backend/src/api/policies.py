"""
Policies Router - Compliance policy management.
"""
from fastapi import APIRouter
import os

router = APIRouter(tags=["Policies"])


@router.get("/policies")
async def get_policies():
    """List all compliance policies."""
    return [
        {"id": "POL-001", "name": "PII Data Encryption", "status": "passing", "enforcement": "Strict", "category": "Security", "lastAudit": "10m ago", "description": "All Personally Identifiable Information must be encrypted at rest and in transit."},
        {"id": "POL-002", "name": "Multi-Factor Authentication", "status": "passing", "enforcement": "Strict", "category": "Security", "lastAudit": "1h ago", "description": "MFA is required for all administrative access."},
        {"id": "POL-003", "name": "API Rate Limiting", "status": "failing", "enforcement": "Strict", "category": "Operational", "lastAudit": "5m ago", "description": "Public APIs must have rate limits configured."},
        {"id": "POL-004", "name": "Redundant Backups", "status": "warning", "enforcement": "Advisory", "category": "Compliance", "lastAudit": "Yesterday", "description": "Daily backups must be verified and stored in a separate region."}
    ]


@router.get("/system/context-providers")
async def get_context_providers():
    """Get status of context injection providers."""
    return {
        "ultracontext": {
            "enabled": bool(os.getenv("ULTRACONTEXT_API_KEY")),
            "status": "active" if os.getenv("ULTRACONTEXT_API_KEY") else "fallback_mode"
        },
        "langsmith": {
            "enabled": bool(os.getenv("LANGCHAIN_API_KEY")),
            "project": os.getenv("LANGCHAIN_PROJECT", "orbitr-production")
        },
        "glm_api": {
            "enabled": bool(os.getenv("GLM_API_KEY")),
            "endpoint": "https://api.z.ai/api/coding/paas/v4/chat/completions"
        },
        "guardrails": {
            "enabled": True,
            "strict_mode": True
        }
    }
