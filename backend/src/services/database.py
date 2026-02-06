"""
Database Service - Enhanced schema for proper audit queries.

Improvements:
- Added actor_id and resource_id columns for efficient queries
- Added domain column for filtering
- Added context_score for tracking LLM context quality
- Maintains backward compatibility
"""
from sqlalchemy import create_engine, Column, String, Float, Text, DateTime, Boolean, Integer, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os
import json
from typing import List, Dict, Any, Optional

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./orbitr.db")

Base = declarative_base()


class AuditLog(Base):
    """
    Enhanced audit log with proper indexing for efficient queries.
    """
    __tablename__ = "audit_logs"

    # Primary identifiers
    id = Column(String, primary_key=True)  # event_id
    correlation_id = Column(String, index=True)
    timestamp = Column(Float, default=lambda: datetime.datetime.utcnow().timestamp(), index=True)
    
    # Event classification
    event_type = Column(String, index=True)
    severity = Column(String, index=True)
    source_system = Column(String, index=True)
    domain = Column(String, index=True)  # NEW: Security, Compliance, Financial, Infrastructure
    
    # Actor and Resource tracking (NEW)
    actor_id = Column(String, index=True)  # Who performed the action
    resource_id = Column(String, index=True)  # What resource was affected
    
    # JSON fields for structured data
    findings_json = Column(Text)
    insight_text = Column(Text)
    suggestion_json = Column(Text)
    
    # Metrics
    risk_score = Column(Float, default=0.0, index=True)
    processing_time_ms = Column(Float)
    
    # Context quality tracking (NEW)
    context_score = Column(Integer, default=0)  # 0-100, how much context was available
    guardrails_passed = Column(Boolean, default=True)  # Did response pass guardrails?
    llm_used = Column(Boolean, default=False)  # Was LLM called?
    
    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_actor_timestamp', 'actor_id', 'timestamp'),
        Index('idx_event_type_timestamp', 'event_type', 'timestamp'),
        Index('idx_severity_timestamp', 'severity', 'timestamp'),
        Index('idx_domain_severity', 'domain', 'severity'),
    )


class FindingRecord(Base):
    """
    Normalized findings table for efficient querying.
    NEW: Separates findings from JSON blobs for direct querying.
    """
    __tablename__ = "findings"
    
    id = Column(String, primary_key=True)
    audit_log_id = Column(String, index=True)  # FK to audit_logs
    timestamp = Column(Float, index=True)
    
    # Finding details
    agent_id = Column(String, index=True)
    finding_type = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    severity = Column(String, index=True)
    confidence = Column(Float)
    
    # Actor tracking
    actor_id = Column(String, index=True)
    
    # JSON for flexible evidence
    evidence_json = Column(Text)
    remediation = Column(Text)


class WorkflowRecord(Base):
    """
    Persistent workflow state for compliance workflows.
    NEW: Replaces in-memory storage for demo-safe persistence.
    """
    __tablename__ = "workflows"
    
    workflow_id = Column(String, primary_key=True)
    workflow_type = Column(String, index=True)  # change_approval, access_review, incident_response
    correlation_id = Column(String, index=True)
    status = Column(String, index=True)  # pending, in_progress, completed, etc.
    
    # Timestamps
    created_at = Column(Float, index=True)
    updated_at = Column(Float, index=True)
    
    # Actors
    requester_id = Column(String, index=True)
    approver_id = Column(String)
    
    # State
    current_step = Column(Integer, default=0)
    steps_json = Column(Text)  # JSON array of step objects
    metadata_json = Column(Text)  # JSON object of metadata


# Setup
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
    print("[DB] Database initialized with enhanced schema")


