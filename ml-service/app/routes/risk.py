from flask import Blueprint, request, jsonify
from app.utils.validators import get_zone_score, get_worker_score

risk_bp = Blueprint('risk', __name__)

@risk_bp.route('/ml/risk/profile', methods=['POST'])
def risk_profile():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid payload"}), 400
        
    try:
        zone_code = data['zone_code']
        worker_id = data['worker_id']
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400

    # Calculate zone and worker scores
    zone_score = get_zone_score(zone_code)
    worker_score = get_worker_score(worker_id)
    
    # Calculate composite score (60% zone, 40% worker)
    composite = round((zone_score * 0.6) + (worker_score * 0.4), 1)

    # Determine risk band
    if composite >= 7:
        band = "high"
    elif composite >= 4:
        band = "medium"
    else:
        band = "low"

    return jsonify({
        "zone_score": zone_score,
        "worker_score": worker_score,
        "composite_score": composite,
        "premium_band": band
    })
