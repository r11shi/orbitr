# ORBITER - Multi-Agent SDLC Compliance Monitoring System

<div align="center">

![Orbiter](https://img.shields.io/badge/ORBITER-v4.0-cyan)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-purple)

**Multi-agent system for SDLC compliance monitoring and intelligent event analysis.**

</div>

---

## 🎯 Overview

Orbiter is a **multi-agent monitoring platform** that demonstrates intelligent event processing through a supervisor-coordinated agent pipeline. The system:

- **Simulates SDLC Events** - Generates realistic events (code pushes, deployments, security alerts, compliance violations)
- **Routes Events Intelligently** - Supervisor agent routes events to specialized agents based on domain
- **Generates Insights** - Rule-based analysis produces actionable recommendations
- **Tracks Workflows** - Monitors workflow states and transitions
- **Provides Visibility** - CLI and Web UI for monitoring agent activity

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORBITER SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌─────────────────────────────┐                   │
│              │   Simulation / Demo API     │                   │
│              │   (Generates test events)   │                   │
│              └──────────────┬──────────────┘                   │
│                             ▼                                   │
│                    ┌─────────────────┐                         │
│                    │   Normalizer    │                         │
│                    │     Agent       │                         │
│                    └────────┬────────┘                         │
│                             ▼                                   │
│                    ┌─────────────────┐                         │
│                    │   Supervisor    │◄──── Routes by          │
│                    │     Agent       │      Domain/Severity    │
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
│                   │    Insight      │◄──── Rule-based          │
│                   │   Synthesizer   │      Analysis            │
│                   └────────┬────────┘                          │
│                            ▼                                    │
│                   ┌─────────────────┐                          │
│                   │     Audit       │                          │
│                   │   Coordinator   │───► SQLite DB            │
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

| Command      | Description                              |
|--------------|------------------------------------------|
| `demo`       | Generate demo data with sample events    |
| `simulate`   | Start/stop continuous event simulation   |
| `clear`      | Clear all data and reset database        |
| `logs`       | Refresh and show recent insights         |
| `workflows`  | List active workflows                    |
| `agents`     | Show agent status                        |
| `status`     | System health check                      |
| `help`       | Show available commands                  |
| `exit`       | Quit CLI                                 |

---

## 🤖 Agents

| Agent                | Domain         | Responsibilities                                          |
|----------------------|----------------|-----------------------------------------------------------|
| **Normalizer**       | Event Intake   | Standardizes events into common format                    |
| **Supervisor**       | Orchestration  | Routes events to appropriate specialist agents            |
| **Security Watchdog**| Security       | Analyzes security-related events (secrets, auth, access)  |
| **Compliance Sentinel** | Compliance  | Checks policy violations, review requirements             |
| **Resource Watcher** | Infrastructure | Monitors resource metrics (CPU, memory, deployments)      |
| **Cost Analyst**     | Financial      | Analyzes cost-related events                              |
| **Insight Synthesizer** | Analysis    | Generates actionable insights using rule-based logic      |
| **Audit Coordinator**| Persistence    | Calculates risk scores, saves to database                 |

---

## 📊 Web UI Pages

| Route         | Description                                    |
|---------------|------------------------------------------------|
| `/`           | Live Feed - Recent insights with agent names   |
| `/dashboard`  | Dashboard with stats and summary               |
| `/workflows`  | Workflow list and status                       |
| `/analytics`  | Analytics and trends                           |
| `/reports`    | Compliance reports                             |
| `/?id=xxx`    | Detailed insight viewer                        |

---

## 🔧 Configuration

### Environment Variables (Backend)

Create `.env` in `/backend` (all optional):

```env
# LLM API (Optional - system uses rule-based insights by default)
# ZAI_API_KEY=your_api_key_here

# Database (Optional - defaults to SQLite)
# DATABASE_URL=sqlite:///./orbiter.db
```

> **Note:** No external APIs required. The system uses **rule-based insight generation** which provides fast analysis without LLM dependencies.

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

| Endpoint                        | Method | Description                      |
|---------------------------------|--------|----------------------------------|
| `/simulation/quick-demo`        | POST   | Generate demo data instantly     |
| `/simulation/start`             | POST   | Start continuous simulation      |
| `/simulation/stop`              | POST   | Stop simulation                  |
| `/simulation/reset`             | POST   | Clear all data                   |
| `/simulation/scenario/{name}`   | POST   | Run specific scenario            |

---

## 🧪 Demo Scenarios

### Quick Demo
```bash
curl -X POST http://localhost:8000/simulation/quick-demo
```
Generates 10 sample events with varied types (security, compliance, infrastructure).

### Rogue Hotfix Scenario
```bash
curl -X POST http://localhost:8000/simulation/scenario/rogue_hotfix
```
Simulates a compliance violation: direct commit to main without review.

### Clear Data
```bash
curl -X POST http://localhost:8000/simulation/reset
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
│   │   ├── services/        # Core services (DB, LLM, etc.)
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

| Layer     | Technology                                |
|-----------|-------------------------------------------|
| Backend   | Python, FastAPI, SQLAlchemy, LangGraph    |
| Frontend  | Next.js 14, React, TypeScript, Tailwind   |
| Database  | SQLite (default)                          |
| CLI       | Rich (Python terminal UI)                 |

---

## 📝 License

MIT License

---

<div align="center">

**Multi-Agent SDLC Compliance Monitoring**

</div>
