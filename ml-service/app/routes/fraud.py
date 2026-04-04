from flask import Blueprint, request, jsonify
import pickle
import numpy as np
import os
from app.utils.validators import get_reason

fraud_bp = Blueprint('fraud', __name__)

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models', 'fraud_model.pkl')
try:
    with open(model_path, "rb") as f:
        model = pickle.load(f)
except FileNotFoundError:
    model = None
    print(f"Warning: Model not found at {model_path}. Run train_models.py first.")

@fraud_bp.route('/ml/fraud/score', methods=['POST'])
def score_fraud():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    try:
        worker_id = data['worker_id']
        event_id = data['event_id']
        motion_data = data['motion_data']
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400

    try:
        features = np.array([[
            float(motion_data.get('variance', 0)),
            int(motion_data.get('is_stationary', 0)),
            int(motion_data.get('network_transitions', 0)),
            int(motion_data.get('claim_freq_30d', 0))
        ]])
    except ValueError as e:
        return jsonify({"error": f"Invalid data format in motion_data: {e}"}), 400

    raw_score = model.decision_function(features)[0]
    
    # Isolation Forest: more negative = more anomalous
    # Scale raw_score (approx -0.5 to 0.2) to 0-100 fraud score.
    # Higher fraud_score = more anomalous
    # Adjust this scaling formula based on actual raw_score distributions in production
    fraud_score = int((1 - (raw_score + 0.5)) * 100)
    fraud_score = max(0, min(100, fraud_score))

    if fraud_score < 70:
        decision = "approved"
    elif fraud_score < 90:
        decision = "soft_hold"
    else:
        decision = "rejected"

    return jsonify({
        "fraud_score": fraud_score,
        "decision": decision,
        "reason": get_reason(fraud_score, motion_data)
    })
