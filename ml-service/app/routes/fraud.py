from flask import Blueprint, request, jsonify
import pickle
import numpy as np
import os
from app.utils.validators import get_reason
from app.utils.gps_validator import detect_gps_spoof
from app.utils.weather_validator import is_weather_claim_valid
from app.utils.behavioral_risk import compute_behavioral_risk_score

fraud_bp = Blueprint('fraud', __name__)

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models', 'fraud_model.pkl')
try:
    with open(model_path, "rb") as f:
        model = pickle.load(f)
except FileNotFoundError:
    model = None
    print(f"Warning: Model not loaded from {model_path}. Run train_models.py first.")


@fraud_bp.route('/ml/fraud/score', methods=['POST'])
def score_fraud():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json or {}
    try:
        worker_id = data['worker_id']
        event_id = data['event_id']
        motion_data = data['motion_data']
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400

    # ── 1. ML Model Score (IsolationForest) ───────────────────────────────────
    try:
        features = np.array([[
            float(motion_data.get('variance', 0)),
            int(motion_data.get('is_stationary', 0)),
            int(motion_data.get('network_transitions', 0)),
            int(motion_data.get('claim_freq_30d', 0))
        ]])
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid data format in motion_data: {e}"}), 400

    raw_score = model.decision_function(features)[0]
    # IsolationForest: more negative = more anomalous
    # Scale raw_score (~-0.5 to 0.2) → 0–100 (higher = more anomalous)
    ml_score_100 = int((1 - (raw_score + 0.5)) * 100)
    ml_score_100 = max(0, min(100, ml_score_100))
    ml_score_01 = ml_score_100 / 100.0

    # ── 2. GPS Spoofing Detection ─────────────────────────────────────────────
    gps_score = 0.0
    claim_location = data.get('claim_location')
    last_known_location = data.get('last_known_location')
    minutes_since_last_ping = data.get('minutes_since_last_ping', 60)

    if claim_location and last_known_location:
        gps_score = detect_gps_spoof(claim_location, last_known_location, minutes_since_last_ping)

    # ── 3. Weather Validation ─────────────────────────────────────────────────
    weather_penalty = 0.0
    weather_result = None
    lat = data.get('lat')
    lon = data.get('lon')
    event_datetime = data.get('event_datetime')
    event_type = data.get('event_type', 'heavy_rain_60')

    if lat and lon and event_datetime:
        weather_result = is_weather_claim_valid(lat, lon, event_datetime, event_type)
        if weather_result and not weather_result.get('valid', True):
            # Weather didn't confirm — penalise but don't auto-reject
            weather_penalty = 1.0 - weather_result.get('confidence', 0.5)

    # ── 4. Behavioral Risk Score ──────────────────────────────────────────────
    claims_history = data.get('claims_history', [])
    behavioral_score = compute_behavioral_risk_score(worker_id, claims_history)

    # ── 5. Composite Score (weighted blend) ───────────────────────────────────
    # Weights: ML model 40%, GPS 30%, Weather 15%, Behavioral 15%
    has_gps = 1 if (claim_location and last_known_location) else 0
    has_weather = 1 if (lat and lon and event_datetime) else 0
    has_behavior = 1 if claims_history else 0

    if has_gps or has_weather or has_behavior:
        # Normalise weights for available signals
        w_ml = 0.40
        w_gps = 0.30 if has_gps else 0.0
        w_weather = 0.15 if has_weather else 0.0
        w_behavior = 0.15 if has_behavior else 0.0
        total_w = w_ml + w_gps + w_weather + w_behavior

        composite = (
            (w_ml * ml_score_01) +
            (w_gps * gps_score) +
            (w_weather * weather_penalty) +
            (w_behavior * behavioral_score)
        ) / total_w
    else:
        composite = ml_score_01

    fraud_score = max(0, min(100, int(composite * 100)))

    # ── 6. Decision ───────────────────────────────────────────────────────────
    if fraud_score < 70:
        decision = "approved"
    elif fraud_score < 90:
        decision = "soft_hold"
    else:
        decision = "rejected"

    # ── 7. Reason string ──────────────────────────────────────────────────────
    reason = get_reason(fraud_score, motion_data)
    if gps_score > 0.5:
        reason = f"GPS anomaly detected (impossibly fast travel). {reason}"
    elif weather_penalty > 0.5:
        reason = f"Weather data does not confirm claimed event. {reason}"
    elif behavioral_score > 0.6:
        reason = f"High claim frequency or zone clustering detected. {reason}"

    return jsonify({
        "fraud_score": fraud_score,
        "decision": decision,
        "reason": reason,
        "signals": {
            "ml_score": ml_score_100,
            "gps_score": round(gps_score * 100),
            "weather_penalty": round(weather_penalty * 100),
            "behavioral_score": round(behavioral_score * 100),
            "weather": weather_result
        }
    })
