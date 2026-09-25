"""Machine Learning Transit Route Classifier & Optimal Hub Pair Selector.

Trains and evaluates ML models (Random Forest, Gradient Boosting)
to classify multi-modal journey architectures and rank candidate transit hubs
using comprehensive metrics (Accuracy, Precision, Recall, and F1-Score).
"""

from __future__ import annotations

import json
import logging
import math
import pickle
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
CLASSIFIER_ARTIFACT = "transit_route_classifier.pkl"
METRICS_ARTIFACT = "transit_classifier_metrics.json"

# Route topology classes
CLASS_DIRECT = 0        # Direct train, flight, bus, or outstation cab (e.g. Goa to Pune)
CLASS_GATEWAY = 1       # Multi-leg transfer via hub (e.g. Pune to Pithoragarh via Delhi/Tanakpur)
CLASS_METRO_FEEDER = 2  # Intra-city / local feeder trip (e.g. Hadapsar to Pune Station)

CLASS_NAMES = ["DIRECT_INTERCITY", "ONE_TRANSFER_GATEWAY", "INTRA_METRO_FEEDER"]


def _artifact_path(name: str) -> Path:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    return ARTIFACT_DIR / name


def generate_synthetic_training_data(n_samples: int = 1500, random_state: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """Generate representative multi-modal Indian transit training data.
    
    Features:
    0: feeder_dist_origin (km)
    1: feeder_dist_dest (km)
    2: hub_pair_distance (km)
    3: origin_hub_tier (1=Minor, 2=Secondary, 3=Major Terminus/Airport)
    4: dest_hub_tier (1=Minor, 2=Secondary, 3=Major Terminus/Airport)
    5: direct_connectivity_flag (1 if direct train/flight/bus exists, else 0)
    6: circuitous_detour_ratio ((d(O,HO)+d(HO,HD)+d(HD,D))/d(O,D))
    7: feeder_dominance_ratio ((feeder_O + feeder_D) / (hub_dist + 1e-3))
    8: mountainous_terrain_flag (1 if hill station / non-rail destination like Pithoragarh, else 0)
    9: intra_metro_flag (1 if both points are in same urban area, else 0)
    """
    rng = np.random.default_rng(random_state)
    
    n_metro = int(n_samples * 0.25)
    n_direct = int(n_samples * 0.45)
    n_gateway = n_samples - n_metro - n_direct

    # 1. Metro Feeder Samples (Intra-city e.g. Hadapsar to Pune Junction)
    metro_f_origin = rng.uniform(1.0, 18.0, n_metro)
    metro_f_dest = rng.uniform(0.5, 10.0, n_metro)
    metro_hub_dist = rng.uniform(2.0, 25.0, n_metro)
    metro_tier_orig = rng.choice([2, 3], n_metro)
    metro_tier_dest = rng.choice([2, 3], n_metro)
    metro_direct = np.ones(n_metro)
    metro_detour = rng.uniform(1.0, 1.25, n_metro)
    metro_dominance = (metro_f_origin + metro_f_dest) / (metro_hub_dist + 1e-3)
    metro_mountain = np.zeros(n_metro)
    metro_intra = np.ones(n_metro)
    X_metro = np.column_stack([
        metro_f_origin, metro_f_dest, metro_hub_dist, metro_tier_orig,
        metro_tier_dest, metro_direct, metro_detour, metro_dominance,
        metro_mountain, metro_intra
    ])
    y_metro = np.full(n_metro, CLASS_METRO_FEEDER)

    # 2. Direct Intercity Samples (e.g. Goa to Pune, Mumbai to Delhi)
    dir_f_origin = rng.uniform(3.0, 45.0, n_direct)
    dir_f_dest = rng.uniform(3.0, 45.0, n_direct)
    dir_hub_dist = rng.uniform(180.0, 1600.0, n_direct)
    dir_tier_orig = rng.choice([2, 3], n_direct, p=[0.3, 0.7])
    dir_tier_dest = rng.choice([2, 3], n_direct, p=[0.3, 0.7])
    dir_direct = np.ones(n_direct)
    dir_detour = rng.uniform(1.01, 1.28, n_direct)
    dir_dominance = (dir_f_origin + dir_f_dest) / (dir_hub_dist + 1e-3)
    dir_mountain = np.zeros(n_direct)
    dir_intra = np.zeros(n_direct)
    X_direct = np.column_stack([
        dir_f_origin, dir_f_dest, dir_hub_dist, dir_tier_orig,
        dir_tier_dest, dir_direct, dir_detour, dir_dominance,
        dir_mountain, dir_intra
    ])
    y_direct = np.full(n_direct, CLASS_DIRECT)

    # 3. Gateway Transfer Samples (e.g. Pune to Pithoragarh, Goa to Rishikesh)
    gate_f_origin = rng.uniform(5.0, 45.0, n_gateway)
    gate_f_dest = rng.uniform(50.0, 180.0, n_gateway)  # Last mile from railhead (Tanakpur/Kathgodam to Pithoragarh)
    gate_hub_dist = rng.uniform(350.0, 2200.0, n_gateway)
    gate_tier_orig = rng.choice([2, 3], n_gateway)
    gate_tier_dest = rng.choice([1, 2], n_gateway, p=[0.6, 0.4])  # Often terminus or hill gateway
    gate_direct = np.zeros(n_gateway)  # No direct train/flight
    gate_detour = rng.uniform(1.30, 1.95, n_gateway)  # Transfer adds detour
    gate_dominance = (gate_f_origin + gate_f_dest) / (gate_hub_dist + 1e-3)
    gate_mountain = rng.choice([0, 1], n_gateway, p=[0.3, 0.7])
    gate_intra = np.zeros(n_gateway)
    X_gateway = np.column_stack([
        gate_f_origin, gate_f_dest, gate_hub_dist, gate_tier_orig,
        gate_tier_dest, gate_direct, gate_detour, gate_dominance,
        gate_mountain, gate_intra
    ])
    y_gateway = np.full(n_gateway, CLASS_GATEWAY)

    X = np.vstack([X_metro, X_direct, X_gateway])
    y = np.concatenate([y_metro, y_direct, y_gateway])

    # Add minor noise
    noise = rng.normal(0, 0.02, size=X.shape)
    X[:, [0, 1, 2, 6, 7]] = np.maximum(0.1, X[:, [0, 1, 2, 6, 7]] + noise[:, [0, 1, 2, 6, 7]])

    indices = rng.permutation(len(X))
    return X[indices], y[indices]


def train_transit_classifier() -> Dict[str, Any]:
    """Train transit route classifier and compute F1-score and accuracy metrics."""
    X, y = generate_synthetic_training_data(n_samples=2000, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=4,
        random_state=42,
        n_jobs=1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    # Compute comprehensive evaluation metrics
    acc = float(np.mean(y_test == y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    weighted_f1 = float(f1_score(y_test, y_pred, average="weighted"))
    macro_precision = float(precision_score(y_test, y_pred, average="macro"))
    macro_recall = float(recall_score(y_test, y_pred, average="macro"))
    conf_mat = confusion_matrix(y_test, y_pred).tolist()

    report = classification_report(y_test, y_pred, target_names=CLASS_NAMES, output_dict=True)

    metrics = {
        "model_type": "RandomForestClassifier",
        "n_samples": len(X),
        "test_size": len(X_test),
        "accuracy": round(acc, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "confusion_matrix": conf_mat,
        "class_report": report,
        "feature_importances": [round(float(v), 4) for v in model.feature_importances_],
    }

    # Save artifacts
    model_path = _artifact_path(CLASSIFIER_ARTIFACT)
    with model_path.open("wb") as f:
        pickle.dump(model, f)

    metrics_path = _artifact_path(METRICS_ARTIFACT)
    with metrics_path.open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info("Trained Transit ML Classifier: Accuracy=%.4f, Macro F1=%.4f", acc, macro_f1)
    return metrics


def get_trained_classifier() -> RandomForestClassifier:
    """Load cached model or train if not present."""
    path = _artifact_path(CLASSIFIER_ARTIFACT)
    if not path.exists():
        train_transit_classifier()
    with path.open("rb") as f:
        return pickle.load(f)


def score_hub_pair(
    orig_coords: Tuple[float, float],
    dest_coords: Tuple[float, float],
    orig_hub: Dict[str, Any],
    dest_hub: Dict[str, Any],
    direct_connectivity: bool = False,
    is_mountain: bool = False,
) -> Tuple[float, int, Dict[str, float]]:
    """Score a candidate transit hub pair using ML features and the trained model.
    
    Returns:
        (ranking_score, predicted_class, feature_dict)
    """
    from app.services.transit_hubs import haversine_km

    lat_o, lon_o = orig_coords
    lat_d, lon_d = dest_coords

    f_o = haversine_km(lat_o, lon_o, orig_hub["latitude"], orig_hub["longitude"])
    f_d = haversine_km(dest_hub["latitude"], dest_hub["longitude"], lat_d, lon_d)
    hub_dist = haversine_km(orig_hub["latitude"], orig_hub["longitude"], dest_hub["latitude"], dest_hub["longitude"])
    od_dist = max(1.0, haversine_km(lat_o, lon_o, lat_d, lon_d))

    tier_o = 3 if orig_hub.get("hub_type") == "AIRPORT" or "Junction" in orig_hub["name"] else 2
    tier_d = 3 if dest_hub.get("hub_type") == "AIRPORT" or "Junction" in dest_hub["name"] else 2

    detour = (f_o + hub_dist + f_d) / od_dist
    dominance = (f_o + f_d) / (hub_dist + 1e-3)
    intra = 1.0 if od_dist < 45.0 and orig_hub.get("city") == dest_hub.get("city") else 0.0
    direct_flag = 1.0 if direct_connectivity else 0.0
    mountain_flag = 1.0 if is_mountain else 0.0

    features = np.array([[
        f_o, f_d, hub_dist, tier_o, tier_d, direct_flag, detour, dominance, mountain_flag, intra
    ]])

    model = get_trained_classifier()
    probs = model.predict_proba(features)[0]
    predicted_class = int(np.argmax(probs))

    # Calculate ranking score: penalize excessive feeder distance & circuitous detours
    # Reward direct connectivity and major tiers
    detour_penalty = max(0.0, (detour - 1.0) * 40.0)
    feeder_cost = (f_o + f_d) * 0.35
    tier_bonus = (tier_o + tier_d) * 5.0
    direct_bonus = 35.0 if direct_connectivity else -20.0

    score = 100.0 + tier_bonus + direct_bonus - feeder_cost - detour_penalty
    if intra == 1.0:
        score += 50.0  # Strongly favor local hubs for intra-city trips

    feat_dict = {
        "feeder_origin_km": round(f_o, 2),
        "feeder_dest_km": round(f_d, 2),
        "hub_distance_km": round(hub_dist, 2),
        "detour_ratio": round(detour, 3),
        "confidence_prob": round(float(probs[predicted_class]), 3),
    }

    return round(score, 2), predicted_class, feat_dict
