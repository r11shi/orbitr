# Orbitr: Intelligent Compliance & Workflow Monitoring System
## Complete Implementation Blueprint for Agents

---

## 👋 Phase 0: Foundation & Contract-First Setup  
*(Estimated Time: 0–3 hours)*

### 0.1 Project Kickoff & Environment Setup
- **Project Name**: Orbitr (ICWMS)  
- **Objective**: Build a hierarchical, parallel, state-aware monitoring system using Supervisor Pattern + LangGraph checkpointing.  
- **Tech Stack**:
  - **Backend**: FastAPI, Python 3.8+  
  - **State & Workflow**: LangGraph with `SqliteSaver` (or `MemorySaver` for MVP)  
  - **LLM**: OpenAI API (gpt-4)  
  - **Data**: SQLite (dev) / PostgreSQL (prod)  
  - **Async I/O**: asyncio + HTTPX/aiohttp

### 0.2 Directory Structure
```text
orbitr/
├── src/
│   ├── models/
│   │   ├── state.py          # WorkflowState TypedDict
│   │   └── events.py         # StandardizedEvent Pydantic model
│   ├── agents/
│   │   ├── normalizer.py     # Agent 1
│   │   ├── supervisor.py     # Agent 2
│   │   ├── compliance.py     # Agent 3
│   │   ├── anomaly.py        # Agent 4
│   │   ├── resource.py       # Agent 5
│   │   ├── insight.py        # Agent 6
│   │   └── audit.py          # Agent 7
│   ├── graph/
│   │   └── workflow.py       # LangGraph StateGraph
│   ├── services/
│   │   ├── database.py       # DB setup & CRUD
│   │   └── llm.py           # OpenAI wrapper
│   └── main.py              # FastAPI app
├── tests/
│   ├── test_models.py
│   ├── test_agents.py
│   └── test_graph.py
├── scripts/
│   └── simulate.py          # Event simulator
├── requirements.txt
└── .env
```

### 0.3 Define State Contract (`src/models/state.py`)
```python
from typing import TypedDict, List, Optional, Dict, Any
from pydantic import BaseModel

class StandardizedEvent(BaseModel):
    event_id: str
    event_type: str  # "Deployment", "Runtime", etc.
    severity_hint: str  # "Low", "Medium", "Critical"
    payload: Dict[str, Any]
    correlation_id: str
    ingestion_timestamp: float

class WorkflowState(TypedDict):
    event: Optional[StandardizedEvent]
    compliance_flags: List[str]
    anomaly_flags: List[str]
    resource_flags: List[str]
    insight: Optional[Dict[str, Any]]
    audit_log: List[str]
```

### 0.4 Setup LangGraph Skeleton (`src/graph/workflow.py`)
```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from src.models.state import WorkflowState, StandardizedEvent

builder = StateGraph(WorkflowState)

# Add nodes (agents) here in Phase 2

builder.set_entry_point("normalizer")

memory = SqliteSaver.from_conn_string("sqlite:///orbitr.db")
graph = builder.compile(checkpointer=memory)
```

### 0.5 FastAPI Entry Point (`src/main.py`)
```python
from fastapi import FastAPI
from src.graph.workflow import graph
from src.models.state import StandardizedEvent

app = FastAPI(title="Orbitr API")

@app.post("/events")
async def ingest_event(event: StandardizedEvent):
    result = graph.invoke({"event": event}, config={"configurable": {"thread_id": event.correlation_id}})
    return result
```

---

## 🧱 Phase 1: Sensor Tier – Ingestion & Normalization  
*(Estimated Time: 3–6 hours)*