def save_audit_entry(
    event: Any,
    findings: List[Dict],
    insight: Optional[str],
    suggestions: List[str],
    risk_score: float,
    processing_time_ms: float,
    context_score: int = 0,
    guardrails_passed: bool = True,
    llm_used: bool = False
):
    """
    Persists the final workflow state to the database.
    Enhanced with actor/resource tracking and normalized findings.
    """
    db = SessionLocal()
    try:
        print(f"[DB] Saving Audit Log: {event.event_id} ({event.event_type})")
        
        # Extract actor and resource from payload
        payload = event.payload
        actor_id = payload.get("user_id") or payload.get("username") or payload.get("actor_id")
        resource_id = payload.get("resource_id") or payload.get("target") or payload.get("host")
        domain = event.domain.value if hasattr(event.domain, 'value') else str(event.domain)
        
        # Create main audit entry
        entry = AuditLog(
            id=event.event_id,
            correlation_id=event.correlation_id,
            timestamp=event.timestamp,
            event_type=event.event_type,
            severity=event.severity.value if hasattr(event.severity, 'value') else str(event.severity),
            source_system=event.source_system,
            domain=domain,
            actor_id=actor_id,
            resource_id=resource_id,
            findings_json=json.dumps(findings, default=str),
            insight_text=insight or "",
            suggestion_json=json.dumps(suggestions, default=str),
            risk_score=risk_score,
            processing_time_ms=processing_time_ms,
            context_score=context_score,
            guardrails_passed=guardrails_passed,
            llm_used=llm_used
        )
        
        db.add(entry)
        
        # Save normalized findings
        for i, finding in enumerate(findings):
            finding_id = f"{event.event_id}_f{i}"
            finding_actor = finding.get("evidence", {}).get("actor", actor_id)
            
            finding_record = FindingRecord(
                id=finding_id,
                audit_log_id=event.event_id,
                timestamp=event.timestamp,
                agent_id=finding.get("agent_id", "unknown"),
                finding_type=finding.get("finding_type", "Unknown"),
                title=finding.get("title", ""),
                description=finding.get("description", ""),
                severity=finding.get("severity", "Low"),
                confidence=finding.get("confidence", 0.0),
                actor_id=finding_actor,
                evidence_json=json.dumps(finding.get("evidence", {}), default=str),
                remediation=finding.get("remediation", "")
            )
            db.add(finding_record)
        
        db.commit()
        print(f"[DB] Saved audit log + {len(findings)} findings")
        
    except Exception as e:
        print(f"[DB-ERR] {e}")
        db.rollback()
        raise e
    finally:
        db.close()


# === Query Helpers (NEW) ===

def get_events_by_actor(actor_id: str, hours: int = 24, limit: int = 50) -> List[Dict]:
    """Get recent events by a specific actor."""
    if not actor_id:
        return []
    
    db = SessionLocal()
    try:
        cutoff = datetime.datetime.utcnow().timestamp() - (hours * 3600)
        logs = db.query(AuditLog).filter(
            AuditLog.actor_id == actor_id,
            AuditLog.timestamp > cutoff
        ).order_by(AuditLog.timestamp.desc()).limit(limit).all()
        
        return [
            {
                "event_id": log.id,
                "event_type": log.event_type,
                "severity": log.severity,
                "risk_score": log.risk_score,
                "timestamp": log.timestamp
            }
            for log in logs
        ]
    finally:
        db.close()


def get_findings_by_agent(agent_id: str, hours: int = 24, limit: int = 100) -> List[Dict]:
    """Get findings produced by a specific agent."""
    db = SessionLocal()
    try:
        cutoff = datetime.datetime.utcnow().timestamp() - (hours * 3600)
        findings = db.query(FindingRecord).filter(
            FindingRecord.agent_id == agent_id,
            FindingRecord.timestamp > cutoff
        ).order_by(FindingRecord.timestamp.desc()).limit(limit).all()
        
        return [
            {
                "id": f.id,
                "title": f.title,
                "severity": f.severity,
                "finding_type": f.finding_type,
                "confidence": f.confidence,
                "actor_id": f.actor_id,
                "timestamp": f.timestamp
            }
            for f in findings
        ]
    finally:
        db.close()


def get_summary_stats(hours: int = 24) -> Dict:
    """Get aggregated statistics without loading all records."""
    db = SessionLocal()
    try:
        from sqlalchemy import func
        
        cutoff = datetime.datetime.utcnow().timestamp() - (hours * 3600)
        
        # Total count
        total = db.query(func.count(AuditLog.id)).filter(
            AuditLog.timestamp > cutoff
        ).scalar() or 0
        
        # By severity
        severity_counts = {}
        for severity in ["Critical", "High", "Medium", "Low"]:
            count = db.query(func.count(AuditLog.id)).filter(
                AuditLog.timestamp > cutoff,
                AuditLog.severity == severity
            ).scalar() or 0
            severity_counts[severity] = count
        
        # Average risk score
        avg_risk = db.query(func.avg(AuditLog.risk_score)).filter(
            AuditLog.timestamp > cutoff
        ).scalar() or 0.0
        
        # Average processing time
        avg_time = db.query(func.avg(AuditLog.processing_time_ms)).filter(
            AuditLog.timestamp > cutoff
        ).scalar() or 0.0
        
        # LLM usage rate
        llm_count = db.query(func.count(AuditLog.id)).filter(
            AuditLog.timestamp > cutoff,
            AuditLog.llm_used == True
        ).scalar() or 0
        
        return {
            "total_events": total,
            "by_severity": severity_counts,
            "avg_risk_score": round(avg_risk, 3),
            "avg_processing_time_ms": round(avg_time, 2),
            "llm_usage_rate": round(llm_count / total * 100, 1) if total > 0 else 0,
            "hours_covered": hours
        }
    finally:
        db.close()
