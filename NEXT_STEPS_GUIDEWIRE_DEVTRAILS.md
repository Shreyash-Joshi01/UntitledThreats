# 🚀 GuideWire DevTrails — Phase 2 Improvement Roadmap
**Project:** Parametric Insurance for Gig Workers  
**IDE:** Antigravity  
**Target:** Week 6 Final Submission  
**Rating Received:** 4 Star (42,000 DC Coins)  
**Improvement Areas:** Advanced Fraud Detection · Instant Payout · Intelligent Dashboard

---

## 📋 Table of Contents

1. [Project Context & Improvement Areas](#1-project-context--improvement-areas)
2. [Advanced Fraud Detection](#2-advanced-fraud-detection)
3. [Instant Payout System with Razorpay Test Mode](#3-instant-payout-system-with-razorpay-test-mode)
4. [Intelligent Dashboard](#4-intelligent-dashboard)
5. [Final Submission Package (Week 6)](#5-final-submission-package-week-6)
6. [Antigravity IDE Setup Notes](#6-antigravity-ide-setup-notes)
7. [Implementation Checklist](#7-implementation-checklist)

---

## 1. Project Context & Improvement Areas

Your 4-star evaluation praised:
- ✅ Full-stack ML implementation
- ✅ Parametric trigger system with automated claim processing
- ✅ ML service architecture and multi-layered fraud detection
- ✅ Mobile-responsive UI

**Areas flagged for improvement:**
- ⚠️ More granular zone definitions
- ⚠️ Individual behavioral risk analysis
- ⚠️ Policy lifecycle management

This roadmap addresses ALL the above plus the new enhancements required for Week 6 judging.

---

## 2. Advanced Fraud Detection

### 2.1 GPS Spoofing Detection

**Goal:** Detect when a gig worker is faking their location to falsely claim a weather-related disruption in a different zone.

#### Step 1 — Add a GPS Metadata Validator Module

Create a new file: `backend/fraud/gps_validator.py`

```python
import math
from datetime import datetime, timedelta

def haversine_distance(lat1, lon1, lat2, lon2):
    """Returns distance in kilometers between two GPS coordinates."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def detect_gps_spoof(claim_location, worker_last_known_location, timestamp_diff_minutes):
    """
    Returns a suspicion score (0.0 = clean, 1.0 = highly suspicious).
    
    Parameters:
        claim_location: dict with 'lat', 'lon' of the claimed disruption location
        worker_last_known_location: dict with 'lat', 'lon' from last verified ping
        timestamp_diff_minutes: how many minutes ago was the last verified ping
    """
    distance_km = haversine_distance(
        claim_location['lat'], claim_location['lon'],
        worker_last_known_location['lat'], worker_last_known_location['lon']
    )
    # A human cannot travel more than ~1.5 km/min even by vehicle
    max_possible_km = timestamp_diff_minutes * 1.5
    
    if distance_km > max_possible_km:
        # Physically impossible movement = likely spoof
        return min(1.0, distance_km / (max_possible_km + 0.001))
    
    return 0.0

def cross_check_with_weather_zone(claim_location, weather_api_data):
    """
    Verify that the claimed disruption location actually had a weather event.
    Use OpenWeatherMap or IMD API historical data.
    
    Returns True if weather event is confirmed at location, False otherwise.
    """
    # TODO: Call your weather API here
    # Example: check if 'rain' or 'storm' in weather_api_data for claim_location zone
    confirmed = weather_api_data.get('event_confirmed', False)
    return confirmed
```

#### Step 2 — Fake Weather Claims via Historical Data

Create: `backend/fraud/weather_validator.py`

```python
import requests
from datetime import datetime, timedelta

OPENWEATHER_API_KEY = "YOUR_TEST_KEY"   # Use free tier for development

def get_historical_weather(lat, lon, claim_datetime):
    """
    Fetch historical weather for a location at the time of the claimed disruption.
    Uses OpenWeatherMap One Call API (free tier works for past 5 days).
    """
    unix_timestamp = int(claim_datetime.timestamp())
    url = (
        f"https://api.openweathermap.org/data/3.0/onecall/timemachine"
        f"?lat={lat}&lon={lon}&dt={unix_timestamp}&appid={OPENWEATHER_API_KEY}&units=metric"
    )
    response = requests.get(url)
    if response.status_code != 200:
        return None
    return response.json()

def is_weather_claim_valid(lat, lon, claim_datetime, claimed_event_type):
    """
    Validates if the claimed weather event (rain, storm, etc.) 
    actually occurred at that location and time.
    
    Returns: dict with 'valid' (bool) and 'confidence' (float 0-1)
    """
    data = get_historical_weather(lat, lon, claim_datetime)
    if not data:
        return {'valid': False, 'confidence': 0.0, 'reason': 'API_UNAVAILABLE'}
    
    hourly_data = data.get('data', [{}])[0]
    weather_description = hourly_data.get('weather', [{}])[0].get('main', '').lower()
    wind_speed = hourly_data.get('wind_speed', 0)
    rain_mm = hourly_data.get('rain', {}).get('1h', 0)
    
    validity_map = {
        'rain': rain_mm > 2.5,
        'storm': wind_speed > 15 or rain_mm > 10,
        'flood': rain_mm > 25,
        'cyclone': wind_speed > 25,
    }
    
    is_valid = validity_map.get(claimed_event_type, False)
    confidence = min(1.0, (rain_mm / 10.0) + (wind_speed / 30.0)) if is_valid else 0.0
    
    return {
        'valid': is_valid,
        'confidence': round(confidence, 2),
        'actual_weather': weather_description,
        'rain_mm': rain_mm,
        'wind_speed': wind_speed
    }
```

#### Step 3 — Behavioral Risk Score (Individual)

Create: `backend/fraud/behavioral_risk.py`

```python
from collections import defaultdict

def compute_behavioral_risk_score(worker_id, claims_history):
    """
    Analyses a worker's claim history to compute an individual risk score.
    
    Parameters:
        worker_id: str
        claims_history: list of dicts, each with 'date', 'amount', 'status', 'zone'
    
    Returns: float (0.0 = low risk, 1.0 = high risk)
    """
    if not claims_history:
        return 0.0
    
    total_claims = len(claims_history)
    rejected_claims = sum(1 for c in claims_history if c['status'] == 'REJECTED')
    
    # Zone clustering: multiple claims from the exact same zone = suspicious
    zone_counts = defaultdict(int)
    for claim in claims_history:
        zone_counts[claim['zone']] += 1
    most_used_zone_pct = max(zone_counts.values()) / total_claims
    
    # High claim frequency in short period
    recent_claims = [c for c in claims_history if is_recent(c['date'], days=30)]
    frequency_score = min(1.0, len(recent_claims) / 5.0)  # >5 claims/month = high risk
    
    # Weighted risk calculation
    rejection_score = rejected_claims / total_claims
    zone_score = most_used_zone_pct if most_used_zone_pct > 0.7 else 0.0
    
    risk = (0.4 * rejection_score) + (0.3 * frequency_score) + (0.3 * zone_score)
    return round(min(1.0, risk), 3)

def is_recent(date_str, days=30):
    from datetime import datetime, timedelta
    claim_date = datetime.fromisoformat(date_str)
    return (datetime.now() - claim_date) <= timedelta(days=days)
```

#### Step 4 — Wire Fraud Signals into Claim Processing API

In your existing `backend/api/claims.py` (or equivalent), add:

```python
from fraud.gps_validator import detect_gps_spoof
from fraud.weather_validator import is_weather_claim_valid
from fraud.behavioral_risk import compute_behavioral_risk_score

def process_claim(worker_id, claim_data, worker_history):
    gps_score = detect_gps_spoof(
        claim_data['location'],
        claim_data['last_known_location'],
        claim_data['minutes_since_last_ping']
    )
    weather_check = is_weather_claim_valid(
        claim_data['location']['lat'],
        claim_data['location']['lon'],
        claim_data['event_datetime'],
        claim_data['event_type']
    )
    behavioral_score = compute_behavioral_risk_score(worker_id, worker_history)
    
    fraud_score = (0.4 * gps_score) + (0.3 * (1 - weather_check['confidence'])) + (0.3 * behavioral_score)
    
    claim_data['fraud_score'] = round(fraud_score, 3)
    claim_data['auto_approve'] = fraud_score < 0.3
    claim_data['flag_for_review'] = 0.3 <= fraud_score < 0.7
    claim_data['auto_reject'] = fraud_score >= 0.7
    
    return claim_data
```

---

## 3. Instant Payout System with Razorpay Test Mode

### 3.1 Setup Razorpay Test Mode

#### Step 1 — Create Razorpay Test Account

1. Go to [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/) → Sign Up (free)
2. Toggle to **Test Mode** in the dashboard (top-right switch)
3. Navigate to **Settings → API Keys → Generate Test Key**
4. Copy your **Test Key ID** and **Test Key Secret**

#### Step 2 — Install Razorpay SDK

In your Antigravity terminal:

```bash
# If Python backend
pip install razorpay

# If Node.js backend
npm install razorpay
```

#### Step 3 — Backend Payout Service

Create: `backend/payments/razorpay_service.py`

```python
import razorpay
import uuid
from datetime import datetime

# ⚠️ Use test credentials — never commit real keys to version control
RAZORPAY_KEY_ID = "rzp_test_XXXXXXXXXX"        # From Razorpay Test Dashboard
RAZORPAY_KEY_SECRET = "your_test_secret_here"   # From Razorpay Test Dashboard

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def create_payout_order(worker_id, amount_inr, claim_id):
    """
    Creates a Razorpay order for the payout amount.
    amount_inr: float — payout amount in INR
    Returns: order dict with order_id
    """
    amount_paise = int(amount_inr * 100)  # Razorpay uses paise (1 INR = 100 paise)
    
    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"claim_{claim_id}_{str(uuid.uuid4())[:8]}",
        "notes": {
            "worker_id": worker_id,
            "claim_id": claim_id,
            "payout_type": "weather_disruption_compensation",
            "timestamp": datetime.now().isoformat()
        }
    })
    return order

def simulate_upi_payout(worker_upi_id, amount_inr, claim_id):
    """
    Simulates a UPI payout transfer in test mode.
    In production this would use Razorpay Payouts API with IMPS/UPI.
    """
    order = create_payout_order("test_worker", amount_inr, claim_id)
    
    # In test mode, Razorpay simulates the payment without real transfer
    return {
        "status": "SIMULATED_SUCCESS",
        "order_id": order['id'],
        "amount_inr": amount_inr,
        "upi_id": worker_upi_id,
        "claim_id": claim_id,
        "mode": "TEST",
        "message": "Payout simulated via Razorpay Test Mode. No real money transferred."
    }

def verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Verifies the payment signature from Razorpay webhook (for UI checkout flow).
    """
    params = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    try:
        client.utility.verify_payment_signature(params)
        return True
    except Exception:
        return False
```

#### Step 4 — Payout API Endpoint

In your `backend/api/payouts.py`:

```python
from flask import Blueprint, request, jsonify
from payments.razorpay_service import simulate_upi_payout, create_payout_order

payout_bp = Blueprint('payouts', __name__)

@payout_bp.route('/api/payout/initiate', methods=['POST'])
def initiate_payout():
    data = request.json
    worker_id = data.get('worker_id')
    claim_id = data.get('claim_id')
    amount = data.get('amount_inr')
    upi_id = data.get('upi_id')
    
    if not all([worker_id, claim_id, amount, upi_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    result = simulate_upi_payout(upi_id, amount, claim_id)
    
    # Save payout record to DB
    # db.save_payout(worker_id, claim_id, result)
    
    return jsonify(result), 200

@payout_bp.route('/api/payout/create-order', methods=['POST'])
def create_order():
    data = request.json
    order = create_payout_order(
        data['worker_id'],
        data['amount_inr'],
        data['claim_id']
    )
    return jsonify({
        'order_id': order['id'],
        'amount': order['amount'],
        'currency': order['currency'],
        'razorpay_key': "rzp_test_XXXXXXXXXX"  # Send test key to frontend
    }), 200
```

#### Step 5 — Frontend Razorpay Checkout Integration

In your frontend (React or plain JS), add this to the claim approval screen:

```javascript
// Install: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

async function initiatePayout(claimId, amountInr) {
    // Step 1: Create order from your backend
    const orderRes = await fetch('/api/payout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            worker_id: currentWorker.id, 
            claim_id: claimId, 
            amount_inr: amountInr 
        })
    });
    const orderData = await orderRes.json();
    
    // Step 2: Open Razorpay checkout (Test Mode)
    const options = {
        key: orderData.razorpay_key,       // Test key from backend
        amount: orderData.amount,           // In paise
        currency: "INR",
        name: "GuideWire DevTrails",
        description: `Claim Payout - ${claimId}`,
        order_id: orderData.order_id,
        handler: function(response) {
            console.log("✅ Payment Simulated:", response);
            showPayoutSuccess(amountInr);  // Update your UI
        },
        prefill: {
            name: currentWorker.name,
            email: currentWorker.email,
            contact: currentWorker.phone
        },
        theme: { color: "#00BCD4" },
        // Test cards: https://razorpay.com/docs/payments/payments/test-card-upi-details/
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
}
```

> **Test UPI ID for simulation:** Use `success@razorpay` for success, `failure@razorpay` for failure

#### Step 6 — Payout Status Tracker (UI Component)

Add a payout status component to the worker dashboard:

```jsx
// components/PayoutTracker.jsx
function PayoutTracker({ claimId, amount, status }) {
    const steps = ['Claim Verified', 'Fraud Check Passed', 'Payout Initiated', 'Amount Credited'];
    const statusIndex = { 'PENDING': 0, 'VERIFIED': 1, 'INITIATED': 2, 'CREDITED': 3 };
    
    return (
        <div className="payout-tracker">
            <h3>💸 Instant Payout — ₹{amount}</h3>
            <div className="steps">
                {steps.map((step, i) => (
                    <div key={i} className={`step ${i <= statusIndex[status] ? 'done' : ''}`}>
                        <span className="dot">{i <= statusIndex[status] ? '✓' : i + 1}</span>
                        <span className="label">{step}</span>
                    </div>
                ))}
            </div>
            <p className="note">⚠️ Simulated via Razorpay Test Mode</p>
        </div>
    );
}
```

---

## 4. Intelligent Dashboard

### 4.1 Worker Dashboard

**Show each worker:**
- **Earnings Protected This Week** — computed from active policies × weather payout rate
- **Active Weekly Coverage** — policy validity window, zones covered
- **Claim History** — with payout status and Razorpay order IDs

Create: `backend/api/worker_dashboard.py`

```python
@app.route('/api/dashboard/worker/<worker_id>', methods=['GET'])
def worker_dashboard(worker_id):
    worker = db.get_worker(worker_id)
    active_policy = db.get_active_policy(worker_id)
    claims = db.get_claims(worker_id, limit=10)
    
    earnings_protected = 0
    if active_policy:
        earnings_protected = active_policy['daily_wage'] * 5  # 5 working days/week
    
    return jsonify({
        "worker_name": worker['name'],
        "earnings_protected_inr": earnings_protected,
        "active_policy": {
            "valid_from": active_policy['start_date'] if active_policy else None,
            "valid_to": active_policy['end_date'] if active_policy else None,
            "zones_covered": active_policy['zones'] if active_policy else [],
            "weekly_premium_inr": active_policy['premium'] if active_policy else 0
        },
        "recent_claims": [
            {
                "claim_id": c['id'],
                "date": c['date'],
                "amount_inr": c['amount'],
                "status": c['status'],
                "payout_order_id": c.get('razorpay_order_id', None)
            } for c in claims
        ]
    })
```

### 4.2 Admin / Insurer Dashboard

**Show insurers:**
- **Loss Ratio** = Total Claims Paid ÷ Total Premiums Collected
- **Predictive Analytics** — next week's likely weather disruption claims by zone

Create: `backend/api/admin_dashboard.py`

```python
@app.route('/api/dashboard/admin', methods=['GET'])
def admin_dashboard():
    total_premiums = db.sum_premiums_this_month()
    total_claims_paid = db.sum_claims_paid_this_month()
    loss_ratio = round(total_claims_paid / total_premiums, 3) if total_premiums > 0 else 0
    
    # Predictive: count claims per zone over last 4 weeks, trend forward
    zone_claim_history = db.get_zone_claim_counts(weeks=4)
    predictions = predict_next_week_claims(zone_claim_history)
    
    return jsonify({
        "loss_ratio": loss_ratio,
        "loss_ratio_pct": f"{loss_ratio * 100:.1f}%",
        "total_premiums_inr": total_premiums,
        "total_claims_inr": total_claims_paid,
        "zone_predictions": predictions,
        "high_risk_zones": [z for z in predictions if predictions[z]['risk'] == 'HIGH'],
        "active_policies_count": db.count_active_policies(),
        "fraud_flags_this_week": db.count_fraud_flags(days=7)
    })

def predict_next_week_claims(zone_history):
    """
    Simple linear trend prediction.
    In production, replace with your trained ML model.
    """
    predictions = {}
    for zone, weekly_counts in zone_history.items():
        if len(weekly_counts) < 2:
            predictions[zone] = {'expected_claims': 0, 'risk': 'LOW'}
            continue
        trend = weekly_counts[-1] - weekly_counts[-2]
        next_week_estimate = max(0, weekly_counts[-1] + trend)
        risk = 'HIGH' if next_week_estimate > 50 else 'MEDIUM' if next_week_estimate > 20 else 'LOW'
        predictions[zone] = {
            'expected_claims': next_week_estimate,
            'risk': risk,
            'trend': '+' if trend > 0 else '-'
        }
    return predictions
```

### 4.3 Granular Zone Definitions (Feedback Fix)

Update your zone config to go beyond city-level:

```python
# config/zones.py
ZONES = {
    "CHN-NORTH": {
        "name": "Chennai North (Tiruvottiyur, Manali)",
        "lat_range": [13.15, 13.25],
        "lon_range": [80.28, 80.35],
        "flood_risk": "HIGH",
        "cyclone_risk": "HIGH"
    },
    "CHN-CENTRAL": {
        "name": "Chennai Central (T.Nagar, Egmore)",
        "lat_range": [13.05, 13.10],
        "lon_range": [80.22, 80.28],
        "flood_risk": "MEDIUM",
        "cyclone_risk": "MEDIUM"
    },
    "CHN-SOUTH": {
        "name": "Chennai South (Velachery, Tambaram)",
        "lat_range": [12.90, 13.00],
        "lon_range": [80.18, 80.25],
        "flood_risk": "HIGH",
        "cyclone_risk": "LOW"
    },
    # Add more micro-zones as needed
}
```

---

## 5. Final Submission Package (Week 6)

### 5.1 Artefacts Checklist

| Artefact | Description | Format |
|---|---|---|
| `README.md` | Full project overview, setup, architecture | Markdown |
| `ARCHITECTURE.md` | System diagram + data flow | Markdown + diagram |
| `demo_video.mp4` | 5-min walkthrough of all features | Screen recording |
| `presentation.pptx` | 10-slide pitch deck | PowerPoint |
| `postman_collection.json` | All API endpoints with test examples | Postman export |
| `docker-compose.yml` | One-command project setup | YAML |
| `test_report.html` | Unit + integration test results | HTML |

### 5.2 README Structure

Your final `README.md` should include:

```markdown
# GuideWire DevTrails — Parametric Insurance for Gig Workers

## 🎯 Problem Statement
## 🏗️ Architecture
## 🔧 Setup Instructions
## 🔑 API Reference
## 💡 Key Features
  - Parametric Trigger System
  - Advanced Fraud Detection (GPS + Weather + Behavioral)
  - Razorpay Test Mode Instant Payout
  - Worker & Insurer Dashboards
## 📊 ML Model Details
## 🧪 Test Credentials
## 📹 Demo Video
## 👥 Team
```

### 5.3 One-Command Docker Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
      - RAZORPAY_KEY_SECRET=your_test_secret
      - OPENWEATHER_API_KEY=your_key
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: guidewire_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: testpass
    ports:
      - "5432:5432"
```

---

## 6. Antigravity IDE Setup Notes

Since you're using **Antigravity IDE**, here are specific tips:

### 6.1 Environment Variables

Create `.env` in your project root:

```env
# Razorpay Test Mode
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret_here

# Weather API
OPENWEATHER_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://admin:testpass@localhost:5432/guidewire_db

# App
FLASK_ENV=development
FLASK_DEBUG=1
```

> ⚠️ Add `.env` to `.gitignore` immediately — never commit API keys.

### 6.2 Recommended Project Structure

```
guidewire-devtrails/
├── backend/
│   ├── api/
│   │   ├── claims.py
│   │   ├── payouts.py
│   │   ├── worker_dashboard.py
│   │   └── admin_dashboard.py
│   ├── fraud/
│   │   ├── gps_validator.py
│   │   ├── weather_validator.py
│   │   └── behavioral_risk.py
│   ├── payments/
│   │   └── razorpay_service.py
│   ├── ml/
│   │   └── claim_predictor.py
│   ├── config/
│   │   └── zones.py
│   └── app.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PayoutTracker.jsx
│   │   │   ├── WorkerDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   └── App.jsx
│   └── public/
│       └── index.html
├── .env
├── .gitignore
├── docker-compose.yml
├── README.md
└── NEXT_STEPS_GUIDEWIRE_DEVTRAILS.md  ← this file
```

---

## 7. Implementation Checklist

Work through this in order. Check off each item as you complete it.

### Week: Now → Submission

#### Fraud Detection
- [ ] Create `backend/fraud/gps_validator.py` with GPS spoof detection
- [ ] Create `backend/fraud/weather_validator.py` with OpenWeatherMap integration
- [ ] Create `backend/fraud/behavioral_risk.py` with per-worker scoring
- [ ] Wire all three fraud signals into the existing claim processing API
- [ ] Test with mock claims (valid + spoofed) and verify scoring
- [ ] Update zone definitions in `config/zones.py` with granular lat/lon ranges

#### Razorpay Payout
- [ ] Create Razorpay test account and generate test API keys
- [ ] Install `razorpay` package (`pip install razorpay`)
- [ ] Create `backend/payments/razorpay_service.py`
- [ ] Add `/api/payout/initiate` and `/api/payout/create-order` endpoints
- [ ] Add Razorpay checkout.js to frontend
- [ ] Test with `success@razorpay` and `failure@razorpay` UPI IDs
- [ ] Add `PayoutTracker` component to worker UI

#### Dashboard
- [ ] Build worker dashboard API (`/api/dashboard/worker/<id>`)
- [ ] Build admin dashboard API (`/api/dashboard/admin`)
- [ ] Add loss ratio display for insurers
- [ ] Add next-week prediction panel for admins
- [ ] Add earnings protected and active coverage to worker view

#### Final Package
- [ ] Write `README.md` with full setup instructions
- [ ] Export Postman collection with all API endpoints
- [ ] Record 5-minute demo video showing: claim → fraud check → payout simulation
- [ ] Create `docker-compose.yml` for one-command setup
- [ ] Run all tests and export `test_report.html`
- [ ] Prepare 10-slide presentation deck

---

## 🔗 Useful Resources

| Resource | Link |
|---|---|
| Razorpay Test Docs | https://razorpay.com/docs/payments/payments/test-card-upi-details/ |
| Razorpay Dashboard | https://dashboard.razorpay.com/ |
| OpenWeatherMap API | https://openweathermap.org/api/one-call-3 |
| Razorpay Python SDK | https://github.com/razorpay/razorpay-python |
| Razorpay JS Checkout | https://checkout.razorpay.com/v1/checkout.js |

---

*Last updated: April 2026 | GuideWire DevTrails Team*