### 1.1 Agent 1: Event Normalizer (`src/agents/normalizer.py`)
```python
from src.models.events import StandardizedEvent
import uuid, time

def normalizer_agent(state: WorkflowState) -> WorkflowState:
    raw = state["event"]
    if not isinstance(raw, dict):
        raise ValueError("Expected dict")
    
    event = StandardizedEvent(
        event_id=str(uuid.uuid4()),
        event_type=raw.get("event_type", "Unknown"),
        severity_hint=raw.get("severity_hint", "Medium"),
        payload=raw,
        correlation_id=raw.get("correlation_id", str(uuid.uuid4())),
        ingestion_timestamp=time.time()
    )
    return {"event": event}
```

### 1.2 Integrate into Graph
```python
from src.agents.normalizer import normalizer_agent
builder.add_node("normalizer", normalizer_agent)
```

### 1.3 Test Normalization
```python
# in tests/test_agents.py
def test_normalizer():
    state = {"event": {"event_type": "Deployment"}}
    new_state = normalizer_agent(state)
    assert new_state["event"].event_type == "Deployment"
    assert "ingestion_timestamp" in new_state["event"].dict()
```

---

## 🧠 Phase 2: Analysis Tier – Supervisor & Parallel Workers  
*(Estimated Time: 6–12 hours)*

### 2.1 Agent 2: Orchestrator Supervisor (`src/agents/supervisor.py`)
```python
def supervisor_agent(state: WorkflowState) -> WorkflowState:
    event = state["event"]
    next_nodes = []
    if event.event_type == "Deployment":
        next_nodes.append("compliance_sentinel")
    elif event.event_type == "Runtime":
        next_nodes.extend(["anomaly_detector", "resource_watcher"])
    if event.severity_hint == "Critical":
        next_nodes = ["compliance_sentinel", "anomaly_detector", "resource_watcher"]
    return {"__next__": next_nodes}
```

### 2.2 Agent 3: Compliance Sentinel (`src/agents/compliance.py`)
```python
def compliance_agent(state: WorkflowState) -> WorkflowState:
    flags = state.get("compliance_flags", [])
    payload = state["event"].payload
    if payload.get("hour", 0) in {2, 3}:
        flags.append("Deployment outside window")
    if payload.get("coverage", 100) < 80:
        flags.append("Coverage below threshold")
    return {"compliance_flags": flags}
```

### 2.3 Agent 4: Anomaly Detector (`src/agents/anomaly.py`)
```python
def anomaly_agent(state: WorkflowState) -> WorkflowState:
    last_5 = [1.0, 1.1, 1.2, 0.9, 1.3]
    current = state["event"].payload.get("duration", 1.0)
    avg = sum(last_5) / len(last_5)
    flags = state.get("anomaly_flags", [])
    if current > 2 * avg:
        flags.append(f"Spike detected: {current:.2f}s")
    return {"anomaly_flags": flags}
```

### 2.4 Agent 5: Resource Watcher (`src/agents/resource.py`)
```python
def resource_agent(state: WorkflowState) -> WorkflowState:
    flags = state.get("resource_flags", [])
    payload = state["event"].payload
    if payload.get("memory_usage", 0) > 90:
        flags.append("OOM Risk")
    if payload.get("cpu_usage", 0) > 95:
        flags.append("Contention")
    return {"resource_flags": flags}
```

### 2.5 Add Conditional Edges in Graph
```python
from src.agents import supervisor, compliance, anomaly, resource

builder.add_node("supervisor", supervisor_agent)
builder.add_node("compliance_sentinel", compliance_agent)
builder.add_node("anomaly_detector", anomaly_agent)
builder.add_node("resource_watcher", resource_agent)

builder.add_conditional_edges("supervisor", lambda state: state["__next__"], {
    "compliance_sentinel": "compliance_sentinel",
    "anomaly_detector": "anomaly_detector",
    "resource_watcher": "resource_watcher"
})
```

---

## 🤖 Phase 3: Action Tier – Synthesis & Audit  
*(Estimated Time: 12–16 hours)*

