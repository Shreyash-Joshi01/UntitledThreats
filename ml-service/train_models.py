import pickle
import numpy as np
import os
from sklearn.ensemble import IsolationForest
import xgboost as xgb

def ensure_model_dir():
    model_dir = "app/models"
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

def train_pricing_model():
    # --- Pricing Model ---
    # Features: [zone_score, weekly_hours, season_encoded, claim_history]
    # Target: premium_multiplier (0.7 to 2.0)
    
    print("Training pricing model (XGBoost)...")
    
    # Generate some synthetic data
    # (zone_score: 1-10, weekly_hours: 10-60, season_encoded: 0-2, claim_history: 0-5)
    np.random.seed(42)
    n_samples = 1000
    
    zone_scores = np.random.uniform(1, 10, n_samples)
    weekly_hours = np.random.uniform(10, 60, n_samples)
    season_enc = np.random.randint(0, 3, n_samples)
    claim_history = np.random.randint(0, 6, n_samples)
    
    X_train = np.column_stack((zone_scores, weekly_hours, season_enc, claim_history))
    
    # Calculate a synthetic target multiplier based on features
    # Base multiplier around 1.0. Zone adds risk, high hours reduces per-hour risk but total increases, claim adds risk
    y_train = 0.8 + (zone_scores * 0.05) + (claim_history * 0.1) + (season_enc * 0.05)
    # Clip multiplier to be bounded between 0.7 and 2.0
    y_train = np.clip(y_train, 0.7, 2.0)
    
    pricing_model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=50, max_depth=3)
    pricing_model.fit(X_train, y_train)
    
    ensure_model_dir()
    with open("app/models/pricing_model.pkl", "wb") as f:
        pickle.dump(pricing_model, f)
    print("Saved -> app/models/pricing_model.pkl")

def train_fraud_model():
    # --- Fraud Model ---
    # Features: [motion_variance, is_stationary, network_transitions, claim_freq_30d]
    
    print("Training fraud model (Isolation Forest)...")
    
    # Generate synthetic data for normal behaviors
    np.random.seed(42)
    n_samples = 1000
    
    # Normal motion data
    motion_var = np.random.normal(5.0, 1.5, n_samples) # normal variance
    is_stat = np.random.binomial(1, 0.2, n_samples) # mostly not completely stationary
    net_trans = np.random.poisson(2, n_samples) # few network transitions
    claim_freq = np.random.poisson(0.5, n_samples) # mostly 0 or 1 claims
    
    X_normal = np.column_stack((motion_var, is_stat, net_trans, claim_freq))
    
    # Add anomalies
    anomalous_var = np.random.normal(0.1, 0.1, 50) # suspicious zero variance
    anomalous_stat = np.ones(50)
    anomalous_net = np.random.poisson(10, 50)
    anomalous_claims = np.random.randint(4, 10, 50)
    
    X_anomalous = np.column_stack((anomalous_var, anomalous_stat, anomalous_net, anomalous_claims))
    
    X_train = np.vstack((X_normal, X_anomalous))
    
    fraud_model = IsolationForest(contamination=0.1, random_state=42)
    fraud_model.fit(X_train)
    
    ensure_model_dir()
    with open("app/models/fraud_model.pkl", "wb") as f:
        pickle.dump(fraud_model, f)
    print("Saved -> app/models/fraud_model.pkl")

# Generate risk_model placeholder if needed - mock one for now just in case
def create_risk_model_placeholder():
    # The prompt actually didn't request training a risk model but the tree showed it
    # risk.py calculation uses pure logic over zone score + worker score, so no pkl needed basically.
    pass

if __name__ == "__main__":
    train_pricing_model()
    train_fraud_model()
    print("Model generation complete.")
