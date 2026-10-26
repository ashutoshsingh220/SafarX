"""Small deterministic ML models used by SmartTrip's mock-safe local demo."""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any, Iterable

import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = RandomForestRegressor


ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
DEMAND_ARTIFACT = "demand_kmeans.pkl"
ETA_ARTIFACT = "eta_xgboost.pkl"
RANKER_ARTIFACT = "journey_ranker.pkl"


def _artifact_path(name: str, artifact_dir: Path | None = None) -> Path:
    directory = artifact_dir or ARTIFACT_DIR
    directory.mkdir(parents=True, exist_ok=True)
    return directory / name


def train_demand_model(artifact_dir: Path | None = None) -> Path:
    """Train a reproducible KMeans model using representative Pune demand areas."""
    generator = np.random.default_rng(42)
    centers = np.array(
        [
            [18.5492, 73.7431],  # Susgaon: highest observed feeder demand
            [18.5314, 73.8446],  # Shivajinagar transport interchange
            [18.5793, 73.7388],  # Hinjewadi Phase 1 tech corridor
        ]
    )
    samples = np.vstack(
        [
            generator.normal(loc=centers[0], scale=[0.015, 0.015], size=(220, 2)),
            generator.normal(loc=centers[1], scale=[0.012, 0.012], size=(160, 2)),
            generator.normal(loc=centers[2], scale=[0.018, 0.018], size=(120, 2)),
        ]
    )
    model = KMeans(n_clusters=3, random_state=42, n_init=10)
    model.fit(samples)
    labels = model.predict(samples)
    sizes = [int(np.sum(labels == idx)) for idx in range(3)]
    path = _artifact_path(DEMAND_ARTIFACT, artifact_dir)
    with path.open("wb") as file:
        pickle.dump({"model": model, "cluster_sizes": sizes}, file)
    return path


def predict_demand(lat: float, lon: float, artifact_dir: Path | None = None) -> dict[str, int | str]:
    path = _artifact_path(DEMAND_ARTIFACT, artifact_dir)
    if not path.exists():
        train_demand_model(artifact_dir)
    with path.open("rb") as file:
        payload = pickle.load(file)
    cluster = int(payload["model"].predict([[lat, lon]])[0])
    cluster_size = int(payload["cluster_sizes"][cluster])
    max_size = max(payload["cluster_sizes"])
    demand_level = "high" if cluster_size == max_size else "medium" if cluster_size >= max_size * 0.55 else "low"
    return {"cluster_id": cluster, "cluster_size": cluster_size, "demand_level": demand_level}


def train_eta_model(artifact_dir: Path | None = None) -> Path:
    """Train an XGBoost ETA regressor on deterministic synthetic route observations."""
    generator = np.random.default_rng(42)
    distance_km = generator.uniform(1, 45, 400)
    hour = generator.integers(0, 24, 400)
    traffic = generator.uniform(0, 1, 400)
    peak_multiplier = np.where(((hour >= 8) & (hour <= 10)) | ((hour >= 17) & (hour <= 20)), 1.35, 1.0)
    eta_minutes = np.maximum(5, distance_km * 2.1 * peak_multiplier * (1 + traffic * 0.45) + generator.normal(0, 2, 400))
    features = np.column_stack([distance_km, hour, traffic])
    if XGBRegressor is RandomForestRegressor:
        model = RandomForestRegressor(
            n_estimators=80,
            max_depth=4,
            random_state=42,
            n_jobs=1,
        )
    else:
        model = XGBRegressor(
            n_estimators=80,
            max_depth=4,
            learning_rate=0.08,
            objective="reg:squarederror",
            random_state=42,
            n_jobs=1,
        )
    model.fit(features, eta_minutes)
    path = _artifact_path(ETA_ARTIFACT, artifact_dir)
    with path.open("wb") as file:
        pickle.dump(model, file)
    return path


def predict_eta(
    distance_km: float, hour_of_day: int, traffic_level: float = 0.5, artifact_dir: Path | None = None
) -> float:
    path = _artifact_path(ETA_ARTIFACT, artifact_dir)
    if not path.exists():
        train_eta_model(artifact_dir)
    with path.open("rb") as file:
        model = pickle.load(file)
    predicted = float(model.predict([[distance_km, hour_of_day, traffic_level]])[0])
    return round(max(3.0, predicted), 2)


def train_ranker_model(artifact_dir: Path | None = None) -> Path:
    """Train a mock ranker model capturing user preferences for speed vs fare."""
    weights = np.array([0.45, 0.40, 0.15])
    path = _artifact_path(RANKER_ARTIFACT, artifact_dir)
    with path.open("wb") as file:
        pickle.dump({"weights": weights, "metric_names": ["fare_ratio", "duration_ratio", "leg_count"]}, file)
    return path


def rank_options(
    options: list[dict[str, float]], artifact_dir: Path | None = None, is_smarttrip_plus: bool = False
) -> list[dict[str, Any]]:
    """Sort options by lowest weighted penalty score; prefers speed/convenience for SmartTrip+."""
    if not options:
        return []
    path = _artifact_path(RANKER_ARTIFACT, artifact_dir)
    if not path.exists():
        train_ranker_model(artifact_dir)
    with path.open("rb") as file:
        payload = pickle.load(file)
    weights = np.array(payload["weights"])
    if is_smarttrip_plus:
        weights = np.array([0.25, 0.60, 0.15])

    fares = np.array([float(item.get("fare", 0.0)) for item in options], dtype=float)
    durations = np.array([
        float(item["duration_seconds"]) if "duration_seconds" in item else float(item.get("duration_hours", 0.0)) * 3600.0
        for item in options
    ], dtype=float)
    legs = np.array([
        float(item["transfers"]) if "transfers" in item else float(item.get("leg_count", 1))
        for item in options
    ], dtype=float)

    max_fare = max(float(np.max(fares)), 1.0)
    max_duration = max(float(np.max(durations)), 1.0)
    max_legs = max(float(np.max(legs)), 1.0)

    normalized = np.column_stack([fares / max_fare, durations / max_duration, legs / max_legs])
    scores = normalized @ weights
    order = [int(idx) for idx in np.argsort(scores)]
    return [{"option_index": idx, "score": float(scores[idx])} for idx in order]


def train_all(artifact_dir: Path | None = None) -> list[Path]:
    return [
        train_demand_model(artifact_dir),
        train_eta_model(artifact_dir),
        train_ranker_model(artifact_dir),
    ]
