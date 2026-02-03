# Project Intake: Orbitr

## 1. Project Overview
**What problem are we solving?**
Disjointed engineering workflows and lack of real-time compliance/anomaly visibility in high-speed dev environments.

**Who are the users?**
DevOps Engineers, SREs, and Engineering Managers.

**What does success look like?**
A functional event-driven pipeline that detects a manual "After-hours" deployment or a "CPU Spike" and synthesizes a Root Cause Analysis (RCA) automatically.

## 2. Scope Definition
- **In scope**: Event normalization, Parallel Agent Execution (LangGraph), LLM Synthesis, CLI Simulation.
- **Out of scope**: Production-grade Auth (for MVP), massive horizontal scaling, direct cloud provider billing integrations.

## 3. Technical Environment
- **Primary language**: Python 3.10+
- **Frameworks**: FastAPI, LangGraph, Pydantic.
- **LLM**: GLM 4.7 by z.ai or anything from openrouter(open for suggestions).
- **State**: SQLite (with LangGraph checkpointing).

## 4. Constraints
- **Performance**: Must handle bursts of events asynchronously.
- **Safety**: Agents must not make destructive changes without confirmation (though current scope is monitor-only).

## 5. Integrations
- **OpenAI**: For RCA synthesis.
- **Supabase (Optional)**: Can be used for persistent audit logs if the user provides credentials.

---
> [!IMPORTANT]
> This intake form is based on preliminary docs. Please verify the "Out of Scope" items.

## Out of scope items
1. We need to somehow make the user feel as if the real data of a specific organisation is coming with different types of tasks and all, then at the end we are sending the stats to frontend to show the insights but also sending the insights. I am not sure about audits(open to suggestions.)
2. We need to build it really fast but we also need to make sure that we are not missing any edge cases and mainly it should work as intended.
3. You will have to research on the types of workflows and implement atleast 2 workflows,
It should be build as mentione. 
Performance monitoring, real time workflow monitoring, security monitoring, compliance monitoring, cost monitoring.
4. Main thing would be how good and realitistic data we could bring and make it feel real time.
5. Making sure agents operate really great with each others.
Open to your suggestions and ideas.