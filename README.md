# ORBITER - Multi-Agent SDLC Compliance & Monitoring System

<div align="center">

![Orbiter](https://img.shields.io/badge/ORBITER-v4.0-cyan)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-purple)

**AI-powered multi-agent system for real-time SDLC compliance monitoring, workflow enforcement, and intelligent insights.**

</div>

---

## 🎯 Overview

Orbiter is a **multi-agent monitoring platform** that processes events from your software development lifecycle (SDLC) and provides:

- **Real-time Event Processing** - Events from GitHub, Vercel, JIRA, etc.
- **Intelligent Routing** - Supervisor agent routes to specialized agents
- **Compliance Monitoring** - Detect policy violations automatically
- **Security Analysis** - Detect secrets, vulnerabilities, unauthorized access
- **Actionable Insights** - Generate recommendations for each event

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORBITER SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   GitHub    │     │   Vercel    │     │    JIRA     │      │
│   │  Webhooks   │     │  Webhooks   │     │  Webhooks   │      │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘      │
│          │                   │                   │              │
│          └───────────────────┼───────────────────┘              │
│                              ▼                                  │
│                    ┌─────────────────┐                         │
│                    │   Normalizer    │                         │
│                    │     Agent       │                         │
│                    └────────┬────────┘                         │
│                             ▼                                   │
│                    ┌─────────────────┐                         │
│                    │   Supervisor    │◄──── Intelligent        │
│                    │     Agent       │      Routing            │
│                    └────────┬────────┘                         │
│                             │                                   │
│          ┌──────────────────┼──────────────────┐               │
│          ▼                  ▼                  ▼               │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│   │  Security   │   │ Compliance  │   │  Resource   │         │
│   │  Watchdog   │   │  Sentinel   │   │  Watcher    │         │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘         │
│          │                 │                 │                 │
│          └─────────────────┼─────────────────┘                 │
│                            ▼                                    │
│                   ┌─────────────────┐                          │
│                   │    Insight      │                          │
│                   │   Synthesizer   │                          │
│                   └────────┬────────┘                          │
│                            ▼                                    │
│                   ┌─────────────────┐                          │
│                   │     Audit       │                          │
│                   │   Coordinator   │───► Database             │
│                   └─────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- pnpm (or npm)

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/orbiter.git
cd orbiter
```

### 2. Start Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn src.main:app --reload --port 8000
```

### 3. Start Frontend

```bash
cd orbiter-web

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

### 4. Run CLI (Optional)

```bash
cd backend
python cli.py
```

### 5. Access the Application

- **Web UI**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **CLI**: Terminal running `python cli.py`

---

## 💻 CLI Commands

The CLI provides real-time monitoring and control:

| Command      | Description                          |
|--------------|--------------------------------------|
| `demo`       | Run demo scenario with sample events |
| `simulate`   | Start/stop continuous simulation     |
| `clear`      | Clear all data and reset             |
| `logs`       | Refresh and show recent logs         |
| `workflows`  | List active workflows                |
| `agents`     | Show agent status                    |
| `status`     | System health check                  |
| `help`       | Show available commands              |
| `exit`       | Quit CLI                             |

---

## 🤖 Agents

| Agent                | Domain         | Responsibilities                                          |
|----------------------|----------------|-----------------------------------------------------------|
| **Normalizer**       | Event Intake   | Standardizes events from any source                       |
| **Supervisor**       | Orchestration  | Routes events to appropriate specialist agents            |
| **Security Watchdog**| Security       | Detects secrets, vulnerabilities, unauthorized access     |
| **Compliance Sentinel** | Compliance  | Monitors policy violations, review requirements           |
| **Resource Watcher** | Infrastructure | Monitors CPU, memory, deployments                         |
| **Cost Analyst**     | Financial      | Tracks cloud costs, billing anomalies                     |
| **Insight Synthesizer** | Analysis    | Generates actionable insights from findings               |
| **Audit Coordinator**| Persistence    | Calculates risk scores, saves to database                 |

---

## 📊 Web UI Pages

- **/** - Live Feed with real-time insights
- **/dashboard** - Dashboard with metrics and charts
- **/workflows** - Workflow monitoring and status
- **/analytics** - Detailed analytics and trends
- **/reports** - Compliance reports
- **/viewer?id=xxx** - Detailed insight viewer

---

## 🔧 Configuration

### Environment Variables (Backend)

Create `.env` in `/backend` (all optional for demo):

```env
# LLM API (Optional - system works without it using rule-based insights)
# ZAI_API_KEY=your_api_key_here

# Database (Optional - defaults to SQLite)
# DATABASE_URL=sqlite:///./orbiter.db

# LangSmith Tracing (Optional - for debugging only)
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=your_langsmith_key
```

> **Note:** The system uses **rule-based insight generation** by default, which provides fast and reliable analysis without requiring any external LLM API. API keys are only needed if you want to enable LLM-enhanced analysis for complex scenarios.

### Environment Variables (Frontend)

Create `.env.local` in `/orbiter-web`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📡 API Endpoints

### Core Endpoints

| Endpoint              | Method | Description                       |
|-----------------------|--------|-----------------------------------|
| `/health`             | GET    | Health check                      |
| `/insights`           | GET    | List recent insights              |
| `/workflows`          | GET    | List workflows                    |
| `/agents/status`      | GET    | Get all agent statuses            |

### Simulation Endpoints

| Endpoint                        | Method | Description                    |
|---------------------------------|--------|--------------------------------|
| `/simulation/quick-demo`        | POST   | Create demo data instantly     |
| `/simulation/start`             | POST   | Start simulation               |
| `/simulation/stop`              | POST   | Stop simulation                |
| `/simulation/reset`             | POST   | Clear all data                 |
| `/simulation/scenario/{name}`   | POST   | Run specific scenario          |

---

## 🧪 Testing

### Run Demo Scenario

```bash
# Via CLI
python cli.py
> demo

# Via API
curl -X POST http://localhost:8000/simulation/quick-demo
```

### Run Rogue Hotfix Scenario

```bash
curl -X POST http://localhost:8000/simulation/scenario/rogue_hotfix
```

---

## 📁 Project Structure

```
orbiter/
├── backend/
│   ├── src/
│   │   ├── agents/          # Agent implementations
│   │   ├── api/             # FastAPI routes
│   │   ├── graph/           # LangGraph workflow
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Core services (LLM, DB, etc.)
│   │   └── main.py          # Entry point
│   ├── cli.py               # CLI application
│   └── requirements.txt
│
├── orbiter-web/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   └── package.json
│
└── README.md                # This file
```

---

## 🎨 Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, LangGraph
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **LLM**: Z.AI GLM-4.7 (via OpenAI-compatible API)
- **Database**: SQLite (default), PostgreSQL (production)
- **CLI**: Rich (Python terminal UI)

---

## 📝 License

MIT License - see LICENSE file for details.

---

<div align="center">

**Built with ❤️ for SDLC compliance and monitoring**

</div>
