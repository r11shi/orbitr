# Operational Runbook (MVP Scope)

## 1. Environment Setup

### Prerequisites
- Python 3.10+
- Docker (Optional, for containerized run)
- OpenRouter API Key (for LLM reasoning)

### Configuration (`.env`)
```bash
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=sqlite:///./orbitr.db
LOG_LEVEL=INFO
```

## 2. Running the System

### A. Local Direct (Recommended for Dev)
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run Migration (Initialize DB)
python -m src.scripts.init_db

# 3. Start Backend
uvicorn src.main:app --reload --port 8000
```

### B. Running the Simulation
To generate high-fidelity test data:
```bash
# Simple run (One-off)
python scripts/simulate.py

# Continuous Load (Daemon)
python scripts/simulate.py --continuous --rate=5
```

## 3. Architecture Validations

| Component | Status | Verification |
|---|---|---|
| **Agents** | Active | `POST /events` triggers Supervisor + Workers |
| **Backend** | Active | `GET /health` returns 200 |
| **DB** | Active | `orbitr.db` file grows with events |
| **LLM** | Connected | Logs show "LLM Response" from OpenRouter |
