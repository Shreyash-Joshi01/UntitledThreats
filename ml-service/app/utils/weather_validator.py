import os
import requests
from datetime import datetime

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')

# Thresholds per event type
WEATHER_THRESHOLDS = {
    'rain':    {'rain_mm': 2.5,  'wind_speed': 0},
    'storm':   {'rain_mm': 10.0, 'wind_speed': 15},
    'flood':   {'rain_mm': 25.0, 'wind_speed': 0},
    'cyclone': {'rain_mm': 0,    'wind_speed': 25},
    # Map GigShield event_type names
    'heavy_rain_60': {'rain_mm': 2.5,  'wind_speed': 0},
    'heavy_rain_90': {'rain_mm': 5.0,  'wind_speed': 0},
    'flash_flood':   {'rain_mm': 25.0, 'wind_speed': 0},
    'extreme_heat':  {'rain_mm': 0,    'wind_speed': 0},  # pass-through (heat validated differently)
    'severe_aqi':    {'rain_mm': 0,    'wind_speed': 0},  # AQI validated via AQICN, always pass
    'curfew':        {'rain_mm': 0,    'wind_speed': 0},  # Non-weather, always pass
}


def get_historical_weather(lat, lon, claim_datetime):
    """
    Fetch historical weather for a location at the time of the claimed disruption.
    Uses OpenWeatherMap One Call API (timemachine) — free tier covers past 5 days.
    """
    if not OPENWEATHER_API_KEY:
        return None

    if isinstance(claim_datetime, str):
        claim_datetime = datetime.fromisoformat(claim_datetime)

    unix_timestamp = int(claim_datetime.timestamp())
    url = (
        f"https://api.openweathermap.org/data/3.0/onecall/timemachine"
        f"?lat={lat}&lon={lon}&dt={unix_timestamp}&appid={OPENWEATHER_API_KEY}&units=metric"
    )
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return response.json()
    except requests.RequestException:
        pass
    return None


def is_weather_claim_valid(lat, lon, claim_datetime, claimed_event_type):
    """
    Validates if the claimed weather event actually occurred at that location and time.
    Returns: dict with 'valid' (bool), 'confidence' (float 0-1), 'reason' (str)
    """
    # Non-weather events always pass weather validation
    non_weather = {'severe_aqi', 'curfew', 'extreme_heat'}
    if claimed_event_type in non_weather:
        return {'valid': True, 'confidence': 1.0, 'reason': 'Non-weather event, weather check skipped'}

    thresholds = WEATHER_THRESHOLDS.get(claimed_event_type, {'rain_mm': 2.5, 'wind_speed': 0})

    data = get_historical_weather(lat, lon, claim_datetime)
    if not data:
        # API unavailable — fail open (don't penalise worker)
        return {'valid': True, 'confidence': 0.5, 'reason': 'Weather API unavailable, defaulting to pass'}

    hourly_data = data.get('data', [{}])[0]
    rain_mm = hourly_data.get('rain', {}).get('1h', 0) or 0
    wind_speed = hourly_data.get('wind_speed', 0) or 0
    weather_desc = hourly_data.get('weather', [{}])[0].get('main', '').lower()

    rain_ok = rain_mm >= thresholds['rain_mm'] if thresholds['rain_mm'] > 0 else True
    wind_ok = wind_speed >= thresholds['wind_speed'] if thresholds['wind_speed'] > 0 else True
    is_valid = rain_ok and wind_ok

    # Confidence: proportional to how far above threshold we are
    rain_conf = min(1.0, rain_mm / (thresholds['rain_mm'] + 0.001)) if thresholds['rain_mm'] > 0 else 1.0
    wind_conf = min(1.0, wind_speed / (thresholds['wind_speed'] + 0.001)) if thresholds['wind_speed'] > 0 else 1.0
    confidence = round((rain_conf + wind_conf) / 2, 3) if is_valid else 0.0

    return {
        'valid': is_valid,
        'confidence': confidence,
        'actual_weather': weather_desc,
        'rain_mm': round(rain_mm, 2),
        'wind_speed': round(wind_speed, 2),
        'reason': f"Actual: {rain_mm:.1f}mm rain, {wind_speed:.1f}m/s wind ({weather_desc})"
    }
