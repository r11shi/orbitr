"""
LLM Guardrails - Prevent hallucinations and validate LLM outputs.

Ensures the LLM:
1. Only references provided context (policies, evidence)
2. Refuses to answer if context is insufficient
3. Only recommends approved remediation actions
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import json
import re


@dataclass
class GuardrailResult:
    """Result of guardrail validation."""
    valid: bool
    modified_response: Dict[str, Any]
    warnings: List[str]
    refused: bool = False
    refusal_reason: Optional[str] = None


class LLMGuardrails:
    """
    Validates and sanitizes LLM responses to prevent:
    - Hallucinated policies
    - Unsupported remediation actions
    - Claims without evidence
    """
    
    # Known compliance framework patterns
    KNOWN_FRAMEWORKS = {
        "SOC2", "SOX", "ISO27001", "NIST", "PCI-DSS", "GDPR", 
        "HIPAA", "CIS", "ITIL", "SRE", "FedRAMP"
    }
    
    @classmethod
    def validate_response(
        cls, 
        response: Dict[str, Any], 
        context: Dict[str, Any],
        strict_mode: bool = True
    ) -> GuardrailResult:
        """
        Validate LLM response against provided context.
        
        Args:
            response: Parsed LLM response (summary, root_cause, actions)
            context: The context that was provided to the LLM
            strict_mode: If True, block responses that reference unknown policies
        
        Returns:
            GuardrailResult with validated/modified response
        """
        warnings = []
        modified = response.copy()
        
        # === Check 1: Context Sufficiency ===
        applicable_policies = context.get("applicable_policies", [])
        if not applicable_policies and strict_mode:
            return GuardrailResult(
                valid=False,
                modified_response={
                    "summary": "Unable to analyze - no compliance policies loaded for this domain.",
                    "root_cause": None,
                    "actions": ["Manual review required - context insufficient"],
                    "refused": True
                },
                warnings=["No policies in context"],
                refused=True,
                refusal_reason="No applicable policies loaded for event domain"
            )
        
        # === Check 2: Validate Recommended Actions ===
        approved_remediations = context.get("approved_remediations", [])
        original_actions = response.get("actions", [])
        validated_actions = []
        
        for action in original_actions:
            action_lower = action.lower()
            # Check if action matches or is similar to an approved remediation
            is_approved = any(
                cls._similarity_check(action_lower, approved.lower())
                for approved in approved_remediations
            )
            
            if is_approved:
                validated_actions.append(action)
            else:
                # Mark as unverified but don't remove
                validated_actions.append(f"[UNVERIFIED] {action}")
                warnings.append(f"Action not in approved list: {action[:50]}...")
        
        modified["actions"] = validated_actions
        
        # === Check 3: Root Cause Evidence Check ===
        root_cause = response.get("root_cause")
        if root_cause:
            # Check if root cause references actual findings
            findings_mentioned = context.get("findings_text", "")
            if findings_mentioned and not cls._has_evidence_support(root_cause, findings_mentioned):
                modified["root_cause"] = f"[INFERENCE] {root_cause}"
                warnings.append("Root cause not directly supported by findings")
        
        # === Check 4: Framework Citation Check ===
        summary = response.get("summary", "")
        cited_frameworks = cls._extract_frameworks(summary + str(response.get("actions", [])))
        
        # Get frameworks from policies
        policy_frameworks = set()
        for policy in applicable_policies:
            policy_frameworks.update(policy.get("frameworks", []))
        
        for framework in cited_frameworks:
            # Extract base framework (e.g., "SOC2" from "SOC2-CC6.1")
            base_framework = framework.split("-")[0]
            if base_framework not in cls.KNOWN_FRAMEWORKS:
                warnings.append(f"Unknown framework cited: {framework}")
        
        # === Check 5: Confidence Indication ===
        # If we had to modify things, mark the response as partially validated
        modified["_validated"] = len(warnings) == 0
        modified["_warnings"] = warnings
        modified["_guardrails_applied"] = True
        
        return GuardrailResult(
            valid=len(warnings) == 0,
            modified_response=modified,
            warnings=warnings,
            refused=False
        )
    
    @classmethod
    def check_context_sufficiency(cls, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pre-flight check before LLM call.
        Returns assessment of context quality.
        """
        issues = []
        score = 100
        
        if not context.get("applicable_policies"):
            issues.append("No policies loaded")
            score -= 40
        
        if not context.get("approved_remediations"):
            issues.append("No approved remediations")
            score -= 20
        
        if not context.get("historical_context"):
            issues.append("No historical baseline")
            score -= 15
        
        if not context.get("actor_profile"):
            issues.append("No actor risk profile")
            score -= 10
        
        return {
            "sufficient": score >= 60,
            "score": max(0, score),
            "issues": issues,
            "recommendation": "Proceed" if score >= 60 else "Add more context or use rule-based fallback"
        }
    
    @classmethod
    def _similarity_check(cls, text1: str, text2: str) -> bool:
        """
        Check if two texts are semantically similar (simple word overlap).
        For production, consider using embeddings.
        """
        words1 = set(re.findall(r'\b\w+\b', text1.lower()))
        words2 = set(re.findall(r'\b\w+\b', text2.lower()))
        
        if not words1 or not words2:
            return False
        
        overlap = len(words1 & words2)
        min_len = min(len(words1), len(words2))
        
        # At least 30% word overlap
        return (overlap / min_len) >= 0.3
    
    @classmethod
    def _has_evidence_support(cls, claim: str, evidence: str) -> bool:
        """Check if a claim has support from evidence text."""
        # Extract key terms from claim
        claim_terms = set(re.findall(r'\b\w{4,}\b', claim.lower()))
        evidence_terms = set(re.findall(r'\b\w{4,}\b', evidence.lower()))
        
        if not claim_terms:
            return True  # Empty claim passes
        
        overlap = len(claim_terms & evidence_terms)
        return (overlap / len(claim_terms)) >= 0.2
    
    @classmethod
    def _extract_frameworks(cls, text: str) -> List[str]:
        """Extract compliance framework references from text."""
        # Pattern: WORD-NUMBER.NUMBER or WORD-WORD-NUMBER
        pattern = r'\b([A-Z]{2,}(?:-[A-Z0-9]+)?(?:-[A-Z0-9.]+)?)\b'
        matches = re.findall(pattern, text.upper())
        
        # Filter to known framework patterns
        frameworks = []
        for match in matches:
            base = match.split("-")[0]
            if base in cls.KNOWN_FRAMEWORKS:
                frameworks.append(match)
        
        return list(set(frameworks))


