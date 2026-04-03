from flask import Blueprint, request, jsonify
import pickle
import numpy as np
import os
from app.utils.validators import get_zone_score

pricing_bp = Blueprint('pricing', __name__)

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models', 'pricing_model.pkl')
try:
    with open(model_path, "rb") as f:
        model = pickle.load(f)
except FileNotFoundError:
    model = None
    print(f"Warning: Model not found at {model_path}. Run train_models.py first.")

SEASON_MAP = {"monsoon": 2, "smog": 1, "normal": 0}
BASE_BANDS = {
    "low": 39, "medium": 59, "high": 79, "very_high": 99
}

@pricing_bp.route('/ml/premium/calculate', methods=['POST'])
def calculate_premium():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    try:
        zone_code = data['zone_code']
        weekly_hours = data['weekly_hours']
        season = data['season']
        claim_history = int(data.get('claim_history', 0))
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400

    # Load zone score from CSV
    zone_score = get_zone_score(zone_code)
    season_enc = SEASON_MAP.get(season.lower(), 0)

    # Note: features array order must match training data: 
    # [zone_score, weekly_hours, season_encoded, claim_history]
    features = np.array([[zone_score, float(weekly_hours), season_enc, claim_history]])
    
    # Predict
    multiplier = float(model.predict(features)[0])
    multiplier = max(0.7, min(2.0, multiplier))

    # Base pricing logic based on zone
    base = BASE_BANDS["high"] if zone_score > 7 else BASE_BANDS["medium"]
    adjusted = min(99, int(round(base * multiplier)))

    return jsonify({
        "base_premium": base,
        "adjusted_premium": adjusted,
        "risk_multiplier": round(multiplier, 2),
        "breakdown": {
            "zone_score": zone_score,
            "season": season,
            "claim_history_penalty": claim_history * 2
        }
    })
