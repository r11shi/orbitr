# 🛰️ Orbitr

**Enterprise-Grade Agentic IT Event Monitoring System**

Orbitr is an autonomous multi-agent system that monitors, analyzes, and provides intelligent insights for IT infrastructure events using LangGraph orchestration and GLM-4.7 AI.

---

## ✨ Features

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
│                                             └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Audit & Store │
              └───────────────┘
```

### Agent Registry

| Agent | Purpose |
|-------|---------|
| `normalizer` | Standardizes incoming events |
| `supervisor` | Routes to appropriate experts |
| `security_watchdog` | Detects security threats |
| `compliance_monitor` | Checks regulatory compliance |
| `anomaly_detector` | Identifies unusual patterns |
| `cost_analyst` | Analyzes cost implications |
| `resource_watcher` | Monitors resource utilization |
| `infrastructure_monitor` | System health checks |
| `insight_synthesizer` | AI-powered analysis (GLM-4.7) |
| `audit_coordinator` | Persists results |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Z.AI API Key (GLM Coding Plan)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/orbitr.git
cd orbitr

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
pip install zai-sdk
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API key
GLM_API_KEY=your-api-key-here
```

### Run

```bash
# Start the server
python -m uvicorn src.main:app --reload --port 8000

# In another terminal, run simulation
python -m scripts.simulate --count 5
```

### Verify

```bash
# Run the verification dashboard
python scripts/verify_dashboard.py
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/events` | Submit an IT event for processing |
| `GET` | `/health` | Health check |
| `GET` | `/insights` | Get processed insights |
| `GET` | `/reports/summary` | Analytics summary |

### Example Request

```bash
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "SecurityAlert",
    "source_system": "Firewall",
    "severity": "High",
    "payload": {"threat": "SQL Injection attempt"}
  }'
```

---

## 📁 Project Structure

```
orbitr/
├── src/
│   ├── agents/          # Multi-agent implementations
│   ├── graph/           # LangGraph workflow
│   ├── models/          # Pydantic models
│   ├── services/        # Business logic
│   ├── simulation/      # Event generators
│   └── main.py          # FastAPI app
├── scripts/
│   ├── simulate.py      # Event simulator
│   └── verify_dashboard.py
├── docs/                # Documentation
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔧 Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `GLM_API_KEY` | Z.AI API Key | Yes |
| `DATABASE_URL` | Database connection string | No (defaults to SQLite) |
| `LOG_LEVEL` | Logging level | No (defaults to INFO) |

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/orbitr/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/orbitr/discussions)

---

Built with ❤️ using LangGraph, FastAPI, and Z.AI GLM-4.7