class ResponseParser:
    """Safely parse LLM responses into structured format."""
    
    @staticmethod
    def parse_json_response(raw_response: str) -> Dict[str, Any]:
        """
        Parse LLM response, handling common issues like:
        - Markdown code blocks
        - Trailing text
        - Invalid JSON
        """
        if not raw_response:
            return {"summary": "No response received", "root_cause": None, "actions": []}
        
        # Clean markdown
        cleaned = raw_response.replace("```json", "").replace("```", "").strip()
        
        # Find JSON object
        start_idx = cleaned.find('{')
        end_idx = cleaned.rfind('}') + 1
        
        if start_idx < 0 or end_idx <= start_idx:
            # No JSON found - extract text as summary
            return {
                "summary": cleaned[:200] if len(cleaned) > 200 else cleaned,
                "root_cause": None,
                "actions": [],
                "_parse_error": "No JSON object found"
            }
        
        json_str = cleaned[start_idx:end_idx]
        
        try:
            parsed = json.loads(json_str)
            
            # Normalize field names
            result = {
                "summary": parsed.get("summary") or parsed.get("analysis") or "",
                "root_cause": parsed.get("root_cause") or parsed.get("rootCause") or parsed.get("cause"),
                "actions": parsed.get("actions") or parsed.get("recommended_actions") or parsed.get("recommendations") or []
            }
            
            # Ensure actions is a list
            if isinstance(result["actions"], str):
                result["actions"] = [result["actions"]]
            
            return result
            
        except json.JSONDecodeError as e:
            return {
                "summary": cleaned[:200],
                "root_cause": None,
                "actions": [],
                "_parse_error": str(e)
            }


# Export commonly used functions
def validate_llm_response(response: Dict, context: Dict, strict: bool = True) -> GuardrailResult:
    """Convenience function for validating LLM responses."""
    return LLMGuardrails.validate_response(response, context, strict)


def check_context_ready(context: Dict) -> Dict:
    """Convenience function for checking context sufficiency."""
    return LLMGuardrails.check_context_sufficiency(context)


def parse_llm_json(raw: str) -> Dict:
    """Convenience function for parsing LLM JSON responses."""
    return ResponseParser.parse_json_response(raw)
