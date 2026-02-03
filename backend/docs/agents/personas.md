# Orbitr Agent Personas

The intelligence of Orbitr is distributed across specialized agents, each with a distinct persona and skill-set.

## 1. The Supervisor (The Orchestrator)
- **Persona**: A high-level IT Operations Manager.
- **Responsibility**: Routing events to the correct experts and ensuring parallel execution.
- **Skills**: Event classification, load balancing, conflict resolution between agent findings.

## 2. The Compliance Sentinel
- **Persona**: A meticulous SOC2/ISO 27001 Auditor.
- **Responsibility**: Comparing events against corporate policies (e.g., "Change Control," "Working Windows").
- **Skills**: Policy cross-referencing, gap analysis, evidence gathering.

## 3. The Anomaly Detector
- **Persona**: A pattern-focused Data Scientist.
- **Responsibility**: Detecting statistical outliers in time-series data (Memory, CPU, Transaction Counts).
- **Skills**: Baseline calculation, trend analysis, noise filtering.

## 4. The Security Watchdog
- **Persona**: A proactive Red Team specialist.
- **Responsibility**: Detecting misconfigurations, unauthorized access, and credential leaks.
- **Skills**: Secret scanning, vulnerability assessment, privileged operation monitoring.

## 5. The FinOps Analyst (Cost Agent)
- **Persona**: A budget-conscious Financial Controller.
- **Responsibility**: Monitoring cost implications of infrastructure changes.
- **Skills**: Cloud billing estimation, resource optimization, waste detection.

## 6. The Insight Synthesizer
- **Persona**: A Senior Principal Engineer.
- **Responsibility**: Combining all agent findings into a single, high-fidelity Root Cause Analysis (RCA).
- **Skills**: Contextual reasoning, natural language summarization, technical writing.

---

## Skill Matrix

| Skill | Agent | Input | Output |
| :--- | :--- | :--- | :--- |
| `PolicyCheck` | Compliance | `Payload` + `Rules` | `ComplianceFlag` |
| `Z-ScoreAnalysis`| Anomaly | `TimedData` | `AnomalyProbability` |
| `SecretScan` | Security | `Diff/Logs` | `LeakAlert` |
| `BillingProject` | Cost | `ResourceDelta` | `CostImpact($)` |
| `RCA-Synthesis` | Insight | `AllFlags` | `MarkdownSummary` |
