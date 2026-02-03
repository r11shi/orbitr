# Orbitr API Documentation v2.1

## Overview
Orbitr is an **Enterprise-Grade Intelligent Compliance & Workflow Monitoring System** that uses AI agents to analyze IT events in real-time.

**Base URL**: `http://localhost:8000`

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ORBITR SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌───────────────┐    ┌─────────────────────────┐  │
│  │ Event    │───▶│ Priority      │───▶│ Agent Pipeline          │  │
│  │ Ingestion│    │ Queue         │    │                         │  │
│  └──────────┘    └───────────────┘    │ ┌─────────┐ ┌─────────┐ │  │
│                                       │ │Normalizer│▶│Supervisor│ │  │
│  ┌──────────┐    ┌───────────────┐    │ └─────────┘ └────┬────┘ │  │
│  │ Workflow │◀──▶│ State Machine │    │                  │      │  │
│  │ Engine   │    │ (Multi-step)  │    │      ┌───────────┼───────┐ │
│  └──────────┘    └───────────────┘    │      ▼           ▼       ▼ │
│                                       │ ┌────────┐ ┌────────┐ ┌───┐ │
│  ┌──────────┐    ┌───────────────┐    │ │Security│ │Compliance│ │...│ │
│  │ Dynamic  │───▶│ Rules Engine  │    │ └────────┘ └──────────┘ └───┘ │
│  │ Rules    │    │               │    │          │                   │
│  └──────────┘    └───────────────┘    │          ▼                   │
│                                       │ ┌─────────────────────────┐ │
│  ┌──────────┐    ┌───────────────┐    │ │ Insight Synthesizer     │ │
│  │Historical│◀──▶│ Pattern       │    │ │ (LLM-powered)           │ │
│  │ Context  │    │ Detection     │    │ └───────────┬─────────────┘ │
│  └──────────┘    └───────────────┘    │             ▼               │
│                                       │ ┌─────────────────────────┐ │
│                                       │ │ Audit Coordinator       │ │
│                                       │ │ (DB Persistence)        │ │
│                                       │ └─────────────────────────┘ │
│                                       └─────────────────────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Priority Queue** | Critical events processed first |
| **Historical Context** | Detect repeat offenders, frequency anomalies |
| **Workflow State Machine** | Track multi-step compliance flows |
| **Dynamic Rules Engine** | Load rules from config without redeployment |
| **Circuit Breaker** | LLM failures don't crash the system |
| **Confidence Scoring** | Every finding has a 0-1 confidence score |

---

## Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1706987654.123,
  "queue": {
    "enqueued": 100,
    "processed": 95,
    "dropped": 0,
    "current_size": 5,
    "max_size": 10000
  },
  "pending_workflows": 3
}
```

---

### 2. Ingest Event (Main Endpoint)
```http
POST /events
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_type": "AccessControl",
  "source_system": "SSH-Gateway",
  "severity": "Critical",
  "payload": {
    "user_id": "usr_abc123",
    "username": "john_doe",
    "action": "sudo /bin/bash",
    "target": "prod-db-01",
    "mfa_present": false,
    "location": "Unknown-IP"
  },
  "tags": ["security", "privileged"]
}
```

**Response:**
```json
{
  "status": "processed",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "correlation_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "priority": 1,
  "processing_time_ms": 245.67,
  "analysis": {
    "risk_score": 0.95,
    "highest_severity": "Critical",
    "findings_count": 4,
    "findings": [
      {
        "agent_id": "security_watchdog",
        "finding_type": "Security Threat",
        "title": "Privileged Command Without MFA",
        "description": "Detected sudo command execution without MFA",
        "severity": "Critical",
        "confidence": 0.95,
        "evidence": {
          "actor": "usr_abc123",
          "repeat_offender": true,
          "historical_risk": 0.72
        },
        "remediation": "Enforce MFA for all privileged operations."
      },
      {
        "agent_id": "compliance_sentinel",
        "finding_type": "Policy Violation",
        "title": "[POL-004] MFA Enforcement for Privileged Access",
        "severity": "Critical",
        "confidence": 0.95,
        "evidence": {
          "policy_id": "POL-004",
          "frameworks": ["ISO27001-A.9.4", "NIST-IA-2", "SOC2-CC6.1"]
        }
      }
    ],
    "summary": "Critical security violation: Privileged sudo access without MFA by repeat offender on production database.",
    "root_cause": "User attempted privileged access without completing MFA challenge. Historical pattern indicates elevated risk.",
    "recommended_actions": [
      "Terminate active session for user john_doe",
      "Enforce MFA policy on SSH gateway",
      "Review user's access permissions",
      "Investigate source IP"
    ]
  },
  "agents_invoked": [
    "normalizer",
    "supervisor",
    "security_watchdog",
    "compliance_sentinel",
    "insight_synthesizer",
    "audit_coordinator"
  ],
  "workflow": {
    "workflow_id": "wf-abc123",
    "type": "incident_response",
    "status": "pending",
    "current_step": 0
  },
  "audit_trail": [
    {
      "step": "Security Analysis",
      "agent": "security_watchdog",
      "findings_count": 2,
      "duration_ms": 12.5,
      "historical_context": {
        "actor": "usr_abc123",
        "repeat_offender": true,
        "frequency_anomaly": false
      }
    }
  ]
}
```

---

### 3. Get Recent Insights
```http
GET /insights?limit=10&severity=Critical
```

**Response:**
```json
{
  "count": 5,
  "insights": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "correlation_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "event_type": "AccessControl",
      "severity": "Critical",
      "risk_score": 0.95,
      "timestamp": 1706987654.123,
      "processing_time_ms": 245.67,
      "summary": "Critical security violation detected..."
    }
  ]
}
```

---

### 4. Get Summary Report (For Charts)
```http
GET /reports/summary
```

**Response:**
```json
{
  "total_events": 156,
  "by_severity": {
    "Critical": 12,
    "High": 34,
    "Medium": 67,
    "Low": 43
  },
  "by_event_type": {
    "AccessControl": 45,
    "SystemMetric": 78,
    "FinancialReconciliation": 15,
    "CostEvent": 18
  },
  "risk_distribution": {
    "high_risk": 46,
    "medium_risk": 67,
    "low_risk": 43
  },
  "performance": {
    "avg_processing_time_ms": 187.5
  }
}
```

---

### 5. Get Audit Detail
```http
GET /audit/{correlation_id}
```

---

### 6. Get Queue Statistics
```http
GET /queue/stats
```

**Response:**
```json
{
  "stats": {
    "enqueued": 1000,
    "processed": 950,
    "dropped": 5,
    "current_size": 45,
    "max_size": 10000
  },
  "by_priority": {
    "Critical": 5,
    "High": 15,
    "Medium": 20,
    "Low": 5
  }
}
```

---

### 7. Get Workflows
```http
GET /workflows?status=pending
```

**Response:**
```json
{
  "count": 3,
  "workflows": [
    {
      "workflow_id": "wf-abc123",
      "workflow_type": "incident_response",
      "correlation_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "status": "awaiting_approval",
      "current_step": 2,
      "steps": [
        {"name": "incident_detected", "completed_at": 1706987654.0},
        {"name": "triage", "completed_at": 1706987700.0},
        {"name": "investigation", "required_action": "investigate"}
      ]
    }
  ]
}
```

---

### 8. Advance Workflow
```http
POST /workflows/{workflow_id}/advance?action=investigate&actor_id=analyst_001
```

---

## Agents Reference

| Agent | Capability | Frameworks |
|-------|------------|------------|
| `security_watchdog` | Pattern matching, historical context, repeat offender detection | NIST, CIS |
| `compliance_sentinel` | 7 policy rules, multi-framework mapping | SOC2, ISO27001, PCI-DSS, SOX, GDPR |
| `anomaly_detector` | Z-score statistical analysis | - |
| `cost_analyst` | FinOps impact projection | - |
| `resource_watcher` | Threshold-based alerting | - |
| `insight_synthesizer` | LLM-powered RCA with circuit breaker | - |

---

## How to Know It's Working Well

### Quality Indicators:
1. **Confidence Scores**: Every finding has a 0-1 score. Higher = more certain.
2. **Processing Time**: Should be <500ms for most events.
3. **Agent Coverage**: Multiple agents should analyze each event.
4. **Historical Context**: Security agent should detect repeat offenders.
5. **Workflow Triggers**: Critical events should auto-create workflows.

### Test Scenarios:
1. **Sudo without MFA** → Should trigger Security + Compliance (Critical)
2. **Production access** → Should trigger multiple agents (High)
3. **Financial mismatch >$1000** → Should trigger Compliance + Cost
4. **Same event 10+ times/hour** → Should detect frequency anomaly

---

## Environment Variables
```bash
# .env file
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=sqlite:///./orbitr.db
```

---

## Quick Start
```bash
# Install
pip install -r requirements.txt

# Run API
uvicorn src.main:app --reload --port 8000

# Run Simulator (new terminal)
python scripts/simulate.py --count 10

# View API Docs
# Open http://localhost:8000/docs
```
