# IT Compliance & Standards Alignment

Orbitr is mapped directly to industry-standard controls to assist scaling IT organizations with their audits.

## 🛡️ SOC 2 Alignment (Trust Service Criteria)

### CC8.1: Change Management
Orbitr monitors **Criterion CC8.1** by tracking all system modifications and verifying they follow the approved change control workflow.
- **Agent**: `Compliance Sentinel` + `Security Watchdog`.
- **Validation**: Checks for PR approvals, test coverage, and authorized deployers.

### CC7.2: Security Monitoring
Orbitr satisfies **CC7.2** by providing continuous monitoring for unauthorized access and misconfigurations.
- **Agent**: `Security Watchdog`.
- **Validation**: Real-time alerting on secret leaks and MFA bypass attempts.

---

## 🏛️ ISO 27001 Alignment (Annex A)

### A.9.4.1: Information Access Restriction
Orbitr monitors access logs to ensure that users are only performing operations within their "Least Privilege" scope.
- **Agent**: `Compliance Sentinel`.

### A.12.4.1: Event Logging
Through the `Audit Coordinator`, Orbitr ensures that every significant event is recorded in a way that is auditable and tamper-evident (via the `orbitr.db` state tracking).

---

## 📈 Scaling Policy
As the organization grows, Orbitr policies can be updated dynamically via `docs/policies/` (to be implemented), allowing the agents to adapt to new regulatory requirements without code changes.
