import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """Returns distance in kilometers between two GPS coordinates."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def detect_gps_spoof(claim_location, worker_last_known_location, timestamp_diff_minutes):
    """
    Returns a suspicion score (0.0 = clean, 1.0 = highly suspicious).

    Parameters:
        claim_location: dict with 'lat', 'lon' of the claimed disruption location
        worker_last_known_location: dict with 'lat', 'lon' from last verified ping
        timestamp_diff_minutes: how many minutes ago was the last verified ping
    """
    if not claim_location or not worker_last_known_location:
        return 0.0  # Missing data — no penalty, fail open

    try:
        distance_km = haversine_distance(
            float(claim_location['lat']), float(claim_location['lon']),
            float(worker_last_known_location['lat']), float(worker_last_known_location['lon'])
        )
    except (KeyError, TypeError, ValueError):
        return 0.0

    # A human cannot travel more than ~1.5 km/min even by vehicle
    max_possible_km = max(0.1, float(timestamp_diff_minutes or 0) * 1.5)

    if distance_km > max_possible_km:
        # Physically impossible movement = likely spoof
        return round(min(1.0, distance_km / (max_possible_km + 0.001)), 3)

    return 0.0
