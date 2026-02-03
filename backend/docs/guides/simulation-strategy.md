# Advanced Simulation Strategy

To move beyond "AI Slop," Orbitr uses high-fidelity simulation patterns that mirror realistic IT environments.

## 🛡️ 10+ Simulation Modalities

1.  **The "Active Incident" Chain**: A series of logical events (e.g., `DB Spike` -> `Auto-Scaling` -> `Cost Alert`).
2.  **MFA "Ghost" Patterns**: Simulating a login succeeded by a privileged command *without* an MFA token event in the log.
3.  **Shadow IT Probing**: Generating external API calls from within the internal network to unapproved endpoints.
4.  **Financial "Drift" Simulation**: Slow, incremental changes in transaction values that bypass simple threshold alerts.
5.  **Jira Correlation**: Events that check if a corresponding ticket exists (and fail if not).
6.  **Human Behavior Noise**: Injected "normal" traffic to test the Anomaly detector's signal-to-noise ratio.
7.  **Chaos Injection**: Hard failures like "Region Unavailable" or "Database Deadlock."
8.  **Secret Leakage**: Commits containing dummy high-entropy strings (simulated AWS/Stripe keys).
9.  **Time-Window Violations**: Changes made during "Company Holidays" or "Freeze Periods."
10. **Resource Contention**: Simulating "noisy neighbors" in a multi-tenant environment.
11. **State Replay**: Ability to "Rewind" a simulation stream to see how agents react to the same data after a policy update.

## 🏗️ Implementation: `scripts/simulate.py`

The simulator will use an **Agent-Based Modeling (ABM)** approach:
- Each "Simulated Entity" (e.g., Developer, Bot) has a behavior profile.
- They generate event streams into the `FastAPI` ingestion point.
- The outcome is a "Real-Time" feed that looks like a production SOC.

> [!TIP]
> Use the `-scenario` flag to trigger specific chains:
> `python scripts/simulate.py --scenario shadow-deploy`
