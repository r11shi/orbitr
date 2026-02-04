# 🛰️ Orbitr v3.0

**Enterprise-Grade Agentic IT Event Monitoring System**

Orbitr is an autonomous multi-agent system that monitors, analyzes, and provides intelligent insights for IT infrastructure events using LangGraph orchestration and GLM-4.7 AI.

---

## 🆕 Version 3.0 Features

| Feature | Description |
|---------|-------------|
| **Context Injection** | Policies and historical data injected into LLM for accurate analysis |
| **LLM Guardrails** | Prevent hallucinations by validating LLM responses against context |
| **UltraContext Integration** | Versioned context storage for AI agents |
| **Observability Tracing** | Debug agent decisions with LangSmith or local tracing |
| **Historical Pattern Detection** | Identify repeat offenders and frequency anomalies |
| **Enhanced Database Schema** | Actor/resource tracking with efficient indexes |

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Architecture** | 8 specialized agents for security, compliance, cost, infrastructure, and anomaly detection |
| **AI-Powered Insights** | GLM-4.7 integration for intelligent analysis and recommendations |
| **Real-time Processing** | Event-driven architecture with FastAPI for low-latency responses |
| **Enterprise Simulation** | Realistic IT event generator for testing and demos |
| **Audit Trail** | Complete logging and persistence with SQLite/PostgreSQL |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Endpoint                          │
│                      /events POST                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  LangGraph Workflow                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │Normalizer│→ │Supervisor│→ │ Experts  │→ │   Insight   │  │
│  └──────────┘  └──────────┘  └──────────┘  │ Synthesizer │  │
│                     │                       └─────────────┘  │
│                     │  ┌──────────────────────────────────┐  │
│                     └→ │ Context Injection + Guardrails   │  │
│                        │ • Policies • History • Baselines │  │
│                        └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Audit & Store │
              │ (Enhanced DB) │
              └───────────────┘
```

### Agent Registry

| Agent | Purpose | v3.0 Enhancement |
|-------|---------|------------------|
| `normalizer` | Standardizes incoming events | - |
| `supervisor` | Routes to appropriate experts | - |
| `security_watchdog` | Detects security threats | ✓ Historical pattern detection |
| `compliance_sentinel` | Checks regulatory compliance | ✓ Policy-based validation |
| `anomaly_detector` | Identifies unusual patterns | ✓ Historical baseline comparison |
| `cost_analyst` | Analyzes cost implications | - |
| `resource_watcher` | Monitors resource utilization | - |
| `infrastructure_monitor` | System health checks | - |
| `insight_synthesizer` | AI-powered analysis (GLM-4.7) | ✓ Context injection + Guardrails |
| `audit_coordinator` | Persists results | ✓ Enhanced schema |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Z.AI API Key (GLM Coding Plan)
- (Optional) UltraContext API Key
- (Optional) LangSmith API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/orbitr.git
cd orbitr/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
GLM_API_KEY=your-glm-api-key           # Required
ULTRACONTEXT_API_KEY=uc_live_xxx       # Optional - context management
LANGCHAIN_API_KEY=ls__xxx              # Optional - observability
```

### Run

```bash
# Start the server
python -m uvicorn src.main:app --reload --port 8000

# In another terminal, run simulation
python -m scripts.simulate --count 5
```

---

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/events` | Submit an IT event for processing |
| `GET` | `/health` | Health check |
| `GET` | `/insights` | Get processed insights (with filters) |
| `GET` | `/reports/summary` | Analytics summary |
| `GET` | `/audit/{correlation_id}` | Get detailed audit trail |

### New v3.0 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/actors/{actor_id}/events` | Get all events by a specific actor |
| `GET` | `/agents/{agent_id}/findings` | Get findings by agent |
| `GET` | `/observability/trace/{trace_id}` | Debug workflow execution |
| `GET` | `/system/context-providers` | Check context provider status |

### Example Request

```bash
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "SecurityAlert",
    "source_system": "Firewall",
    "severity": "High",
    "payload": {"threat": "SQL Injection attempt", "user_id": "user123"}
  }'
```

### Example Response (v3.0)

```json
{
  "status": "processed",
  "event_id": "abc123...",
  "analysis": {
    "risk_score": 0.85,
    "highest_severity": "High",
    "findings_count": 3,
    "summary": "Security threat detected...",
    "recommended_actions": ["Enable MFA for all privileged operations"]
  },
  "observability": {
    "trace_id": "run_abc123",
    "context_score": 85,
    "guardrails_applied": true
  }
}
```

---

## 📁 Project Structure

```
orbitr/backend/
├── src/
│   ├── agents/              # Multi-agent implementations
│   │   ├── insight.py       # ✓ Context injection + guardrails
│   │   ├── security.py      # ✓ Historical pattern detection
│   │   └── anomaly.py       # ✓ Baseline comparison
│   ├── graph/               # LangGraph workflow
│   ├── models/              # Pydantic models
│   ├── services/
│   │   ├── ultracontext.py  # NEW: Context management
│   │   ├── guardrails.py    # NEW: LLM validation
│   │   ├── observability.py # NEW: Tracing
│   │   ├── database.py      # ✓ Enhanced schema
│   │   └── history.py       # Historical context
│   ├── simulation/          # Event generators
│   └── main.py              # FastAPI app
├── scripts/
├── docs/
├── requirements.txt
├── .env.example             # ✓ Updated with new config
└── README.md
```

---

## 🔧 Configuration

### Required

| Variable | Description |
|----------|-------------|
| `GLM_API_KEY` | Z.AI API Key for GLM-4.7 |

### Optional (Recommended for Production)

| Variable | Description |
|----------|-------------|
| `ULTRACONTEXT_API_KEY` | UltraContext API for versioned context |
| `LANGCHAIN_API_KEY` | LangSmith for observability |
| `LANGCHAIN_PROJECT` | LangSmith project name |
| `DATABASE_URL` | Database connection (PostgreSQL recommended) |

---

## 🛡️ LLM Guardrails

v3.0 implements guardrails to prevent LLM hallucinations:

1. **Context Sufficiency Check** - Validates policies are loaded before LLM call
2. **Action Validation** - Ensures recommended actions are from approved list
3. **Evidence Verification** - Checks root cause claims against findings
4. **Framework Validation** - Verifies cited compliance frameworks exist

If guardrails fail, responses are marked with warnings:
- `[UNVERIFIED]` - Action not in approved list
- `[INFERENCE]` - Root cause not directly supported by evidence
- `[REFUSED]` - Context insufficient to analyze

---

## 📊 Observability

Debug agent decisions with:

```bash
# Get trace for a workflow run
curl http://localhost:8000/observability/trace/run_abc123
```

For full LangSmith integration:
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your_key
LANGCHAIN_PROJECT=orbitr-production
```

---

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=src
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/orbitr/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/orbitr/discussions)

---

Built with ❤️ using LangGraph, FastAPI, Z.AI GLM-4.7, UltraContext & LangSmith
