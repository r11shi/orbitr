"""
Historical Context Service - Pattern Detection Across Time
Enables agents to detect behavioral patterns by querying past events.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..services.database import SessionLocal, AuditLog
import json

class HistoricalContext:
    """
    Provides historical context for pattern detection.
    Enables agents to make decisions based on past behavior.
    """
    
    @staticmethod
    def get_recent_events_by_actor(actor_id: str, hours: int = 24, limit: int = 50) -> List[Dict]:
        """Get recent events by the same actor."""
        if not actor_id:
            return []
        
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow().timestamp() - (hours * 3600)
            logs = db.query(AuditLog).filter(
                AuditLog.timestamp > cutoff
            ).order_by(AuditLog.timestamp.desc()).limit(limit * 2).all()
            
            # Filter by actor in findings
            results = []
            for log in logs:
                try:
                    findings = json.loads(log.findings_json) if log.findings_json else []
                    for f in findings:
                        if f.get("evidence", {}).get("actor") == actor_id:
                            results.append({
                                "event_id": log.id,
                                "event_type": log.event_type,
                                "severity": log.severity,
                                "timestamp": log.timestamp
                            })
                            break
                except:
                    pass
            return results[:limit]
        finally:
            db.close()
    
    @staticmethod
    def get_similar_events(event_type: str, hours: int = 24, limit: int = 20) -> List[Dict]:
        """Get recent events of the same type."""
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow().timestamp() - (hours * 3600)
            logs = db.query(AuditLog).filter(
                AuditLog.event_type == event_type,
                AuditLog.timestamp > cutoff
            ).order_by(AuditLog.timestamp.desc()).limit(limit).all()
            
            return [
                {
                    "event_id": log.id,
                    "severity": log.severity,
                    "timestamp": log.timestamp,
                    "risk_score": log.risk_score
                }
                for log in logs
            ]
        finally:
            db.close()
    
    @staticmethod
    def detect_frequency_anomaly(event_type: str, actor_id: str = None, window_hours: int = 1, threshold: int = 5) -> Dict:
        """
        Detect if current event frequency is abnormal.
        Returns anomaly score and details.
        """
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow().timestamp() - (window_hours * 3600)
            
            query = db.query(AuditLog).filter(
                AuditLog.event_type == event_type,
                AuditLog.timestamp > cutoff
            )
            
            count = query.count()
            
            return {
                "is_anomaly": count >= threshold,
                "count_in_window": count,
                "threshold": threshold,
                "window_hours": window_hours,
                "anomaly_score": min(count / threshold, 2.0) if threshold > 0 else 0
            }
        finally:
            db.close()
    
    @staticmethod
    def get_actor_risk_history(actor_id: str, days: int = 7) -> Dict:
        """
        Calculate historical risk profile for an actor.
        """
        if not actor_id:
            return {"risk_score": 0.5, "events_count": 0, "high_severity_count": 0}
        
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow().timestamp() - (days * 86400)
            logs = db.query(AuditLog).filter(
                AuditLog.timestamp > cutoff
            ).all()
            
            actor_events = []
            for log in logs:
                try:
                    findings = json.loads(log.findings_json) if log.findings_json else []
                    for f in findings:
                        if f.get("evidence", {}).get("actor") == actor_id:
                            actor_events.append(log)
                            break
                except:
                    pass
            
            if not actor_events:
                return {"risk_score": 0.5, "events_count": 0, "high_severity_count": 0}
            
            high_sev = sum(1 for e in actor_events if e.severity in ["Critical", "High"])
            avg_risk = sum(e.risk_score or 0 for e in actor_events) / len(actor_events)
            
            return {
                "risk_score": avg_risk,
                "events_count": len(actor_events),
                "high_severity_count": high_sev,
                "is_repeat_offender": high_sev >= 3
            }
        finally:
            db.close()
