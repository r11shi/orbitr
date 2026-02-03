from sqlalchemy import create_engine, Column, String, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os
import json
from typing import List, Dict, Any, Optional

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./orbitr.db")

Base = declarative_base()

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    correlation_id = Column(String, index=True)
    timestamp = Column(Float, default=lambda: datetime.datetime.utcnow().timestamp())
    
    event_type = Column(String, index=True)
    severity = Column(String, index=True)
    source_system = Column(String)
    
    # JSON fields
    findings_json = Column(Text)
    insight_text = Column(Text)
    suggestion_json = Column(Text)
    
    # Metrics
    risk_score = Column(Float, default=0.0)
    processing_time_ms = Column(Float)

# Setup
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create tables if they don't exist."""
    Base.metadata.create_all(bind=engine)

def save_audit_entry(
    event: Any,
    findings: List[Dict],
    insight: Optional[str],
    suggestions: List[str],
    risk_score: float,
    processing_time_ms: float
):
    """
    Persists the final workflow state to the database.
    """
    db = SessionLocal()
    try:
        print(f"💾 Saving Audit Log: {event.event_id} ({event.event_type})")
        
        entry = AuditLog(
            id=event.event_id,
            correlation_id=event.correlation_id,
            timestamp=event.timestamp,
            event_type=event.event_type,
            severity=event.severity.value if hasattr(event.severity, 'value') else str(event.severity),
            source_system=event.source_system,
            findings_json=json.dumps(findings, default=str),
            insight_text=insight or "",
            suggestion_json=json.dumps(suggestions, default=str),
            risk_score=risk_score,
            processing_time_ms=processing_time_ms
        )
        
        db.add(entry)
        db.commit()
        print(f"✅ Saved successfully.")
    except Exception as e:
        print(f"❌ DB Error: {e}")
        db.rollback()
        raise e
    finally:
        db.close()
