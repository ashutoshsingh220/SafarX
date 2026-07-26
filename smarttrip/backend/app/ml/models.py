import pickle
import numpy as np
import os
from sklearn.cluster import KMeans

MODEL_PATH = "kmeans_demand.pkl"

def train_mock_demand_model():
    """Trains a simple KMeans cluster to identify high demand zones"""
    # Mock coordinates around Pune
    X = np.array([
        [18.5492, 73.7431], # Susgaon
        [18.5987, 73.7628], # Wakad
        [18.5204, 73.8567], # Pune Center
        [18.5538, 73.7789]  # Baner
    ] * 10)
    
    # Add some noise
    X = X + np.random.normal(0, 0.01, X.shape)
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans.fit(X)
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(kmeans, f)
    print("Demand clusters model trained and saved.")

def predict_demand(lat: float, lon: float) -> str:
    if not os.path.exists(MODEL_PATH):
        train_mock_demand_model()
        
    with open(MODEL_PATH, "rb") as f:
        kmeans = pickle.load(f)
        
    cluster = kmeans.predict([[lat, lon]])[0]
    return f"high_demand_zone_{cluster}"

# --- XGBoost mock for ETA ---
ETA_MODEL_PATH = "xgboost_eta.pkl"

def train_mock_eta_model():
    # We will mock the xgboost model using a simple regressor since we didn't add xgboost to requirements
    # A simple linear model representing ETA as a function of distance and time of day
    from sklearn.linear_model import LinearRegression
    X = np.array([
        [5.0, 9], # 5km, 9 AM
        [15.0, 18], # 15km, 6 PM
        [2.0, 14],
        [10.0, 8]
    ])
    # Time in minutes
    y = np.array([20, 60, 10, 45])
    
    model = LinearRegression()
    model.fit(X, y)
    
    with open(ETA_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print("ETA model trained and saved.")

def predict_eta(distance_km: float, hour_of_day: int) -> float:
    if not os.path.exists(ETA_MODEL_PATH):
        train_mock_eta_model()
        
    with open(ETA_MODEL_PATH, "rb") as f:
        model = pickle.load(f)
        
    eta_mins = model.predict([[distance_km, hour_of_day]])[0]
    return max(5.0, float(eta_mins)) # Minimum 5 mins