### 3.1 Agent 6: Insight Synthesizer (`src/agents/insight.py`)
```python
from src.services.llm import call_llm

def insight_agent(state: WorkflowState) -> WorkflowState:
    flags = state["compliance_flags"] + state["anomaly_flags"] + state["resource_flags"]
    prompt = f"""
    Context: Deployment failed. Flags: {', '.join(flags)}.
    Determine root cause and suggest one remediation step.
    """
    llm_output = call_llm(prompt)
    return {"insight": llm_output}
```

### 3.2 Agent 7: Audit & Response Coordinator (`src/agents/audit.py`)
```python
from src.services.database import save_audit

def audit_agent(state: WorkflowState) -> WorkflowState:
    audit_entry = {
        "correlation_id": state["event"].correlation_id,
        "insight": state["insight"],
        "flags": {
            "compliance": state["compliance_flags"],
            "anomaly": state["anomaly_flags"],
            "resource": state["resource_flags"]
        }
    }
    save_audit(audit_entry)
    return {"audit_log": state.get("audit_log", []) + [audit_entry]}
```

### 3.3 Connect Final Nodes
```python
from src.agents import insight, audit

builder.add_node("insight_synthesizer", insight_agent)
builder.add_node("audit_coordinator", audit_agent)

for worker in ["compliance_sentinel", "anomaly_detector", "resource_watcher"]:
    builder.add_edge(worker, "insight_synthesizer")

builder.add_edge("insight_synthesizer", "audit_coordinator")
builder.add_edge("audit_coordinator", END)
```

---

## 🎯 Phase 4: Polish, Simulation & Demo Prep  
*(Estimated Time: 16–24 hours)*

### 4.1 Enhance Simulator (`scripts/simulate.py`)
```python
import asyncio, random
from httpx import AsyncClient

async def simulate_event():
    event_type = random.choice(["Deployment", "Runtime"])
    payload = {
        "service": "payment-processor",
        "cpu_usage": random.uniform(85, 99),
        "memory_usage": random.uniform(85, 99),
        "duration": random.uniform(0.5, 3.0),
        "coverage": random.uniform(70, 95)
    }
    async with AsyncClient(base_url="http://localhost:8000") as client:
        await client.post("/events", json={"event_type": event_type, "payload": payload})

async def main():
    for _ in range(100):
        await simulate_event()
        await asyncio.sleep(0.1)

asyncio.run(main())
```

### 4.2 Colored Logging
Use `rich` or `colorlog` for `[PARALLEL] Running Compliance...` visualization.

### 4.3 Demo Script
1. Normal deployment → pass  
2. After-hours deployment → compliance flag  
3. Runtime spike → anomaly flag  
4. Critical event → all agents fire

---

## 📦 Phase 5: Deployment & Monitoring  
*(Estimated Time: 24+ hours)*

### 5.1 Dockerize
Create `Dockerfile` and `docker-compose.yml` for Orbitr + SQLite.

### 5.2 CI/CD Pipeline
GitHub Actions or GitLab CI to run tests and build Docker image on push.

### 5.3 Monitoring
- **Logs**: Structured JSON to stdout/file  
- **Metrics**: Prometheus endpoint  
- **Health Check**: `/health`

---

## 📚 Appendix

### A. Dependencies (`requirements.txt`)
```text
fastapi==0.104.1
uvicorn==0.24.0
langgraph==0.0.26
openai==1.3.5
pydantic==2.5.0
aiohttp==3.9.0
httpx==0.25.2
rich==13.7.0
```

### B. Environment Variables (`.env`)
```env
DATABASE_URL=sqlite:///./orbitr.db
OPENAI_API_KEY=sk-...
LOG_LEVEL=INFO
MAX_CONCURRENT_WORKERS=10
```

### C. Testing Commands
```bash
pytest tests/unit
pytest tests/integration
pytest --cov=src tests/
```

---

## 🏁 Next Steps
1. **Confirm Phase 0 completion** (dir structure, state contract, graph skeleton).  
2. **Proceed to Phase 1**: Implement and test Event Normalizer.  
3. **Iterate through phases**, committing after each.  
4. **Prepare final demo** with simulator and colored logs.