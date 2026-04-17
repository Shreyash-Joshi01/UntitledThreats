from collections import defaultdict
from datetime import datetime, timedelta


def is_recent(date_val, days=30):
    """Check if a date (str or datetime) is within the last N days."""
    if not date_val:
        return False
    if isinstance(date_val, str):
        try:
            claim_date = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
        except ValueError:
            return False
    else:
        claim_date = date_val

    # Make naive if offset-aware comparison would fail
    now = datetime.utcnow()
    if claim_date.tzinfo is not None:
        claim_date = claim_date.replace(tzinfo=None)

    return (now - claim_date) <= timedelta(days=days)


def compute_behavioral_risk_score(worker_id, claims_history):
    """
    Analyses a worker's claim history to compute an individual risk score.

    Parameters:
        worker_id: str (unused directly, kept for logging/tracing)
        claims_history: list of dicts, each with:
            'date' (ISO str), 'amount' (float), 'status' (str), 'zone' (str)

    Returns: float (0.0 = low risk, 1.0 = high risk)
    """
    if not claims_history or not isinstance(claims_history, list):
        return 0.0

    total_claims = len(claims_history)
    if total_claims == 0:
        return 0.0

    rejected_claims = sum(1 for c in claims_history if c.get('status') == 'rejected')

    # Zone clustering: multiple claims from the exact same zone = suspicious
    zone_counts = defaultdict(int)
    for claim in claims_history:
        zone_key = claim.get('zone', 'unknown')
        zone_counts[zone_key] += 1

    most_used_zone_pct = max(zone_counts.values()) / total_claims if zone_counts else 0.0

    # High claim frequency in short window
    recent_claims = [c for c in claims_history if is_recent(c.get('date'), days=30)]
    frequency_score = min(1.0, len(recent_claims) / 5.0)  # >5 claims/month = high risk

    # Weighted risk calculation
    rejection_score = rejected_claims / total_claims
    zone_score = most_used_zone_pct if most_used_zone_pct > 0.7 else 0.0

    risk = (0.4 * rejection_score) + (0.3 * frequency_score) + (0.3 * zone_score)
    return round(min(1.0, risk), 3)
