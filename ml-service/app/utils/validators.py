import os
import pandas as pd

def get_zone_score(zone_code):
    """
    Returns the composite_score from zone_scores.csv for a given zone_code.
    Returns a default logic if zone code isn't explicitly found.
    """
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, '..', '..', 'data', 'zone_scores.csv')
        df = pd.read_csv(data_path)
        # Assuming zone_code may come as string or int
        matcher = df[df['zone_code'].astype(str) == str(zone_code)]
        if not matcher.empty:
            return float(matcher.iloc[0]['composite_score'])
    except Exception as e:
        print(f"Error loading zone score: {e}")
    # Default return value if not found
    return 5.0

def get_worker_score(worker_id):
    """
    Mock fetch of worker score (often from Supabase).
    For now, return a deterministic mock value based on length/chars of worker_id.
    """
    # Simply convert worker_id to something deterministic between 0 and 10
    if not worker_id:
        return 5.0
    val = sum(ord(c) for c in str(worker_id)) % 10
    # Normalize between 3 and 9 for realistic variance
    return 3.0 + (val / 1.5)

def get_reason(fraud_score, motion_data):
    """
    Generate a simple reason string based on motion_data attributes for fraud reporting.
    """
    if fraud_score >= 90:
        if motion_data.get('claim_freq_30d', 0) > 3:
            return "Anomalous claim frequency detected"
        elif motion_data.get('variance', 0) < 0.1:
            return "Suspiciously low motion variance (likely automated/fake)"
        return "High anomaly indicators in motion/behavior profile"
    elif fraud_score >= 70:
        return "Moderate anomaly in network transitions or stationarity"
    return "Profile looks typical"
